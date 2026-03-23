import { describe, expect, it } from "vitest";
import { getBrochureEmailContent, BROCHURE_URL, BAGEL_IMAGE_URL } from "./brochure-email";

describe("brochure-email", () => {
  describe("BROCHURE_URL", () => {
    it("points to the v4 PDF on CloudFront CDN", () => {
      expect(BROCHURE_URL).toContain("cloudfront.net");
      expect(BROCHURE_URL).toContain("Hinnawi_Bros_Wholesale_Brochure");
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

  describe("getBrochureEmailContent", () => {
    const lead = {
      name: "Alice Martin",
      business: "Cafe Lumiere",
      email: "alice@cafelumiere.com",
    };

    it("returns subject and content strings", () => {
      const result = getBrochureEmailContent(lead);
      expect(result).toHaveProperty("subject");
      expect(result).toHaveProperty("content");
      expect(typeof result.subject).toBe("string");
      expect(typeof result.content).toBe("string");
    });

    it("includes the lead's name in the greeting", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.content).toContain("Hi Alice Martin");
    });

    it("includes the lead's business name in the closing", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.content).toContain("Cafe Lumiere");
    });

    it("includes the brochure download URL", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.content).toContain(BROCHURE_URL);
    });

    it("includes wholesale pricing information", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.content).toContain("$8.00 per dozen");
    });

    it("mentions the 4 signature bagel varieties", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.content).toContain("Plain");
      expect(result.content).toContain("Sesame");
      expect(result.content).toContain("Multigrain");
      expect(result.content).toContain("Everything");
    });

    it("includes Rosalyn's contact information", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.content).toContain("Rosalyn Manneh");
      expect(result.content).toContain("514-571-7672");
      expect(result.content).toContain("rosalyn@bagelandcafe.com");
    });

    it("has a professional subject line", () => {
      const result = getBrochureEmailContent(lead);
      expect(result.subject).toContain("Hinnawi Bros");
      expect(result.subject).toContain("Wholesale");
    });

    it("personalizes content for different leads", () => {
      const lead2 = {
        name: "Bob Chen",
        business: "Golden Dragon Restaurant",
        email: "bob@goldendragon.ca",
      };
      const result = getBrochureEmailContent(lead2);
      expect(result.content).toContain("Hi Bob Chen");
      expect(result.content).toContain("Golden Dragon Restaurant");
    });
  });
});
