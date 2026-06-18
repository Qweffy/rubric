import { describe, expect, it } from "vitest";

import { GAP, type ToolPair, toolConfusion } from "@/lib/trajectory/confusion";

describe("toolConfusion", () => {
  it("tallies expected×actual pairings into nested counts", () => {
    const m = toolConfusion([
      { expected: "search_flights", actual: "search_flights" },
      { expected: "check_seats", actual: "hold_seat" },
      { expected: "check_seats", actual: "hold_seat" },
      { expected: "hold_seat", actual: "hold_seat" },
    ]);
    expect(m).toEqual({
      search_flights: { search_flights: 1 },
      check_seats: { hold_seat: 2 },
      hold_seat: { hold_seat: 1 },
    });
  });

  it("returns an empty map for no pairs", () => {
    expect(toolConfusion([])).toEqual({});
  });

  it("buckets an inserted call (null expected) under the GAP row", () => {
    const m = toolConfusion([{ expected: null, actual: "search_flights" }]);
    expect(m).toEqual({ [GAP]: { search_flights: 1 } });
  });

  it("buckets a deleted call (null actual) under the GAP column", () => {
    const m = toolConfusion([{ expected: "check_seats", actual: null }]);
    expect(m).toEqual({ check_seats: { [GAP]: 1 } });
  });

  it("keeps the diagonal (correct selections) separate from confusions", () => {
    const m = toolConfusion([
      { expected: "a", actual: "a" },
      { expected: "a", actual: "b" },
      { expected: "a", actual: "a" },
    ]);
    expect(m.a).toEqual({ a: 2, b: 1 });
  });

  it("counts across all cells sum to the number of pairs", () => {
    const pairs: ToolPair[] = [
      { expected: "a", actual: "a" },
      { expected: "a", actual: "b" },
      { expected: "b", actual: "b" },
      { expected: null, actual: "c" },
      { expected: "d", actual: null },
    ];
    const total = Object.values(toolConfusion(pairs))
      .flatMap((row) => Object.values(row))
      .reduce((sum, n) => sum + n, 0);
    expect(total).toBe(pairs.length);
  });
});
