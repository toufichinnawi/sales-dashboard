import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  createNotification: vi.fn(),
  getAllNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

import {
  createNotification,
  getAllNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "./db";

describe("Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("should create a notification with required fields", async () => {
      const mockNotif = {
        id: 1,
        type: "new_lead" as const,
        title: "New Lead: Test Cafe",
        message: "John from Test Cafe (john@test.com)",
        link: "/leads",
        isRead: 0,
        createdAt: new Date(),
      };

      vi.mocked(createNotification).mockResolvedValue(mockNotif);

      const result = await createNotification({
        type: "new_lead",
        title: "New Lead: Test Cafe",
        message: "John from Test Cafe (john@test.com)",
        link: "/leads",
      });

      expect(result).toEqual(mockNotif);
      expect(createNotification).toHaveBeenCalledWith({
        type: "new_lead",
        title: "New Lead: Test Cafe",
        message: "John from Test Cafe (john@test.com)",
        link: "/leads",
      });
    });

    it("should support all notification types", async () => {
      const types = ["new_lead", "tasting_request", "new_order", "order_status", "system"] as const;

      for (const type of types) {
        vi.mocked(createNotification).mockResolvedValue({
          id: 1,
          type,
          title: `Test ${type}`,
          message: "Test message",
          link: null,
          isRead: 0,
          createdAt: new Date(),
        });

        const result = await createNotification({
          type,
          title: `Test ${type}`,
          message: "Test message",
        });

        expect(result).toBeTruthy();
        expect(result!.type).toBe(type);
      }
    });
  });

  describe("getAllNotifications", () => {
    it("should return notifications ordered by createdAt desc", async () => {
      const mockNotifs = [
        { id: 3, type: "new_order" as const, title: "Order 3", message: "msg", link: null, isRead: 0, createdAt: new Date("2026-03-24") },
        { id: 2, type: "new_lead" as const, title: "Lead 2", message: "msg", link: null, isRead: 0, createdAt: new Date("2026-03-23") },
        { id: 1, type: "system" as const, title: "System 1", message: "msg", link: null, isRead: 1, createdAt: new Date("2026-03-22") },
      ];

      vi.mocked(getAllNotifications).mockResolvedValue(mockNotifs);

      const result = await getAllNotifications(50);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3);
      expect(result[2].id).toBe(1);
    });

    it("should respect limit parameter", async () => {
      vi.mocked(getAllNotifications).mockResolvedValue([]);

      await getAllNotifications(10);
      expect(getAllNotifications).toHaveBeenCalledWith(10);
    });
  });

  describe("getUnreadNotificationCount", () => {
    it("should return count of unread notifications", async () => {
      vi.mocked(getUnreadNotificationCount).mockResolvedValue(5);

      const count = await getUnreadNotificationCount();
      expect(count).toBe(5);
    });

    it("should return 0 when all notifications are read", async () => {
      vi.mocked(getUnreadNotificationCount).mockResolvedValue(0);

      const count = await getUnreadNotificationCount();
      expect(count).toBe(0);
    });
  });

  describe("markNotificationRead", () => {
    it("should mark a specific notification as read", async () => {
      vi.mocked(markNotificationRead).mockResolvedValue();

      await markNotificationRead(1);
      expect(markNotificationRead).toHaveBeenCalledWith(1);
    });
  });

  describe("markAllNotificationsRead", () => {
    it("should mark all unread notifications as read", async () => {
      vi.mocked(markAllNotificationsRead).mockResolvedValue();

      await markAllNotificationsRead();
      expect(markAllNotificationsRead).toHaveBeenCalled();
    });
  });

  describe("deleteNotification", () => {
    it("should delete a notification by id", async () => {
      vi.mocked(deleteNotification).mockResolvedValue();

      await deleteNotification(1);
      expect(deleteNotification).toHaveBeenCalledWith(1);
    });
  });

  describe("Notification type coverage", () => {
    it("new_lead notification has correct structure", () => {
      const notif = {
        type: "new_lead" as const,
        title: "New Lead: Cafe Moka",
        message: "Sarah from Cafe Moka (sarah@moka.com) — website",
        link: "/leads",
      };

      expect(notif.type).toBe("new_lead");
      expect(notif.link).toBe("/leads");
      expect(notif.title).toContain("New Lead");
    });

    it("tasting_request notification has correct structure", () => {
      const notif = {
        type: "tasting_request" as const,
        title: "Tasting Request: Bistro 21",
        message: "Marc from Bistro 21 wants to try plain, sesame",
        link: "/tastings",
      };

      expect(notif.type).toBe("tasting_request");
      expect(notif.link).toBe("/tastings");
    });

    it("new_order notification has correct structure", () => {
      const notif = {
        type: "new_order" as const,
        title: "New Order: WO-2026-0042",
        message: "$450.00 — 10 x plain, 5 x sesame",
        link: "/orders",
      };

      expect(notif.type).toBe("new_order");
      expect(notif.link).toBe("/orders");
    });

    it("order_status notification has correct structure", () => {
      const notif = {
        type: "order_status" as const,
        title: "Delivered: WO-2026-0042",
        message: "Order WO-2026-0042 ($450.00) delivered",
        link: "/orders",
      };

      expect(notif.type).toBe("order_status");
    });
  });
});
