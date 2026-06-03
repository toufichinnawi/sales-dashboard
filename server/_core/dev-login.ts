import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const DEV_OPEN_ID = "dev-local";
const DEV_NAME = "Dev Admin";

export function registerDevLoginRoute(app: Express) {
  app.get("/api/dev-login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).json({ error: "dev-login is only available in development" });
      return;
    }

    try {
      await db.upsertUser({
        openId: DEV_OPEN_ID,
        name: DEV_NAME,
        role: "admin",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(DEV_OPEN_ID, {
        name: DEV_NAME,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[DevLogin] Failed", error);
      res.status(500).json({ error: "dev-login failed" });
    }
  });
}
