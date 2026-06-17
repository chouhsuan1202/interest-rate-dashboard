import fixture from "../data/sample-policy-rates.json" with { type: "json" };

export async function fetchPolicyRates({ useNetwork = true, fetchImpl = globalThis.fetch } = {}) {
  if (!useNetwork || typeof fetchImpl !== "function") {
    return fixture;
  }

  try {
    const fredResponse = await fetchImpl("https://fred.stlouisfed.org/graph/fredgraph.csv?id=FEDFUNDS");
    if (!fredResponse.ok) {
      return fixture;
    }

    const fredCsv = await fredResponse.text();
    const observation = parseLatestFredObservation(fredCsv);
    if (!observation) {
      return fixture;
    }

    return {
      ...fixture,
      asOf: observation.asOf,
      rates: {
        ...fixture.rates,
        us: {
          ...fixture.rates.us,
          value: observation.value,
          sourceName: "FRED FEDFUNDS",
          sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS",
          notes: "Automated from FRED monthly effective federal funds rate. Target range adapter can replace this later."
        }
      }
    };
  } catch {
    return fixture;
  }
}

export function parseLatestFredObservation(csvText) {
  const rows = csvText.trim().split("\n").slice(1);

  for (const row of rows.reverse()) {
    const [date, value] = row.split(",");
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return {
        asOf: new Date(`${date}T00:00:00.000Z`).toISOString(),
        value: parsed
      };
    }
  }

  return null;
}
