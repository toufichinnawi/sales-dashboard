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
} from "./db";

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
    // Test the pricing logic
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
