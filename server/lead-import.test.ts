import { describe, it, expect } from "vitest";
import {
  parseFileBuffer,
  validateRows,
  normalizePhone,
  buildInsertLead,
  LEAD_FIELDS,
  type ColumnMapping,
  type ParsedRow,
} from "./lead-import";
import * as XLSX from "xlsx";

// ─── Helper: create a test Excel buffer ─────────────────────────────────────

function createTestExcel(headers: string[], rows: string[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createTestCSV(headers: string[], rows: string[][]): Buffer {
  const lines = [headers.join(","), ...rows.map((r) => r.join(","))];
  return Buffer.from(lines.join("\n"));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Lead Import Module", () => {
  describe("parseFileBuffer", () => {
    it("parses an Excel file and extracts columns and rows", () => {
      const buffer = createTestExcel(
        ["Company", "Contact", "Email", "Phone"],
        [
          ["Cafe Latte", "John Doe", "john@cafe.com", "514-555-0001"],
          ["Bistro X", "Jane Smith", "jane@bistro.com", "514-555-0002"],
        ]
      );

      const result = parseFileBuffer(buffer, "test.xlsx");

      expect(result.columns).toHaveLength(4);
      expect(result.columns[0]!.header).toBe("Company");
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]!.cells[0]).toBe("Cafe Latte");
    });

    it("parses a CSV file", () => {
      const buffer = createTestCSV(
        ["Business Name", "Name", "Email"],
        [["My Shop", "Alice", "alice@shop.com"]]
      );

      const result = parseFileBuffer(buffer, "test.csv");

      expect(result.columns).toHaveLength(3);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]!.cells[2]).toBe("alice@shop.com");
    });

    it("auto-maps common column names", () => {
      const buffer = createTestExcel(
        ["Company", "Contact Name", "Email Address", "Phone Number", "Notes"],
        [["Test Co", "Bob", "bob@test.com", "555-1234", "Some notes"]]
      );

      const result = parseFileBuffer(buffer, "test.xlsx");

      expect(result.autoMapping.business).toBe(0); // Company → business
      expect(result.autoMapping.name).toBe(1); // Contact Name → name
      expect(result.autoMapping.email).toBe(2); // Email Address → email
      expect(result.autoMapping.phone).toBe(3); // Phone Number → phone
      expect(result.autoMapping.notes).toBe(4); // Notes → notes
    });

    it("throws for empty file", () => {
      const buffer = createTestExcel(["Header"], []);
      expect(() => parseFileBuffer(buffer, "empty.xlsx")).toThrow(
        "at least one data row after the header row"
      );
    });
  });

  describe("normalizePhone", () => {
    it("normalizes a 10-digit number", () => {
      expect(normalizePhone("5145550001")).toBe("514-555-0001");
    });

    it("normalizes an 11-digit number starting with 1", () => {
      expect(normalizePhone("15145550001")).toBe("+1-514-555-0001");
    });

    it("strips non-digit characters", () => {
      expect(normalizePhone("(514) 555-0001")).toBe("514-555-0001");
    });

    it("returns empty string for empty input", () => {
      expect(normalizePhone("")).toBe("");
    });
  });

  describe("validateRows", () => {
    const mapping: ColumnMapping = {
      business: 0,
      name: 1,
      email: 2,
      phone: 3,
      address: null,
      businessType: null,
      leadSource: null,
      status: null,
      potentialValue: null,
      estimatedWeeklyOrder: null,
      productsInterested: null,
      assignedTo: null,
      nextFollowUpDate: null,
      notes: null,
    };

    it("validates valid rows", () => {
      const rows: ParsedRow[] = [
        {
          rowIndex: 2,
          cells: ["Cafe Latte", "John", "john@cafe.com", "514-555-0001"],
        },
      ];

      const result = validateRows(rows, mapping);

      expect(result).toHaveLength(1);
      expect(result[0]!.isValid).toBe(true);
      expect(result[0]!.errors).toHaveLength(0);
    });

    it("rejects rows without business name AND contact person", () => {
      const rows: ParsedRow[] = [
        { rowIndex: 2, cells: ["", "", "test@test.com", "555-1234"] },
      ];

      const result = validateRows(rows, mapping);

      expect(result[0]!.isValid).toBe(false);
      expect(result[0]!.errors.some((e) => e.field === "business/name")).toBe(
        true
      );
    });

    it("rejects rows without phone AND email", () => {
      const rows: ParsedRow[] = [
        { rowIndex: 2, cells: ["My Cafe", "John", "", ""] },
      ];

      const result = validateRows(rows, mapping);

      expect(result[0]!.isValid).toBe(false);
      expect(result[0]!.errors.some((e) => e.field === "phone/email")).toBe(
        true
      );
    });

    it("validates email format", () => {
      const rows: ParsedRow[] = [
        { rowIndex: 2, cells: ["My Cafe", "John", "not-an-email", "555-1234"] },
      ];

      const result = validateRows(rows, mapping);

      expect(result[0]!.isValid).toBe(false);
      expect(result[0]!.errors.some((e) => e.field === "email")).toBe(true);
    });

    it("ignores completely empty rows", () => {
      const rows: ParsedRow[] = [
        { rowIndex: 2, cells: ["", "", "", ""] },
        {
          rowIndex: 3,
          cells: ["Cafe Latte", "John", "john@cafe.com", "555-1234"],
        },
      ];

      const result = validateRows(rows, mapping);

      expect(result).toHaveLength(1);
      expect(result[0]!.rowIndex).toBe(3);
    });

    it("accepts row with only business name and email", () => {
      const rows: ParsedRow[] = [
        { rowIndex: 2, cells: ["My Cafe", "", "info@cafe.com", ""] },
      ];

      const result = validateRows(rows, mapping);

      expect(result[0]!.isValid).toBe(true);
    });

    it("accepts row with only contact person and phone", () => {
      const rows: ParsedRow[] = [
        { rowIndex: 2, cells: ["", "John Doe", "", "514-555-0001"] },
      ];

      const result = validateRows(rows, mapping);

      expect(result[0]!.isValid).toBe(true);
    });
  });

  describe("buildInsertLead", () => {
    it("builds a valid InsertLead object", () => {
      const data: Record<string, string> = {
        business: "Cafe Latte",
        name: "John Doe",
        email: "john@cafe.com",
        phone: "514-555-0001",
        address: "123 Main St",
        businessType: "cafe",
        leadSource: "referral",
        status: "new",
        potentialValue: "high",
        estimatedWeeklyOrder: "50 dozen",
        productsInterested: "Plain, Sesame",
        assignedTo: "Sarah",
        nextFollowUpDate: "",
        notes: "Good prospect",
      };

      const result = buildInsertLead(data);

      expect(result.name).toBe("John Doe");
      expect(result.business).toBe("Cafe Latte");
      expect(result.email).toBe("john@cafe.com");
      expect(result.phone).toBe("514-555-0001");
      expect(result.businessType).toBe("cafe");
      expect(result.leadSource).toBe("referral");
      expect(result.potentialValue).toBe("high");
      expect(result.notes).toBe("Good prospect");
      expect(result.source).toBe("import");
    });

    it("defaults missing fields", () => {
      const data: Record<string, string> = {
        business: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        businessType: "",
        leadSource: "",
        status: "",
        potentialValue: "",
        estimatedWeeklyOrder: "",
        productsInterested: "",
        assignedTo: "",
        nextFollowUpDate: "",
        notes: "",
      };

      const result = buildInsertLead(data);

      expect(result.name).toBe("Unknown");
      expect(result.business).toBe("Unknown");
      expect(result.status).toBe("new");
      expect(result.source).toBe("import");
    });

    it("maps valid status values", () => {
      const data: Record<string, string> = {
        business: "Test",
        name: "Test",
        email: "test@test.com",
        phone: "",
        address: "",
        businessType: "",
        leadSource: "",
        status: "interested",
        potentialValue: "",
        estimatedWeeklyOrder: "",
        productsInterested: "",
        assignedTo: "",
        nextFollowUpDate: "",
        notes: "",
      };

      const result = buildInsertLead(data);
      expect(result.status).toBe("interested");
    });

    it("parses follow-up date", () => {
      const data: Record<string, string> = {
        business: "Test",
        name: "Test",
        email: "test@test.com",
        phone: "",
        address: "",
        businessType: "",
        leadSource: "",
        status: "",
        potentialValue: "",
        estimatedWeeklyOrder: "",
        productsInterested: "",
        assignedTo: "",
        nextFollowUpDate: "2025-06-15",
        notes: "",
      };

      const result = buildInsertLead(data);
      expect(result.nextFollowUpDate).toBeInstanceOf(Date);
      expect(result.followUpStatus).toBe("pending");
    });
  });

  describe("LEAD_FIELDS", () => {
    it("has all expected fields", () => {
      const keys = LEAD_FIELDS.map((f) => f.key);
      expect(keys).toContain("business");
      expect(keys).toContain("name");
      expect(keys).toContain("phone");
      expect(keys).toContain("email");
      expect(keys).toContain("address");
      expect(keys).toContain("notes");
      expect(keys).toContain("status");
      expect(keys).toContain("potentialValue");
    });

    it("marks business and name as required", () => {
      const businessField = LEAD_FIELDS.find((f) => f.key === "business");
      const nameField = LEAD_FIELDS.find((f) => f.key === "name");
      expect(businessField?.required).toBe(true);
      expect(nameField?.required).toBe(true);
    });
  });
});
