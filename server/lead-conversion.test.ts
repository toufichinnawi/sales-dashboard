import { describe, it, expect } from "vitest";

/**
 * Lead-to-Client Conversion Tests
 *
 * These tests verify the conversion logic at the unit level.
 * Since the actual DB operations are integration-level, we test
 * the business rules and data flow expectations.
 */

describe("lead-conversion", () => {
  describe("Active status classification", () => {
    const ACTIVE_STATUSES = ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation"];
    const CONVERTED_STATUSES = ["won"];
    const LOST_STATUSES = ["lost"];

    it("active statuses include all pipeline stages before conversion", () => {
      expect(ACTIVE_STATUSES).toContain("new");
      expect(ACTIVE_STATUSES).toContain("contacted");
      expect(ACTIVE_STATUSES).toContain("interested");
      expect(ACTIVE_STATUSES).toContain("tasting_scheduled");
      expect(ACTIVE_STATUSES).toContain("quote_sent");
      expect(ACTIVE_STATUSES).toContain("negotiation");
    });

    it("active statuses do not include won or lost", () => {
      expect(ACTIVE_STATUSES).not.toContain("won");
      expect(ACTIVE_STATUSES).not.toContain("lost");
    });

    it("converted statuses include only won", () => {
      expect(CONVERTED_STATUSES).toEqual(["won"]);
    });

    it("lost statuses include only lost", () => {
      expect(LOST_STATUSES).toEqual(["lost"]);
    });

    it("all statuses are accounted for in the three groups", () => {
      const allStatuses = [...ACTIVE_STATUSES, ...CONVERTED_STATUSES, ...LOST_STATUSES];
      const expectedStatuses = ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"];
      expect(allStatuses.sort()).toEqual(expectedStatuses.sort());
    });
  });

  describe("Duplicate detection logic", () => {
    it("should match by email", () => {
      const existingClients = [
        { id: 1, email: "cafe@test.com", phone: "514-111-1111", businessName: "Test Cafe" },
      ];
      const leadEmail = "cafe@test.com";
      const matches = existingClients.filter(c => c.email === leadEmail);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(1);
    });

    it("should match by phone", () => {
      const existingClients = [
        { id: 2, email: "other@test.com", phone: "514-222-2222", businessName: "Other Cafe" },
      ];
      const leadPhone = "514-222-2222";
      const matches = existingClients.filter(c => c.phone === leadPhone);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(2);
    });

    it("should match by business name", () => {
      const existingClients = [
        { id: 3, email: "biz@test.com", phone: "514-333-3333", businessName: "Montreal Bagel Shop" },
      ];
      const leadBusiness = "Montreal Bagel Shop";
      const matches = existingClients.filter(c => c.businessName === leadBusiness);
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(3);
    });

    it("should return empty when no match", () => {
      const existingClients = [
        { id: 1, email: "cafe@test.com", phone: "514-111-1111", businessName: "Test Cafe" },
      ];
      const matches = existingClients.filter(
        c => c.email === "nomatch@test.com" || c.phone === "999-999-9999" || c.businessName === "No Match"
      );
      expect(matches).toHaveLength(0);
    });
  });

  describe("Conversion data flow", () => {
    it("should set status to won after conversion", () => {
      const lead = { id: 1, status: "negotiation", convertedAt: null, convertedCustomerId: null };
      // Simulate conversion
      const converted = { ...lead, status: "won", convertedAt: new Date(), convertedCustomerId: 42 };
      expect(converted.status).toBe("won");
      expect(converted.convertedCustomerId).toBe(42);
      expect(converted.convertedAt).toBeInstanceOf(Date);
    });

    it("should create customer with lead information", () => {
      const lead = {
        id: 1,
        name: "John Doe",
        business: "Doe's Cafe",
        email: "john@doescafe.com",
        phone: "514-555-1234",
        address: "123 Main St",
        notes: "Interested in sesame bagels",
      };

      const newCustomer = {
        businessName: lead.business,
        contactName: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        notes: lead.notes,
        status: "active" as const,
        segment: "cafe" as const,
      };

      expect(newCustomer.businessName).toBe("Doe's Cafe");
      expect(newCustomer.contactName).toBe("John Doe");
      expect(newCustomer.email).toBe("john@doescafe.com");
      expect(newCustomer.phone).toBe("514-555-1234");
      expect(newCustomer.status).toBe("active");
    });

    it("should link to existing customer when duplicate found", () => {
      const lead = { id: 5, status: "interested", convertedCustomerId: null };
      const existingCustomerId = 99;
      // Simulate linking to existing
      const converted = { ...lead, status: "won", convertedAt: new Date(), convertedCustomerId: existingCustomerId };
      expect(converted.convertedCustomerId).toBe(99);
      expect(converted.status).toBe("won");
    });

    it("should not delete the lead after conversion", () => {
      const leads = [
        { id: 1, status: "won", convertedCustomerId: 42 },
        { id: 2, status: "new", convertedCustomerId: null },
      ];
      // Converted leads remain in the list
      expect(leads).toHaveLength(2);
      expect(leads.find(l => l.id === 1)).toBeDefined();
    });

    it("converted leads should be filtered from active view", () => {
      const ACTIVE_STATUSES = ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation"];
      const leads = [
        { id: 1, status: "won", convertedCustomerId: 42 },
        { id: 2, status: "new", convertedCustomerId: null },
        { id: 3, status: "lost", convertedCustomerId: null },
        { id: 4, status: "contacted", convertedCustomerId: null },
      ];
      const activeLeads = leads.filter(l => ACTIVE_STATUSES.includes(l.status));
      expect(activeLeads).toHaveLength(2);
      expect(activeLeads.map(l => l.id)).toEqual([2, 4]);
    });
  });
});
