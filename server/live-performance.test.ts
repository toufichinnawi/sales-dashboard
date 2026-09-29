import { describe, expect, it } from "vitest";
import { buildLivePerformanceSnapshot } from "./live-performance";

const at = (value: string) => new Date(value);

function snapshot() {
  return buildLivePerformanceSnapshot({
    now: at("2026-09-15T16:30:00.000Z"), // 12:30 Toronto (EDT)
    orders: [
      // Today's recognized, operational, pending, and cancelled orders.
      { id: 1, customerId: 10, customerName: "North Café", orderNumber: "HB-1001", status: "paid", total: 120, createdAt: at("2026-09-15T13:00:00.000Z") },
      { id: 2, customerId: 20, customerName: "Market Street", orderNumber: "HB-1002", status: "delivered", total: 80, createdAt: at("2026-09-15T15:00:00.000Z") },
      { id: 3, customerId: 30, customerName: "Pending Café", orderNumber: "HB-1003", status: "pending", total: 60, createdAt: at("2026-09-15T15:15:00.000Z") },
      { id: 4, customerId: 40, customerName: "Cancelled Café", orderNumber: "HB-1004", status: "cancelled", total: 999, createdAt: at("2026-09-15T14:00:00.000Z") },
      // Yesterday through the same 12:30 Toronto cutoff.
      { id: 5, customerId: 10, customerName: "North Café", orderNumber: "HB-1005", status: "paid", total: 100, createdAt: at("2026-09-14T14:00:00.000Z") },
      { id: 6, customerId: 20, customerName: "Market Street", orderNumber: "HB-1006", status: "confirmed", total: 50, createdAt: at("2026-09-14T15:30:00.000Z") },
      // Current month before today and previous month.
      { id: 7, customerId: 10, customerName: "North Café", orderNumber: "HB-1007", status: "paid", total: 200, createdAt: at("2026-09-02T14:00:00.000Z") },
      { id: 8, customerId: 20, customerName: "Market Street", orderNumber: "HB-1008", status: "paid", total: 150, createdAt: at("2026-08-02T14:00:00.000Z") },
      { id: 9, customerId: 50, customerName: "Previous Only", orderNumber: "HB-1009", status: "delivered", total: 50, createdAt: at("2026-08-10T14:00:00.000Z") },
    ],
    orderItems: [
      { orderId: 1, quantity: 12, unit: "dozen" },
      { orderId: 1, quantity: 5, unit: "each" },
      { orderId: 2, quantity: 8, unit: "dozen" },
      { orderId: 3, quantity: 20, unit: "dozen" },
      { orderId: 5, quantity: 10, unit: "dozen" },
      { orderId: 6, quantity: 6, unit: "dozen" },
      { orderId: 7, quantity: 20, unit: "dozen" },
      { orderId: 8, quantity: 15, unit: "dozen" },
      { orderId: 9, quantity: 5, unit: "dozen" },
    ],
    customers: [
      { id: 10, createdAt: at("2024-01-01T12:00:00.000Z") },
      { id: 20, createdAt: at("2024-01-01T12:00:00.000Z") },
      { id: 30, createdAt: at("2026-09-12T12:00:00.000Z") },
      { id: 50, createdAt: at("2024-01-01T12:00:00.000Z") },
    ],
    target: { targetRevenue: 1000, targetDozens: 100 },
  });
}

describe("buildLivePerformanceSnapshot", () => {
  it("uses delivered and paid orders for revenue while excluding cancelled orders from operational metrics", () => {
    const result = snapshot();

    expect(result.today.revenue).toMatchObject({ current: 200, previous: 100, difference: 100, percentChange: 100 });
    expect(result.today.orders).toMatchObject({ current: 3, previous: 2, difference: 1, percentChange: 50 });
    expect(result.today.dozen).toBeUndefined();
    expect(result.today.dozens).toMatchObject({ current: 20, previous: 10, difference: 10, percentChange: 100 });
    expect(result.today.averageOrderValue).toMatchObject({ current: 100, previous: 100, difference: 0, percentChange: 0 });
  });

  it("returns null percentage changes when no prior-period baseline exists", () => {
    const result = buildLivePerformanceSnapshot({
      now: at("2026-09-15T16:30:00.000Z"),
      orders: [{ id: 1, customerId: 1, customerName: "New Café", orderNumber: "HB-1", status: "paid", total: 75, createdAt: at("2026-09-15T15:00:00.000Z") }],
      orderItems: [{ orderId: 1, quantity: 6, unit: "dozen" }],
      customers: [{ id: 1, createdAt: at("2026-09-15T15:00:00.000Z") }],
      target: null,
    });

    expect(result.today.revenue.percentChange).toBeNull();
    expect(result.month.target.revenueProgress).toBeNull();
    expect(result.month.target.dozenProgress).toBeNull();
  });

  it("distinguishes full previous-month performance from equivalent elapsed month-to-date performance", () => {
    const result = snapshot();

    // Current MTD: Sep 2 + yesterday + today recognized = 500. Previous MTD through Aug 15 = 200.
    expect(result.month.monthToDate.revenue).toMatchObject({ current: 500, previous: 200, difference: 300, percentChange: 150 });
    // Previous full month includes all $200 of August recognized revenue in this fixture.
    expect(result.month.comparedWithPreviousFullMonth.revenue).toMatchObject({ current: 500, previous: 200 });
    expect(result.month.target).toMatchObject({ targetRevenue: 1000, targetDozens: 100, revenueProgress: 50, dozenProgress: 50 });
  });

  it("keeps Toronto calendar days intact across the UTC boundary", () => {
    const result = buildLivePerformanceSnapshot({
      now: at("2026-09-15T04:30:00.000Z"), // 00:30 Sep 15 in Toronto
      orders: [
        { id: 1, customerId: 1, customerName: "Late Café", orderNumber: "HB-1", status: "paid", total: 50, createdAt: at("2026-09-15T04:15:00.000Z") },
        { id: 2, customerId: 1, customerName: "Late Café", orderNumber: "HB-2", status: "paid", total: 25, createdAt: at("2026-09-14T04:15:00.000Z") }, // Sep 14, 00:15 Toronto
      ],
      orderItems: [],
      customers: [],
      target: null,
    });

    expect(result.period.currentDay).toBe("2026-09-15");
    expect(result.today.revenue.current).toBe(50);
    expect(result.today.revenue.previous).toBe(25);
  });

  it("limits customer rankings to current-month recognized revenue and reports unit quantities without relabeling eaches as dozens", () => {
    const result = snapshot();

    expect(result.topCustomers[0]).toMatchObject({ customerName: "North Café", revenue: 420, orders: 3, previousRevenue: 0 });
    expect(result.recentOrders.find((order) => order.orderNumber === "HB-1001")?.quantityByUnit).toEqual([
      { unit: "dozen", quantity: 12 },
      { unit: "each", quantity: 5 },
    ]);
    expect(result.dataQuality).toMatchObject({
      dozenDefinition: "Only order items explicitly recorded with unit 'dozen' are included in dozen metrics.",
    });
  });
});
