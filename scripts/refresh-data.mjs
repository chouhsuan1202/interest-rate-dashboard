import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import manualRates from "../src/data/manual-rates.json" with { type: "json" };
import { fetchPolicyRates } from "../src/fetch/policyRates.mjs";
import { buildSnapshot } from "../src/lib/snapshot.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function resolveOutputPaths(outputDir = process.env.RATES_OUTPUT_DIR) {
  const dataDir = outputDir ? path.resolve(outputDir) : path.join(root, "public", "data");
  return {
    dataDir,
    ratesPath: path.join(dataDir, "rates.json"),
    historyPath: path.join(dataDir, "history.json")
  };
}

async function readJsonOrNull(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function sanitizePreviousSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  const sanitizeRows = (rows) =>
    Array.isArray(rows)
      ? rows.map((row) => ({
          ...row,
          cells: Object.fromEntries(
            Object.entries(row.cells || {}).filter(([, cell]) => cell?.quality !== "unavailable")
          )
        }))
      : [];

  return {
    ...snapshot,
    primaryRows: sanitizeRows(snapshot.primaryRows),
    europeRows: sanitizeRows(snapshot.europeRows),
    asiaRows: sanitizeRows(snapshot.asiaRows)
  };
}

export function historyPoint(snapshot) {
  const rates = snapshot.primaryRows.map((row) => ({
    regionId: row.regionId,
    value: row.cells.policy_rate.numericValue
  }));
  const observedAt = snapshot.primaryRows[0]?.cells?.policy_rate?.fetchedAt || snapshot.generatedAt;

  return { observedAt, rates };
}

function sameRates(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function appendHistory(history, point) {
  const existing = Array.isArray(history) ? history : [];
  const matchingIndex = existing.findIndex((item) => item.observedAt === point.observedAt);

  if (matchingIndex >= 0) {
    if (sameRates(existing[matchingIndex].rates, point.rates)) {
      return existing;
    }

    const updated = [...existing];
    updated[matchingIndex] = point;
    return updated.slice(-365);
  }

  return [...existing, point].slice(-365);
}

export function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.filter(
    (item) => typeof item?.observedAt === "string" && Array.isArray(item?.rates)
  );
}

export async function refreshData({
  outputDir = process.env.RATES_OUTPUT_DIR,
  useNetwork = process.env.RATES_FIXTURE !== "1",
  now = new Date().toISOString()
} = {}) {
  const { dataDir, ratesPath, historyPath } = resolveOutputPaths(outputDir);

  await fs.mkdir(dataDir, { recursive: true });

  const previousSnapshot = sanitizePreviousSnapshot(await readJsonOrNull(ratesPath));
  const previousHistory = normalizeHistory(await readJsonOrNull(historyPath));
  const policyRates = await fetchPolicyRates({ useNetwork });
  const snapshot = buildSnapshot({ policyRates, manualRates, now, previousSnapshot });
  const history = appendHistory(previousHistory, historyPoint(snapshot));

  await fs.writeFile(ratesPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  await fs.writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`);

  return { dataDir, ratesPath, historyPath, snapshot, history };
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;

if (entryUrl === import.meta.url) {
  const { ratesPath, historyPath } = await refreshData();
  console.log(`Wrote ${path.relative(root, ratesPath)} and ${path.relative(root, historyPath)}`);
}
