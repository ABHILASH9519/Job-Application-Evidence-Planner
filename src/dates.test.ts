import { describe, expect, it } from "vitest";
import { addCalendarDays, daysBetweenDates } from "./dates";

describe("calendar date utilities", () => {
  it("adds days across month and year boundaries", () => {
    expect(addCalendarDays("2026-11-28", 5)).toBe("2026-12-03");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap years and negative offsets", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addCalendarDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("calculates signed calendar-day differences without DST drift", () => {
    expect(daysBetweenDates("2026-11-01", "2026-11-05")).toBe(4);
    expect(daysBetweenDates("2026-11-05", "2026-11-01")).toBe(-4);
  });

  it("rejects malformed dates and fractional offsets", () => {
    expect(() => addCalendarDays("2026-02-30", 1)).toThrow("valid date");
    expect(() => addCalendarDays("2026-11-01", 1.5)).toThrow("whole number");
    expect(() => daysBetweenDates("2026-02-30", "2026-03-01")).toThrow("valid calendar dates");
  });
});
