import test from "node:test";
import assert from "node:assert/strict";
import historyFixture from "../public/data/history.json" with { type: "json" };

import {
  buildChartModel,
  buildChartSvg,
  buildDashboardViewModel,
  formatUpdatedAt,
  primaryCardToHtml,
  qualityLabel,
  rateTone,
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

test("classifies rate tone by product-specific thresholds", () => {
  assert.equal(rateTone("policy_rate", { numericValue: 1 }), "low");
  assert.equal(rateTone("policy_rate", { numericValue: 5 }), "high");
  assert.equal(rateTone("personal_credit", { numericValue: 16 }), "high");
  assert.equal(rateTone("personal_credit", { display: "20.00%" }), "very-high");
  assert.equal(rateTone("mortgage", { display: "無資料" }), "unknown");
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
    ["美國", "荷蘭", "台灣"]
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
  assert.match(svg, /荷蘭/);
  assert.match(svg, /台灣/);
  assert.match(svg, /path/);
});

test("keeps the final chart date from colliding with the previous month label", () => {
  const svg = buildChartSvg(buildChartModel(historyFixture, "zh"), "zh");

  assert.match(svg, /6月16日/);
  assert.doesNotMatch(svg, /5月1日/);
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
  assert.match(primaryCardToHtml(viewModel.primaryCards[0]), /<h3><a href="https:\/\/example.com\/fed"/);
  assert.doesNotMatch(primaryCardToHtml(viewModel.primaryCards[0]), /card-sources/);
  assert.match(primaryCardToHtml(viewModel.primaryCards[0], "en"), /Policy rate/);
  assert.match(primaryCardToHtml(viewModel.primaryCards[0], "en"), /Stock collateral \/ brokers/);
  assert.doesNotMatch(primaryCardToHtml(viewModel.primaryCards[0], "en"), /可查券商|金額越大|起/);
});

test("omits long Chinese notes in English details", () => {
  const html = rowToHtml({
    regionId: "tw",
    label: "台灣",
    cells: {
      policy_rate: {
        productId: "policy_rate",
        display: "2.00%",
        quality: "official",
        sourceName: "Central Bank",
        sourceUrl: "https://example.com",
        fetchedAt: "2026-06-16T00:00:00.000Z",
        notes: "這是一段很長的中文註記"
      },
      mortgage: {
        productId: "mortgage",
        display: "2.20-3.00%",
        quality: "manual",
        sourceName: "Bank",
        sourceUrl: "https://example.com",
        fetchedAt: "",
        notes: "台灣房貸常見參考區間"
      },
      personal_credit: {
        productId: "personal_credit",
        display: "2.50-16.00%",
        quality: "manual",
        sourceName: "Bank",
        sourceUrl: "https://example.com",
        fetchedAt: "",
        notes: "台灣信貸常見公告區間"
      },
      stock_collateral: {
        productId: "stock_collateral",
        display: "依券商/銀行專案",
        quality: "broker",
        sourceName: "Broker",
        sourceUrl: "https://example.com",
        fetchedAt: "",
        notes: "可查券商：元大、凱基、國泰"
      }
    }
  }, "en");

  assert.match(html, /Taiwan/);
  assert.doesNotMatch(html, /台灣|可查券商|中文註記/);
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
