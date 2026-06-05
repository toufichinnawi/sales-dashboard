import { desc, eq, or } from "drizzle-orm";
import { customers, orderItems, orders } from "../drizzle/schema";
import { getDb } from "./db";

const DEFAULT_SHOPIFY_API_VERSION = "2026-04";

type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

type ShopifyOrderNode = {
  id: string;
  legacyResourceId: string;
  name: string;
  createdAt: string;
  processedAt?: string | null;
  email?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  subtotalPriceSet?: { shopMoney?: ShopifyMoney | null } | null;
  totalPriceSet?: { shopMoney?: ShopifyMoney | null } | null;
  totalDiscountsSet?: { shopMoney?: ShopifyMoney | null } | null;
  customer?: {
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  billingAddress?: ShopifyAddress | null;
  shippingAddress?: ShopifyAddress | null;
  lineItems: {
    edges: {
      node: {
        name: string;
        quantity: number;
        sku?: string | null;
        originalUnitPriceSet?: { shopMoney?: ShopifyMoney | null } | null;
      };
    }[];
  };
};

type ShopifyAddress = {
  name?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  provinceCode?: string | null;
  zip?: string | null;
  country?: string | null;
  phone?: string | null;
};

export type ShopifySyncLog = {
  id: number;
  syncType: "orders";
  status: "completed" | "failed";
  ordersCreated: number;
  ordersUpdated: number;
  customersCreated: number;
  customersUpdated: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date;
};

const shopifySyncLogs: ShopifySyncLog[] = [];

function getShopifyConfig() {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN?.trim();
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_SHOPIFY_API_VERSION;

  return {
    shopDomain,
    accessToken,
    apiVersion,
    configured: Boolean(shopDomain && accessToken),
  };
}

function normalizeShopDomain(shopDomain: string): string {
  return shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function moneyAmount(value: ShopifyMoney | null | undefined): number {
  return Number(value?.amount || 0);
}

function formatAddress(address: ShopifyAddress | null | undefined): string | null {
  if (!address) return null;
  const parts = [
    address.company,
    address.address1,
    address.address2,
    address.city,
    address.provinceCode,
    address.zip,
    address.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function shopifyOrderNumber(order: ShopifyOrderNode): string {
  const id = order.legacyResourceId || order.id.split("/").pop() || order.name.replace(/\D/g, "");
  return `SH-${id.slice(-17)}`;
}

function mapOrderStatus(order: ShopifyOrderNode): "confirmed" | "delivered" | "paid" | "cancelled" {
  const financialStatus = (order.displayFinancialStatus || "").toUpperCase();
  const fulfillmentStatus = (order.displayFulfillmentStatus || "").toUpperCase();

  if (financialStatus === "VOIDED" || financialStatus === "REFUNDED") return "cancelled";
  if (fulfillmentStatus === "FULFILLED") return "delivered";
  if (financialStatus === "PAID") return "paid";
  return "confirmed";
}

async function shopifyGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const config = getShopifyConfig();
  if (!config.shopDomain || !config.accessToken) {
    throw new Error("Shopify credentials are not configured");
  }

  const endpoint = `https://${normalizeShopDomain(config.shopDomain)}/admin/api/${config.apiVersion}/graphql.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof payload?.errors === "string"
        ? payload.errors
        : Array.isArray(payload?.errors)
          ? payload.errors.map((err: { message?: string }) => err.message).filter(Boolean).join("; ")
          : null;
    throw new Error(`Shopify request failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }
  if (payload?.errors?.length) {
    throw new Error(payload.errors.map((err: { message?: string }) => err.message).filter(Boolean).join("; "));
  }

  return payload.data as T;
}

async function fetchRecentShopifyOrders(): Promise<ShopifyOrderNode[]> {
  const query = `
    query RecentOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            legacyResourceId
            name
            createdAt
            processedAt
            email
            displayFinancialStatus
            displayFulfillmentStatus
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalPriceSet { shopMoney { amount currencyCode } }
            totalDiscountsSet { shopMoney { amount currencyCode } }
            customer {
              displayName
              email
              phone
            }
            billingAddress {
              name
              company
              address1
              address2
              city
              provinceCode
              zip
              country
              phone
            }
            shippingAddress {
              name
              company
              address1
              address2
              city
              provinceCode
              zip
              country
              phone
            }
            lineItems(first: 100) {
              edges {
                node {
                  name
                  quantity
                  sku
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphql<{ orders: { edges: { node: ShopifyOrderNode }[] } }>(query, { first: 50 });
  return data.orders.edges.map((edge) => edge.node);
}

async function getOrCreateShopifyCustomer(order: ShopifyOrderNode): Promise<{ id: number; created: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const address = order.shippingAddress || order.billingAddress;
  const customerName =
    address?.company ||
    order.customer?.displayName ||
    address?.name ||
    order.email ||
    order.name ||
    "Shopify Customer";
  const email = order.customer?.email || order.email || `shopify-${order.legacyResourceId}@placeholder.local`;

  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(or(eq(customers.email, email), eq(customers.businessName, customerName)))
    .limit(1);

  if (existing.length > 0) return { id: existing[0].id, created: false };

  const inserted = await db.insert(customers).values({
    businessName: customerName,
    contactName: order.customer?.displayName || address?.name || customerName,
    email,
    phone: order.customer?.phone || address?.phone || null,
    address: formatAddress(address),
    segment: "other",
    status: "active",
    notes: `Auto-created from Shopify order ${order.name}.`,
  });

  return { id: inserted[0].insertId, created: true };
}

export async function getShopifyStatus() {
  const config = getShopifyConfig();
  return {
    connected: config.configured,
    connection: config.configured
      ? {
          shopDomain: config.shopDomain,
          apiVersion: config.apiVersion,
          lastSyncAt: shopifySyncLogs[0]?.completedAt ?? null,
        }
      : null,
  };
}

export function getShopifySyncLogs(limit = 50): ShopifySyncLog[] {
  return shopifySyncLogs.slice(0, limit);
}

export async function runShopifyOrdersSync(): Promise<{
  success: boolean;
  ordersCreated: number;
  ordersUpdated: number;
  customersCreated: number;
  customersUpdated: number;
}> {
  const startedAt = new Date();
  let ordersCreated = 0;
  let ordersUpdated = 0;
  let customersCreated = 0;
  let customersUpdated = 0;

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const shopifyOrders = await fetchRecentShopifyOrders();

    for (const shopifyOrder of shopifyOrders) {
      const customer = await getOrCreateShopifyCustomer(shopifyOrder);
      if (customer.created) customersCreated++;
      else customersUpdated++;

      const orderNumber = shopifyOrderNumber(shopifyOrder);
      const deliveryDate = new Date(shopifyOrder.processedAt || shopifyOrder.createdAt);
      const subtotal = moneyAmount(shopifyOrder.subtotalPriceSet?.shopMoney);
      const discount = moneyAmount(shopifyOrder.totalDiscountsSet?.shopMoney);
      const total = moneyAmount(shopifyOrder.totalPriceSet?.shopMoney);
      const address = formatAddress(shopifyOrder.shippingAddress || shopifyOrder.billingAddress);
      const notes = [
        `Shopify order ${shopifyOrder.name}`,
        `Shopify ID: ${shopifyOrder.legacyResourceId}`,
        `Financial status: ${shopifyOrder.displayFinancialStatus || "unknown"}`,
        `Fulfillment status: ${shopifyOrder.displayFulfillmentStatus || "unknown"}`,
      ].join(" | ");

      const existing = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);

      let orderId: number;
      if (existing.length > 0) {
        orderId = existing[0].id;
        await db
          .update(orders)
          .set({
            customerId: customer.id,
            status: mapOrderStatus(shopifyOrder),
            deliveryDate,
            deliveryAddress: address,
            subtotal: subtotal.toFixed(2),
            discount: discount.toFixed(2),
            total: total.toFixed(2),
            notes,
          })
          .where(eq(orders.id, orderId));
        await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
        ordersUpdated++;
      } else {
        const inserted = await db.insert(orders).values({
          customerId: customer.id,
          orderNumber,
          status: mapOrderStatus(shopifyOrder),
          deliveryDate,
          deliveryAddress: address,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          notes,
          createdAt: new Date(shopifyOrder.createdAt),
        });
        orderId = inserted[0].insertId;
        ordersCreated++;
      }

      const items = shopifyOrder.lineItems.edges.map(({ node }) => {
        const unitPrice = moneyAmount(node.originalUnitPriceSet?.shopMoney);
        return {
          orderId,
          product: node.sku ? `${node.name} (${node.sku})` : node.name,
          quantity: String(node.quantity),
          unit: "unit",
          unitPrice: unitPrice.toFixed(2),
          lineTotal: (unitPrice * node.quantity).toFixed(2),
        };
      });

      if (items.length > 0) {
        await db.insert(orderItems).values(items);
      }
    }

    const result = { success: true, ordersCreated, ordersUpdated, customersCreated, customersUpdated };
    shopifySyncLogs.unshift({
      id: Date.now(),
      syncType: "orders",
      status: "completed",
      ordersCreated,
      ordersUpdated,
      customersCreated,
      customersUpdated,
      errorMessage: null,
      startedAt,
      completedAt: new Date(),
    });
    return result;
  } catch (err: any) {
    shopifySyncLogs.unshift({
      id: Date.now(),
      syncType: "orders",
      status: "failed",
      ordersCreated,
      ordersUpdated,
      customersCreated,
      customersUpdated,
      errorMessage: err.message,
      startedAt,
      completedAt: new Date(),
    });
    throw err;
  }
}
