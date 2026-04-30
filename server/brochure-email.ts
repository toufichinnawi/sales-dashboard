/**
 * Brochure Email Helper
 * Provides email template composition for the "Send Brochure" assisted email flow.
 * Generates Gmail and Outlook Web compose URLs for reliable cross-platform email opening.
 */

import { createPendingEmail } from "./db";

// The uploaded Hinnawi Bros Client Summary / Wholesale Product Summary PDF
export const BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/Hinnawi_Bros_Client_Summary_342ca47c.pdf";

export const BAGEL_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-variety_72c673df.jpg";

interface LeadInfo {
  name: string;
  business: string;
  email: string;
}

/**
 * Compose the brochure email content using the approved template.
 * Dynamic replacements:
 * - [Business Name] → lead business name (or "your team" if missing)
 * - [Brochure PDF Link] → BROCHURE_URL
 */
export function composeBrochureEmail(lead: LeadInfo): { subject: string; body: string } {
  const businessName = lead.business?.trim() || "your team";

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
${BROCHURE_URL}

We would be delighted to arrange a complimentary tasting or discuss a trial order at your convenience. Feel free to reach out at any time — we look forward to the possibility of working together.

Warm regards,

Rosalyn Menneh
Hinnawi Bros. Bagel & Café`;

  return { subject, body };
}

/**
 * Build a Gmail compose URL.
 * Opens Gmail in a new tab with pre-filled To, Subject, and Body.
 */
export function buildGmailUrl(lead: LeadInfo): string {
  const { subject, body } = composeBrochureEmail(lead);
  const params = new URLSearchParams({
    to: lead.email,
    su: subject,
    body: body,
  });
  return `https://mail.google.com/mail/?view=cm&${params.toString()}`;
}

/**
 * Build an Outlook Web compose URL.
 * Opens Outlook Web in a new tab with pre-filled To, Subject, and Body.
 */
export function buildOutlookUrl(lead: LeadInfo): string {
  const { subject, body } = composeBrochureEmail(lead);
  const params = new URLSearchParams({
    to: lead.email,
    subject: subject,
    body: body,
  });
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

/**
 * Build a mailto: URL (kept as fallback).
 */
export function buildMailtoUrl(lead: LeadInfo): string {
  const { subject, body } = composeBrochureEmail(lead);
  const mailto = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailto;
}

/**
 * Get the brochure email content for preview / manual sending
 */
export function getBrochureEmailContent(lead: LeadInfo) {
  return composeBrochureEmail(lead);
}

/**
 * Queue brochure email for a lead (legacy - kept for backward compatibility).
 * The email is saved to the pending_emails table and will be sent by the
 * scheduled Manus task via Outlook MCP.
 * Returns the pending email ID, or null on failure.
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
