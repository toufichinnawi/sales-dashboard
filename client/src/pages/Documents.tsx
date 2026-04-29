/**
 * Documents — Admin document management page
 * Upload, view, edit, and delete portal documents
 */

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Trash2,
  Pencil,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  FileUp,
  Loader2,
  FolderOpen,
} from "lucide-react";

const DOC_TYPE_LABELS: Record<string, string> = {
  brochure: "Brochure",
  spec_sheet: "Spec Sheet",
  client_summary: "Client Summary",
  pricing: "Pricing",
  other: "Other",
};

const VISIBILITY_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin_only: { label: "Admin Only", icon: EyeOff, color: "text-muted-foreground" },
  client_portal: { label: "Client Portal", icon: Eye, color: "text-green-600" },
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

export default function Documents() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Upload form state
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<string>("brochure");
  const [visibility, setVisibility] = useState<string>("client_portal");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDocType, setEditDocType] = useState<string>("");
  const [editVisibility, setEditVisibility] = useState<string>("");

  const { data: documents, isLoading } = trpc.documents.list.useQuery();

  const uploadMut = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      utils.documents.list.invalidate();
      resetUploadForm();
      setUploadOpen(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMut = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("Document updated");
      utils.documents.list.invalidate();
      setEditOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      utils.documents.list.invalidate();
      setDeleteConfirmOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  function resetUploadForm() {
    setTitle("");
    setDocumentType("brochure");
    setVisibility("client_portal");
    setSelectedFile(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    const ext = file.name.toLowerCase().split(".").pop();

    // Block Word files with clear message
    if (ext === "doc" || ext === "docx") {
      setUploadError(
        "Please export this document as PDF before uploading it to the client portal."
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Only accept PDF
    if (ext !== "pdf") {
      setUploadError("Only PDF files are accepted. Please convert your document to PDF first.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // File size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File size exceeds 20MB limit. Please reduce the file size.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    // Auto-fill title from filename if empty
    if (!title) {
      setTitle(file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
    }
  }

  async function handleUpload() {
    if (!selectedFile || !title.trim()) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMut.mutate({
        title: title.trim(),
        documentType: documentType as any,
        visibility: visibility as any,
        fileName: selectedFile.name,
        fileBase64: base64,
        fileSize: selectedFile.size,
      });
    };
    reader.readAsDataURL(selectedFile);
  }

  function openEdit(doc: any) {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditDocType(doc.documentType);
    setEditVisibility(doc.visibility);
    setEditOpen(true);
  }

  function handleUpdate() {
    if (!selectedDoc) return;
    updateMut.mutate({
      id: selectedDoc.id,
      title: editTitle.trim(),
      documentType: editDocType as any,
      visibility: editVisibility as any,
    });
  }

  function openDeleteConfirm(doc: any) {
    setSelectedDoc(doc);
    setDeleteConfirmOpen(true);
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage brochures, spec sheets, and client-facing documents
          </p>
        </div>
        <Button onClick={() => { resetUploadForm(); setUploadOpen(true); }}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-0">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground mb-1">Total Documents</div>
            <div className="font-data text-lg font-semibold">{documents?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground mb-1">Client Portal</div>
            <div className="font-data text-lg font-semibold text-green-600">
              {documents?.filter((d: any) => d.visibility === "client_portal").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground mb-1">Admin Only</div>
            <div className="font-data text-lg font-semibold">
              {documents?.filter((d: any) => d.visibility === "admin_only").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground mb-1">Total Size</div>
            <div className="font-data text-lg font-semibold">
              {formatFileSize(documents?.reduce((sum: number, d: any) => sum + (d.fileSize || 0), 0) ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card className="py-0">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-display font-semibold">All Documents</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No documents uploaded yet</p>
              <p className="text-xs mt-1">Upload your first PDF document to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc: any) => {
                    const vis = VISIBILITY_LABELS[doc.visibility] ?? VISIBILITY_LABELS.admin_only;
                    const VisIcon = vis.icon;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="font-medium text-sm truncate max-w-[200px]">
                              {doc.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1.5 text-xs ${vis.color}`}>
                            <VisIcon className="h-3.5 w-3.5" />
                            {vis.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-data">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {doc.uploadedByName ?? "—"}
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(doc)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => openDeleteConfirm(doc)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File upload zone */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">PDF File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[250px]">{selectedFile.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUp className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a PDF file</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Max 20MB · PDF only</p>
                  </>
                )}
              </div>
              {uploadError && (
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {uploadError}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Document Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wholesale Product Catalog 2026"
              />
            </div>

            {/* Document Type */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brochure">Brochure</SelectItem>
                  <SelectItem value="spec_sheet">Spec Sheet</SelectItem>
                  <SelectItem value="client_summary">Client Summary</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_portal">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-green-600" />
                      Client Portal (visible to customers)
                    </div>
                  </SelectItem>
                  <SelectItem value="admin_only">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-3.5 w-3.5" />
                      Admin Only (internal use)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploadMut.isPending}
            >
              {uploadMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Document Type</Label>
              <Select value={editDocType} onValueChange={setEditDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brochure">Brochure</SelectItem>
                  <SelectItem value="spec_sheet">Spec Sheet</SelectItem>
                  <SelectItem value="client_summary">Client Summary</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Visibility</Label>
              <Select value={editVisibility} onValueChange={setEditVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_portal">Client Portal</SelectItem>
                  <SelectItem value="admin_only">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Document</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedDoc?.title}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDoc && deleteMut.mutate({ id: selectedDoc.id })}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
