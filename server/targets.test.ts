import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getTarget: vi.fn(),
  listTargets: vi.fn(),
  upsertTarget: vi.fn(),
  getMonthlyActuals: vi.fn(),
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
  getAllCustomers: vi.fn(),
  getAllCustomersWithStats: vi.fn(),
  createCustomer: vi.fn(),
  getCustomerById: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  getOrdersByCustomerId: vi.fn(),
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  listProductCosts: vi.fn(),
  listDistinctOrderProducts: vi.fn(),
  upsertProductCost: vi.fn(),
  deleteProductCost: vi.fn(),
  getProfitByCustomer: vi.fn(),
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
import { getTarget, listTargets, upsertTarget, getMonthlyActuals } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user",
    email: "staff@hinnawibros.com",
    name: "Staff Member",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("targets.get", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns target for a given month", async () => {
    const mockTarget = {
      id: 1,
      periodMonth: "2026-06",
      targetRevenue: "25000.00",
      targetDozens: "1200.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getTarget).mockResolvedValue(mockTarget);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.get({ periodMonth: "2026-06" });

    expect(result).toEqual(mockTarget);
    expect(getTarget).toHaveBeenCalledWith("2026-06");
  });

  it("returns null when no target exists for the month", async () => {
    vi.mocked(getTarget).mockResolvedValue(null);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.get({ periodMonth: "2026-01" });

    expect(result).toBeNull();
  });
});

describe("targets.upsert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows admin to set a monthly target with revenue and dozens", async () => {
    vi.mocked(upsertTarget).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.upsert({
      periodMonth: "2026-06",
      targetRevenue: 25000,
      targetDozens: 1200,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertTarget).toHaveBeenCalledWith({
      periodMonth: "2026-06",
      targetRevenue: "25000.00",
      targetDozens: "1200.00",
    });
  });

  it("allows admin to set a target with revenue only (no dozens)", async () => {
    vi.mocked(upsertTarget).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.upsert({
      periodMonth: "2026-03",
      targetRevenue: 18000,
      targetDozens: null,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertTarget).toHaveBeenCalledWith({
      periodMonth: "2026-03",
      targetRevenue: "18000.00",
      targetDozens: null,
    });
  });

  it("rejects non-admin users from setting targets", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.targets.upsert({
        periodMonth: "2026-06",
        targetRevenue: 25000,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid periodMonth format", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(
      caller.targets.upsert({
        periodMonth: "2026-6", // missing leading zero
        targetRevenue: 25000,
      })
    ).rejects.toThrow();
  });

  it("allows setting targets for past months", async () => {
    vi.mocked(upsertTarget).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.upsert({
      periodMonth: "2025-09",
      targetRevenue: 15000,
      targetDozens: 800,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertTarget).toHaveBeenCalledWith({
      periodMonth: "2025-09",
      targetRevenue: "15000.00",
      targetDozens: "800.00",
    });
  });
});

describe("targets.progress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns progress with targets merged for default 6 months plus future months", async () => {
    const actuals = [
      { periodMonth: "2026-01", actualRevenue: 12000 },
      { periodMonth: "2026-02", actualRevenue: 15000 },
      { periodMonth: "2026-03", actualRevenue: 18000 },
      { periodMonth: "2026-04", actualRevenue: 20000 },
      { periodMonth: "2026-05", actualRevenue: 22000 },
      { periodMonth: "2026-06", actualRevenue: 8000 },
    ];
    const targets = [
      { id: 1, periodMonth: "2026-01", targetRevenue: "15000.00", targetDozens: "800.00", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, periodMonth: "2026-03", targetRevenue: "20000.00", targetDozens: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, periodMonth: "2026-06", targetRevenue: "25000.00", targetDozens: "1200.00", createdAt: new Date(), updatedAt: new Date() },
      { id: 4, periodMonth: "2026-08", targetRevenue: "30000.00", targetDozens: "1500.00", createdAt: new Date(), updatedAt: new Date() },
    ];

    vi.mocked(getMonthlyActuals).mockResolvedValue(actuals);
    vi.mocked(listTargets).mockResolvedValue(targets);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.progress();

    // Should have 6 actuals + 6 future months = 12
    expect(result.length).toBeGreaterThanOrEqual(6);
    // Month with target
    expect(result[0]).toEqual({
      periodMonth: "2026-01",
      actualRevenue: 12000,
      targetRevenue: 15000,
      targetDozens: 800,
    });
    // Month without target
    expect(result[1]).toEqual({
      periodMonth: "2026-02",
      actualRevenue: 15000,
      targetRevenue: null,
      targetDozens: null,
    });
    // Month with target but no dozens
    expect(result[2]).toEqual({
      periodMonth: "2026-03",
      actualRevenue: 18000,
      targetRevenue: 20000,
      targetDozens: null,
    });
    // Current month with target
    expect(result[5]).toEqual({
      periodMonth: "2026-06",
      actualRevenue: 8000,
      targetRevenue: 25000,
      targetDozens: 1200,
    });
    // Future month with target (2026-08)
    const aug = result.find((r) => r.periodMonth === "2026-08");
    expect(aug).toEqual({
      periodMonth: "2026-08",
      actualRevenue: 0,
      targetRevenue: 30000,
      targetDozens: 1500,
    });
  });

  it("accepts custom monthsBack parameter for 12 months", async () => {
    vi.mocked(getMonthlyActuals).mockResolvedValue([]);
    vi.mocked(listTargets).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAdminContext());
    await caller.targets.progress({ monthsBack: 12 });

    expect(getMonthlyActuals).toHaveBeenCalledWith(12);
  });

  it("defaults to 6 months back and 6 future months when no input provided", async () => {
    vi.mocked(getMonthlyActuals).mockResolvedValue([]);
    vi.mocked(listTargets).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.progress();

    expect(getMonthlyActuals).toHaveBeenCalledWith(6);
    // Should include 6 future months even with no actuals
    expect(result.length).toBe(6);
  });

  it("returns null targetRevenue for months without a target", async () => {
    const actuals = [
      { periodMonth: "2026-06", actualRevenue: 5000 },
    ];
    vi.mocked(getMonthlyActuals).mockResolvedValue(actuals);
    vi.mocked(listTargets).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.progress({ monthsBack: 1, futureMonths: 0 });

    expect(result[0]).toEqual({
      periodMonth: "2026-06",
      actualRevenue: 5000,
      targetRevenue: null,
      targetDozens: null,
    });
  });

  it("includes future months with targets set", async () => {
    const actuals = [
      { periodMonth: "2026-06", actualRevenue: 8000 },
    ];
    const targets = [
      { id: 1, periodMonth: "2026-09", targetRevenue: "35000.00", targetDozens: "1800.00", createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(getMonthlyActuals).mockResolvedValue(actuals);
    vi.mocked(listTargets).mockResolvedValue(targets);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.progress({ monthsBack: 1, futureMonths: 6 });

    // Should include the actual month + 6 future months
    expect(result.length).toBe(7);
    // The September future month should have the target
    const sep = result.find((r) => r.periodMonth === "2026-09");
    expect(sep).toEqual({
      periodMonth: "2026-09",
      actualRevenue: 0,
      targetRevenue: 35000,
      targetDozens: 1800,
    });
  });

  it("allows setting futureMonths to 0 to exclude future months", async () => {
    const actuals = [
      { periodMonth: "2026-06", actualRevenue: 8000 },
    ];
    vi.mocked(getMonthlyActuals).mockResolvedValue(actuals);
    vi.mocked(listTargets).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.progress({ monthsBack: 1, futureMonths: 0 });

    expect(result.length).toBe(1);
    expect(result[0].periodMonth).toBe("2026-06");
  });
});

describe("targets.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all saved targets", async () => {
    const mockTargets = [
      { id: 2, periodMonth: "2026-06", targetRevenue: "25000.00", targetDozens: "1200.00", createdAt: new Date(), updatedAt: new Date() },
      { id: 1, periodMonth: "2026-05", targetRevenue: "22000.00", targetDozens: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(listTargets).mockResolvedValue(mockTargets);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.targets.list();

    expect(result).toEqual(mockTargets);
    expect(listTargets).toHaveBeenCalled();
  });
});
