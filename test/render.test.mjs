import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChartModel,
  buildChartSvg,
  buildDashboardViewModel,
  formatUpdatedAt,
  primaryCardToHtml,
  qualityLabel,
  rowToHtml
} from "../public/app.js";

test("formats missing update times", () => {
  assert.equal(formatUpdatedAt(""), "無時間戳");
});

test("formats invalid update times safely", () => {
  assert.equal(formatUpdatedAt("not-an-iso-string"), "無時間戳");
});

test("formats known quality labels in plain language", () => {
  assert.equal(qualityLabel("official"), "官方");
  assert.equal(qualityLabel("broker"), "券商");
  assert.equal(qualityLabel("unavailable"), "無資料");
  assert.equal(qualityLabel("official", "en"), "Official");
  assert.equal(qualityLabel("unavailable", "en"), "N/A");
});

test("renders stale cells visibly", () => {
  const html = rowToHtml({
    label: "United States",
    cells: {
      policy_rate: {
        display: "3.75%",
        quality: "official",
        sourceName: "Fed",
        sourceUrl: "https://example.com",
        stale: true,
        fetchedAt: "2026-06-16T00:00:00.000Z"
      },
      mortgage: {
        display: "無資料",
        quality: "unavailable",
        sourceName: "",
        sourceUrl: "",
        stale: false,
        fetchedAt: ""
      },
      personal_credit: {
        display: "無資料",
        quality: "unavailable",
        sourceName: "",
        sourceUrl: "",
        stale: false,
        fetchedAt: ""
      },
      stock_collateral: {
        display: "無資料",
        quality: "unavailable",
        sourceName: "",
        sourceUrl: "",
        stale: false,
        fetchedAt: ""
      }
    }
  });

  assert.match(html, /United States/);
  assert.match(html, /沿用上次/);
  assert.match(html, /3\.75%/);
});

test("builds a three-line policy trend model in plain language", () => {
  const model = buildChartModel([
    {
      observedAt: "2026-06-14T00:00:00.000Z",
      rates: [
        { regionId: "us", value: 4.5 },
        { regionId: "euro_nl", value: 2.25 },
        { regionId: "tw", value: 2.0 }
      ]
    },
    {
      observedAt: "2026-06-15T00:00:00.000Z",
      rates: [
        { regionId: "us", value: 4.25 },
        { regionId: "euro_nl", value: 2.15 },
        { regionId: "tw", value: 2.0 }
      ]
    },
    {
      observedAt: "2026-06-16T00:00:00.000Z",
      rates: [
        { regionId: "us", value: 4.0 },
        { regionId: "euro_nl", value: 2.0 },
        { regionId: "tw", value: 1.875 }
      ]
    }
  ]);

  assert.deepEqual(
    model.series.map((item) => item.label),
    ["美國", "歐洲 / 荷蘭", "台灣"]
  );
  assert.equal(model.points.length, 3);
  assert.deepEqual(
    model.series.map((item) => item.values),
    [
      [4.5, 4.25, 4.0],
      [2.25, 2.15, 2.0],
      [2.0, 2.0, 1.875]
    ]
  );
});

test("renders trend chart svg with legend text", () => {
  const svg = buildChartSvg(
    buildChartModel([
      {
        observedAt: "2026-06-14T00:00:00.000Z",
        rates: [
          { regionId: "us", value: 4.5 },
          { regionId: "euro_nl", value: 2.25 },
          { regionId: "tw", value: 2.0 }
        ]
      },
      {
        observedAt: "2026-06-16T00:00:00.000Z",
        rates: [
          { regionId: "us", value: 4.0 },
          { regionId: "euro_nl", value: 2.0 },
          { regionId: "tw", value: 1.875 }
        ]
      }
    ])
  );

  assert.match(svg, /<svg/);
  assert.match(svg, /美國/);
  assert.match(svg, /歐洲 \/ 荷蘭/);
  assert.match(svg, /台灣/);
  assert.match(svg, /path/);
});

test("keeps tables and source links when history loading fails", () => {
  const snapshot = {
    generatedAt: "2026-06-16T21:44:57.643Z",
    primaryRows: [
      {
        label: "United States",
        cells: {
          policy_rate: {
            display: "3.75%",
            quality: "official",
            sourceName: "Federal Reserve",
            sourceUrl: "https://example.com/fed",
            stale: false,
            fetchedAt: "2026-06-16T00:00:00.000Z"
          },
          mortgage: {
            display: "6.50%",
            quality: "market",
            sourceName: "Mortgage Guide",
            sourceUrl: "https://example.com/mortgage",
            stale: false,
            fetchedAt: "2026-06-16T00:00:00.000Z"
          },
          personal_credit: {
            display: "8.50%",
            quality: "market",
            sourceName: "Loan Guide",
            sourceUrl: "https://example.com/loan",
            stale: false,
            fetchedAt: "2026-06-16T00:00:00.000Z"
          },
          stock_collateral: {
            display: "5.50%",
            quality: "broker",
            sourceName: "Broker",
            sourceUrl: "https://example.com/broker",
            stale: false,
            fetchedAt: "2026-06-16T00:00:00.000Z"
          }
        }
      }
    ],
    asiaRows: []
  };

  const viewModel = buildDashboardViewModel({
    snapshot,
    historyError: new Error("history.json 500")
  });

  assert.equal(viewModel.snapshotState, "live");
  assert.equal(viewModel.chart.state, "unavailable");
  assert.match(viewModel.chart.message, /趨勢圖暫時無法讀取/);
  assert.match(rowToHtml(viewModel.primaryRows[0]), /來源：Federal Reserve/);
  assert.match(primaryCardToHtml(viewModel.primaryCards[0]), /政策利率/);
  assert.match(primaryCardToHtml(viewModel.primaryCards[0]), /股票質押 \/ 券商/);
  assert.match(primaryCardToHtml(viewModel.primaryCards[0], "en"), /Policy rate/);
  assert.match(primaryCardToHtml(viewModel.primaryCards[0], "en"), /Stock collateral \/ brokers/);
});

test("uses cached snapshot as stale fallback when live rates fail", () => {
  const cachedSnapshot = {
    generatedAt: "2026-06-15T21:44:57.643Z",
    primaryRows: [
      {
        label: "United States",
        cells: {
          policy_rate: {
            display: "3.75%",
            quality: "official",
            sourceName: "Federal Reserve",
            sourceUrl: "https://example.com/fed",
            stale: false,
            fetchedAt: "2026-06-15T00:00:00.000Z"
          },
          mortgage: {
            display: "6.50%",
            quality: "market",
            sourceName: "Mortgage Guide",
            sourceUrl: "https://example.com/mortgage",
            stale: false,
            fetchedAt: "2026-06-15T00:00:00.000Z"
          },
          personal_credit: {
            display: "8.50%",
            quality: "market",
            sourceName: "Loan Guide",
            sourceUrl: "https://example.com/loan",
            stale: false,
            fetchedAt: "2026-06-15T00:00:00.000Z"
          },
          stock_collateral: {
            display: "5.50%",
            quality: "broker",
            sourceName: "Broker",
            sourceUrl: "https://example.com/broker",
            stale: false,
            fetchedAt: "2026-06-15T00:00:00.000Z"
          }
        }
      }
    ],
    asiaRows: []
  };

  const viewModel = buildDashboardViewModel({
    snapshotError: new Error("rates.json 503"),
    cachedSnapshot
  });

  assert.equal(viewModel.snapshotState, "stale");
  assert.match(viewModel.statusMessage, /沿用/);
  assert.match(rowToHtml(viewModel.primaryRows[0]), /沿用上次/);
  assert.match(rowToHtml(viewModel.primaryRows[0]), /來源：Federal Reserve/);
});
