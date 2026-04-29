import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  return { ctx };
}

describe("documents procedures", () => {
  describe("upload validation", () => {
    it("rejects Word .doc files with clear message", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          title: "Test Doc",
          documentType: "brochure",
          visibility: "client_portal",
          fileName: "test.doc",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow(
        "Please export this document as PDF before uploading it to the client portal."
      );
    });

    it("rejects Word .docx files with clear message", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          title: "Test Doc",
          documentType: "brochure",
          visibility: "client_portal",
          fileName: "test.docx",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow(
        "Please export this document as PDF before uploading it to the client portal."
      );
    });

    it("rejects non-PDF files", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          title: "Test Image",
          documentType: "brochure",
          visibility: "client_portal",
          fileName: "test.png",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow("Only PDF files are accepted");
    });

    it("requires title", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          title: "",
          documentType: "brochure",
          visibility: "client_portal",
          fileName: "test.pdf",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow();
    });

    it("validates document type enum", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          title: "Test",
          documentType: "invalid_type" as any,
          visibility: "client_portal",
          fileName: "test.pdf",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow();
    });

    it("validates visibility enum", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.documents.upload({
          title: "Test",
          documentType: "brochure",
          visibility: "invalid" as any,
          fileName: "test.pdf",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow();
    });
  });

  describe("access control", () => {
    it("allows authenticated users to list documents", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("blocks unauthenticated users from listing documents", async () => {
      const caller = appRouter.createCaller({ user: null } as any);

      await expect(caller.documents.list()).rejects.toThrow();
    });

    it("blocks unauthenticated users from uploading documents", async () => {
      const caller = appRouter.createCaller({ user: null } as any);

      await expect(
        caller.documents.upload({
          title: "Test",
          documentType: "brochure",
          visibility: "client_portal",
          fileName: "test.pdf",
          fileBase64: "dGVzdA==",
          fileSize: 100,
        })
      ).rejects.toThrow();
    });

    it("blocks unauthenticated users from deleting documents", async () => {
      const caller = appRouter.createCaller({ user: null } as any);

      await expect(caller.documents.delete({ id: 1 })).rejects.toThrow();
    });

    it("blocks unauthenticated users from updating documents", async () => {
      const caller = appRouter.createCaller({ user: null } as any);

      await expect(
        caller.documents.update({ id: 1, title: "New Title" })
      ).rejects.toThrow();
    });

    it("allows regular users to view client portal documents", async () => {
      const { ctx } = createUserContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw - clientList is a protectedProcedure, not adminProcedure
      const result = await caller.documents.clientList();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
