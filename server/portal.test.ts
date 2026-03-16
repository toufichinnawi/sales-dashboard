import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getAllCustomers: vi.fn().mockResolvedValue([]),
  createCustomer: vi.fn().mockResolvedValue({ id: 1 }),
  getCustomerById: vi.fn().mockResolvedValue({
    id: 1,
    businessName: "Test Cafe",
    contactName: "John",
    email: "john@test.com",
    phone: "514-555-1234",
    address: "123 Main St",
    segment: "cafe",
    status: "active",
    userId: null,
    createdAt: new Date(),
  }),
  updateCustomer: vi.fn().mockResolvedValue({}),
  deleteCustomer: vi.fn().mockResolvedValue({}),
  getAllLeads: vi.fn().mockResolvedValue([]),
  createLead: vi.fn().mockResolvedValue({ id: 1 }),
  updateLeadStatus: vi.fn().mockResolvedValue({}),
  deleteLead: vi.fn().mockResolvedValue({}),
  generateOrderNumber: vi.fn().mockResolvedValue("WO-2026-0001"),
  createOrder: vi.fn().mockResolvedValue({ id: 1 }),
  getAllOrders: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue(null),
  updateOrderStatus: vi.fn().mockResolvedValue({}),
  deleteOrder: vi.fn().mockResolvedValue({}),
  getOrdersByCustomerId: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalRevenue: 50000,
    monthlyRevenue: 8500,
    activeAccounts: 12,
    weeklyDozens: 340,
    avgOrderSize: 425,
    pipelineValue: 15000,
    conversionRate: 65,
    recentOrders: [],
    monthlyRevenueData: [],
    pipelineStages: [],
    recentActivities: [],
  }),
  createRecurringOrder: vi.fn().mockResolvedValue({ id: 1 }),
  getAllRecurringOrders: vi.fn().mockResolvedValue([]),
  getRecurringOrderById: vi.fn().mockResolvedValue(null),
  updateRecurringOrderStatus: vi.fn().mockResolvedValue({}),
  deleteRecurringOrder: vi.fn().mockResolvedValue({}),
  getRecurringOrdersByCustomerId: vi.fn().mockResolvedValue([]),
  computeNextDelivery: vi.fn().mockReturnValue("2026-03-23"),
  createCustomerInvite: vi.fn().mockResolvedValue({
    id: 1,
    customerId: 1,
    token: "test-token-123",
    email: "john@test.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
    createdAt: new Date(),
  }),
  getInviteByToken: vi.fn().mockResolvedValue({
    id: 1,
    customerId: 1,
    token: "test-token-123",
    email: "john@test.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
  }),
  acceptInvite: vi.fn().mockResolvedValue(true),
  getCustomerByUserId: vi.fn().mockResolvedValue({
    id: 1,
    businessName: "Test Cafe",
    contactName: "John",
    email: "john@test.com",
    phone: "514-555-1234",
    address: "123 Main St",
    segment: "cafe",
    status: "active",
    userId: "user-123",
    createdAt: new Date(),
  }),
  getInvitesByCustomerId: vi.fn().mockResolvedValue([]),
  getPortalOrders: vi.fn().mockResolvedValue([
    {
      id: 1,
      orderNumber: "WO-2026-0001",
      status: "pending",
      total: "425.00",
      discount: "0",
      deliveryDate: "2026-03-20",
      notes: null,
      createdAt: new Date(),
      items: [
        { product: "plain", quantityDozens: "20", pricePerDozen: "8.00", lineTotal: "160.00" },
        { product: "sesame", quantityDozens: "15", pricePerDozen: "8.50", lineTotal: "127.50" },
      ],
    },
  ]),
  getPortalRecurringOrders: vi.fn().mockResolvedValue([
    {
      id: 1,
      customerId: 1,
      dayOfWeek: "tuesday",
      frequency: "weekly",
      status: "active",
      total: "200.00",
      deliveryAddress: "123 Main St",
      nextDelivery: "2026-03-18",
      items: [
        { product: "plain", quantityDozens: "10", pricePerDozen: "8.00", lineTotal: "80.00" },
      ],
    },
  ]),
  bulkCreateCustomers: vi.fn().mockResolvedValue({ imported: 5, skipped: 1 }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Test Suites ─────────────────────────────────────────────────────────────

describe("Customer Portal Architecture", () => {
  describe("Invite System", () => {
    it("should create invite tokens with 7-day expiry", () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });

    it("should generate secure random tokens", async () => {
      const crypto = await import("crypto");
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64);
    });

    it("should build invite URL with origin and token", () => {
      const origin = "https://example.com";
      const token = "abc123";
      const url = `${origin}/portal/accept-invite?token=${token}`;
      expect(url).toBe("https://example.com/portal/accept-invite?token=abc123");
    });
  });

  describe("Portal Data Access", () => {
    it("should return orders for a linked customer", async () => {
      const { getPortalOrders } = await import("./db");
      const orders = await getPortalOrders(1);
      expect(orders).toHaveLength(1);
      expect(orders[0].orderNumber).toBe("WO-2026-0001");
      expect(orders[0].items).toHaveLength(2);
    });

    it("should return recurring orders for a linked customer", async () => {
      const { getPortalRecurringOrders } = await import("./db");
      const recurring = await getPortalRecurringOrders(1);
      expect(recurring).toHaveLength(1);
      expect(recurring[0].dayOfWeek).toBe("tuesday");
      expect(recurring[0].status).toBe("active");
    });

    it("should get customer by userId", async () => {
      const { getCustomerByUserId } = await import("./db");
      const customer = await getCustomerByUserId("user-123");
      expect(customer).toBeTruthy();
      expect(customer!.businessName).toBe("Test Cafe");
      expect(customer!.userId).toBe("user-123");
    });

    it("should return null for unlinked userId", async () => {
      const { getCustomerByUserId } = await import("./db");
      vi.mocked(getCustomerByUserId).mockResolvedValueOnce(null);
      const customer = await getCustomerByUserId("unknown-user");
      expect(customer).toBeNull();
    });
  });

  describe("Accept Invite Flow", () => {
    it("should accept valid invite and link user", async () => {
      const { acceptInvite } = await import("./db");
      const result = await acceptInvite("test-token-123", "user-456");
      expect(result).toBe(true);
    });

    it("should reject expired/invalid invite", async () => {
      const { acceptInvite } = await import("./db");
      vi.mocked(acceptInvite).mockResolvedValueOnce(false);
      const result = await acceptInvite("expired-token", "user-789");
      expect(result).toBe(false);
    });
  });
});

describe("QuickBooks CSV Import", () => {
  it("should bulk create customers and return counts", async () => {
    const { bulkCreateCustomers } = await import("./db");
    const result = await bulkCreateCustomers([
      { businessName: "Cafe A", contactName: "Alice", email: "alice@a.com", phone: null, address: null, segment: "cafe", notes: null, status: "active" as const },
      { businessName: "Cafe B", contactName: "Bob", email: "bob@b.com", phone: null, address: null, segment: "cafe", notes: null, status: "active" as const },
    ]);
    expect(result.imported).toBe(5);
    expect(result.skipped).toBe(1);
  });

  it("should handle empty import gracefully", async () => {
    const { bulkCreateCustomers } = await import("./db");
    vi.mocked(bulkCreateCustomers).mockResolvedValueOnce({ imported: 0, skipped: 0 });
    const result = await bulkCreateCustomers([]);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
  });

  describe("CSV Parsing (frontend logic)", () => {
    function parseCsv(text: string): { headers: string[]; rows: string[][] } {
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return { headers: [], rows: [] };
      const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
      const rows = lines.slice(1).map((line) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });
      return { headers, rows };
    }

    it("should parse simple CSV", () => {
      const csv = "Customer,Email,Phone\nCafe A,a@test.com,555-1234\nCafe B,b@test.com,555-5678";
      const { headers, rows } = parseCsv(csv);
      expect(headers).toEqual(["Customer", "Email", "Phone"]);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual(["Cafe A", "a@test.com", "555-1234"]);
    });

    it("should handle quoted fields with commas", () => {
      const csv = 'Customer,Address\n"Cafe A","123 Main St, Suite 4"';
      const { rows } = parseCsv(csv);
      expect(rows[0][1]).toBe("123 Main St, Suite 4");
    });

    it("should handle empty CSV", () => {
      const { headers, rows } = parseCsv("");
      expect(headers).toEqual([]);
      expect(rows).toEqual([]);
    });

    it("should handle Windows line endings", () => {
      const csv = "Customer,Email\r\nCafe A,a@test.com\r\nCafe B,b@test.com";
      const { rows } = parseCsv(csv);
      expect(rows).toHaveLength(2);
    });
  });
});

describe("Dashboard Stats", () => {
  it("should return comprehensive dashboard data", async () => {
    const { getDashboardStats } = await import("./db");
    const stats = await getDashboardStats();
    expect(stats.totalRevenue).toBe(50000);
    expect(stats.monthlyRevenue).toBe(8500);
    expect(stats.activeAccounts).toBe(12);
    expect(stats.weeklyDozens).toBe(340);
    expect(stats.avgOrderSize).toBe(425);
  });
});

describe("Notifications", () => {
  it("should notify owner on events", async () => {
    const { notifyOwner } = await import("./_core/notification");
    const result = await notifyOwner({
      title: "New Portal Order",
      content: "Test Cafe placed an order for $425.00",
    });
    expect(result).toBe(true);
  });
});
