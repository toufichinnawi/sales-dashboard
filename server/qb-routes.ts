/**
 * QuickBooks OAuth2 Express Routes
 * These are raw Express routes (not tRPC) because QuickBooks redirects
 * back to a URL and we need to handle the callback as a GET request.
 */

import { Router } from "express";
import crypto from "crypto";
import {
  getQBAuthUrl,
  exchangeCodeForTokens,
  saveQBConnection,
  getQBCompanyInfo,
  getActiveQBConnection,
} from "./quickbooks";

const qbRouter = Router();

// Store pending OAuth states (in-memory, short-lived)
const pendingStates = new Map<string, { origin: string; timestamp: number }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  pendingStates.forEach((val, key) => {
    if (now - val.timestamp > 10 * 60 * 1000) {
      pendingStates.delete(key);
    }
  });
}, 10 * 60 * 1000);

/**
 * GET /api/qb/connect
 * Initiates the QuickBooks OAuth2 flow.
 * Query params: origin (the frontend origin for redirect after callback)
 */
qbRouter.get("/connect", (req, res) => {
  const origin = (req.query.origin as string) || "";
  if (!origin) {
    return res.status(400).json({ error: "Missing origin parameter" });
  }

  const state = crypto.randomBytes(16).toString("hex");
  pendingStates.set(state, { origin, timestamp: Date.now() });

  const redirectUri = `${origin}/api/qb/callback`;
  const authUrl = getQBAuthUrl(redirectUri, state);

  console.log("[QB OAuth] Redirecting to QuickBooks authorization...");
  console.log("[QB OAuth] Redirect URI:", redirectUri);

  res.redirect(authUrl);
});

/**
 * GET /api/qb/callback
 * Handles the QuickBooks OAuth2 callback after user authorizes.
 */
qbRouter.get("/callback", async (req, res) => {
  const { code, state, realmId, error: qbError } = req.query;

  if (qbError) {
    console.error("[QB OAuth] Authorization denied:", qbError);
    return res.redirect("/?qb_error=denied");
  }

  if (!code || !state || !realmId) {
    console.error("[QB OAuth] Missing params:", { code: !!code, state: !!state, realmId: !!realmId });
    return res.redirect("/?qb_error=missing_params");
  }

  const stateStr = state as string;
  const pending = pendingStates.get(stateStr);
  if (!pending) {
    console.error("[QB OAuth] Invalid or expired state");
    return res.redirect("/?qb_error=invalid_state");
  }

  pendingStates.delete(stateStr);

  try {
    const redirectUri = `${pending.origin}/api/qb/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string, redirectUri);

    // Save connection to database
    await saveQBConnection(
      realmId as string,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tokens.x_refresh_token_expires_in
    );

    // Try to get company name
    try {
      const companyInfo = await getQBCompanyInfo();
      const companyName = companyInfo?.CompanyInfo?.CompanyName;
      if (companyName) {
        const { getDb } = await import("./db");
        const { qbConnections } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          await db
            .update(qbConnections)
            .set({ companyName })
            .where(eq(qbConnections.realmId, realmId as string));
        }
      }
    } catch (e) {
      console.warn("[QB OAuth] Could not fetch company name:", e);
    }

    console.log("[QB OAuth] Successfully connected QuickBooks, realmId:", realmId);
    res.redirect("/?qb_connected=true");
  } catch (err: any) {
    console.error("[QB OAuth] Token exchange error:", err.message);
    res.redirect(`/?qb_error=${encodeURIComponent(err.message)}`);
  }
});

export default qbRouter;
