/**
 * Brochure Email Helper
 * Queues brochure emails in the database. A scheduled Manus task picks them up
 * and sends via the Outlook MCP (from Rosalyn@bagelandcafe.com).
 */

import { createPendingEmail } from "./db";

export const BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/brochure/Hinnawi_Bros_Wholesale_Brochure_v4.pdf";

export const BAGEL_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/bagel-variety_72c673df.jpg";

export const TASTING_REQUEST_PATH = "/tasting";

interface LeadInfo {
  name: string;
  business: string;
  email: string;
}

/**
 * Compose the brochure email content for a lead
 */
export function composeBrochureEmail(lead: LeadInfo): { subject: string; text: string; html: string } {
  const subject = `Hinnawi Bros Wholesale Partnership - Product Guide & Pricing`;

  const text = `Hi ${lead.name},

Thank you for your interest in partnering with Hinnawi Bros Bagel & Cafe! We're excited to share our wholesale program with you.

Our Wholesale Partnership Guide includes:

- Our 4 signature varieties: Plain, Sesame, Multigrain & Everything
- Wholesale pricing starting at $8.00 per dozen
- Volume discount tiers: up to 15% off for high-volume partners
- Delivery coverage across the Greater Montreal area
- How to get started with your first order

Download the brochure here:
${BROCHURE_URL}

---
REQUEST A FREE TASTING
---

We'd love to bring fresh bagels right to your door - no commitment, no cost, just great bagels!

Request a tasting: https://salesdash-x4qkp2kk.manus.space/tasting

Or simply reply to this email and we'll set something up!

Looking forward to working with ${lead.business}!

Warm regards,

Rosalyn Manneh
Wholesale Manager
Hinnawi Bros Bagel & Cafe
Phone: 514-571-7672
Email: rosalyn@bagelandcafe.com
Address: 733 Cathcart, Montreal, QC
Web: hinnawibrosbagelandcafe.com`;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <div style="text-align: center; padding: 20px 0;">
    <img src="${BAGEL_IMAGE_URL}" alt="Hinnawi Bros Bagels" style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
  <p>Hi ${lead.name},</p>
  <p>Thank you for your interest in partnering with <strong>Hinnawi Bros Bagel &amp; Cafe</strong>! We're excited to share our wholesale program with you.</p>
  <h3 style="color: #B45309; margin-top: 24px;">Our Wholesale Partnership Guide includes:</h3>
  <ul style="line-height: 1.8;">
    <li>Our <strong>4 signature varieties</strong>: Plain, Sesame, Multigrain &amp; Everything</li>
    <li>Wholesale pricing starting at <strong>$8.00 per dozen</strong></li>
    <li>Volume discount tiers: up to <strong>15% off</strong> for high-volume partners</li>
    <li>Delivery coverage across the <strong>Greater Montreal area</strong></li>
    <li>How to get started with your first order</li>
  </ul>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${BROCHURE_URL}" style="display: inline-block; background-color: #B45309; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download the Brochure</a>
  </div>
  <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
    <h3 style="color: #92400E; margin-top: 0;">Request a Free Tasting</h3>
    <p style="margin-bottom: 16px;">We'd love to bring fresh bagels right to your door &mdash; no commitment, no cost, just great bagels!</p>
    <a href="https://salesdash-x4qkp2kk.manus.space/tasting" style="display: inline-block; background-color: #92400E; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Request a Tasting</a>
  </div>
  <p>Or simply reply to this email and we'll set something up!</p>
  <p>Looking forward to working with <strong>${lead.business}</strong>!</p>
  <p style="margin-top: 24px;">
    Warm regards,<br/><br/>
    <strong>Rosalyn Manneh</strong><br/>
    Wholesale Manager<br/>
    Hinnawi Bros Bagel &amp; Cafe<br/>
    Phone: <a href="tel:5145717672">514-571-7672</a><br/>
    Email: <a href="mailto:rosalyn@bagelandcafe.com">rosalyn@bagelandcafe.com</a><br/>
    Address: 733 Cathcart, Montreal, QC<br/>
    Web: <a href="https://hinnawibrosbagelandcafe.com">hinnawibrosbagelandcafe.com</a>
  </p>
</div>`;

  return { subject, text, html };
}

/**
 * Queue brochure email for a lead.
 * The email is saved to the pending_emails table and will be sent by the
 * scheduled Manus task via Outlook MCP.
 * Returns the pending email ID, or null on failure.
 */
export async function sendBrochureEmail(lead: LeadInfo): Promise<number | null> {
  const { subject, text } = composeBrochureEmail(lead);

  console.log(
    `[Brochure] Queuing wholesale brochure for ${lead.email} (${lead.business})`
  );

  try {
    const emailId = await createPendingEmail({
      toEmail: lead.email,
      toName: lead.name,
      subject,
      body: text,
      attachments: JSON.stringify([BROCHURE_URL, BAGEL_IMAGE_URL]),
      leadId: undefined,
    });

    console.log(`[Brochure] Email queued (id=${emailId}) for ${lead.email}`);
    return emailId;
  } catch (error) {
    console.error(`[Brochure] Failed to queue email for ${lead.email}:`, error);
    return null;
  }
}

/**
 * Get the brochure email content for preview / manual sending
 */
export function getBrochureEmailContent(lead: LeadInfo) {
  return composeBrochureEmail(lead);
}
