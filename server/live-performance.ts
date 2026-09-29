export const PERFORMANCE_TIME_ZONE = "America/Toronto";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export type PerformanceOrder = {
  id: number;
  customerId: number;
  customerName: string | null;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
};

export type PerformanceOrderItem = {
  orderId: number;
  quantity: number;
  unit: string;
};

export type PerformanceCustomer = {
  id: number;
  createdAt: Date;
};

export type PerformanceTarget = {
  targetRevenue: number | null;
  targetDozens: number | null;
};

export type Comparison = {
  current: number;
  previous: number;
  difference: number;
  percentChange: number | null;
};

type PeriodMetrics = {
  revenue: number;
  orders: number;
  dozens: number;
  averageOrderValue: number;
  recognizedOrders: number;
  orderingCustomers: number;
};

type TimeRange = {
  start: Date;
  end: Date;
};

const recognizedStatuses = new Set(["delivered", "paid"]);

function partsInTimeZone(date: Date, timeZone = PERFORMANCE_TIME_ZONE): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>;

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

/** Converts a wall-clock date/time in Toronto to a UTC Date without relying on DB time-zone tables. */
function torontoWallClockToUtc(parts: DateParts): Date {
  const desiredWallClockMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  let timestamp = desiredWallClockMs;

  // Resolve the Toronto offset at the requested time. Midnight in Toronto is not
  // a DST transition point, and the second pass also covers offset changes.
  for (let i = 0; i < 3; i++) {
    const observed = partsInTimeZone(new Date(timestamp));
    const observedWallClockMs = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second
    );
    const adjustment = desiredWallClockMs - observedWallClockMs;
    if (adjustment === 0) break;
    timestamp += adjustment;
  }

  return new Date(timestamp);
}

function dateKey(parts: Pick<DateParts, "year" | "month" | "day">): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function monthKey(parts: Pick<DateParts, "year" | "month">): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

function addDays(parts: DateParts, days: number): DateParts {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function previousMonth(parts: DateParts): DateParts {
  if (parts.month === 1) {
    return { ...parts, year: parts.year - 1, month: 12 };
  }
  return { ...parts, month: parts.month - 1 };
}

export function getLivePerformanceQueryStart(now = new Date()): Date {
  const localNow = partsInTimeZone(now);
  const previousLocal = previousMonth(localNow);
  return torontoWallClockToUtc({
    year: previousLocal.year,
    month: previousLocal.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
}

export function getLivePerformanceMonthKey(now = new Date()): string {
  return monthKey(partsInTimeZone(now));
}

function nextMonthStart(parts: DateParts): Date {
  const year = parts.month === 12 ? parts.year + 1 : parts.year;
  const month = parts.month === 12 ? 1 : parts.month + 1;
  return torontoWallClockToUtc({ year, month, day: 1, hour: 0, minute: 0, second: 0 });
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function inRange(date: Date, range: TimeRange): boolean {
  return date >= range.start && date < range.end;
}

function comparison(current: number, previous: number): Comparison {
  const difference = current - previous;
  return {
    current,
    previous,
    difference,
    percentChange: previous === 0 ? null : (difference / previous) * 100,
  };
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildMetrics(
  orders: PerformanceOrder[],
  orderItems: Map<number, PerformanceOrderItem[]>,
  range: TimeRange
): PeriodMetrics {
  const operational = orders.filter(
    (order) => order.status !== "cancelled" && inRange(order.createdAt, range)
  );
  const recognized = operational.filter((order) => recognizedStatuses.has(order.status));
  const revenue = recognized.reduce((sum, order) => sum + order.total, 0);
  const dozens = recognized.reduce((sum, order) => {
    const verifiedDozens = (orderItems.get(order.id) ?? [])
      .filter((item) => item.unit.toLowerCase() === "dozen")
      .reduce((itemSum, item) => itemSum + item.quantity, 0);
    return sum + verifiedDozens;
  }, 0);

  return {
    revenue: round(revenue),
    orders: operational.length,
    dozens: round(dozens),
    averageOrderValue: recognized.length > 0 ? round(revenue / recognized.length) : 0,
    recognizedOrders: recognized.length,
    orderingCustomers: new Set(operational.map((order) => order.customerId)).size,
  };
}

function comparisonSet(current: PeriodMetrics, previous: PeriodMetrics) {
  return {
    revenue: comparison(current.revenue, previous.revenue),
    orders: comparison(current.orders, previous.orders),
    dozens: comparison(current.dozens, previous.dozens),
    averageOrderValue: comparison(current.averageOrderValue, previous.averageOrderValue),
  };
}

function moneyByDate(
  orders: PerformanceOrder[],
  range: TimeRange
): Map<string, { revenue: number; orders: number }> {
  const out = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    if (!recognizedStatuses.has(order.status) || !inRange(order.createdAt, range)) continue;
    const key = dateKey(partsInTimeZone(order.createdAt));
    const existing = out.get(key) ?? { revenue: 0, orders: 0 };
    existing.revenue += order.total;
    existing.orders += 1;
    out.set(key, existing);
  }
  return out;
}

function hourByDate(
  orders: PerformanceOrder[],
  range: TimeRange
): Map<number, number> {
  const out = new Map<number, number>();
  for (const order of orders) {
    if (!recognizedStatuses.has(order.status) || !inRange(order.createdAt, range)) continue;
    const hour = partsInTimeZone(order.createdAt).hour;
    out.set(hour, (out.get(hour) ?? 0) + order.total);
  }
  return out;
}

export function buildLivePerformanceSnapshot(input: {
  now?: Date;
  orders: PerformanceOrder[];
  orderItems: PerformanceOrderItem[];
  customers: PerformanceCustomer[];
  target?: PerformanceTarget | null;
}) {
  const now = input.now ?? new Date();
  const localNow = partsInTimeZone(now);
  const todayStart = torontoWallClockToUtc({ ...localNow, hour: 0, minute: 0, second: 0 });
  const tomorrowStart = torontoWallClockToUtc({
    ...addDays({ ...localNow, hour: 0, minute: 0, second: 0 }, 1),
    hour: 0,
    minute: 0,
    second: 0,
  });
  const yesterdayStart = torontoWallClockToUtc({
    ...addDays({ ...localNow, hour: 0, minute: 0, second: 0 }, -1),
    hour: 0,
    minute: 0,
    second: 0,
  });

  const currentMonthStart = torontoWallClockToUtc({
    year: localNow.year,
    month: localNow.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  const previousLocal = previousMonth(localNow);
  const previousMonthStart = torontoWallClockToUtc({
    year: previousLocal.year,
    month: previousLocal.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  const previousMonthEnd = currentMonthStart;

  const sameDayLastMonth = Math.min(
    localNow.day,
    daysInMonth(previousLocal.year, previousLocal.month)
  );
  const previousMtdEnd = torontoWallClockToUtc({
    year: previousLocal.year,
    month: previousLocal.month,
    day: sameDayLastMonth,
    hour: localNow.hour,
    minute: localNow.minute,
    second: localNow.second,
  });
  const sameTimeYesterday = new Date(yesterdayStart.getTime() + (now.getTime() - todayStart.getTime()));

  const orderItems = new Map<number, PerformanceOrderItem[]>();
  for (const item of input.orderItems) {
    const list = orderItems.get(item.orderId) ?? [];
    list.push(item);
    orderItems.set(item.orderId, list);
  }

  const today = buildMetrics(input.orders, orderItems, { start: todayStart, end: now });
  const yesterday = buildMetrics(input.orders, orderItems, { start: yesterdayStart, end: sameTimeYesterday });
  const thisMonth = buildMetrics(input.orders, orderItems, { start: currentMonthStart, end: now });
  const previousFullMonth = buildMetrics(input.orders, orderItems, { start: previousMonthStart, end: previousMonthEnd });
  const previousMtd = buildMetrics(input.orders, orderItems, { start: previousMonthStart, end: previousMtdEnd });

  const thisMonthCustomerIds = new Set(
    input.orders
      .filter((order) => order.status !== "cancelled" && inRange(order.createdAt, { start: currentMonthStart, end: now }))
      .map((order) => order.customerId)
  );
  const previousMtdCustomerIds = new Set(
    input.orders
      .filter((order) => order.status !== "cancelled" && inRange(order.createdAt, { start: previousMonthStart, end: previousMtdEnd }))
      .map((order) => order.customerId)
  );
  const newCustomers = input.customers.filter((customer) =>
    inRange(customer.createdAt, { start: currentMonthStart, end: now })
  ).length;
  const previousNewCustomers = input.customers.filter((customer) =>
    inRange(customer.createdAt, { start: previousMonthStart, end: previousMtdEnd })
  ).length;

  const todayByHour = hourByDate(input.orders, { start: todayStart, end: now });
  const yesterdayByHour = hourByDate(input.orders, { start: yesterdayStart, end: sameTimeYesterday });
  const todayProgression = Array.from({ length: Math.max(localNow.hour + 1, 1) }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    todayRevenue: round(todayByHour.get(hour) ?? 0),
    yesterdayRevenue: round(yesterdayByHour.get(hour) ?? 0),
  }));

  const currentDaily = moneyByDate(input.orders, { start: currentMonthStart, end: now });
  const previousDaily = moneyByDate(input.orders, { start: previousMonthStart, end: previousMonthEnd });
  let currentCumulative = 0;
  let previousCumulative = 0;
  const dailyRevenue = Array.from({ length: localNow.day }, (_, index) => {
    const day = index + 1;
    const currentKey = dateKey({ year: localNow.year, month: localNow.month, day });
    const previousDay = Math.min(day, daysInMonth(previousLocal.year, previousLocal.month));
    const previousKey = dateKey({ year: previousLocal.year, month: previousLocal.month, day: previousDay });
    const current = currentDaily.get(currentKey) ?? { revenue: 0, orders: 0 };
    const previous = previousDaily.get(previousKey) ?? { revenue: 0, orders: 0 };
    currentCumulative += current.revenue;
    previousCumulative += previous.revenue;
    return {
      date: currentKey,
      label: `${localNow.month}/${day}`,
      revenue: round(current.revenue),
      orders: current.orders,
      cumulativeRevenue: round(currentCumulative),
      previousMonthRevenue: round(previous.revenue),
      previousMonthCumulativeRevenue: round(previousCumulative),
    };
  });

  type CustomerBucket = {
    customerId: number;
    customerName: string;
    revenue: number;
    orders: Set<number>;
    previousRevenue: number;
  };
  const customerBuckets = new Map<number, CustomerBucket>();
  for (const order of input.orders) {
    if (!recognizedStatuses.has(order.status)) continue;
    const inCurrent = inRange(order.createdAt, { start: currentMonthStart, end: now });
    const inPrevious = inRange(order.createdAt, { start: previousMonthStart, end: previousMonthEnd });
    if (!inCurrent && !inPrevious) continue;
    const bucket = customerBuckets.get(order.customerId) ?? {
      customerId: order.customerId,
      customerName: order.customerName || "Unassigned customer",
      revenue: 0,
      orders: new Set<number>(),
      previousRevenue: 0,
    };
    if (inCurrent) {
      bucket.revenue += order.total;
      bucket.orders.add(order.id);
    }
    if (inPrevious) bucket.previousRevenue += order.total;
    customerBuckets.set(order.customerId, bucket);
  }
  const topCustomers = Array.from(customerBuckets.values())
    .filter((bucket) => bucket.revenue > 0)
    .map((bucket) => ({
      customerId: bucket.customerId,
      customerName: bucket.customerName,
      revenue: round(bucket.revenue),
      orders: bucket.orders.size,
      previousRevenue: round(bucket.previousRevenue),
      revenueChange: comparison(bucket.revenue, bucket.previousRevenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentOrders = input.orders
    .filter((order) => order.status !== "cancelled")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12)
    .map((order) => {
      const byUnit = new Map<string, number>();
      for (const item of orderItems.get(order.id) ?? []) {
        const unit = item.unit || "unit";
        byUnit.set(unit, (byUnit.get(unit) ?? 0) + item.quantity);
      }
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || "Unassigned customer",
        total: round(order.total),
        status: order.status,
        createdAt: order.createdAt,
        quantityByUnit: Array.from(byUnit.entries()).map(([unit, quantity]) => ({
          unit,
          quantity: round(quantity),
        })),
      };
    });

  const targetRevenue = input.target?.targetRevenue ?? null;
  const targetDozens = input.target?.targetDozens ?? null;
  const verifiedDozenItems = input.orderItems.filter((item) => item.unit.toLowerCase() === "dozen");
  const nonDozenItems = input.orderItems.filter((item) => item.unit.toLowerCase() !== "dozen");

  return {
    generatedAt: now.toISOString(),
    timeZone: PERFORMANCE_TIME_ZONE,
    period: {
      currentMonth: monthKey(localNow),
      previousMonth: monthKey(previousLocal),
      currentDay: dateKey(localNow),
      comparisonCutoff: now.toISOString(),
    },
    today: comparisonSet(today, yesterday),
    month: {
      comparedWithPreviousFullMonth: comparisonSet(thisMonth, previousFullMonth),
      monthToDate: comparisonSet(thisMonth, previousMtd),
      uniqueOrderingCustomers: comparison(thisMonthCustomerIds.size, previousMtdCustomerIds.size),
      newCustomers: comparison(newCustomers, previousNewCustomers),
      target: {
        targetRevenue,
        targetDozens,
        revenueProgress: targetRevenue && targetRevenue > 0 ? round((thisMonth.revenue / targetRevenue) * 100) : null,
        dozenProgress: targetDozens && targetDozens > 0 ? round((thisMonth.dozens / targetDozens) * 100) : null,
      },
    },
    charts: {
      todayProgression,
      dailyRevenue,
    },
    topCustomers,
    recentOrders,
    dataQuality: {
      verifiedDozenLineItems: verifiedDozenItems.length,
      nonDozenLineItems: nonDozenItems.length,
      dozenDefinition: "Only order items explicitly recorded with unit 'dozen' are included in dozen metrics.",
      revenueDefinition: "Revenue uses delivered and paid orders only.",
    },
  };
}
