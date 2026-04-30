import { describe, expect, it } from "vitest";
import { getBrochureEmailContent, composeBrochureEmail, buildMailtoUrl, BROCHURE_URL, BAGEL_IMAGE_URL } from "./brochure-email";

describe("brochure-email", () => {
  describe("BROCHURE_URL", () => {
    it("points to the Client Summary PDF on CloudFront CDN", () => {
      expect(BROCHURE_URL).toContain("cloudfront.net");
      expect(BROCHURE_URL).toContain("Hinnawi_Bros_Client_Summary");
      expect(BROCHURE_URL).toMatch(/\.pdf$/);
    });
  });

  describe("BAGEL_IMAGE_URL", () => {
    it("points to a bagel image on CloudFront CDN", () => {
      expect(BAGEL_IMAGE_URL).toContain("cloudfront.net");
      expect(BAGEL_IMAGE_URL).toContain("bagel-variety");
      expect(BAGEL_IMAGE_URL).toMatch(/\.jpg$/);
    });
  });

  describe("composeBrochureEmail", () => {
    const lead = {
      name: "Alice Martin",
      business: "Cafe Lumiere",
      email: "alice@cafelumiere.com",
    };

    it("returns subject and body strings", () => {
      const result = composeBrochureEmail(lead);
      expect(result).toHaveProperty("subject");
      expect(result).toHaveProperty("body");
      expect(typeof result.subject).toBe("string");
      expect(typeof result.body).toBe("string");
    });

    it("includes the lead's business name in the greeting", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("Cafe Lumiere");
    });

    it("includes the brochure download URL", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain(BROCHURE_URL);
    });

    it("mentions signature bagel varieties", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("Sesame");
      expect(result.body).toContain("Plain");
      expect(result.body).toContain("Multigrain");
      expect(result.body).toContain("Everything");
    });

    it("includes Rosalyn's contact information", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("Rosalyn Menneh");
      expect(result.body).toContain("Hinnawi Bros. Bagel");
    });

    it("has a professional subject line about wholesale partnership", () => {
      const result = composeBrochureEmail(lead);
      expect(result.subject).toContain("Wholesale");
      expect(result.subject).toContain("Montréal Bagels");
    });

    it("personalizes content for different leads", () => {
      const lead2 = {
        name: "Bob Chen",
        business: "Golden Dragon Restaurant",
        email: "bob@goldendragon.ca",
      };
      const result = composeBrochureEmail(lead2);
      expect(result.body).toContain("Golden Dragon Restaurant");
    });

    it("mentions complimentary tasting offer", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("complimentary tasting");
    });

    it("mentions Hinnawi Bros Bagel", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("Hinnawi Bros");
    });

    it("mentions pack size and shelf life details", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("6 bagels per bag");
      expect(result.body).toContain("7 days ambient");
    });
  });

  describe("buildMailtoUrl", () => {
    const lead = {
      name: "Test User",
      business: "Test Cafe",
      email: "test@example.com",
    };

    it("returns a mailto: URL with the recipient email", () => {
      const url = buildMailtoUrl(lead);
      expect(url).toMatch(/^mailto:/);
      expect(url).toContain(encodeURIComponent("test@example.com"));
    });

    it("includes subject parameter", () => {
      const url = buildMailtoUrl(lead);
      expect(url).toContain("subject=");
    });

    it("includes body parameter with brochure URL", () => {
      const url = buildMailtoUrl(lead);
      expect(url).toContain("body=");
      expect(url).toContain(encodeURIComponent(BROCHURE_URL));
    });
  });

  describe("getBrochureEmailContent", () => {
    it("returns same result as composeBrochureEmail", () => {
      const lead = { name: "Test", business: "Test Co", email: "test@test.com" };
      const a = getBrochureEmailContent(lead);
      const b = composeBrochureEmail(lead);
      expect(a.subject).toBe(b.subject);
      expect(a.body).toBe(b.body);
    });
  });
});
