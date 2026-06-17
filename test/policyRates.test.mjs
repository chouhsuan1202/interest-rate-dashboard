import test from "node:test";
import assert from "node:assert/strict";
import fixture from "../src/data/sample-policy-rates.json" with { type: "json" };
import { fetchPolicyRates, parseLatestFredObservation } from "../src/fetch/policyRates.mjs";

test("parses the latest finite FRED observation from csv", () => {
  const csv = ["DATE,FEDFUNDS", "2026-05-01,4.33", "2026-06-01,."].join("\n");

  assert.deepEqual(parseLatestFredObservation(csv), {
    asOf: "2026-05-01T00:00:00.000Z",
    value: 4.33
  });
});

test("returns fixture data when network use is disabled", async () => {
  const rates = await fetchPolicyRates({ useNetwork: false });

  assert.deepEqual(rates, fixture);
});

test("updates the US policy rate from FRED csv when fetch succeeds", async () => {
  const rates = await fetchPolicyRates({
    fetchImpl: async () => ({
      ok: true,
      async text() {
        return ["DATE,FEDFUNDS", "2026-05-01,4.33", "2026-06-01,4.5"].join("\n");
      }
    })
  });

  assert.equal(rates.rates.us.value, 4.5);
  assert.equal(rates.asOf, "2026-06-01T00:00:00.000Z");
  assert.equal(rates.rates.us.quality, "official");
  assert.equal(rates.rates.us.sourceName, "FRED FEDFUNDS");
  assert.equal(
    rates.rates.us.notes,
    "Automated from FRED monthly effective federal funds rate. Target range adapter can replace this later."
  );
});

test("falls back to fixture when FRED csv has no finite observation", async () => {
  const rates = await fetchPolicyRates({
    fetchImpl: async () => ({
      ok: true,
      async text() {
        return ["DATE,FEDFUNDS", "2026-05-01,.", "2026-06-01,."].join("\n");
      }
    })
  });

  assert.deepEqual(rates, fixture);
});
