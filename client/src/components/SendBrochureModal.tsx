/**
 * SendBrochureModal — Preview modal for the Send Brochure assisted email flow.
 * Shows the email content and provides buttons to open in Gmail, Outlook Web,
 * or copy individual fields.
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface SendBrochureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toEmail: string;
  subject: string;
  body: string;
  brochureUrl: string;
  gmailUrl: string;
  outlookUrl: string;
  onEmailOpened: () => void; // Called when user clicks Gmail or Outlook
}

export function SendBrochureModal({
  open,
  onOpenChange,
  toEmail,
  subject,
  body,
  brochureUrl,
  gmailUrl,
  outlookUrl,
  onEmailOpened,
}: SendBrochureModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard.`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Copy failed. Please select and copy manually.");
    }
  };

  const handleOpenGmail = () => {
    window.open(gmailUrl, "_blank");
    onEmailOpened();
    toast.success("Gmail opened — review the email and click Send manually.");
  };

  const handleOpenOutlook = () => {
    window.open(outlookUrl, "_blank");
    onEmailOpened();
    toast.success("Outlook opened — review the email and click Send manually.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Send Brochure Email
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            This will open your email app in a new tab. Review the email and click Send manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* To Email */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(toEmail, "Email address")}
              >
                {copiedField === "Email address" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2 text-sm font-mono">
              {toEmail}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(subject, "Subject")}
              >
                {copiedField === "Subject" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy Subject
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
              {subject}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Body</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(body, "Email Body")}
              >
                {copiedField === "Email Body" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy Email Body
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {body}
            </div>
          </div>

          {/* Brochure Link */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brochure PDF</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(brochureUrl, "Brochure Link")}
              >
                {copiedField === "Brochure Link" ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy Brochure Link
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate"
              >
                Hinnawi Bros Wholesale Product Summary
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={handleOpenGmail}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Gmail
              </Button>
              <Button
                onClick={handleOpenOutlook}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Outlook Web
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="text-xs font-normal">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Email will not be sent automatically — you must click Send in your email app
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
