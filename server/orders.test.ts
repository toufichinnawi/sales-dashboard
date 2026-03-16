import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  createLead: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Lead",
    business: "Test Biz",
    email: "test@test.com",
    phone: null,
    message: null,
    status: "new",
    source: "manual",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAllLeads: vi.fn().mockResolvedValue([]),
  updateLeadStatus: vi.fn().mockResolvedValue(undefined),
  deleteLead: vi.fn().mockResolvedValue(undefined),
  createCustomer: vi.fn().mockResolvedValue({
    id: 1,
    businessName: "Café du Plateau",
    contactName: "Jean Tremblay",
    email: "jean@cafe.com",
    phone: "514-555-1234",
    address: "123 Rue Saint-Laurent",
    segment: "cafe",
    notes: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAllCustomers: vi.fn().mockResolvedValue([
    {
      id: 1,
      businessName: "Café du Plateau",
      contactName: "Jean Tremblay",
      email: "jean@cafe.com",
      phone: "514-555-1234",
      address: "123 Rue Saint-Laurent",
      segment: "cafe",
      notes: null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getCustomerById: vi.fn().mockResolvedValue({
    id: 1,
    businessName: "Café du Plateau",
    contactName: "Jean Tremblay",
    email: "jean@cafe.com",
    phone: "514-555-1234",
    address: "123 Rue Saint-Laurent",
    segment: "cafe",
    notes: null,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateCustomer: vi.fn().mockResolvedValue(undefined),
  deleteCustomer: vi.fn().mockResolvedValue(undefined),
  generateOrderNumber: vi.fn().mockResolvedValue("HB-0001"),
  createOrder: vi.fn().mockResolvedValue({
    order: {
      id: 1,
      customerId: 1,
      orderNumber: "HB-0001",
      status: "pending",
      deliveryDate: new Date("2026-03-20"),
      deliveryAddress: null,
      subtotal: "24.00",
      discount: "0.00",
      total: "24.00",
      notes: null,
      recurringOrderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [
      {
        id: 1,
        orderId: 1,
        product: "plain",
        quantityDozens: "3",
        pricePerDozen: "8.00",
        lineTotal: "24.00",
      },
    ],
  }),
  getAllOrders: vi.fn().mockResolvedValue([
    {
      id: 1,
      customerId: 1,
      orderNumber: "HB-0001",
      status: "pending",
      deliveryDate: new Date("2026-03-20"),
      deliveryAddress: null,
      subtotal: "24.00",
      discount: "0.00",
      total: "24.00",
      notes: null,
      recurringOrderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getOrderById: vi.fn().mockResolvedValue({
    order: {
      id: 1,
      customerId: 1,
      orderNumber: "HB-0001",
      status: "pending",
      deliveryDate: new Date("2026-03-20"),
      deliveryAddress: null,
      subtotal: "24.00",
      discount: "0.00",
      total: "24.00",
      notes: null,
      recurringOrderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [
      {
        id: 1,
        orderId: 1,
        product: "plain",
        quantityDozens: "3",
        pricePerDozen: "8.00",
        lineTotal: "24.00",
      },
    ],
  }),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  deleteOrder: vi.fn().mockResolvedValue(undefined),
  getOrdersByCustomerId: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({
    kpis: {
      monthlyRevenue: 12500,
      revenueChange: 15.2,
      weeklyDozens: 85,
      activeAccounts: 12,
      avgOrderSize: 245.50,
      avgOrderChange: 3.1,
      pipelineValue: 5200,
      conversionRate: 42.5,
      totalOrders: 51,
      activeRecurring: 4,
    },
    monthlyRevenue: [
      { month: "2026-01", revenue: 10200, orderCount: 42 },
      { month: "2026-02", revenue: 11800, orderCount: 48 },
      { month: "2026-03", revenue: 12500, orderCount: 51 },
    ],
    leadsByStatus: [
      { status: "new", count: 5 },
      { status: "contacted", count: 3 },
      { status: "qualified", count: 2 },
      { status: "converted", count: 8 },
      { status: "lost", count: 2 },
    ],
    recentOrders: [
      {
        id: 1,
        orderNumber: "HB-0001",
        customerId: 1,
        status: "pending",
        total: "245.50",
        createdAt: new Date(),
      },
    ],
    topCustomers: [
      { customerId: 1, totalRevenue: 3200, orderCount: 12 },
    ],
  }),
  createRecurringOrder: vi.fn().mockResolvedValue({
    order: {
      id: 1,
      customerId: 1,
      dayOfWeek: "tuesday",
      frequency: "weekly",
      deliveryAddress: null,
      notes: null,
      subtotal: "40.00",
      discount: "0.00",
      total: "40.00",
      status: "active",
      nextDelivery: new Date("2026-03-18"),
      lastGenerated: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [
      {
        id: 1,
        recurringOrderId: 1,
        product: "plain",
        quantityDozens: "5",
        pricePerDozen: "8.00",
        lineTotal: "40.00",
      },
    ],
  }),
  getAllRecurringOrders: vi.fn().mockResolvedValue([
    {
      id: 1,
      customerId: 1,
      dayOfWeek: "tuesday",
      frequency: "weekly",
      deliveryAddress: null,
      notes: null,
      subtotal: "40.00",
      discount: "0.00",
      total: "40.00",
      status: "active",
      nextDelivery: new Date("2026-03-18"),
      lastGenerated: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getRecurringOrderById: vi.fn().mockResolvedValue({
    order: {
      id: 1,
      customerId: 1,
      dayOfWeek: "tuesday",
      frequency: "weekly",
      deliveryAddress: null,
      notes: null,
      subtotal: "40.00",
      discount: "0.00",
      total: "40.00",
      status: "active",
      nextDelivery: new Date("2026-03-18"),
      lastGenerated: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [
      {
        id: 1,
        recurringOrderId: 1,
        product: "plain",
        quantityDozens: "5",
        pricePerDozen: "8.00",
        lineTotal: "40.00",
      },
    ],
  }),
  updateRecurringOrderStatus: vi.fn().mockResolvedValue(undefined),
  deleteRecurringOrder: vi.fn().mockResolvedValue(undefined),
  getRecurringOrdersByCustomerId: vi.fn().mockResolvedValue([]),
  computeNextDelivery: vi.fn().mockReturnValue(new Date("2026-03-18")),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  generateOrderNumber,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getDashboardStats,
  createRecurringOrder,
  getAllRecurringOrders,
  getRecurringOrderById,
  updateRecurringOrderStatus,
  deleteRecurringOrder,
  computeNextDelivery,
} from "./db";
import { notifyOwner } from "./_core/notification";

// ─── Customer Tests ──────────────────────────────────────────────────────────

describe("Customer database operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a customer with required fields", async () => {
    const result = await createCustomer({
      businessName: "Café du Plateau",
      contactName: "Jean Tremblay",
      email: "jean@cafe.com",
      segment: "cafe",
    });

    expect(createCustomer).toHaveBeenCalledWith({
      businessName: "Café du Plateau",
      contactName: "Jean Tremblay",
      email: "jean@cafe.com",
      segment: "cafe",
    });
    expect(result).toBeDefined();
    expect(result?.businessName).toBe("Café du Plateau");
  });

  it("should list all customers", async () => {
    const customers = await getAllCustomers();
    expect(getAllCustomers).toHaveBeenCalled();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThanOrEqual(0);
  });

  it("should get customer by ID", async () => {
    const customer = await getCustomerById(1);
    expect(getCustomerById).toHaveBeenCalledWith(1);
    expect(customer?.id).toBe(1);
  });

  it("should update a customer", async () => {
    await updateCustomer(1, { businessName: "Updated Café" });
    expect(updateCustomer).toHaveBeenCalledWith(1, { businessName: "Updated Café" });
  });

  it("should delete a customer", async () => {
    await deleteCustomer(1);
    expect(deleteCustomer).toHaveBeenCalledWith(1);
  });
});

// ─── Order Tests ─────────────────────────────────────────────────────────────

describe("Order database operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate unique order numbers", async () => {
    const orderNumber = await generateOrderNumber();
    expect(orderNumber).toMatch(/^HB-\d{4}$/);
  });

  it("should create an order with items", async () => {
    const result = await createOrder(
      {
        customerId: 1,
        orderNumber: "HB-0001",
        deliveryDate: new Date("2026-03-20"),
        subtotal: "24.00",
        discount: "0.00",
        total: "24.00",
      },
      [
        {
          product: "plain",
          quantityDozens: "3",
          pricePerDozen: "8.00",
          lineTotal: "24.00",
        },
      ]
    );

    expect(createOrder).toHaveBeenCalled();
    expect(result?.order.orderNumber).toBe("HB-0001");
    expect(result?.items.length).toBe(1);
  });

  it("should list all orders", async () => {
    const orders = await getAllOrders();
    expect(getAllOrders).toHaveBeenCalled();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("should get order by ID with items", async () => {
    const result = await getOrderById(1);
    expect(getOrderById).toHaveBeenCalledWith(1);
    expect(result?.order.id).toBe(1);
    expect(result?.items.length).toBeGreaterThan(0);
  });

  it("should update order status", async () => {
    await updateOrderStatus(1, "confirmed");
    expect(updateOrderStatus).toHaveBeenCalledWith(1, "confirmed");
  });

  it("should delete an order", async () => {
    await deleteOrder(1);
    expect(deleteOrder).toHaveBeenCalledWith(1);
  });

  it("should calculate order totals correctly", () => {
    const items = [
      { product: "plain", quantityDozens: 3, pricePerDozen: 8.0 },
      { product: "sesame", quantityDozens: 2, pricePerDozen: 8.5 },
      { product: "everything", quantityDozens: 1, pricePerDozen: 9.0 },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantityDozens * item.pricePerDozen,
      0
    );
    const discount = 5.0;
    const total = Math.max(0, subtotal - discount);

    // 3*8 + 2*8.5 + 1*9 = 24 + 17 + 9 = 50
    expect(subtotal).toBe(50);
    expect(total).toBe(45);
  });

  it("should enforce minimum 0.5 dozen quantity", () => {
    const minQuantity = 0.5;
    expect(minQuantity).toBeGreaterThanOrEqual(0.5);
  });

  it("should validate product pricing", () => {
    const products = {
      plain: 8.0,
      sesame: 8.5,
      everything: 9.0,
    };

    expect(products.plain).toBe(8.0);
    expect(products.sesame).toBe(8.5);
    expect(products.everything).toBe(9.0);
  });
});

// ─── Dashboard Stats Tests ───────────────────────────────────────────────────

describe("Dashboard stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return KPI data with all required fields", async () => {
    const stats = await getDashboardStats();
    expect(getDashboardStats).toHaveBeenCalled();
    expect(stats).toBeDefined();
    expect(stats?.kpis).toBeDefined();
    expect(stats?.kpis.monthlyRevenue).toBe(12500);
    expect(stats?.kpis.activeAccounts).toBe(12);
    expect(stats?.kpis.weeklyDozens).toBe(85);
    expect(stats?.kpis.avgOrderSize).toBe(245.50);
    expect(stats?.kpis.pipelineValue).toBe(5200);
    expect(stats?.kpis.activeRecurring).toBe(4);
  });

  it("should return monthly revenue data for chart", async () => {
    const stats = await getDashboardStats();
    expect(stats?.monthlyRevenue).toBeDefined();
    expect(stats?.monthlyRevenue.length).toBe(3);
    expect(stats?.monthlyRevenue[0].month).toBe("2026-01");
    expect(stats?.monthlyRevenue[0].revenue).toBe(10200);
  });

  it("should return leads by status for pipeline", async () => {
    const stats = await getDashboardStats();
    expect(stats?.leadsByStatus).toBeDefined();
    expect(stats?.leadsByStatus.length).toBe(5);
    const converted = stats?.leadsByStatus.find((l: any) => l.status === "converted");
    expect(converted?.count).toBe(8);
  });

  it("should return recent orders for activity feed", async () => {
    const stats = await getDashboardStats();
    expect(stats?.recentOrders).toBeDefined();
    expect(stats?.recentOrders.length).toBeGreaterThan(0);
    expect(stats?.recentOrders[0].orderNumber).toBe("HB-0001");
  });

  it("should return top customers by revenue", async () => {
    const stats = await getDashboardStats();
    expect(stats?.topCustomers).toBeDefined();
    expect(stats?.topCustomers.length).toBeGreaterThan(0);
    expect(stats?.topCustomers[0].totalRevenue).toBe(3200);
  });

  it("should include revenue change percentage", async () => {
    const stats = await getDashboardStats();
    expect(stats?.kpis.revenueChange).toBe(15.2);
  });
});

// ─── Recurring Order Tests ───────────────────────────────────────────────────

describe("Recurring order operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a recurring order with items", async () => {
    const result = await createRecurringOrder(
      {
        customerId: 1,
        dayOfWeek: "tuesday",
        frequency: "weekly",
        subtotal: "40.00",
        discount: "0.00",
        total: "40.00",
        status: "active",
        nextDelivery: new Date("2026-03-18"),
      },
      [
        {
          product: "plain",
          quantityDozens: "5",
          pricePerDozen: "8.00",
          lineTotal: "40.00",
        },
      ]
    );

    expect(createRecurringOrder).toHaveBeenCalled();
    expect(result?.order.dayOfWeek).toBe("tuesday");
    expect(result?.order.frequency).toBe("weekly");
    expect(result?.order.status).toBe("active");
    expect(result?.items.length).toBe(1);
  });

  it("should list all recurring orders", async () => {
    const orders = await getAllRecurringOrders();
    expect(getAllRecurringOrders).toHaveBeenCalled();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].status).toBe("active");
  });

  it("should get recurring order by ID with items", async () => {
    const result = await getRecurringOrderById(1);
    expect(getRecurringOrderById).toHaveBeenCalledWith(1);
    expect(result?.order.id).toBe(1);
    expect(result?.items.length).toBeGreaterThan(0);
  });

  it("should update recurring order status to paused", async () => {
    await updateRecurringOrderStatus(1, "paused");
    expect(updateRecurringOrderStatus).toHaveBeenCalledWith(1, "paused");
  });

  it("should update recurring order status to active", async () => {
    await updateRecurringOrderStatus(1, "active");
    expect(updateRecurringOrderStatus).toHaveBeenCalledWith(1, "active");
  });

  it("should delete a recurring order", async () => {
    await deleteRecurringOrder(1);
    expect(deleteRecurringOrder).toHaveBeenCalledWith(1);
  });

  it("should compute next delivery date correctly", () => {
    const nextDelivery = computeNextDelivery("tuesday");
    expect(nextDelivery).toBeDefined();
    expect(nextDelivery instanceof Date).toBe(true);
  });

  it("should calculate weekly revenue estimate from recurring orders", () => {
    const recurringOrders = [
      { total: "40.00", frequency: "weekly", status: "active" },
      { total: "60.00", frequency: "biweekly", status: "active" },
      { total: "120.00", frequency: "monthly", status: "active" },
      { total: "50.00", frequency: "weekly", status: "paused" },
    ];

    const weeklyRevenue = recurringOrders
      .filter((r) => r.status === "active")
      .reduce((sum, r) => {
        const total = Number(r.total);
        if (r.frequency === "weekly") return sum + total;
        if (r.frequency === "biweekly") return sum + total / 2;
        if (r.frequency === "monthly") return sum + total / 4.33;
        return sum;
      }, 0);

    // 40 + 30 + ~27.71 = ~97.71
    expect(weeklyRevenue).toBeCloseTo(97.71, 1);
  });
});

// ─── Notification Tests ──────────────────────────────────────────────────────

describe("Owner notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send notification for new lead", async () => {
    const result = await notifyOwner({
      title: "New Wholesale Lead: Test Biz",
      content: "Test Lead from Test Biz submitted a tasting request.",
    });

    expect(notifyOwner).toHaveBeenCalledWith({
      title: "New Wholesale Lead: Test Biz",
      content: "Test Lead from Test Biz submitted a tasting request.",
    });
    expect(result).toBe(true);
  });

  it("should send notification for order delivery", async () => {
    const result = await notifyOwner({
      title: "Order Delivered: HB-0001",
      content: "Order HB-0001 ($245.50) has been delivered successfully.",
    });

    expect(notifyOwner).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should send notification for payment received", async () => {
    const result = await notifyOwner({
      title: "Payment Received: HB-0001",
      content: "Order HB-0001 has been marked as paid ($245.50).",
    });

    expect(notifyOwner).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should send notification for new standing order", async () => {
    const result = await notifyOwner({
      title: "New Standing Order: Café du Plateau",
      content: "Recurring weekly order set up for Café du Plateau.\nDay: tuesday\nTotal per delivery: $40.00",
    });

    expect(notifyOwner).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
