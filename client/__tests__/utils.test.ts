import { cn, formatDate, getInitials, isOverdue } from "@/lib/utils";

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toContain("px-4");
  });

  it("builds initials from a name", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("admin")).toBe("A");
  });

  it("formats a date or returns fallback", () => {
    expect(formatDate(null, "—")).toBe("—");
    expect(formatDate("2024-01-15T00:00:00Z")).toMatch(/2024/);
  });

  it("detects overdue tasks", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(isOverdue(past, "IN_PROGRESS")).toBe(true);
    expect(isOverdue(past, "COMPLETED")).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});
