import test from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot } from "../src/lib/snapshot.mjs";

const manualRates = {
  us: {
    mortgage: {
      value: { min: 6, max: 7 },
      quality: "market",
      sourceName: "Mortgage Source",
      sourceUrl: "https://example.com/mortgage",
      notes: "Range varies by borrower."
    }
  }
};

const policyRates = {
  asOf: "2026-06-16T00:00:00.000Z",
  rates: {
    us: {
      value: 3.75,
      quality: "official",
      sourceName: "Federal Reserve",
      sourceUrl: "https://example.com/fed"
    },
    euro: {
      value: 2.4,
      quality: "official",
      sourceName: "European Central Bank",
      sourceUrl: "https://example.com/ecb"
    },
    tw: {
      value: 2,
      quality: "official",
      sourceName: "Taiwan Central Bank",
      sourceUrl: "https://example.com/tw"
    }
  }
};

test("builds primary and asia sections", () => {
  const snapshot = buildSnapshot({
    policyRates,
    manualRates,
    now: "2026-06-16T10:00:00.000Z",
    previousSnapshot: null
  });

  assert.equal(snapshot.generatedAt, "2026-06-16T10:00:00.000Z");
  assert.equal(snapshot.primaryRows.length, 3);
  assert.equal(snapshot.europeRows.length, 13);
  assert.equal(snapshot.asiaRows.length, 4);
  assert.equal(snapshot.primaryRows[0].regionId, "us");
});

test("includes policy and manual borrowing cells with source links", () => {
  const snapshot = buildSnapshot({
    policyRates,
    manualRates,
    now: "2026-06-16T10:00:00.000Z",
    previousSnapshot: null
  });

  const us = snapshot.primaryRows.find((row) => row.regionId === "us");
  assert.equal(us.cells.policy_rate.display, "3.75%");
  assert.equal(us.cells.policy_rate.quality, "official");
  assert.equal(us.cells.mortgage.display, "6.00-7.00%");
  assert.equal(us.cells.mortgage.quality, "market");
  assert.equal(us.cells.mortgage.sourceUrl, "https://example.com/mortgage");

  const uk = snapshot.europeRows.find((row) => row.regionId === "uk");
  assert.equal(uk.cells.policy_rate.display, "無資料");
});

test("marks missing values unavailable without breaking rows", () => {
  const snapshot = buildSnapshot({
    policyRates,
    manualRates: {},
    now: "2026-06-16T10:00:00.000Z",
    previousSnapshot: null
  });

  const japan = snapshot.asiaRows.find((row) => row.regionId === "jp");
  assert.equal(japan.cells.mortgage.display, "無資料");
  assert.equal(japan.cells.mortgage.quality, "unavailable");
  assert.equal(japan.cells.mortgage.stale, false);
});

test("uses previous value and marks stale when current policy fetch is missing", () => {
  const previousSnapshot = buildSnapshot({
    policyRates,
    manualRates,
    now: "2026-06-15T10:00:00.000Z",
    previousSnapshot: null
  });

  const snapshot = buildSnapshot({
    policyRates: { asOf: "2026-06-16T00:00:00.000Z", rates: {} },
    manualRates,
    now: "2026-06-16T10:00:00.000Z",
    previousSnapshot
  });

  const us = snapshot.primaryRows.find((row) => row.regionId === "us");
  assert.equal(us.cells.policy_rate.display, "3.75%");
  assert.equal(us.cells.policy_rate.stale, true);
});
