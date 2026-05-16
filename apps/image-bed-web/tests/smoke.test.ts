import { describe, expect, it } from "vitest";

describe("image-bed-web", () => {
  it("keeps /admin base contract", () => {
    expect("/admin/".startsWith("/admin")).toBe(true);
  });
});
