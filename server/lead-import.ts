/**
 * Lead Import Module
 * Handles Excel/CSV parsing, column mapping, validation, and duplicate detection
 */
import * as XLSX from "xlsx";
import { eq, or, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { leads, type Lead, type InsertLead } from "../drizzle/schema";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ParsedColumn {
  index: number;
  header: string;
}

export interface ColumnMapping {
  [leadField: string]: number | null; // maps lead field name → column index
}

export interface ParsedRow {
  rowIndex: number;
  cells: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: ValidationError[];
  isValid: boolean;
  duplicateOf?: { id: number; business: string; email: string } | null;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  updated: number;
  failed: number;
  duplicates: number;
}

// ─── Lead field definitions ─────────────────────────────────────────────────

export const LEAD_FIELDS = [
  { key: "business", label: "Business Name", required: true },
  { key: "name", label: "Contact Person", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "address", label: "Address", required: false },
  { key: "businessType", label: "Business Type", required: false },
  { key: "leadSource", label: "Lead Source", required: false },
  { key: "status", label: "Status", required: false },
  { key: "potentialValue", label: "Potential Value", required: false },
  { key: "estimatedWeeklyOrder", label: "Estimated Weekly Order", required: false },
  { key: "productsInterested", label: "Products Interested", required: false },
  { key: "assignedTo", label: "Assigned To", required: false },
  { key: "nextFollowUpDate", label: "Next Follow-up Date", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

export type LeadFieldKey = (typeof LEAD_FIELDS)[number]["key"];

// ─── Smart auto-mapping dictionary ──────────────────────────────────────────

const AUTO_MAP: Record<string, LeadFieldKey> = {
  // Business Name
  "company": "business",
  "company name": "business",
  "business": "business",
  "business name": "business",
  "business_name": "business",
  "businessname": "business",
  "organization": "business",
  "org": "business",
  "establishment": "business",
  "shop": "business",
  "store": "business",
  "cafe": "business",
  "restaurant": "business",

  // Contact Person
  "name": "name",
  "contact": "name",
  "contact name": "name",
  "contact_name": "name",
  "contactname": "name",
  "contact person": "name",
  "contact_person": "name",
  "contactperson": "name",
  "person": "name",
  "full name": "name",
  "fullname": "name",
  "owner": "name",
  "manager": "name",

  // Phone
  "phone": "phone",
  "phone number": "phone",
  "phone_number": "phone",
  "phonenumber": "phone",
  "mobile": "phone",
  "mobile number": "phone",
  "tel": "phone",
  "telephone": "phone",
  "cell": "phone",
  "number": "phone",

  // Email
  "email": "email",
  "email address": "email",
  "email_address": "email",
  "emailaddress": "email",
  "e-mail": "email",
  "mail": "email",

  // Address
  "address": "address",
  "location": "address",
  "street": "address",
  "street address": "address",
  "city": "address",
  "full address": "address",

  // Lead Source
  "source": "leadSource",
  "lead source": "leadSource",
  "lead_source": "leadSource",
  "leadsource": "leadSource",
  "how found": "leadSource",
  "referral source": "leadSource",

  // Business Type
  "type": "businessType",
  "business type": "businessType",
  "business_type": "businessType",
  "businesstype": "businessType",
  "category": "businessType",
  "segment": "businessType",

  // Status
  "status": "status",
  "lead status": "status",
  "lead_status": "status",

  // Potential Value
  "value": "potentialValue",
  "potential": "potentialValue",
  "potential value": "potentialValue",
  "potential_value": "potentialValue",

  // Estimated Weekly Order
  "weekly order": "estimatedWeeklyOrder",
  "weekly_order": "estimatedWeeklyOrder",
  "estimated weekly order": "estimatedWeeklyOrder",
  "est weekly": "estimatedWeeklyOrder",
  "order size": "estimatedWeeklyOrder",

  // Products Interested
  "products": "productsInterested",
  "products interested": "productsInterested",
  "products_interested": "productsInterested",
  "interested in": "productsInterested",
  "items": "productsInterested",

  // Assigned To
  "assigned": "assignedTo",
  "assigned to": "assignedTo",
  "assigned_to": "assignedTo",
  "rep": "assignedTo",
  "sales rep": "assignedTo",

  // Follow-up Date
  "follow up": "nextFollowUpDate",
  "follow-up": "nextFollowUpDate",
  "follow_up": "nextFollowUpDate",
  "followup": "nextFollowUpDate",
  "next follow-up": "nextFollowUpDate",
  "follow up date": "nextFollowUpDate",

  // Notes
  "notes": "notes",
  "note": "notes",
  "comment": "notes",
  "comments": "notes",
  "remarks": "notes",
  "description": "notes",
  "message": "notes",
};

// ─── Parse file ─────────────────────────────────────────────────────────────

export function parseFileBuffer(
  buffer: Buffer,
  fileName: string
): { columns: ParsedColumn[]; rows: ParsedRow[]; autoMapping: ColumnMapping } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in file");

  const sheet = workbook.Sheets[sheetName]!;
  const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rawData.length < 2) {
    throw new Error("File must have at least a header row and one data row");
  }

  // Extract headers
  const headerRow = rawData[0]!;
  const columns: ParsedColumn[] = headerRow.map((h, i) => ({
    index: i,
    header: String(h).trim(),
  }));

  // Extract data rows (skip header)
  const rows: ParsedRow[] = rawData.slice(1).map((row, i) => ({
    rowIndex: i + 2, // 1-indexed, +1 for header
    cells: row.map((c) => String(c ?? "").trim()),
  }));

  // Auto-map columns
  const autoMapping: ColumnMapping = {};
  const usedColumns = new Set<number>();

  for (const field of LEAD_FIELDS) {
    autoMapping[field.key] = null;
  }

  for (const col of columns) {
    const normalized = col.header.toLowerCase().trim();
    const matchedField = AUTO_MAP[normalized];
    if (matchedField && autoMapping[matchedField] === null && !usedColumns.has(col.index)) {
      autoMapping[matchedField] = col.index;
      usedColumns.add(col.index);
    }
  }

  return { columns, rows, autoMapping };
}

// ─── Validation ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_STATUSES = ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"];
const VALID_BUSINESS_TYPES = ["cafe", "restaurant", "grocery", "hotel", "caterer", "other"];
const VALID_LEAD_SOURCES = ["instagram", "referral", "website", "walk_in", "cold_call", "other"];
const VALID_POTENTIAL_VALUES = ["low", "medium", "high"];

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  // Remove all non-digit characters except + at start
  let cleaned = phone.replace(/[^\d+]/g, "");
  // If starts with 1 and is 11 digits, format as North American
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    cleaned = `+1-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    cleaned = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

export function validateRows(
  rows: ParsedRow[],
  mapping: ColumnMapping
): ValidatedRow[] {
  return rows
    .filter((row) => {
      // Ignore completely empty rows
      return row.cells.some((c) => c.trim() !== "");
    })
    .map((row) => {
      const data: Record<string, string> = {};
      const errors: ValidationError[] = [];

      // Extract mapped values
      for (const field of LEAD_FIELDS) {
        const colIdx = mapping[field.key];
        if (colIdx !== null && colIdx !== undefined && colIdx >= 0) {
          data[field.key] = row.cells[colIdx]?.trim() ?? "";
        } else {
          data[field.key] = "";
        }
      }

      // Normalize phone
      if (data.phone) {
        data.phone = normalizePhone(data.phone);
      }

      // Validation: must have business name OR contact person
      if (!data.business && !data.name) {
        errors.push({
          field: "business/name",
          message: "Must have at least Business Name or Contact Person",
        });
      }

      // Validation: must have phone OR email
      if (!data.phone && !data.email) {
        errors.push({
          field: "phone/email",
          message: "Must have at least Phone or Email",
        });
      }

      // Validate email format
      if (data.email && !EMAIL_REGEX.test(data.email)) {
        errors.push({
          field: "email",
          message: `Invalid email format: ${data.email}`,
        });
      }

      // Validate enum fields
      if (data.status && !VALID_STATUSES.includes(data.status.toLowerCase())) {
        errors.push({
          field: "status",
          message: `Invalid status: ${data.status}. Valid: ${VALID_STATUSES.join(", ")}`,
        });
      }

      if (data.businessType) {
        const normalized = data.businessType.toLowerCase();
        if (!VALID_BUSINESS_TYPES.includes(normalized)) {
          errors.push({
            field: "businessType",
            message: `Invalid business type: ${data.businessType}. Valid: ${VALID_BUSINESS_TYPES.join(", ")}`,
          });
        }
      }

      if (data.leadSource) {
        const normalized = data.leadSource.toLowerCase().replace(/\s+/g, "_");
        if (!VALID_LEAD_SOURCES.includes(normalized)) {
          errors.push({
            field: "leadSource",
            message: `Invalid lead source: ${data.leadSource}. Valid: ${VALID_LEAD_SOURCES.join(", ")}`,
          });
        }
      }

      if (data.potentialValue) {
        const normalized = data.potentialValue.toLowerCase();
        if (!VALID_POTENTIAL_VALUES.includes(normalized)) {
          errors.push({
            field: "potentialValue",
            message: `Invalid potential value: ${data.potentialValue}. Valid: ${VALID_POTENTIAL_VALUES.join(", ")}`,
          });
        }
      }

      return {
        rowIndex: row.rowIndex,
        data,
        errors,
        isValid: errors.length === 0,
        duplicateOf: null,
      };
    });
}

// ─── Duplicate Detection ────────────────────────────────────────────────────

export async function checkDuplicates(
  validatedRows: ValidatedRow[]
): Promise<ValidatedRow[]> {
  const db = await getDb();
  if (!db) return validatedRows;

  const existingLeads = await db.select().from(leads);

  return validatedRows.map((row) => {
    if (!row.isValid) return row;

    const dup = findDuplicate(row.data, existingLeads);
    return {
      ...row,
      duplicateOf: dup,
    };
  });
}

function findDuplicate(
  data: Record<string, string>,
  existingLeads: Lead[]
): { id: number; business: string; email: string } | null {
  for (const lead of existingLeads) {
    // Match by email (exact, case-insensitive)
    if (
      data.email &&
      lead.email &&
      data.email.toLowerCase() === lead.email.toLowerCase()
    ) {
      return { id: lead.id, business: lead.business, email: lead.email };
    }

    // Match by phone (normalized comparison)
    if (data.phone && lead.phone) {
      const normalizedImport = data.phone.replace(/\D/g, "");
      const normalizedExisting = lead.phone.replace(/\D/g, "");
      if (normalizedImport && normalizedExisting && normalizedImport === normalizedExisting) {
        return { id: lead.id, business: lead.business, email: lead.email };
      }
    }

    // Match by business name + address
    if (
      data.business &&
      lead.business &&
      data.business.toLowerCase() === lead.business.toLowerCase() &&
      data.address &&
      lead.address &&
      data.address.toLowerCase() === lead.address.toLowerCase()
    ) {
      return { id: lead.id, business: lead.business, email: lead.email };
    }
  }

  return null;
}

// ─── Build InsertLead from validated data ────────────────────────────────────

export function buildInsertLead(data: Record<string, string>): InsertLead {
  const lead: InsertLead = {
    name: data.name || "Unknown",
    business: data.business || "Unknown",
    email: data.email || "",
    phone: data.phone || null,
    address: data.address || null,
    message: null,
    status: "new",
    source: "import",
    notes: data.notes || null,
    businessType: null,
    leadSource: null,
    potentialValue: null,
    estimatedWeeklyOrder: data.estimatedWeeklyOrder || null,
    productsInterested: data.productsInterested || null,
    assignedTo: data.assignedTo || null,
  };

  // Map status
  if (data.status) {
    const s = data.status.toLowerCase();
    if (VALID_STATUSES.includes(s)) {
      lead.status = s as InsertLead["status"];
    }
  }

  // Map business type
  if (data.businessType) {
    const bt = data.businessType.toLowerCase();
    if (VALID_BUSINESS_TYPES.includes(bt)) {
      lead.businessType = bt as InsertLead["businessType"];
    }
  }

  // Map lead source
  if (data.leadSource) {
    const ls = data.leadSource.toLowerCase().replace(/\s+/g, "_");
    if (VALID_LEAD_SOURCES.includes(ls)) {
      lead.leadSource = ls as InsertLead["leadSource"];
    }
  }

  // Map potential value
  if (data.potentialValue) {
    const pv = data.potentialValue.toLowerCase();
    if (VALID_POTENTIAL_VALUES.includes(pv)) {
      lead.potentialValue = pv as InsertLead["potentialValue"];
    }
  }

  // Map follow-up date
  if (data.nextFollowUpDate) {
    const parsed = new Date(data.nextFollowUpDate);
    if (!isNaN(parsed.getTime())) {
      lead.nextFollowUpDate = parsed;
      lead.followUpStatus = "pending";
    }
  }

  return lead;
}
