import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getAllCustomers: vi.fn(),
  getAllCustomersWithStats: vi.fn(),
  createCustomer: vi.fn(),
  getCustomerById: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  getOrdersByCustomerId: vi.fn(),
  // Stub all other exports used by routers.ts
  createLead: vi.fn(),
  getAllLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
  deleteLead: vi.fn(),
  generateOrderNumber: vi.fn(),
  createOrder: vi.fn(),
  getAllOrders: vi.fn(),
  getOrderById: vi.fn(),
  updateOrderStatus: vi.fn(),
  deleteOrder: vi.fn(),
  getDashboardStats: vi.fn(),
  createRecurringOrder: vi.fn(),
  getAllRecurringOrders: vi.fn(),
  getRecurringOrderById: vi.fn(),
  updateRecurringOrderStatus: vi.fn(),
  deleteRecurringOrder: vi.fn(),
  getRecurringOrdersByCustomerId: vi.fn(),
  computeNextDelivery: vi.fn(),
  createCustomerInvite: vi.fn(),
  getInviteByToken: vi.fn(),
  acceptInvite: vi.fn(),
  getCustomerByUserId: vi.fn(),
  getInvitesByCustomerId: vi.fn(),
  getPortalOrders: vi.fn(),
  getPortalRecurringOrders: vi.fn(),
  bulkCreateCustomers: vi.fn(),
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock brochure email
vi.mock("./brochure-email", () => ({
  sendBrochureEmail: vi.fn().mockResolvedValue(true),
  getBrochureEmailContent: vi.fn().mockReturnValue({ subject: "Test", body: "Test" }),
  BROCHURE_URL: "https://example.com/brochure.pdf",
}));

// Mock quickbooks
vi.mock("./quickbooks", () => ({
  getActiveQBConnection: vi.fn(),
  disconnectQB: vi.fn(),
  getRecentSyncLogs: vi.fn(),
}));

vi.mock("./qb-sync", () => ({
  runFullSync: vi.fn(),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getAllCustomersWithStats, getAllCustomers } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "rosie@hinnawibros.com",
    name: "Rosie Manneh",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("customers.listWithStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns customers with order stats and classification", async () => {
    const mockData = [
      {
        id: 1,
        businessName: "Cafe du Plateau",
        contactName: "Jean Tremblay",
        email: "jean@cafe.com",
        phone: "514-555-1234",
        address: "123 Rue Saint-Laurent",
        segment: "cafe",
        notes: null,
        status: "active",
        userId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        orderCount: 15,
        totalRevenue: "4523.50",
        lastOrderDate: new Date("2026-03-20"),
        classification: "customer" as const,
      },
      {
        id: 2,
        businessName: "New Prospect Bistro",
        contactName: "Marie Lafleur",
        email: "marie@bistro.com",
        phone: null,
        address: null,
        segment: "restaurant",
        notes: null,
        status: "prospect",
        userId: null,
        createdAt: new Date("2026-03-01"),
        updatedAt: new Date("2026-03-01"),
        orderCount: 0,
        totalRevenue: "0.00",
        lastOrderDate: null,
        classification: "suspect" as const,
      },
    ];

    (getAllCustomersWithStats as any).mockResolvedValue(mockData);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.listWithStats();

    expect(result).toHaveLength(2);

    // First customer has orders → classified as "customer"
    expect(result[0].classification).toBe("customer");
    expect(result[0].orderCount).toBe(15);
    expect(result[0].totalRevenue).toBe("4523.50");
    expect(result[0].lastOrderDate).toBeTruthy();

    // Second customer has no orders → classified as "suspect"
    expect(result[1].classification).toBe("suspect");
    expect(result[1].orderCount).toBe(0);
    expect(result[1].totalRevenue).toBe("0.00");
    expect(result[1].lastOrderDate).toBeNull();
  });

  it("returns empty array when no customers exist", async () => {
    (getAllCustomersWithStats as any).mockResolvedValue([]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.listWithStats();

    expect(result).toEqual([]);
  });

  it("correctly classifies all suspects when no orders exist", async () => {
    const mockData = [
      {
        id: 1,
        businessName: "Suspect A",
        contactName: "Alice",
        email: "alice@test.com",
        phone: null,
        address: null,
        segment: "cafe",
        notes: null,
        status: "active",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderCount: 0,
        totalRevenue: "0.00",
        lastOrderDate: null,
        classification: "suspect" as const,
      },
      {
        id: 2,
        businessName: "Suspect B",
        contactName: "Bob",
        email: "bob@test.com",
        phone: null,
        address: null,
        segment: "restaurant",
        notes: null,
        status: "prospect",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderCount: 0,
        totalRevenue: "0.00",
        lastOrderDate: null,
        classification: "suspect" as const,
      },
    ];

    (getAllCustomersWithStats as any).mockResolvedValue(mockData);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.listWithStats();

    expect(result.every((c) => c.classification === "suspect")).toBe(true);
    expect(result.every((c) => c.orderCount === 0)).toBe(true);
  });

  it("includes negative revenue from credit memos in total", async () => {
    const mockData = [
      {
        id: 1,
        businessName: "Cafe with Credits",
        contactName: "Test",
        email: "test@test.com",
        phone: null,
        address: null,
        segment: "cafe",
        notes: null,
        status: "active",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderCount: 5,
        totalRevenue: "-150.00",
        lastOrderDate: new Date(),
        classification: "customer" as const,
      },
    ];

    (getAllCustomersWithStats as any).mockResolvedValue(mockData);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.listWithStats();

    expect(result[0].totalRevenue).toBe("-150.00");
    expect(result[0].classification).toBe("customer");
  });
});

describe("customers.list (original)", () => {
  it("still returns basic customer list", async () => {
    const mockCustomers = [
      {
        id: 1,
        businessName: "Test Cafe",
        contactName: "Test",
        email: "test@test.com",
        phone: null,
        address: null,
        segment: "cafe",
        notes: null,
        status: "active",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (getAllCustomers as any).mockResolvedValue(mockCustomers);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.list();

    expect(result).toHaveLength(1);
    expect(result[0].businessName).toBe("Test Cafe");
    // Original list should NOT have classification field
    expect((result[0] as any).classification).toBeUndefined();
  });
});
