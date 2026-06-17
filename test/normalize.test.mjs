import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRate } from "../src/lib/normalize.mjs";

test("normalizes a single percentage value", () => {
  assert.deepEqual(normalizeRate(4.25), {
    display: "4.25%",
    numericValue: 4.25,
    unit: "%",
    isRange: false
  });
});

test("normalizes a percentage range", () => {
  assert.deepEqual(normalizeRate({ min: 2.1, max: 2.8 }), {
    display: "2.10-2.80%",
    numericValue: null,
    unit: "%",
    isRange: true
  });
});

test("marks unavailable values consistently", () => {
  assert.deepEqual(normalizeRate(null), {
    display: "無資料",
    numericValue: null,
    unit: "%",
    isRange: false
  });
});
