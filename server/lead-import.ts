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

export interface ValidationWarning {
  field: string;
  message: string;
  originalValue: string;
  normalizedValue: string;
}

export interface ValidatedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: ValidationError[];
  warnings: ValidationWarning[];
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
// Each key is a lowercase keyword/phrase; value is the lead field it maps to.
// We also support partial/substring matching for common patterns.

const AUTO_MAP_EXACT: Record<string, LeadFieldKey> = {
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
  "store name": "business",
  "storename": "business",
  "cafe": "business",
  "restaurant": "business",
  "client": "business",
  "client name": "business",
  "account": "business",
  "account name": "business",
  "firm": "business",
  "venue": "business",

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
  "first name": "name",
  "firstname": "name",
  "last name": "name",
  "lastname": "name",

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
  "cell phone": "phone",
  "work phone": "phone",
  "fax": "phone",

  // Email
  "email": "email",
  "email address": "email",
  "email_address": "email",
  "emailaddress": "email",
  "e-mail": "email",
  "mail": "email",
  "courriel": "email",

  // Address
  "address": "address",
  "location": "address",
  "street": "address",
  "street address": "address",
  "city": "address",
  "full address": "address",
  "adresse": "address",

  // Lead Source
  "source": "leadSource",
  "lead source": "leadSource",
  "lead_source": "leadSource",
  "leadsource": "leadSource",
  "how found": "leadSource",
  "referral source": "leadSource",
  "origin": "leadSource",

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

// Substring patterns: if the header CONTAINS one of these, map to the field.
// Checked after exact matching fails. Order matters — more specific first.
const AUTO_MAP_CONTAINS: { pattern: string; field: LeadFieldKey }[] = [
  { pattern: "business name", field: "business" },
  { pattern: "company name", field: "business" },
  { pattern: "store name", field: "business" },
  { pattern: "client name", field: "business" },
  { pattern: "account name", field: "business" },
  { pattern: "contact person", field: "name" },
  { pattern: "contact name", field: "name" },
  { pattern: "full name", field: "name" },
  { pattern: "phone number", field: "phone" },
  { pattern: "phone", field: "phone" },
  { pattern: "mobile", field: "phone" },
  { pattern: "telephone", field: "phone" },
  { pattern: "email", field: "email" },
  { pattern: "e-mail", field: "email" },
  { pattern: "mail", field: "email" },
  { pattern: "address", field: "address" },
  { pattern: "location", field: "address" },
  { pattern: "lead source", field: "leadSource" },
  { pattern: "source", field: "leadSource" },
  { pattern: "business type", field: "businessType" },
  { pattern: "category", field: "businessType" },
  { pattern: "follow-up", field: "nextFollowUpDate" },
  { pattern: "follow up", field: "nextFollowUpDate" },
  { pattern: "followup", field: "nextFollowUpDate" },
  { pattern: "notes", field: "notes" },
  { pattern: "comment", field: "notes" },
  { pattern: "remark", field: "notes" },
  { pattern: "weekly order", field: "estimatedWeeklyOrder" },
  { pattern: "product", field: "productsInterested" },
  { pattern: "assigned", field: "assignedTo" },
  { pattern: "company", field: "business" },
  { pattern: "business", field: "business" },
  { pattern: "contact", field: "name" },
  { pattern: "name", field: "name" },
];

// ─── Header detection helpers ───────────────────────────────────────────────

/**
 * Determine if a row looks like a header row:
 * - Has at least 2 non-empty cells
 * - Most cells are short text (not long data)
 * - At least one cell matches a known keyword
 */
function isLikelyHeaderRow(row: string[]): boolean {
  const nonEmpty = row.filter((c) => String(c ?? "").trim() !== "");
  if (nonEmpty.length < 2) return false;

  // Check if at least one cell matches a known auto-map keyword
  let matchCount = 0;
  for (const cell of nonEmpty) {
    const normalized = String(cell).toLowerCase().trim().replace(/[_\-]/g, " ");
    if (AUTO_MAP_EXACT[normalized]) {
      matchCount++;
    } else {
      // Check substring patterns
      for (const { pattern } of AUTO_MAP_CONTAINS) {
        if (normalized.includes(pattern)) {
          matchCount++;
          break;
        }
      }
    }
  }

  // If at least 1 cell matches a known keyword, it's likely a header
  if (matchCount >= 1) return true;

  // Fallback: if most cells are short (< 40 chars) and non-numeric, likely a header
  const shortTextCount = nonEmpty.filter((c) => {
    const s = String(c).trim();
    return s.length < 40 && isNaN(Number(s));
  }).length;

  return shortTextCount >= nonEmpty.length * 0.7;
}

/**
 * Find the header row index from the raw data.
 * Scans the first 10 rows to find the best header candidate.
 */
function findHeaderRowIndex(rawData: string[][]): number {
  const maxScan = Math.min(rawData.length, 10);

  // First pass: find a row that matches known keywords
  for (let i = 0; i < maxScan; i++) {
    const row = rawData[i];
    if (!row) continue;
    const nonEmpty = row.filter((c) => String(c ?? "").trim() !== "");
    if (nonEmpty.length < 2) continue;

    // Count keyword matches
    let matchCount = 0;
    for (const cell of nonEmpty) {
      const normalized = String(cell).toLowerCase().trim().replace(/[_\-]/g, " ");
      if (AUTO_MAP_EXACT[normalized]) {
        matchCount++;
      } else {
        for (const { pattern } of AUTO_MAP_CONTAINS) {
          if (normalized.includes(pattern)) {
            matchCount++;
            break;
          }
        }
      }
    }

    // If at least 2 cells match known keywords, this is very likely the header
    if (matchCount >= 2) return i;
  }

  // Second pass: find the first row with at least 2 non-empty cells
  for (let i = 0; i < maxScan; i++) {
    const row = rawData[i];
    if (!row) continue;
    if (isLikelyHeaderRow(row)) return i;
  }

  // Default to row 0
  return 0;
}

/**
 * Auto-map a single column header to a lead field.
 * Uses exact match first, then substring match.
 */
function autoMapColumn(header: string): LeadFieldKey | null {
  if (!header) return null;

  // Normalize: lowercase, trim, replace underscores/dashes with spaces, collapse whitespace
  const normalized = header
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");

  // Exact match
  if (AUTO_MAP_EXACT[normalized]) {
    return AUTO_MAP_EXACT[normalized];
  }

  // Try without common prefixes/suffixes like "lead ", "customer "
  const stripped = normalized
    .replace(/^(lead|customer|client|account)\s+/, "")
    .trim();
  if (stripped !== normalized && AUTO_MAP_EXACT[stripped]) {
    return AUTO_MAP_EXACT[stripped];
  }

  // Substring match
  for (const { pattern, field } of AUTO_MAP_CONTAINS) {
    if (normalized.includes(pattern)) {
      return field;
    }
  }

  return null;
}

// ─── Parse file ─────────────────────────────────────────────────────────────

export function parseFileBuffer(
  buffer: Buffer,
  fileName: string
): { columns: ParsedColumn[]; rows: ParsedRow[]; autoMapping: ColumnMapping; headerRowIndex: number } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in file");

  const sheet = workbook.Sheets[sheetName]!;
  const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rawData.length < 1) {
    throw new Error("File is empty");
  }

  // Find the header row (first non-empty row with recognizable column names)
  const headerRowIdx = findHeaderRowIndex(rawData);
  const headerRow = rawData[headerRowIdx]!;

  // Check that we actually have headers
  const nonEmptyHeaders = headerRow.filter((h) => String(h ?? "").trim() !== "");
  if (nonEmptyHeaders.length === 0) {
    throw new Error(
      "No column headers detected. Please make sure your first non-empty row contains column names."
    );
  }

  // Extract columns from the header row
  const columns: ParsedColumn[] = headerRow.map((h, i) => ({
    index: i,
    header: String(h ?? "").trim(),
  }));

  // Extract data rows (everything after the header row)
  const dataRows = rawData.slice(headerRowIdx + 1);
  if (dataRows.length === 0) {
    throw new Error("File must have at least one data row after the header row");
  }

  const rows: ParsedRow[] = dataRows
    .map((row, i) => ({
      rowIndex: headerRowIdx + 2 + i, // 1-indexed Excel row number
      cells: row.map((c) => String(c ?? "").trim()),
    }))
    .filter((row) => row.cells.some((c) => c !== "")); // skip fully empty rows

  if (rows.length === 0) {
    throw new Error("No data rows found after the header row");
  }

  // Auto-map columns using improved matching
  const autoMapping: ColumnMapping = {};
  const usedColumns = new Set<number>();

  // Initialize all fields to null
  for (const field of LEAD_FIELDS) {
    autoMapping[field.key] = null;
  }

  // Map each column to a field
  for (const col of columns) {
    if (!col.header) continue; // skip empty headers
    const matchedField = autoMapColumn(col.header);
    if (matchedField && autoMapping[matchedField] === null && !usedColumns.has(col.index)) {
      autoMapping[matchedField] = col.index;
      usedColumns.add(col.index);
    }
  }

  return { columns, rows, autoMapping, headerRowIndex: headerRowIdx };
}

// ─── Validation ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_STATUSES = ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"];
const VALID_BUSINESS_TYPES = ["cafe", "restaurant", "grocery", "hotel", "caterer", "other"];
const VALID_LEAD_SOURCES = ["instagram", "referral", "website", "walk_in", "cold_call", "other"];
const VALID_POTENTIAL_VALUES = ["low", "medium", "high"];

// ─── Enum normalization maps ────────────────────────────────────────────────
// Maps common imported values to valid enum values.

const BUSINESS_TYPE_NORMALIZE: Record<string, string> = {
  // cafe
  "café": "cafe", "cafe": "cafe", "coffee shop": "cafe", "coffee": "cafe",
  "café / coffee shop": "cafe", "cafe / coffee shop": "cafe",
  "bakery cafe": "cafe", "bakery café": "cafe", "bakery": "cafe",
  "coffee house": "cafe", "coffeehouse": "cafe", "tea shop": "cafe",
  "tea house": "cafe", "espresso bar": "cafe", "juice bar": "cafe",
  "boulangerie": "cafe", "patisserie": "cafe", "pâtisserie": "cafe",
  // restaurant
  "restaurant": "restaurant", "food service": "restaurant", "deli": "restaurant",
  "sandwich shop": "restaurant", "bistro": "restaurant", "brasserie": "restaurant",
  "diner": "restaurant", "eatery": "restaurant", "pizzeria": "restaurant",
  "traiteur": "restaurant", "food truck": "restaurant", "fast food": "restaurant",
  "pub": "restaurant", "bar": "restaurant", "grill": "restaurant",
  "steakhouse": "restaurant", "sushi": "restaurant", "buffet": "restaurant",
  "canteen": "restaurant", "cafeteria": "restaurant",
  // grocery
  "grocery": "grocery", "grocery store": "grocery", "market": "grocery",
  "supermarket": "grocery", "épicerie": "grocery", "epicerie": "grocery",
  "convenience store": "grocery", "dépanneur": "grocery", "depanneur": "grocery",
  "food store": "grocery", "general store": "grocery", "mini mart": "grocery",
  // hotel
  "hotel": "hotel", "hospitality": "hotel", "motel": "hotel",
  "inn": "hotel", "resort": "hotel", "b&b": "hotel", "bed and breakfast": "hotel",
  "auberge": "hotel", "hostel": "hotel", "lodge": "hotel",
  // caterer
  "caterer": "caterer", "catering": "caterer", "catering company": "caterer",
  "catering service": "caterer", "event catering": "caterer",
  "food catering": "caterer", "traiteur service": "caterer",
  // other
  "other": "other", "unknown": "other", "n/a": "other", "na": "other",
};

const STATUS_NORMALIZE: Record<string, string> = {
  "new": "new", "nouveau": "new", "fresh": "new",
  "contacted": "contacted", "contact made": "contacted", "reached out": "contacted",
  "interested": "interested", "warm": "interested", "hot": "interested",
  "tasting scheduled": "tasting_scheduled", "tasting_scheduled": "tasting_scheduled",
  "tasting": "tasting_scheduled", "sample": "tasting_scheduled",
  "quote sent": "quote_sent", "quote_sent": "quote_sent", "quoted": "quote_sent",
  "negotiation": "negotiation", "negotiating": "negotiation", "in progress": "negotiation",
  "won": "won", "closed won": "won", "converted": "won", "active": "won",
  "lost": "lost", "closed lost": "lost", "dead": "lost", "rejected": "lost",
};

const LEAD_SOURCE_NORMALIZE: Record<string, string> = {
  "instagram": "instagram", "ig": "instagram", "insta": "instagram",
  "referral": "referral", "referred": "referral", "word of mouth": "referral",
  "recommendation": "referral", "reference": "referral",
  "website": "website", "web": "website", "online": "website", "google": "website",
  "walk in": "walk_in", "walk_in": "walk_in", "walkin": "walk_in", "walk-in": "walk_in",
  "door to door": "walk_in", "in person": "walk_in",
  "cold call": "cold_call", "cold_call": "cold_call", "coldcall": "cold_call",
  "phone": "cold_call", "telemarketing": "cold_call",
  "other": "other", "unknown": "other", "n/a": "other", "na": "other",
};

const POTENTIAL_VALUE_NORMALIZE: Record<string, string> = {
  "low": "low", "small": "low", "minor": "low",
  "medium": "medium", "med": "medium", "moderate": "medium", "average": "medium",
  "high": "high", "large": "high", "big": "high", "major": "high",
};

/**
 * Normalize an enum value using a lookup map.
 * Returns { normalized, matched } where matched=true if a mapping was found.
 */
export function normalizeEnumValue(
  value: string,
  normalizeMap: Record<string, string>,
  validValues: string[]
): { normalized: string; matched: boolean } {
  if (!value) return { normalized: "", matched: true };
  const lower = value.toLowerCase().trim();

  // Direct match to valid values
  if (validValues.includes(lower)) {
    return { normalized: lower, matched: true };
  }

  // Check normalization map
  if (normalizeMap[lower]) {
    return { normalized: normalizeMap[lower], matched: true };
  }

  // Try partial matching: check if the value contains a key from the map
  for (const [key, mapped] of Object.entries(normalizeMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { normalized: mapped, matched: true };
    }
  }

  // No match found — default to "other" if available, otherwise empty
  if (validValues.includes("other")) {
    return { normalized: "other", matched: false };
  }
  return { normalized: "", matched: false };
}

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
      const warnings: ValidationWarning[] = [];

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

      // Normalize enum fields (warnings, not errors)
      if (data.businessType) {
        const original = data.businessType;
        const { normalized, matched } = normalizeEnumValue(original, BUSINESS_TYPE_NORMALIZE, VALID_BUSINESS_TYPES);
        if (normalized && original.toLowerCase().trim() !== normalized) {
          warnings.push({
            field: "businessType",
            message: `Business type normalized: "${original}" → "${normalized}"`,
            originalValue: original,
            normalizedValue: normalized,
          });
        }
        if (!matched) {
          warnings.push({
            field: "businessType",
            message: `Unrecognized business type: "${original}" → defaulting to "other"`,
            originalValue: original,
            normalizedValue: "other",
          });
        }
        data._businessTypeNormalized = normalized || "other";
      }

      if (data.status) {
        const original = data.status;
        const { normalized, matched } = normalizeEnumValue(original, STATUS_NORMALIZE, VALID_STATUSES);
        if (normalized && original.toLowerCase().trim() !== normalized) {
          warnings.push({
            field: "status",
            message: `Status normalized: "${original}" → "${normalized}"`,
            originalValue: original,
            normalizedValue: normalized,
          });
        }
        if (!matched) {
          warnings.push({
            field: "status",
            message: `Unrecognized status: "${original}" → defaulting to "new"`,
            originalValue: original,
            normalizedValue: "new",
          });
        }
        data._statusNormalized = normalized || "new";
      }

      if (data.leadSource) {
        const original = data.leadSource;
        const { normalized, matched } = normalizeEnumValue(original, LEAD_SOURCE_NORMALIZE, VALID_LEAD_SOURCES);
        if (normalized && original.toLowerCase().trim() !== normalized) {
          warnings.push({
            field: "leadSource",
            message: `Lead source normalized: "${original}" → "${normalized}"`,
            originalValue: original,
            normalizedValue: normalized,
          });
        }
        if (!matched) {
          warnings.push({
            field: "leadSource",
            message: `Unrecognized lead source: "${original}" → defaulting to "other"`,
            originalValue: original,
            normalizedValue: "other",
          });
        }
        data._leadSourceNormalized = normalized || "other";
      }

      if (data.potentialValue) {
        const original = data.potentialValue;
        const { normalized, matched } = normalizeEnumValue(original, POTENTIAL_VALUE_NORMALIZE, VALID_POTENTIAL_VALUES);
        if (normalized && original.toLowerCase().trim() !== normalized) {
          warnings.push({
            field: "potentialValue",
            message: `Potential value normalized: "${original}" → "${normalized}"`,
            originalValue: original,
            normalizedValue: normalized,
          });
        }
        if (!matched) {
          warnings.push({
            field: "potentialValue",
            message: `Unrecognized potential value: "${original}" → ignored`,
            originalValue: original,
            normalizedValue: "",
          });
        }
        data._potentialValueNormalized = normalized;
      }

      return {
        rowIndex: row.rowIndex,
        data,
        errors,
        warnings,
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

  // Map status — use pre-normalized value if available
  const statusVal = data._statusNormalized || data.status;
  if (statusVal) {
    const s = statusVal.toLowerCase();
    if (VALID_STATUSES.includes(s)) {
      lead.status = s as InsertLead["status"];
    }
  }

  // Map business type — use pre-normalized value if available
  const btVal = data._businessTypeNormalized || data.businessType;
  if (btVal) {
    const bt = btVal.toLowerCase();
    if (VALID_BUSINESS_TYPES.includes(bt)) {
      lead.businessType = bt as InsertLead["businessType"];
    }
  }

  // Map lead source — use pre-normalized value if available
  const lsVal = data._leadSourceNormalized || data.leadSource;
  if (lsVal) {
    const ls = lsVal.toLowerCase().replace(/\s+/g, "_");
    if (VALID_LEAD_SOURCES.includes(ls)) {
      lead.leadSource = ls as InsertLead["leadSource"];
    }
  }

  // Map potential value — use pre-normalized value if available
  const pvVal = data._potentialValueNormalized || data.potentialValue;
  if (pvVal) {
    const pv = pvVal.toLowerCase();
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
