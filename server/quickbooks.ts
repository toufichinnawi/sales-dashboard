/**
 * QuickBooks Online API Integration
 * OAuth2 flow, token management, and API helpers
 */

import { ENV } from "./_core/env";
import { getDb } from "./db";
import { qbConnections, qbSyncLog } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ─── Constants ────────────────────────────────────────────────────────────────

const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_BASE = "https://quickbooks.api.intuit.com";
const QB_SANDBOX_API_BASE = "https://sandbox-quickbooks.api.intuit.com";
const QB_SCOPE = "com.intuit.quickbooks.accounting";

// Use production API base (change to QB_SANDBOX_API_BASE for sandbox testing)
const API_BASE = QB_API_BASE;

// ─── OAuth2 Helpers ───────────────────────────────────────────────────────────

/**
 * Generate the QuickBooks OAuth2 authorization URL
 */
export function getQBAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: ENV.qbClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: QB_SCOPE,
    state,
  });
  return `${QB_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
}> {
  const basicAuth = Buffer.from(
    `${ENV.qbClientId}:${ENV.qbClientSecret}`
  ).toString("base64");

  const resp = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("[QB OAuth] Token exchange failed:", resp.status, errText);
    throw new Error(`QuickBooks token exchange failed: ${resp.status} ${errText}`);
  }

  return resp.json();
}

/**
 * Refresh an expired access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
}> {
  const basicAuth = Buffer.from(
    `${ENV.qbClientId}:${ENV.qbClientSecret}`
  ).toString("base64");

  const resp = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("[QB OAuth] Token refresh failed:", resp.status, errText);
    throw new Error(`QuickBooks token refresh failed: ${resp.status} ${errText}`);
  }

  return resp.json();
}

// ─── Connection Management ────────────────────────────────────────────────────

/**
 * Save or update a QuickBooks connection after OAuth
 */
export async function saveQBConnection(
  realmId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  refreshExpiresIn: number,
  companyName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const accessTokenExpiresAt = new Date(now.getTime() + expiresIn * 1000);
  const refreshTokenExpiresAt = new Date(now.getTime() + refreshExpiresIn * 1000);

  // Check if connection already exists for this realmId
  const existing = await db
    .select()
    .from(qbConnections)
    .where(eq(qbConnections.realmId, realmId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(qbConnections)
      .set({
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        isActive: 1,
        companyName: companyName ?? existing[0].companyName,
      })
      .where(eq(qbConnections.realmId, realmId));
    return existing[0].id;
  } else {
    const result = await db.insert(qbConnections).values({
      realmId,
      companyName: companyName ?? null,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      isActive: 1,
    });
    return result[0].insertId;
  }
}

/**
 * Get the active QuickBooks connection (most recent active)
 */
export async function getActiveQBConnection() {
  const db = await getDb();
  if (!db) return null;

  const connections = await db
    .select()
    .from(qbConnections)
    .where(eq(qbConnections.isActive, 1))
    .orderBy(desc(qbConnections.updatedAt))
    .limit(1);

  return connections[0] ?? null;
}

/**
 * Disconnect QuickBooks (mark as inactive)
 */
export async function disconnectQB(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(qbConnections)
    .set({ isActive: 0 })
    .where(eq(qbConnections.id, connectionId));
}

/**
 * Get a valid access token, refreshing if needed
 */
export async function getValidAccessToken(): Promise<{
  accessToken: string;
  realmId: string;
} | null> {
  const conn = await getActiveQBConnection();
  if (!conn) return null;

  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  // Check if access token is still valid
  if (conn.accessTokenExpiresAt.getTime() - bufferMs > now.getTime()) {
    return { accessToken: conn.accessToken, realmId: conn.realmId };
  }

  // Check if refresh token is still valid
  if (conn.refreshTokenExpiresAt.getTime() < now.getTime()) {
    console.error("[QB] Refresh token expired, need to re-authorize");
    await disconnectQB(conn.id);
    return null;
  }

  // Refresh the access token
  try {
    const tokens = await refreshAccessToken(conn.refreshToken);
    const db = await getDb();
    if (!db) return null;

    const newAccessExpiry = new Date(now.getTime() + tokens.expires_in * 1000);
    const newRefreshExpiry = new Date(now.getTime() + tokens.x_refresh_token_expires_in * 1000);

    await db
      .update(qbConnections)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: newAccessExpiry,
        refreshTokenExpiresAt: newRefreshExpiry,
      })
      .where(eq(qbConnections.id, conn.id));

    return { accessToken: tokens.access_token, realmId: conn.realmId };
  } catch (err) {
    console.error("[QB] Failed to refresh token:", err);
    return null;
  }
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

/**
 * Make an authenticated GET request to QuickBooks API
 */
export async function qbApiGet(endpoint: string): Promise<any> {
  const auth = await getValidAccessToken();
  if (!auth) throw new Error("No active QuickBooks connection");

  const url = `${API_BASE}/v3/company/${auth.realmId}${endpoint}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`QB API error ${resp.status}: ${errText}`);
  }

  return resp.json();
}

/**
 * Query QuickBooks using their SQL-like query syntax
 */
export async function qbQuery(query: string): Promise<any> {
  const auth = await getValidAccessToken();
  if (!auth) throw new Error("No active QuickBooks connection");

  const url = `${API_BASE}/v3/company/${auth.realmId}/query?query=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`QB Query error ${resp.status}: ${errText}`);
  }

  return resp.json();
}

/**
 * Get company info from QuickBooks
 */
export async function getQBCompanyInfo(): Promise<any> {
  const auth = await getValidAccessToken();
  if (!auth) throw new Error("No active QuickBooks connection");

  const url = `${API_BASE}/v3/company/${auth.realmId}/companyinfo/${auth.realmId}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`QB CompanyInfo error ${resp.status}: ${errText}`);
  }

  return resp.json();
}

// ─── Sync Log Helpers ─────────────────────────────────────────────────────────

export async function createSyncLog(
  connectionId: number,
  syncType: "full" | "incremental" | "customers" | "invoices" | "payments"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(qbSyncLog).values({
    connectionId,
    syncType,
    status: "running",
  });
  return result[0].insertId;
}

export async function updateSyncLog(
  logId: number,
  data: {
    status?: "running" | "completed" | "failed";
    customersCreated?: number;
    customersUpdated?: number;
    ordersCreated?: number;
    ordersUpdated?: number;
    paymentsProcessed?: number;
    errorMessage?: string;
    completedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) return;

  await db.update(qbSyncLog).set(data).where(eq(qbSyncLog.id, logId));
}

export async function getRecentSyncLogs(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(qbSyncLog)
    .orderBy(desc(qbSyncLog.startedAt))
    .limit(limit);
}
