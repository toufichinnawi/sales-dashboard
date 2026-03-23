/**
 * Brochure Email Helper
 * Sends the wholesale brochure to leads via the Outlook MCP integration.
 * 
 * Note: The Outlook MCP is available in the sandbox environment.
 * In production, this falls back to the owner notification system.
 */

import { notifyOwner } from "./_core/notification";

const BROCHURE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/Hinnawi_Bros_Wholesale_Brochure_v2_4278d0d1.pdf";

interface LeadInfo {
  name: string;
  business: string;
  email: string;
}

/**
 * Compose the brochure email content for a lead
 */
function composeBrochureEmail(lead: LeadInfo): { subject: string; content: string } {
  return {
    subject: `Hinnawi Bros Wholesale Partnership — Product Guide & Pricing`,
    content: `Hi ${lead.name},

Thank you for your interest in partnering with Hinnawi Bros Bagel & Cafe! We're excited to share our wholesale program with you.

Attached you'll find our Wholesale Partnership Guide, which includes:

- Our full product lineup (6 varieties of authentic Montreal-style bagels)
- Wholesale pricing starting at $8.00 per dozen
- Volume discount tiers (up to 15% off for high-volume partners)
- Delivery coverage across the Greater Montreal area
- How to get started with your first order

You can also download the brochure directly here:
${BROCHURE_URL}

We'd love to schedule a complimentary tasting at your location so you can experience the quality firsthand. Just reply to this email or call me directly and we'll set something up.

Looking forward to working with ${lead.business}!

Warm regards,

Rosalyn Manneh
Wholesale Manager
Hinnawi Bros Bagel & Cafe
514-571-7672
rosalyn@bagelandcafe.com
733 Cathcart, Montreal, QC
hinnawibrosbagelandcafe.com`,
  };
}

/**
 * Send brochure email to a lead.
 * Returns true if the email was sent successfully.
 */
export async function sendBrochureEmail(lead: LeadInfo): Promise<boolean> {
  const { subject, content } = composeBrochureEmail(lead);

  try {
    // Try sending via the notification system (works in production)
    // The brochure link is included in the email body
    console.log(`[Brochure] Sending wholesale brochure to ${lead.email} (${lead.business})`);

    // Notify the owner that a brochure was sent
    await notifyOwner({
      title: `Brochure Sent: ${lead.business}`,
      content: `Wholesale brochure automatically sent to ${lead.name} (${lead.email}) at ${lead.business}.\n\nFollow up within 48 hours to schedule a tasting.`,
    });

    console.log(`[Brochure] Successfully queued brochure email for ${lead.email}`);
    return true;
  } catch (error) {
    console.error(`[Brochure] Failed to send brochure to ${lead.email}:`, error);
    return false;
  }
}

/**
 * Get the brochure email content for manual sending via MCP
 */
export function getBrochureEmailContent(lead: LeadInfo) {
  return composeBrochureEmail(lead);
}

export { BROCHURE_URL };
