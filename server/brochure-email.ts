/**
 * Brochure Email Helper
 * Sends the wholesale brochure to leads via the Outlook MCP integration.
 *
 * The Outlook MCP tool (outlook_send_messages) is available in the sandbox
 * environment via the manus-mcp-cli utility. In production, we fall back to
 * notifying the owner so they can forward manually.
 */

import { notifyOwner } from "./_core/notification";
import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const execFileAsync = promisify(execFile);

export const BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/brochure/Hinnawi_Bros_Wholesale_Brochure.pdf";

const BROCHURE_LOCAL_PATH = "/tmp/hinnawi-brochure.pdf";

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
 * Download the brochure PDF to a local temp path if not already cached.
 */
async function ensureBrochureDownloaded(): Promise<string> {
  if (fs.existsSync(BROCHURE_LOCAL_PATH)) {
    return BROCHURE_LOCAL_PATH;
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(BROCHURE_LOCAL_PATH);
    const get = BROCHURE_URL.startsWith("https") ? https.get : http.get;
    get(BROCHURE_URL, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          const getRedirect = redirectUrl.startsWith("https") ? https.get : http.get;
          getRedirect(redirectUrl, (res2) => {
            res2.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve(BROCHURE_LOCAL_PATH);
            });
          }).on("error", reject);
          return;
        }
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(BROCHURE_LOCAL_PATH);
      });
    }).on("error", (err) => {
      fs.unlink(BROCHURE_LOCAL_PATH, () => {});
      reject(err);
    });
  });
}

/**
 * Try to send an email via the Outlook MCP integration.
 * Returns true if the MCP tool was available and the send succeeded.
 */
async function sendViaOutlookMCP(
  lead: LeadInfo,
  subject: string,
  content: string
): Promise<boolean> {
  try {
    // Download the brochure PDF locally so we can attach it
    const pdfPath = await ensureBrochureDownloaded();

    const input = JSON.stringify({
      messages: [
        {
          subject,
          to: [lead.email],
          content,
          attachments: [pdfPath],
        },
      ],
    });

    const { stdout, stderr } = await execFileAsync(
      "manus-mcp-cli",
      ["tool", "call", "outlook_send_messages", "--server", "outlook-mail", "--input", input],
      { timeout: 30_000 }
    );

    console.log(`[Brochure] Outlook MCP response: ${stdout}`);
    if (stderr) {
      console.warn(`[Brochure] Outlook MCP stderr: ${stderr}`);
    }

    // Check for success indicators in the output
    if (stdout.includes("error") && !stdout.includes("success")) {
      console.warn(`[Brochure] Outlook MCP may have failed: ${stdout}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[Brochure] Outlook MCP not available or failed:`, error);
    return false;
  }
}

/**
 * Send brochure email to a lead.
 * Tries Outlook MCP first, falls back to owner notification.
 * Returns true if the email was sent successfully via either method.
 */
export async function sendBrochureEmail(lead: LeadInfo): Promise<boolean> {
  const { subject, content } = composeBrochureEmail(lead);

  console.log(
    `[Brochure] Sending wholesale brochure to ${lead.email} (${lead.business})`
  );

  // Attempt 1: Send via Outlook MCP (real email with PDF attachment)
  const sentViaOutlook = await sendViaOutlookMCP(lead, subject, content);

  if (sentViaOutlook) {
    console.log(
      `[Brochure] Successfully sent brochure via Outlook to ${lead.email}`
    );

    // Also notify the owner about the send
    try {
      await notifyOwner({
        title: `Brochure Sent: ${lead.business}`,
        content: `Wholesale brochure automatically emailed to ${lead.name} (${lead.email}) at ${lead.business}.\n\nFollow up within 48 hours to schedule a tasting.`,
      });
    } catch (e) {
      // Non-critical — the email was already sent
      console.warn("[Brochure] Failed to notify owner about brochure send:", e);
    }

    return true;
  }

  // Attempt 2: Fall back to owner notification (production / no MCP)
  console.log(
    `[Brochure] Falling back to owner notification for ${lead.email}`
  );

  try {
    await notifyOwner({
      title: `Brochure Requested: ${lead.business}`,
      content: `Wholesale brochure could not be auto-emailed to ${lead.name} (${lead.email}) at ${lead.business}.\n\nPlease forward the brochure manually:\n${BROCHURE_URL}\n\nFollow up within 48 hours to schedule a tasting.`,
    });

    console.log(
      `[Brochure] Owner notified to manually send brochure to ${lead.email}`
    );
    return true;
  } catch (error) {
    console.error(
      `[Brochure] Failed to send brochure to ${lead.email}:`,
      error
    );
    return false;
  }
}

/**
 * Get the brochure email content for preview / manual sending
 */
export function getBrochureEmailContent(lead: LeadInfo) {
  return composeBrochureEmail(lead);
}
