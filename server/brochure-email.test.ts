import { describe, expect, it } from "vitest";
import { getBrochureEmailContent, composeBrochureEmail, BROCHURE_URL, BAGEL_IMAGE_URL } from "./brochure-email";

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

  describe("composeBrochureEmail", () => {
    const lead = {
      name: "Alice Martin",
      business: "Cafe Lumiere",
      email: "alice@cafelumiere.com",
    };

    it("returns subject, text, and html strings", () => {
      const result = composeBrochureEmail(lead);
      expect(result).toHaveProperty("subject");
      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("html");
      expect(typeof result.subject).toBe("string");
      expect(typeof result.text).toBe("string");
      expect(typeof result.html).toBe("string");
    });

    it("includes the lead's name in the greeting", () => {
      const result = composeBrochureEmail(lead);
      expect(result.text).toContain("Hi Alice Martin");
      expect(result.html).toContain("Hi Alice Martin");
    });

    it("includes the lead's business name in the closing", () => {
      const result = composeBrochureEmail(lead);
      expect(result.text).toContain("Cafe Lumiere");
      expect(result.html).toContain("Cafe Lumiere");
    });

    it("includes the brochure download URL", () => {
      const result = composeBrochureEmail(lead);
      expect(result.text).toContain(BROCHURE_URL);
      expect(result.html).toContain(BROCHURE_URL);
    });

    it("includes wholesale pricing information", () => {
      const result = composeBrochureEmail(lead);
      expect(result.text).toContain("$8.00 per dozen");
      expect(result.html).toContain("$8.00 per dozen");
    });

    it("mentions the 4 signature bagel varieties", () => {
      const result = composeBrochureEmail(lead);
      expect(result.text).toContain("Plain");
      expect(result.text).toContain("Sesame");
      expect(result.text).toContain("Multigrain");
      expect(result.text).toContain("Everything");
    });

    it("includes Rosalyn's contact information", () => {
      const result = composeBrochureEmail(lead);
      expect(result.text).toContain("Rosalyn Manneh");
      expect(result.text).toContain("514-571-7672");
      expect(result.text).toContain("rosalyn@bagelandcafe.com");
    });

    it("has a professional subject line", () => {
      const result = composeBrochureEmail(lead);
      expect(result.subject).toContain("Hinnawi Bros");
      expect(result.subject).toContain("Wholesale");
    });

    it("personalizes content for different leads", () => {
      const lead2 = {
        name: "Bob Chen",
        business: "Golden Dragon Restaurant",
        email: "bob@goldendragon.ca",
      };
      const result = composeBrochureEmail(lead2);
      expect(result.text).toContain("Hi Bob Chen");
      expect(result.text).toContain("Golden Dragon Restaurant");
    });

    it("includes HTML with styled brochure download button", () => {
      const result = composeBrochureEmail(lead);
      expect(result.html).toContain("Download the Brochure");
      expect(result.html).toContain("Request a Free Tasting");
    });

    it("includes bagel image in HTML email", () => {
      const result = composeBrochureEmail(lead);
      expect(result.html).toContain(BAGEL_IMAGE_URL);
    });
  });

  describe("getBrochureEmailContent", () => {
    it("returns same result as composeBrochureEmail", () => {
      const lead = { name: "Test", business: "Test Co", email: "test@test.com" };
      const a = getBrochureEmailContent(lead);
      const b = composeBrochureEmail(lead);
      expect(a.subject).toBe(b.subject);
      expect(a.text).toBe(b.text);
      expect(a.html).toBe(b.html);
    });
  });
});
