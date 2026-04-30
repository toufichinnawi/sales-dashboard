/**
 * Brochure Email Helper
 * Provides email template composition for the "Send Brochure" assisted email flow.
 * Generates Outlook Web and Gmail compose URLs for reliable cross-platform email opening.
 * Also provides SMS text for phone-only leads.
 */

import { createPendingEmail } from "./db";

// The uploaded Hinnawi Bros Client Summary / Wholesale Product Summary PDF (raw CDN)
export const BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/Hinnawi_Bros_Client_Summary_342ca47c.pdf";

export const BAGEL_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-variety_72c673df.jpg";

/**
 * Clean branded share link path (relative).
 * The server route at /share/wholesale-product-summary redirects to the actual PDF.
 */
export const BROCHURE_SHARE_PATH = "/share/wholesale-product-summary";

interface LeadInfo {
  name: string;
  business: string;
  email: string;
}

/**
 * Build the full clean brochure share URL using the provided origin.
 * Falls back to relative path if no origin provided.
 */
export function getBrochureShareUrl(origin?: string): string {
  if (origin) {
    return `${origin}${BROCHURE_SHARE_PATH}`;
  }
  return BROCHURE_SHARE_PATH;
}

/**
 * Compose the brochure email content using the approved template.
 * Uses clean branded share link instead of raw CloudFront URL.
 */
export function composeBrochureEmail(lead: LeadInfo, origin?: string): { subject: string; body: string } {
  const businessName = lead.business?.trim() || "your team";
  const brochureLink = getBrochureShareUrl(origin);

  const subject = `Authentic Montréal Bagels for Your Menu — Wholesale Partnership Opportunity`;

  const body = `Dear ${businessName} team,

My name is Rosalyn Menneh and I am reaching out on behalf of Hinnawi Bros. Bagel, a proudly Montréal-based artisanal bagel bakery with four locations across the city.

Since 2013, we have been crafting authentic Montréal-style bagels the traditional way — hand-rolled, water boiled, and oven baked using 100% natural ingredients, with no artificial preservatives or additives. Our bagels are vegan-certified and proudly made in Québec.

We are currently expanding our wholesale program and would love to partner with ${businessName} to bring the genuine taste of Montréal bagels to your customers.

What We Offer:

Most popular signature flavors: Sesame, Plain, Everything (Tout Garni), and Multigrain
Pack size: 6 bagels per bag · 640 g · 6 bags per case (36 bagels)
Shelf life: 7 days ambient · 6 months frozen
Flexible order quantities to suit your volume needs
Reliable delivery across Greater Montréal and surroundings

Please find our Wholesale Product Summary here:
${brochureLink}

We would be delighted to arrange a complimentary tasting or discuss a trial order at your convenience. Feel free to reach out at any time — we look forward to the possibility of working together.

Warm regards,

Rosalyn Menneh
Hinnawi Bros. Bagel & Café`;

  return { subject, body };
}

/**
 * Build an Outlook Web compose URL.
 * Uses the correct Outlook deeplink format with proper encoding.
 * Outlook primary — this is the team's main email client.
 */
export function buildOutlookUrl(lead: LeadInfo, origin?: string): string {
  const { subject, body } = composeBrochureEmail(lead, origin);
  // Outlook Web deeplink compose format
  // Use encodeURIComponent for each parameter individually
  const to = encodeURIComponent(lead.email);
  const subj = encodeURIComponent(subject);
  const bodyEnc = encodeURIComponent(body);
  return `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subj}&body=${bodyEnc}`;
}

/**
 * Build a Gmail compose URL.
 * Opens Gmail in a new tab with pre-filled To, Subject, and Body.
 */
export function buildGmailUrl(lead: LeadInfo, origin?: string): string {
  const { subject, body } = composeBrochureEmail(lead, origin);
  const params = new URLSearchParams({
    view: "cm",
    to: lead.email,
    su: subject,
    body: body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Build a mailto: URL (kept as fallback).
 */
export function buildMailtoUrl(lead: LeadInfo, origin?: string): string {
  const { subject, body } = composeBrochureEmail(lead, origin);
  const mailto = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailto;
}

/**
 * Compose SMS text for phone-only leads (short version).
 */
export function composeBrochureSms(business: string, origin?: string): string {
  const businessName = business?.trim() || "there";
  const brochureLink = getBrochureShareUrl(origin);
  return `Hi ${businessName}, this is Rosalyn from Hinnawi Bros. Bagel. We're expanding our wholesale program and would love to share our wholesale product summary with you: ${brochureLink}`;
}

/**
 * Build an SMS URL (sms: protocol).
 */
export function buildSmsUrl(phone: string, business: string, origin?: string): string {
  const text = composeBrochureSms(business, origin);
  // Use & separator for iOS/Android compatibility
  return `sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(text)}`;
}

/**
 * Get the brochure email content for preview / manual sending
 */
export function getBrochureEmailContent(lead: LeadInfo, origin?: string) {
  return composeBrochureEmail(lead, origin);
}

/**
 * Queue brochure email for a lead (legacy - kept for backward compatibility).
 */
export async function sendBrochureEmail(lead: LeadInfo): Promise<number | null> {
  const { subject, body } = composeBrochureEmail(lead);

  console.log(
    `[Brochure] Queuing wholesale brochure for ${lead.email} (${lead.business})`
  );

  try {
    const emailId = await createPendingEmail({
      toEmail: lead.email,
      toName: lead.name,
      subject,
      body,
      attachments: JSON.stringify([BROCHURE_URL]),
      leadId: undefined,
    });

    console.log(`[Brochure] Email queued (id=${emailId}) for ${lead.email}`);
    return emailId;
  } catch (error) {
    console.error(`[Brochure] Failed to queue email for ${lead.email}:`, error);
    return null;
  }
}
