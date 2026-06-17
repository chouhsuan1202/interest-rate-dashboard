import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import {
  appendHistory,
  historyPoint,
  normalizeHistory,
  sanitizePreviousSnapshot
} from "../scripts/refresh-data.mjs";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function makeOutputDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "rates-refresh-test-"));
}

test("refresh script writes fixture-backed json files to the requested output dir", async () => {
  const outputDir = await makeOutputDir();
  const ratesPath = path.join(outputDir, "rates.json");
  const historyPath = path.join(outputDir, "history.json");
  const { stdout } = await execFileAsync("node", ["scripts/refresh-data.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      RATES_FIXTURE: "1",
      RATES_OUTPUT_DIR: outputDir
    }
  });

  assert.match(stdout, /Wrote .*rates\.json and .*history\.json/);

  const rates = JSON.parse(await fs.readFile(ratesPath, "utf8"));
  const history = JSON.parse(await fs.readFile(historyPath, "utf8"));

  assert.equal(rates.primaryRows.length, 3);
  assert.equal(rates.europeRows.length, 13);
  assert.equal(rates.asiaRows.length, 4);
  assert.equal(history.at(-1).rates.length, 3);
  assert.equal(history.at(-1).observedAt, rates.primaryRows[0].cells.policy_rate.fetchedAt);
});

test("refresh script does not append duplicate history points across repeated fixture runs", async () => {
  const outputDir = await makeOutputDir();
  const historyPath = path.join(outputDir, "history.json");

  await execFileAsync("node", ["scripts/refresh-data.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      RATES_FIXTURE: "1",
      RATES_OUTPUT_DIR: outputDir
    }
  });

  await execFileAsync("node", ["scripts/refresh-data.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      RATES_FIXTURE: "1",
      RATES_OUTPUT_DIR: outputDir
    }
  });

  const history = JSON.parse(await fs.readFile(historyPath, "utf8"));

  assert.equal(history.length, 1);
});

test("sanitizePreviousSnapshot preserves unavailable rows across refreshes", () => {
  const previousSnapshot = sanitizePreviousSnapshot({
    primaryRows: [],
    europeRows: [],
    asiaRows: [
      {
        regionId: "jp",
        cells: {
          mortgage: {
            productId: "mortgage",
            quality: "unavailable",
            stale: false,
            notes: "尚未設定可靠公開數值。"
          },
          policy_rate: {
            productId: "policy_rate",
            quality: "official",
            numericValue: 1
          }
        }
      }
    ]
  });

  assert.deepEqual(previousSnapshot.asiaRows[0].cells, {
    policy_rate: {
      productId: "policy_rate",
      quality: "official",
      numericValue: 1
    }
  });
});

test("appendHistory replaces matching observation date and appends only when observation changes", () => {
  const history = [
    {
      observedAt: "2026-05-01T00:00:00.000Z",
      rates: [{ regionId: "us", value: 4.33 }]
    }
  ];

  const sameObservation = {
    observedAt: "2026-05-01T00:00:00.000Z",
    rates: [{ regionId: "us", value: 4.33 }]
  };
  const revisedObservation = {
    observedAt: "2026-05-01T00:00:00.000Z",
    rates: [{ regionId: "us", value: 4.5 }]
  };
  const newerObservation = {
    observedAt: "2026-06-01T00:00:00.000Z",
    rates: [{ regionId: "us", value: 4.5 }]
  };

  assert.deepEqual(appendHistory(history, sameObservation), history);
  assert.deepEqual(appendHistory(history, revisedObservation), [revisedObservation]);
  assert.deepEqual(appendHistory(history, newerObservation), [...history, newerObservation]);
});

test("appendHistory keeps a new observation date even when rates are unchanged", () => {
  const history = [
    {
      observedAt: "2026-05-01T00:00:00.000Z",
      rates: [{ regionId: "us", value: 4.33 }]
    }
  ];

  const newerObservation = {
    observedAt: "2026-06-01T00:00:00.000Z",
    rates: [{ regionId: "us", value: 4.33 }]
  };

  assert.deepEqual(appendHistory(history, newerObservation), [...history, newerObservation]);
});

test("historyPoint uses the policy observation timestamp", () => {
  const point = historyPoint({
    primaryRows: [
      {
        regionId: "us",
        cells: {
          policy_rate: {
            numericValue: 4.5,
            fetchedAt: "2026-06-01T00:00:00.000Z"
          }
        }
      }
    ]
  });

  assert.deepEqual(point, {
    observedAt: "2026-06-01T00:00:00.000Z",
    rates: [{ regionId: "us", value: 4.5 }]
  });
});

test("normalizeHistory drops legacy refresh-timestamp entries", () => {
  const history = normalizeHistory([
    {
      generatedAt: "2026-06-16T21:32:06.316Z",
      rates: [{ regionId: "us", value: 3.75 }]
    },
    {
      observedAt: "2026-06-01T00:00:00.000Z",
      rates: [{ regionId: "us", value: 3.75 }]
    }
  ]);

  assert.deepEqual(history, [
    {
      observedAt: "2026-06-01T00:00:00.000Z",
      rates: [{ regionId: "us", value: 3.75 }]
    }
  ]);
});
