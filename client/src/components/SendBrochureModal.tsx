/**
 * SendBrochureModal — Preview modal for the Send Brochure assisted email flow.
 * Outlook is the primary action. Gmail is secondary.
 * Includes SMS option for phone-only leads.
 * Shows full email preview with copy buttons.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  FileText,
  AlertTriangle,
  MessageSquare,
  Smartphone,
} from "lucide-react";

interface SendBrochureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Email fields (may be empty for phone-only leads)
  toEmail?: string;
  subject?: string;
  body?: string;
  brochureShareUrl: string;
  outlookUrl?: string;
  gmailUrl?: string;
  // SMS fields (for phone-only leads)
  phone?: string;
  smsText?: string;
  smsUrl?: string;
  // Callbacks
  onEmailOpened: () => void;
  onSmsOpened?: () => void;
}

export function SendBrochureModal({
  open,
  onOpenChange,
  toEmail,
  subject,
  body,
  brochureShareUrl,
  outlookUrl,
  gmailUrl,
  phone,
  smsText,
  smsUrl,
  onEmailOpened,
  onSmsOpened,
}: SendBrochureModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hasEmail = !!(toEmail && subject && body);
  const hasPhone = !!(phone && smsText);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard.`);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      toast.error("Copy failed. Please select and copy manually.");
    }
  };

  const handleOpenOutlook = () => {
    if (!outlookUrl) return;
    window.open(outlookUrl, "_blank", "noopener,noreferrer");
    onEmailOpened();
    toast.success("Outlook opened — review the email and click Send manually.");
  };

  const handleOpenGmail = () => {
    if (!gmailUrl) return;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    onEmailOpened();
    toast.success("Gmail opened — review the email and click Send manually.");
  };

  const handleOpenSms = () => {
    if (!smsUrl) return;
    window.open(smsUrl, "_blank");
    onSmsOpened?.();
    toast.success("SMS app opened — review and send manually.");
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-3 text-xs shrink-0"
      onClick={() => copyToClipboard(text, label)}
    >
      {copiedField === label ? (
        <Check className="h-3 w-3 mr-1.5 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 mr-1.5" />
      )}
      {copiedField === label ? "Copied!" : `Copy ${label}`}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Wholesale Brochure
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              This will open your email app in a new tab. Review the email and click Send manually.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-x-hidden">
          {/* Email Preview Section */}
          {hasEmail && (
            <>
              {/* To */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</span>
                </div>
                <div className="bg-muted/40 rounded-lg px-4 py-2.5 text-sm font-mono border border-border/50">
                  {toEmail}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</span>
                </div>
                <div className="bg-muted/40 rounded-lg px-4 py-2.5 text-sm border border-border/50">
                  {subject}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Body</span>
                </div>
                <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed border border-border/50 max-h-[320px] overflow-y-auto">
                  {body}
                </div>
              </div>

              {/* Brochure Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brochure Link</span>
                </div>
                <div className="bg-muted/40 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 border border-border/50">
                  <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                  <a
                    href={brochureShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {brochureShareUrl}
                  </a>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
              </div>
            </>
          )}

          {/* SMS Preview Section (phone-only leads) */}
          {hasPhone && !hasEmail && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Smartphone className="h-3 w-3 inline mr-1" />
                  SMS to {phone}
                </span>
              </div>
              <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
                {smsText}
              </div>
            </div>
          )}

          {/* SMS Section when lead has both email and phone */}
          {hasPhone && hasEmail && (
            <div className="space-y-1.5">
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Smartphone className="h-3 w-3 inline mr-1" />
                  SMS Alternative ({phone})
                </span>
              </div>
              <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed border border-border/50">
                {smsText}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer with Buttons */}
        <div className="border-t bg-background px-6 py-4 space-y-3">
          {/* Fallback helper text */}
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              If Outlook does not load correctly, copy the email body and paste it into Outlook manually.
            </span>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap gap-2">
            {/* 1. Open in Outlook (Primary) */}
            {hasEmail && outlookUrl && (
              <Button
                onClick={handleOpenOutlook}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Outlook
              </Button>
            )}

            {/* 2. Open in Gmail (Secondary) */}
            {hasEmail && gmailUrl && (
              <Button
                onClick={handleOpenGmail}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Gmail
              </Button>
            )}

            {/* 3. Copy Email Body */}
            {hasEmail && body && (
              <CopyButton text={body} label="Email Body" />
            )}

            {/* 4. Copy Subject */}
            {hasEmail && subject && (
              <CopyButton text={subject} label="Subject" />
            )}

            {/* 5. Copy Brochure Link */}
            <CopyButton text={brochureShareUrl} label="Brochure Link" />

            {/* 6. SMS options */}
            {hasPhone && smsUrl && (
              <Button
                onClick={handleOpenSms}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Open SMS
              </Button>
            )}
            {hasPhone && smsText && (
              <CopyButton text={smsText} label="SMS Text" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
