/**
 * PortalDocuments — Client-facing documents page
 * Shows downloadable documents shared by admin
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FolderOpen } from "lucide-react";

const DOC_TYPE_LABELS: Record<string, string> = {
  brochure: "Brochure",
  spec_sheet: "Spec Sheet",
  client_summary: "Client Summary",
  pricing: "Pricing",
  other: "Document",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PortalDocuments() {
  const { data: documents, isLoading } = trpc.documents.clientList.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Download product brochures, spec sheets, and other resources
        </p>
      </div>

      {!documents || documents.length === 0 ? (
        <Card className="py-0">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No documents available</p>
            <p className="text-xs mt-1">Check back later for product resources and brochures.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="py-0 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold leading-snug">{doc.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground font-data">
                            {formatFileSize(doc.fileSize)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
