import { describe, expect, it, vi } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  createTastingRequest: vi.fn().mockResolvedValue({
    id: 1,
    name: "Marie Tremblay",
    business: "Cafe Lumiere",
    email: "marie@cafelumiere.com",
    phone: "514-555-1234",
    address: "123 Rue Saint-Denis, Montreal",
    preferredDate: "Next Tuesday morning",
    bagelPreferences: "Plain, Sesame, Everything",
    message: "We serve 200 customers daily",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAllTastingRequests: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Marie Tremblay",
      business: "Cafe Lumiere",
      email: "marie@cafelumiere.com",
      phone: "514-555-1234",
      address: "123 Rue Saint-Denis",
      preferredDate: "Next Tuesday",
      bagelPreferences: "Plain, Sesame",
      message: null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "Jean Dupont",
      business: "Hotel Royal",
      email: "jean@hotelroyal.com",
      phone: null,
      address: null,
      preferredDate: null,
      bagelPreferences: null,
      message: null,
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateTastingRequestStatus: vi.fn().mockResolvedValue(undefined),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import {
  createTastingRequest,
  getAllTastingRequests,
  updateTastingRequestStatus,
} from "./db";
import { notifyOwner } from "./_core/notification";

describe("tastings", () => {
  describe("createTastingRequest", () => {
    it("creates a tasting request with all fields", async () => {
      const input = {
        name: "Marie Tremblay",
        business: "Cafe Lumiere",
        email: "marie@cafelumiere.com",
        phone: "514-555-1234",
        address: "123 Rue Saint-Denis, Montreal",
        preferredDate: "Next Tuesday morning",
        bagelPreferences: "Plain, Sesame, Everything",
        message: "We serve 200 customers daily",
      };

      const result = await createTastingRequest(input);

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Marie Tremblay");
      expect(result!.business).toBe("Cafe Lumiere");
      expect(result!.email).toBe("marie@cafelumiere.com");
      expect(result!.status).toBe("pending");
      expect(createTastingRequest).toHaveBeenCalledWith(input);
    });

    it("creates a tasting request with only required fields", async () => {
      const input = {
        name: "Jean Dupont",
        business: "Hotel Royal",
        email: "jean@hotelroyal.com",
        phone: null,
        address: null,
        preferredDate: null,
        bagelPreferences: null,
        message: null,
      };

      await createTastingRequest(input);
      expect(createTastingRequest).toHaveBeenCalledWith(input);
    });
  });

  describe("getAllTastingRequests", () => {
    it("returns all tasting requests ordered by creation date", async () => {
      const results = await getAllTastingRequests();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Marie Tremblay");
      expect(results[1].name).toBe("Jean Dupont");
      expect(results[1].status).toBe("scheduled");
    });
  });

  describe("updateTastingRequestStatus", () => {
    it("updates status to scheduled", async () => {
      await updateTastingRequestStatus(1, "scheduled");
      expect(updateTastingRequestStatus).toHaveBeenCalledWith(1, "scheduled");
    });

    it("updates status to completed", async () => {
      await updateTastingRequestStatus(1, "completed");
      expect(updateTastingRequestStatus).toHaveBeenCalledWith(1, "completed");
    });

    it("updates status to cancelled", async () => {
      await updateTastingRequestStatus(1, "cancelled");
      expect(updateTastingRequestStatus).toHaveBeenCalledWith(1, "cancelled");
    });
  });

  describe("owner notification on new tasting request", () => {
    it("notifies owner when a tasting request is submitted", async () => {
      const input = {
        name: "Marie Tremblay",
        business: "Cafe Lumiere",
        email: "marie@cafelumiere.com",
        phone: "514-555-1234",
      };

      await notifyOwner({
        title: `New Tasting Request: ${input.business}`,
        content: `${input.name} from ${input.business} (${input.email}) has requested a free tasting.`,
      });

      expect(notifyOwner).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Tasting Request: Cafe Lumiere",
          content: expect.stringContaining("Marie Tremblay"),
        })
      );
    });
  });
});
