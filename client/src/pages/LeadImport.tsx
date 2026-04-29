/**
 * Lead Import Wizard — Upload → Map Columns → Preview & Validate → Confirm → Summary
 */
import { useState, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ParsedColumn {
  index: number;
  header: string;
}

interface ParsedRow {
  rowIndex: number;
  cells: string[];
}

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  originalValue: string;
  normalizedValue: string;
}

interface ValidatedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
  duplicateOf?: { id: number; business: string; email: string } | null;
}

type Step = "upload" | "mapping" | "preview" | "confirm" | "summary";

interface ImportSummary {
  imported: number;
  skipped: number;
  updated: number;
  failed: number;
  duplicates: number;
}

// ─── Step indicator ─────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "upload", label: "Upload", num: 1 },
  { key: "mapping", label: "Map Columns", num: 2 },
  { key: "preview", label: "Preview", num: 3 },
  { key: "confirm", label: "Confirm", num: 4 },
  { key: "summary", label: "Summary", num: 5 },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-amber-600 text-white"
                  : isDone
                  ? "bg-amber-100 text-amber-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="font-data">{step.num}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 ${
                  i < currentIdx ? "bg-amber-400" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function LeadImport() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Wizard state
  const [step, setStep] = useState<Step>("upload");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse state
  const [columns, setColumns] = useState<ParsedColumn[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});

  // Validation state
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [removedRows, setRemovedRows] = useState<Set<number>>(new Set());

  // Confirm state
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "update" | "import_anyway">("skip");

  // Summary state
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // tRPC mutations
  const parseMut = trpc.leads.importParse.useMutation();
  const validateMut = trpc.leads.importValidate.useMutation();
  const confirmMut = trpc.leads.importConfirm.useMutation();

  // ─── Upload handlers ────────────────────────────────────────────────────

  const ACCEPTED_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
  ];
  const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFileError(null);

    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFileError(`Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFileError(`File too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum: 5MB`);
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  const handleUploadAndParse = useCallback(async () => {
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const result = await parseMut.mutateAsync({
        fileBase64: base64,
        fileName: file.name,
      });

      setColumns(result.columns);
      setRows(result.rows);
      setFields(result.fields as unknown as FieldDef[]);
      setMapping(result.autoMapping as Record<string, number | null>);
      setStep("mapping");
    } catch (e: any) {
      setFileError(e.message || "Failed to parse file");
    }
  }, [file, parseMut]);

  // ─── Mapping handlers ──────────────────────────────────────────────────

  const handleMappingChange = useCallback(
    (fieldKey: string, value: string) => {
      setMapping((prev) => ({
        ...prev,
        [fieldKey]: value === "__none__" ? null : parseInt(value, 10),
      }));
    },
    []
  );

  const mappedFieldCount = useMemo(
    () => Object.values(mapping).filter((v) => v !== null).length,
    [mapping]
  );

  const handleValidate = useCallback(async () => {
    try {
      const result = await validateMut.mutateAsync({
        rows,
        mapping,
      });

      setValidatedRows(result.rows);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
      setDuplicateCount(result.duplicateCount);
      setRemovedRows(new Set());
      setStep("preview");
    } catch (e: any) {
      toast.error(e.message || "Validation failed");
    }
  }, [rows, mapping, validateMut]);

  // ─── Preview handlers ─────────────────────────────────────────────────

  const toggleRemoveRow = useCallback((rowIndex: number) => {
    setRemovedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  }, []);

  const activeRows = useMemo(
    () =>
      validatedRows.filter(
        (r) => r.isValid && !removedRows.has(r.rowIndex)
      ),
    [validatedRows, removedRows]
  );

  // ─── Confirm handlers ─────────────────────────────────────────────────

  const handleConfirmImport = useCallback(async () => {
    try {
      const rowsToImport = activeRows.map((r) => ({
        rowIndex: r.rowIndex,
        data: r.data,
        duplicateOf: r.duplicateOf ?? null,
      }));

      const result = await confirmMut.mutateAsync({
        rows: rowsToImport,
        duplicateAction,
      });

      setSummary(result);
      setStep("summary");
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    }
  }, [activeRows, duplicateAction, confirmMut]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/leads")}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Button>
        <div>
          <h1 className="text-lg font-display font-bold">Import Leads</h1>
          <p className="text-xs text-muted-foreground">
            Upload an Excel or CSV file to import leads
          </p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* Step Content */}
      {step === "upload" && (
        <UploadStep
          file={file}
          fileError={fileError}
          fileInputRef={fileInputRef}
          isLoading={parseMut.isPending}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
          onUpload={handleUploadAndParse}
          onClear={() => {
            setFile(null);
            setFileError(null);
          }}
        />
      )}

      {step === "mapping" && (
        <MappingStep
          columns={columns}
          fields={fields}
          mapping={mapping}
          rows={rows}
          mappedFieldCount={mappedFieldCount}
          isLoading={validateMut.isPending}
          onMappingChange={handleMappingChange}
          onBack={() => setStep("upload")}
          onNext={handleValidate}
        />
      )}

      {step === "preview" && (
        <PreviewStep
          validatedRows={validatedRows}
          validCount={validCount}
          invalidCount={invalidCount}
          duplicateCount={duplicateCount}
          removedRows={removedRows}
          onToggleRemove={toggleRemoveRow}
          onBack={() => setStep("mapping")}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && (
        <ConfirmStep
          activeRows={activeRows}
          duplicateCount={duplicateCount}
          duplicateAction={duplicateAction}
          isLoading={confirmMut.isPending}
          onDuplicateActionChange={setDuplicateAction}
          onBack={() => setStep("preview")}
          onConfirm={handleConfirmImport}
        />
      )}

      {step === "summary" && summary && (
        <SummaryStep summary={summary} onDone={() => navigate("/leads")} />
      )}
    </div>
  );
}

// ─── Upload Step ────────────────────────────────────────────────────────────

function UploadStep({
  file,
  fileError,
  fileInputRef,
  isLoading,
  onDrop,
  onFileInput,
  onUpload,
  onClear,
}: {
  file: File | null;
  fileError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  onDrop: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onClear: () => void;
}) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">Upload File</CardTitle>
        <p className="text-xs text-muted-foreground">
          Accepted formats: .xlsx, .xls, .csv · Max size: 5MB
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            file
              ? "border-amber-400 bg-amber-50/50"
              : fileError
              ? "border-red-300 bg-red-50/30"
              : "border-border hover:border-amber-400/60 hover:bg-amber-50/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileInput}
            className="hidden"
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-10 w-10 text-amber-600" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Drag & drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground/70">
                Excel (.xlsx, .xls) or CSV files
              </p>
            </div>
          )}
        </div>

        {fileError && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2.5 rounded-md">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {fileError}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={onUpload}
            disabled={!file || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                Parse File
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mapping Step ───────────────────────────────────────────────────────────

function MappingStep({
  columns,
  fields,
  mapping,
  rows,
  mappedFieldCount,
  isLoading,
  onMappingChange,
  onBack,
  onNext,
}: {
  columns: ParsedColumn[];
  fields: FieldDef[];
  mapping: Record<string, number | null>;
  rows: ParsedRow[];
  mappedFieldCount: number;
  isLoading: boolean;
  onMappingChange: (fieldKey: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  // Get preview values for a column
  const getPreview = (colIdx: number | null): string => {
    if (colIdx === null || colIdx < 0) return "";
    const samples = rows
      .slice(0, 3)
      .map((r) => r.cells[colIdx] ?? "")
      .filter(Boolean);
    return samples.join(" · ");
  };

  // Minimum mapping validation:
  // Must have (Business Name OR Contact Person) AND (Phone OR Email)
  const hasIdentity =
    mapping["business"] !== null || mapping["name"] !== null;
  const hasContact =
    mapping["phone"] !== null || mapping["email"] !== null;
  const isMinimumMet = hasIdentity && hasContact;

  // Detected column names for display
  const detectedHeaders = columns
    .filter((c) => c.header)
    .map((c) => c.header);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-display">
              Map Columns
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Map your file columns to lead fields · {rows.length} rows found ·{" "}
              {mappedFieldCount} fields mapped
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-data">
            {columns.length} columns
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Detected columns info */}
        {detectedHeaders.length > 0 && (
          <div className="bg-muted/50 border border-border rounded-md p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Detected columns:</p>
            <div className="flex flex-wrap gap-1">
              {detectedHeaders.map((h, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-data">
                  {h}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50/50 border border-amber-200 rounded-md p-2.5 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Columns with matching names were auto-mapped. Review and adjust as
            needed. At minimum, map <strong>Business Name or Contact Person</strong>, plus <strong>Phone
            or Email</strong>.
          </p>
        </div>

        {/* Validation warning if minimum not met */}
        {!isMinimumMet && mappedFieldCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2.5 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">
              {!hasIdentity && !hasContact
                ? "Map at least Business Name or Contact Person, and Phone or Email to continue."
                : !hasIdentity
                ? "Map at least Business Name or Contact Person to continue."
                : "Map at least Phone or Email to continue."}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {fields.map((field) => {
            const colIdx = mapping[field.key] ?? null;
            const preview = getPreview(colIdx);
            const isMapped = colIdx !== null;
            return (
              <div
                key={field.key}
                className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors ${
                  isMapped
                    ? "border-green-200 bg-green-50/30"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="w-44 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {isMapped ? (
                      <Check className="h-3 w-3 text-green-600 shrink-0" />
                    ) : (
                      <div className="h-3 w-3 shrink-0" />
                    )}
                    <span className="text-xs font-medium">{field.label}</span>
                    {field.required && (
                      <span className="text-[10px] text-amber-600">*</span>
                    )}
                  </div>
                </div>

                <ArrowLeft className="h-3 w-3 text-muted-foreground shrink-0 rotate-180" />

                <Select
                  value={colIdx !== null ? String(colIdx) : "__none__"}
                  onValueChange={(v) => onMappingChange(field.key, v)}
                >
                  <SelectTrigger className="w-52 h-8 text-xs">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">— Not mapped —</span>
                    </SelectItem>
                    {columns.map((col) => (
                      <SelectItem key={col.index} value={String(col.index)}>
                        {col.header || `Column ${col.index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {preview && (
                  <span className="text-[11px] text-muted-foreground truncate max-w-48">
                    {preview}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={onNext}
            disabled={!isMinimumMet || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Validate & Preview
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Preview Step ───────────────────────────────────────────────────────────

function PreviewStep({
  validatedRows,
  validCount,
  invalidCount,
  duplicateCount,
  removedRows,
  onToggleRemove,
  onBack,
  onNext,
}: {
  validatedRows: ValidatedRow[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  removedRows: Set<number>;
  onToggleRemove: (rowIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [showInvalid, setShowInvalid] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const validRows = validatedRows.filter((r) => r.isValid && !r.duplicateOf);
  const invalidRows = validatedRows.filter((r) => !r.isValid);
  const duplicateRows = validatedRows.filter(
    (r) => r.isValid && r.duplicateOf
  );

  const activeCount = validatedRows.filter(
    (r) => r.isValid && !removedRows.has(r.rowIndex)
  ).length;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">
          Preview & Validate
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review the data before importing. Remove rows you don't want to
          import.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
            <div className="text-lg font-data font-bold text-green-700">
              {validCount}
            </div>
            <div className="text-[11px] text-green-600">Valid Rows</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
            <div className="text-lg font-data font-bold text-red-700">
              {invalidCount}
            </div>
            <div className="text-[11px] text-red-600">Invalid Rows</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-center">
            <div className="text-lg font-data font-bold text-amber-700">
              {duplicateCount}
            </div>
            <div className="text-[11px] text-amber-600">Duplicates</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
            <div className="text-lg font-data font-bold text-blue-700">
              {validatedRows.filter((r) => r.warnings && r.warnings.length > 0).length}
            </div>
            <div className="text-[11px] text-blue-600">Normalized</div>
          </div>
        </div>

        {/* Valid rows table */}
        <div>
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            Valid Rows ({validRows.length})
          </h3>
          <div className="border rounded-md overflow-auto max-h-72">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium w-8">#</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Business
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Contact
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Email</th>
                  <th className="px-2 py-1.5 text-left font-medium">Phone</th>
                  <th className="px-2 py-1.5 text-left font-medium">Type</th>
                  <th className="px-2 py-1.5 text-left font-medium">Status</th>
                  <th className="px-2 py-1.5 text-center font-medium w-12">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {validRows.map((row) => {
                  const isRemoved = removedRows.has(row.rowIndex);
                  return (
                    <tr
                      key={row.rowIndex}
                      className={`border-t ${
                        isRemoved ? "opacity-40 line-through" : ""
                      }`}
                    >
                      <td className="px-2 py-1.5 text-muted-foreground font-data">
                        {row.rowIndex}
                      </td>
                      <td className="px-2 py-1.5">{row.data.business}</td>
                      <td className="px-2 py-1.5">{row.data.name}</td>
                      <td className="px-2 py-1.5">{row.data.email}</td>
                      <td className="px-2 py-1.5">{row.data.phone}</td>
                      <td className="px-2 py-1.5">
                        {row.warnings?.some((w) => w.field === "businessType") ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="line-through text-muted-foreground">
                              {row.warnings.find((w) => w.field === "businessType")?.originalValue}
                            </span>
                            <span className="text-[10px]">→</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                              {row.data._businessTypeNormalized || row.data.businessType || "—"}
                            </Badge>
                          </span>
                        ) : (
                          <span>{row.data.businessType || "—"}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        {row.warnings?.some((w) => w.field === "status") ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="line-through text-muted-foreground">
                              {row.warnings.find((w) => w.field === "status")?.originalValue}
                            </span>
                            <span className="text-[10px]">→</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                              {row.data._statusNormalized || row.data.status || "new"}
                            </Badge>
                          </span>
                        ) : (
                          <span>{row.data.status || "new"}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onToggleRemove(row.rowIndex)}
                        >
                          {isRemoved ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-red-500" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invalid rows */}
        {invalidRows.length > 0 && (
          <div>
            <button
              onClick={() => setShowInvalid(!showInvalid)}
              className="text-xs font-semibold mb-2 flex items-center gap-1.5 hover:text-red-700"
            >
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              Invalid Rows ({invalidRows.length})
              {showInvalid ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showInvalid && (
              <div className="border border-red-200 rounded-md overflow-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-red-50/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium w-8">
                        #
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Data
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRows.map((row) => (
                      <tr key={row.rowIndex} className="border-t">
                        <td className="px-2 py-1.5 text-muted-foreground font-data">
                          {row.rowIndex}
                        </td>
                        <td className="px-2 py-1.5">
                          {row.data.business || row.data.name || "—"} ·{" "}
                          {row.data.email || row.data.phone || "—"}
                        </td>
                        <td className="px-2 py-1.5">
                          {row.errors.map((e, i) => (
                            <span key={i} className="text-red-600 block">
                              {e.message}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Duplicate rows */}
        {duplicateRows.length > 0 && (
          <div>
            <button
              onClick={() => setShowDuplicates(!showDuplicates)}
              className="text-xs font-semibold mb-2 flex items-center gap-1.5 hover:text-amber-700"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Duplicate Rows ({duplicateRows.length})
              {showDuplicates ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showDuplicates && (
              <div className="border border-amber-200 rounded-md overflow-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-amber-50/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium w-8">
                        #
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Import Data
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Matches Existing
                      </th>
                      <th className="px-2 py-1.5 text-center font-medium w-12">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateRows.map((row) => {
                      const isRemoved = removedRows.has(row.rowIndex);
                      return (
                        <tr
                          key={row.rowIndex}
                          className={`border-t ${
                            isRemoved ? "opacity-40 line-through" : ""
                          }`}
                        >
                          <td className="px-2 py-1.5 text-muted-foreground font-data">
                            {row.rowIndex}
                          </td>
                          <td className="px-2 py-1.5">
                            {row.data.business} · {row.data.email}
                          </td>
                          <td className="px-2 py-1.5 text-amber-700">
                            {row.duplicateOf?.business} ({row.duplicateOf?.email}
                            )
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onToggleRemove(row.rowIndex)}
                            >
                              {isRemoved ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Trash2 className="h-3 w-3 text-red-500" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {activeCount} rows ready to import
            </span>
            <Button
              size="sm"
              onClick={onNext}
              disabled={activeCount === 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Confirm Step ───────────────────────────────────────────────────────────

function ConfirmStep({
  activeRows,
  duplicateCount,
  duplicateAction,
  isLoading,
  onDuplicateActionChange,
  onBack,
  onConfirm,
}: {
  activeRows: ValidatedRow[];
  duplicateCount: number;
  duplicateAction: "skip" | "update" | "import_anyway";
  isLoading: boolean;
  onDuplicateActionChange: (v: "skip" | "update" | "import_anyway") => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const dupsInActive = activeRows.filter((r) => r.duplicateOf).length;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">
          Confirm Import
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review and confirm before saving to database
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-md p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total rows to process:</span>
            <span className="font-data font-semibold">{activeRows.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>New leads:</span>
            <span className="font-data font-semibold text-green-700">
              {activeRows.length - dupsInActive}
            </span>
          </div>
          {dupsInActive > 0 && (
            <div className="flex justify-between text-sm">
              <span>Duplicates:</span>
              <span className="font-data font-semibold text-amber-700">
                {dupsInActive}
              </span>
            </div>
          )}
        </div>

        {/* Duplicate handling */}
        {dupsInActive > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              How to handle {dupsInActive} duplicate(s)?
            </h3>
            <div className="space-y-1.5">
              {[
                {
                  value: "skip" as const,
                  label: "Skip duplicates",
                  desc: "Don't import rows that match existing leads",
                },
                {
                  value: "update" as const,
                  label: "Update existing leads",
                  desc: "Merge new data into matching existing leads",
                },
                {
                  value: "import_anyway" as const,
                  label: "Import anyway",
                  desc: "Create new leads even if duplicates exist",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                    duplicateAction === opt.value
                      ? "border-amber-400 bg-amber-50/50"
                      : "border-border hover:border-amber-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="duplicateAction"
                    value={opt.value}
                    checked={duplicateAction === opt.value}
                    onChange={() => onDuplicateActionChange(opt.value)}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <div className="text-xs font-medium">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            This action will save leads to the database. This cannot be undone
            easily. Please make sure the data is correct.
          </p>
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Confirm Import
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Summary Step ───────────────────────────────────────────────────────────

function SummaryStep({
  summary,
  onDone,
}: {
  summary: ImportSummary;
  onDone: () => void;
}) {
  const total =
    summary.imported + summary.skipped + summary.updated + summary.failed;

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="pt-8 pb-6 text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-display font-bold">Import Complete</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {total} rows processed
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-xl font-data font-bold text-green-700">
              {summary.imported}
            </div>
            <div className="text-[11px] text-green-600">Imported</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-xl font-data font-bold text-blue-700">
              {summary.updated}
            </div>
            <div className="text-[11px] text-blue-600">Updated</div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-md p-3">
            <div className="text-xl font-data font-bold text-stone-700">
              {summary.skipped}
            </div>
            <div className="text-[11px] text-stone-600">Skipped</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-xl font-data font-bold text-red-700">
              {summary.failed}
            </div>
            <div className="text-[11px] text-red-600">Failed</div>
          </div>
        </div>

        {summary.duplicates > 0 && (
          <p className="text-xs text-muted-foreground">
            {summary.duplicates} duplicate(s) detected during import
          </p>
        )}

        <Button
          onClick={onDone}
          className="bg-amber-600 hover:bg-amber-700 w-full"
        >
          Go to Leads
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
