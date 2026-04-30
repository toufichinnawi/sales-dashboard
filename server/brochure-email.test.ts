import { describe, expect, it } from "vitest";
import {
  getBrochureEmailContent,
  composeBrochureEmail,
  buildMailtoUrl,
  buildGmailUrl,
  buildOutlookUrl,
  composeBrochureSms,
  buildSmsUrl,
  getBrochureShareUrl,
  BROCHURE_URL,
  BAGEL_IMAGE_URL,
  BROCHURE_SHARE_PATH,
} from "./brochure-email";

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

  describe("BROCHURE_SHARE_PATH", () => {
    it("is a clean branded path", () => {
      expect(BROCHURE_SHARE_PATH).toBe("/share/wholesale-product-summary");
    });
  });

  describe("getBrochureShareUrl", () => {
    it("returns relative path when no origin provided", () => {
      expect(getBrochureShareUrl()).toBe("/share/wholesale-product-summary");
    });

    it("returns full URL when origin provided", () => {
      const url = getBrochureShareUrl("https://example.com");
      expect(url).toBe("https://example.com/share/wholesale-product-summary");
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

    it("includes the clean branded share link (not raw CloudFront URL)", () => {
      const result = composeBrochureEmail(lead, "https://mysite.com");
      expect(result.body).toContain("https://mysite.com/share/wholesale-product-summary");
      expect(result.body).not.toContain("cloudfront.net");
    });

    it("uses relative share path when no origin provided", () => {
      const result = composeBrochureEmail(lead);
      expect(result.body).toContain("/share/wholesale-product-summary");
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

    it("falls back to 'your team' when business name is empty", () => {
      const leadNoBiz = { name: "Test", business: "", email: "test@test.com" };
      const result = composeBrochureEmail(leadNoBiz);
      expect(result.body).toContain("Dear your team team");
    });
  });

  describe("buildOutlookUrl", () => {
    const lead = {
      name: "Test User",
      business: "Test Cafe",
      email: "test@example.com",
    };

    it("returns an Outlook Web compose URL", () => {
      const url = buildOutlookUrl(lead);
      expect(url).toContain("https://outlook.office.com/mail/deeplink/compose");
    });

    it("includes the recipient email as 'to' parameter (encoded)", () => {
      const url = buildOutlookUrl(lead);
      expect(url).toContain("to=" + encodeURIComponent("test@example.com"));
    });

    it("includes the subject parameter", () => {
      const url = buildOutlookUrl(lead);
      expect(url).toContain("subject=");
      expect(url).toContain("Wholesale");
    });

    it("includes the body with clean share link", () => {
      const url = buildOutlookUrl(lead, "https://mysite.com");
      expect(url).toContain("body=");
      expect(url).toContain(encodeURIComponent("https://mysite.com/share/wholesale-product-summary"));
    });

    it("personalizes the body for the lead's business", () => {
      const url = buildOutlookUrl(lead);
      expect(url).toContain(encodeURIComponent("Test Cafe"));
    });

    it("uses encodeURIComponent for proper encoding", () => {
      const url = buildOutlookUrl(lead);
      // Should not use URLSearchParams + encoding (which uses +)
      expect(url).toContain("to=" + encodeURIComponent("test@example.com"));
    });
  });

  describe("buildGmailUrl", () => {
    const lead = {
      name: "Test User",
      business: "Test Cafe",
      email: "test@example.com",
    };

    it("returns a Gmail compose URL", () => {
      const url = buildGmailUrl(lead);
      expect(url).toContain("https://mail.google.com/mail/");
      expect(url).toContain("view=cm");
    });

    it("includes the recipient email as 'to' parameter", () => {
      const url = buildGmailUrl(lead);
      expect(url).toContain("to=test%40example.com");
    });

    it("includes the subject as 'su' parameter", () => {
      const url = buildGmailUrl(lead);
      expect(url).toContain("su=");
      expect(url).toContain("Wholesale");
    });

    it("includes the body with clean share link", () => {
      const url = buildGmailUrl(lead, "https://mysite.com");
      expect(url).toContain("body=");
      expect(url).toContain("mysite.com");
    });

    it("personalizes the body for the lead's business", () => {
      const url = buildGmailUrl(lead);
      expect(url).toContain("Test+Cafe");
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

    it("includes body parameter with clean share link", () => {
      const url = buildMailtoUrl(lead, "https://mysite.com");
      expect(url).toContain("body=");
      expect(url).toContain(encodeURIComponent("https://mysite.com/share/wholesale-product-summary"));
    });
  });

  describe("composeBrochureSms", () => {
    it("returns a short SMS text with the business name", () => {
      const sms = composeBrochureSms("Cafe Lumiere");
      expect(sms).toContain("Cafe Lumiere");
      expect(sms).toContain("Rosalyn");
      expect(sms).toContain("Hinnawi Bros");
      expect(sms).toContain("wholesale");
    });

    it("includes the clean branded share link", () => {
      const sms = composeBrochureSms("Test Cafe", "https://mysite.com");
      expect(sms).toContain("https://mysite.com/share/wholesale-product-summary");
    });

    it("uses relative path when no origin provided", () => {
      const sms = composeBrochureSms("Test Cafe");
      expect(sms).toContain("/share/wholesale-product-summary");
    });

    it("falls back to 'there' when business name is empty", () => {
      const sms = composeBrochureSms("");
      expect(sms).toContain("Hi there");
    });
  });

  describe("buildSmsUrl", () => {
    it("returns an sms: URL with the phone number", () => {
      const url = buildSmsUrl("+15141234567", "Test Cafe");
      expect(url).toMatch(/^sms:/);
      expect(url).toContain(encodeURIComponent("+15141234567"));
    });

    it("includes body parameter with SMS text", () => {
      const url = buildSmsUrl("+15141234567", "Test Cafe", "https://mysite.com");
      expect(url).toContain("body=");
      expect(url).toContain(encodeURIComponent("Rosalyn"));
    });
  });

  describe("getBrochureEmailContent", () => {
    it("returns same result as composeBrochureEmail", () => {
      const lead = { name: "Test", business: "Test Co", email: "test@test.com" };
      const a = getBrochureEmailContent(lead, "https://example.com");
      const b = composeBrochureEmail(lead, "https://example.com");
      expect(a.subject).toBe(b.subject);
      expect(a.body).toBe(b.body);
    });
  });
});
