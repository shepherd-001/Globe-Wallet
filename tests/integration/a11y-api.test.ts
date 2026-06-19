/** @jest-environment node */
import { GET, POST } from "../../app/api/a11y/route";

describe("A11y API routes (Issue #24)", () => {
  describe("GET /api/a11y", () => {
    it("returns WCAG standard and page catalog", async () => {
      const response = await GET();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.standard).toBe("WCAG2AA");
      expect(body.pages).toHaveLength(8);
      expect(body.pages[0]).toMatchObject({ path: "/", label: "Dashboard", critical: true });
    });
  });

  describe("POST /api/a11y", () => {
    it("audits a valid page and returns summary", async () => {
      const request = new Request("http://localhost/api/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/" }),
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.path).toBe("/");
      expect(body.summary.passed).toBe(true);
      expect(body.violations).toEqual([]);
    });

    it("returns mock violations for /send", async () => {
      const request = new Request("http://localhost/api/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/send" }),
      });

      const response = await POST(request as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.violations).toHaveLength(1);
      expect(body.violations[0].id).toBe("label");
    });

    it("returns 400 for missing path", async () => {
      const request = new Request("http://localhost/api/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await POST(request as any);
      expect(response.status).toBe(400);
    });

    it("returns 422 for out-of-scope path", async () => {
      const request = new Request("http://localhost/api/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/admin" }),
      });

      const response = await POST(request as any);
      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("not in the accessibility audit scope");
    });

    it("returns 400 for invalid JSON", async () => {
      const request = new Request("http://localhost/api/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });

      const response = await POST(request as any);
      expect(response.status).toBe(400);
    });
  });
});
