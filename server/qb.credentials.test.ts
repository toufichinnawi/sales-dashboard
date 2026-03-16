import { describe, it, expect } from "vitest";

describe("QuickBooks credentials", () => {
  it("QB_CLIENT_ID is set and non-empty", () => {
    const clientId = process.env.QB_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId!.length).toBeGreaterThan(10);
  });

  it("QB_CLIENT_SECRET is set and non-empty", () => {
    const clientSecret = process.env.QB_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret!.length).toBeGreaterThan(10);
  });

  it("can construct valid Basic auth header for token exchange", () => {
    const clientId = process.env.QB_CLIENT_ID!;
    const clientSecret = process.env.QB_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    expect(basicAuth).toBeTruthy();
    // Verify it decodes back correctly
    const decoded = Buffer.from(basicAuth, "base64").toString("utf-8");
    expect(decoded).toBe(`${clientId}:${clientSecret}`);
  });
});
