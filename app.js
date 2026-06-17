const PRODUCT_ORDER = ["policy_rate", "mortgage", "personal_credit", "stock_collateral"];
const SNAPSHOT_CACHE_KEY = "interest-rate-dashboard.snapshot";
const LANG_CACHE_KEY = "interest-rate-dashboard.language";
const CHART_SERIES = [
  { label: "美國", aliases: ["us"], color: "#0f5f8f" },
  { label: "歐洲 / 荷蘭", aliases: ["euro_nl", "euro"], color: "#2f6f65" },
  { label: "台灣", aliases: ["tw"], color: "#8a4f7d" }
];

const UI_TEXT = {
  zh: {
    htmlLang: "zh-Hant",
    title: "全球利率",
    refresh: "更新",
    loading: "讀取利率資料中...",
    updatePrefix: "更新",
    stalePrefix: "沿用",
    trendPaused: "趨勢暫停",
    errorPrefix: "無法讀取 dashboard 資料",
    noTimestamp: "無時間戳",
    noDate: "無日期",
    noSource: "無來源",
    sourcePrefix: "來源",
    updatedPrefix: "更新",
    staleFlag: "沿用上次",
    primaryHeading: "重點地區",
    europeHeading: "歐洲其他",
    asiaHeading: "亞洲其他",
    trendHeading: "政策利率趨勢",
    detailsHeading: "明細",
    asiaDetailsHeading: "亞洲明細",
    regionHeader: "地區",
    policyHeader: "政策利率",
    mortgageHeader: "房貸",
    creditHeader: "信貸",
    stockHeader: "股票質押 / 融資",
    brokerLabel: "股票質押 / 券商",
    chartAria: "美國、歐洲 / 荷蘭、台灣政策利率趨勢",
    chartCaption: "依每日保存紀錄顯示政策利率趨勢。",
    chartLoadFirst: "利率資料載入後才會顯示趨勢圖。",
    chartUnavailable: "趨勢圖暫時無法讀取。",
    chartNoHistory: "目前還沒有足夠歷史資料可顯示趨勢圖。",
    chartTablesStillAvailable: "趨勢圖暫時無法讀取，利率表與來源連結仍可使用。",
    qualityNote: "資料狀態：官方 = 央行或監管機構來源；市場 = 比較網站或公開市場報價；券商 = 融資或 margin 費率表；手動 = 人工維護區間與來源連結；無資料 = 尚無可靠公開數值。",
    quality: {
      official: "官方",
      market: "市場",
      broker: "券商",
      manual: "手動",
      unavailable: "無資料"
    }
  },
  en: {
    htmlLang: "en",
    title: "Interest Rates",
    refresh: "Refresh",
    loading: "Loading rates...",
    updatePrefix: "Updated",
    stalePrefix: "Using saved",
    trendPaused: "trend paused",
    errorPrefix: "Could not load dashboard data",
    noTimestamp: "No timestamp",
    noDate: "No date",
    noSource: "No source",
    sourcePrefix: "Source",
    updatedPrefix: "Updated",
    staleFlag: "Saved",
    primaryHeading: "Key Regions",
    europeHeading: "Other Europe",
    asiaHeading: "Other Asia",
    trendHeading: "Policy Rate Trend",
    detailsHeading: "Details",
    asiaDetailsHeading: "Asia Details",
    regionHeader: "Region",
    policyHeader: "Policy rate",
    mortgageHeader: "Mortgage",
    creditHeader: "Personal loan",
    stockHeader: "Stock collateral / margin",
    brokerLabel: "Stock collateral / brokers",
    chartAria: "Policy rate trend for the US, Europe / Netherlands, and Taiwan",
    chartCaption: "Policy rate trend based on saved daily snapshots.",
    chartLoadFirst: "Trend appears after rates data loads.",
    chartUnavailable: "Trend chart is unavailable right now.",
    chartNoHistory: "Not enough saved history to show a trend yet.",
    chartTablesStillAvailable: "Trend chart is unavailable right now. Rate tables and source links still work.",
    qualityNote: "Data status: Official = central bank or regulator source; Market = comparison site or public market quote; Broker = margin or financing schedule; Manual = maintained range with source link; N/A = no reliable public value yet.",
    quality: {
      official: "Official",
      market: "Market",
      broker: "Broker",
      manual: "Manual",
      unavailable: "N/A"
    }
  }
};

const REGION_LABELS = {
  en: {
    us: "United States",
    euro_nl: "Europe / Netherlands",
    tw: "Taiwan",
    jp: "Japan",
    cn: "China",
    kr: "South Korea",
    sg: "Singapore",
    uk: "United Kingdom",
    ch: "Switzerland",
    de: "Germany",
    fr: "France",
    be: "Belgium",
    at: "Austria",
    ie: "Ireland",
    it: "Italy",
    es: "Spain",
    pt: "Portugal",
    se: "Sweden",
    no: "Norway",
    dk: "Denmark"
  }
};

const VALUE_TRANSLATIONS = {
  en: {
    "無資料": "N/A",
    "需比價": "Compare",
    "依券商/銀行專案": "By broker/bank offer",
    "依券商 margin / 信用取引": "Broker margin / credit trading",
    "依券商融資融券": "Broker margin financing",
    "依券商 margin loan": "Broker margin loan",
    "依券商 margin financing": "Broker margin financing",
    "IBKR：基準利率 + 2.5% 起": "IBKR: benchmark + 2.5% from",
    "IBKR EUR：依基準利率加碼": "IBKR EUR: benchmark + spread"
  }
};

const SOURCE_NAME_TRANSLATIONS = {
  en: {
    "券商 margin 費率表": "Broker margin schedule",
    "台灣券商融資費率": "Taiwan broker financing reference",
    "台灣銀行房貸頁面": "Taiwan bank mortgage page",
    "台灣銀行信貸頁面": "Taiwan bank personal loan page",
    "荷蘭房貸比較來源": "Dutch mortgage comparison source",
    "ABN AMRO，使用者人工確認": "ABN AMRO, manually confirmed by user",
    "Freddie Mac / 美國房貸市場來源": "Freddie Mac / US mortgage market source",
    "Federal Reserve 消費信貸資料": "Federal Reserve consumer credit data"
  }
};

const EN_BROKER_BULLETS = {
  us: [
    "IBKR Lite: benchmark + 2.5%",
    "IBKR Pro: benchmark + 1.5% from",
    "Also check: Interactive Brokers, Charles Schwab, Fidelity"
  ],
  euro_nl: [
    "EUR margin usually uses benchmark + spread",
    "Also check: Interactive Brokers, DEGIRO, Saxo Bank"
  ],
  tw: [
    "Usually quoted by bank or broker program",
    "Also check: Yuanta, KGI, Cathay, Fubon, SinoPac"
  ]
};

let currentLanguage = "zh";

function textFor(lang = currentLanguage) {
  return UI_TEXT[lang] || UI_TEXT.zh;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidDate(date) {
  return date instanceof Date && Number.isFinite(date.getTime());
}

function createEmptyCell() {
  return {
    display: "無資料",
    quality: "unavailable",
    sourceName: "",
    sourceUrl: "",
    stale: false,
    fetchedAt: "",
    notes: ""
  };
}

function cloneRows(rows, forceStale = false) {
  return (rows || []).map((row) => ({
    ...row,
    cells: Object.fromEntries(
      PRODUCT_ORDER.map((productId) => {
        const cell = row.cells?.[productId] || createEmptyCell();
        return [
          productId,
          {
            ...cell,
            stale: forceStale || Boolean(cell.stale)
          }
        ];
      })
    )
  }));
}

function splitNotes(notes) {
  return String(notes || "")
    .split("｜")
    .map((item) => item.trim())
    .filter(Boolean);
}

function localizeRegion(row, lang = currentLanguage) {
  return REGION_LABELS[lang]?.[row?.regionId] || row?.label || "";
}

function localizeDisplay(value, lang = currentLanguage) {
  return VALUE_TRANSLATIONS[lang]?.[value] || value;
}

function localizeSourceName(value, lang = currentLanguage) {
  return SOURCE_NAME_TRANSLATIONS[lang]?.[value] || value;
}

function representativeRate(cell) {
  if (!cell) return null;
  if (Number.isFinite(cell.numericValue)) return cell.numericValue;

  const display = String(cell.display || "");
  const matches = [...display.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
  if (!matches.length || matches.some((value) => !Number.isFinite(value))) return null;
  return matches.reduce((sum, value) => sum + value, 0) / matches.length;
}

export function rateTone(productId, cell) {
  const rate = representativeRate(cell);
  if (!Number.isFinite(rate)) return "unknown";

  const thresholds = {
    policy_rate: [1.5, 2.5, 4, 6],
    mortgage: [2.5, 4, 6, 8],
    personal_credit: [4, 8, 12, 18],
    stock_collateral: [3, 6, 9, 12]
  }[productId] || [2, 4, 7, 10];

  if (rate < thresholds[0]) return "low";
  if (rate < thresholds[1]) return "moderate";
  if (rate < thresholds[2]) return "mid";
  if (rate < thresholds[3]) return "high";
  return "very-high";
}

function formatChartDate(isoString, lang = currentLanguage) {
  const date = new Date(isoString);
  if (!isValidDate(date)) {
    return textFor(lang).noDate;
  }

  return new Intl.DateTimeFormat(lang === "en" ? "en" : "zh-TW", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatPercent(value) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : value % 0.25 === 0 ? 2 : 2).replace(/\.00$/, "")}%`;
}

function historyValueForAliases(entry, aliases) {
  if (!Array.isArray(entry?.rates)) {
    return null;
  }

  for (const alias of aliases) {
    const match = entry.rates.find((item) => item.regionId === alias && Number.isFinite(item.value));
    if (match) {
      return match.value;
    }
  }

  return null;
}

function buildSeriesPath(points, xForIndex, yForValue) {
  const commands = [];

  points.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const prefix = commands.length === 0 || !Number.isFinite(points[index - 1]) ? "M" : "L";
    commands.push(`${prefix}${xForIndex(index).toFixed(1)} ${yForValue(value).toFixed(1)}`);
  });

  return commands.join(" ");
}

export function formatUpdatedAt(isoString, lang = currentLanguage) {
  const text = textFor(lang);
  if (!isoString) return text.noTimestamp;

  const date = new Date(isoString);
  if (!isValidDate(date)) {
    return text.noTimestamp;
  }

  return new Intl.DateTimeFormat(lang === "en" ? "en" : "zh-TW", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function qualityLabel(quality, lang = currentLanguage) {
  const labels = textFor(lang).quality;
  return labels[quality] || labels.unavailable;
}

function sourceHtml(cell, lang = currentLanguage) {
  const text = textFor(lang);
  const separator = lang === "zh" ? "：" : ": ";
  if (!cell.sourceUrl) {
    return `<span class="cell-meta">${escapeHtml(text.noSource)}</span>`;
  }

  const sourceName = escapeHtml(localizeSourceName(cell.sourceName || text.sourcePrefix, lang));
  const sourceUrl = escapeHtml(cell.sourceUrl);
  return `<a class="cell-meta" href="${sourceUrl}" target="_blank" rel="noreferrer">${escapeHtml(text.sourcePrefix)}${separator}${sourceName}</a>`;
}

function noteHtml(cell, lang = currentLanguage) {
  if (lang === "en") {
    return "";
  }

  if (!cell.notes) {
    return "";
  }

  return `<div class="cell-meta note">${escapeHtml(cell.notes)}</div>`;
}

function cellToHtml(cell, productId, lang = currentLanguage) {
  const text = textFor(lang);
  const separator = lang === "zh" ? "：" : ": ";
  const staleFlag = cell.stale ? `<span class="stale-flag">${escapeHtml(text.staleFlag)}</span>` : "";
  const tone = rateTone(productId, cell);

  return `
    <td class="${cell.stale ? "stale" : ""}" data-rate-tone="${escapeHtml(tone)}">
      <div class="cell-stack">
        <div class="rate-value rate-tone">${escapeHtml(localizeDisplay(cell.display, lang))}</div>
        <div class="quality-line">
          <span class="quality">${escapeHtml(qualityLabel(cell.quality, lang))}</span>
          ${staleFlag}
        </div>
        ${sourceHtml(cell, lang)}
        <div class="cell-meta">${escapeHtml(text.updatedPrefix)}${separator}${escapeHtml(formatUpdatedAt(cell.fetchedAt, lang))}</div>
        ${noteHtml(cell, lang)}
      </div>
    </td>
  `;
}

export function rowToHtml(row, lang = currentLanguage) {
  return `
    <tr>
      <th scope="row">${escapeHtml(localizeRegion(row, lang))}</th>
      ${PRODUCT_ORDER.map((productId) => cellToHtml(row.cells[productId] || createEmptyCell(), productId, lang)).join("")}
    </tr>
  `;
}

function cardMetricHtml(label, cell, lang = currentLanguage) {
  const safeCell = cell || createEmptyCell();
  const staleFlag = safeCell.stale ? `<span class="stale-flag">${escapeHtml(textFor(lang).staleFlag)}</span>` : "";
  const productId = PRODUCT_ORDER.find((id) => safeCell.productId === id) || "";
  const tone = rateTone(productId, safeCell);

  return `
    <div class="card-metric" data-rate-tone="${escapeHtml(tone)}">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong class="rate-tone">${escapeHtml(localizeDisplay(safeCell.display, lang))}</strong>
      <span class="metric-meta">${escapeHtml(qualityLabel(safeCell.quality, lang))}${staleFlag ? ` ${staleFlag}` : ""}</span>
    </div>
  `;
}

function brokerNotesHtml(cell, lang = currentLanguage) {
  const text = textFor(lang);
  const separator = lang === "zh" ? "：" : ": ";
  const safeCell = cell || createEmptyCell();
  const bullets = lang === "en"
    ? EN_BROKER_BULLETS[safeCell.regionId] || []
    : splitNotes(safeCell.notes);
  const source = safeCell.sourceUrl
    ? `<a href="${escapeHtml(safeCell.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(localizeSourceName(safeCell.sourceName || text.sourcePrefix, lang))}</a>`
    : `<span>${escapeHtml(text.noSource)}</span>`;

  return `
    <div class="broker-notes">
      <div class="broker-notes-head">
        <span>${escapeHtml(text.brokerLabel)}</span>
        <strong>${escapeHtml(localizeDisplay(safeCell.display, lang))}</strong>
      </div>
      <ul>
        ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
      <div class="broker-source">${escapeHtml(text.sourcePrefix)}${separator}${source}</div>
    </div>
  `;
}

export function primaryCardToHtml(row, lang = currentLanguage) {
  const text = textFor(lang);
  const cells = row?.cells || {};
  const stockCollateralCell = { ...(cells.stock_collateral || createEmptyCell()), regionId: row.regionId };
  return `
    <article class="primary-card">
      <div class="primary-card-head">
        <h3>${escapeHtml(localizeRegion(row, lang))}</h3>
        <div class="primary-source">${sourceHtml(cells.policy_rate || createEmptyCell(), lang)}</div>
      </div>
      <div class="primary-metrics">
        ${cardMetricHtml(text.policyHeader, cells.policy_rate, lang)}
        ${cardMetricHtml(text.mortgageHeader, cells.mortgage, lang)}
        ${cardMetricHtml(text.creditHeader, cells.personal_credit, lang)}
      </div>
      ${brokerNotesHtml(stockCollateralCell, lang)}
    </article>
  `;
}

export function asiaItemToHtml(row, lang = currentLanguage) {
  const policyRate = row?.cells?.policy_rate || createEmptyCell();
  const staleClass = policyRate.stale ? " stale" : "";
  const tone = rateTone("policy_rate", policyRate);

  return `
    <a class="asia-pill${staleClass}" data-rate-tone="${escapeHtml(tone)}" href="${escapeHtml(policyRate.sourceUrl || "#")}" target="_blank" rel="noreferrer">
      <span>${escapeHtml(localizeRegion(row, lang))}</span>
      <strong class="rate-tone">${escapeHtml(localizeDisplay(policyRate.display, lang))}</strong>
    </a>
  `;
}

export function buildChartModel(history, lang = currentLanguage) {
  const points = Array.isArray(history)
    ? history.map((entry) => ({
        observedAt: entry.observedAt,
        shortLabel: formatChartDate(entry.observedAt, lang)
      }))
    : [];

  const series = CHART_SERIES.map((item) => ({
    ...item,
    label: lang === "en" ? (item.aliases.includes("us") ? "United States" : item.aliases.includes("tw") ? "Taiwan" : "Europe / Netherlands") : item.label,
    values: Array.isArray(history) ? history.map((entry) => historyValueForAliases(entry, item.aliases)) : []
  }));

  const finiteValues = series.flatMap((item) => item.values).filter((value) => Number.isFinite(value));

  return {
    points,
    series,
    minValue: finiteValues.length > 0 ? Math.min(...finiteValues) : null,
    maxValue: finiteValues.length > 0 ? Math.max(...finiteValues) : null
  };
}

export function buildChartSvg(model, lang = currentLanguage) {
  const text = textFor(lang);
  if (!model?.points?.length || !model?.series?.some((item) => item.values.some((value) => Number.isFinite(value)))) {
    return "";
  }

  const width = 760;
  const height = 320;
  const margin = { top: 54, right: 24, bottom: 58, left: 54 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const pointCount = model.points.length;
  const paddedMin = Math.floor(((model.minValue ?? 0) - 0.25) * 2) / 2;
  const paddedMax = Math.ceil(((model.maxValue ?? 0) + 0.25) * 2) / 2;
  const minValue = paddedMin === paddedMax ? paddedMin - 0.5 : paddedMin;
  const maxValue = paddedMin === paddedMax ? paddedMax + 0.5 : paddedMax;
  const xForIndex = (index) =>
    margin.left + (pointCount === 1 ? plotWidth / 2 : (plotWidth / Math.max(pointCount - 1, 1)) * index);
  const yForValue = (value) => margin.top + ((maxValue - value) / (maxValue - minValue || 1)) * plotHeight;
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = minValue + ((maxValue - minValue) / tickCount) * index;
    return { value, y: yForValue(value) };
  });

  const gridLines = yTicks
    .map(
      (tick) =>
        `<line x1="${margin.left}" y1="${tick.y.toFixed(1)}" x2="${width - margin.right}" y2="${tick.y.toFixed(
          1
        )}" class="chart-grid" />`
    )
    .join("");

  const yLabels = yTicks
    .map(
      (tick) =>
        `<text x="${margin.left - 10}" y="${(tick.y + 4).toFixed(1)}" text-anchor="end" class="chart-axis-label">${escapeHtml(
          formatPercent(tick.value)
        )}</text>`
    )
    .join("");

  const xLabels = model.points
    .map(
      (point, index) =>
        `<text x="${xForIndex(index).toFixed(1)}" y="${height - 18}" text-anchor="middle" class="chart-axis-label">${escapeHtml(
          point.shortLabel
        )}</text>`
    )
    .join("");

  const seriesLines = model.series
    .map((item) => {
      const path = buildSeriesPath(item.values, xForIndex, yForValue);
      if (!path) {
        return "";
      }

      const points = item.values
        .map((value, index) => {
          if (!Number.isFinite(value)) {
            return "";
          }

          return `<circle cx="${xForIndex(index).toFixed(1)}" cy="${yForValue(value).toFixed(1)}" r="3.5" fill="${item.color}" />`;
        })
        .join("");

      return `<path d="${path}" fill="none" stroke="${item.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />${points}`;
    })
    .join("");

  const legend = model.series
    .map((item, index) => {
      const x = margin.left + index * 190;
      return `
        <line x1="${x}" y1="24" x2="${x + 20}" y2="24" stroke="${item.color}" stroke-width="3" stroke-linecap="round" />
        <text x="${x + 28}" y="28" class="chart-legend-label">${escapeHtml(item.label)}</text>
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" class="trend-svg" role="img" aria-label="${escapeHtml(text.chartAria)}">
      <g>${gridLines}</g>
      <g>${yLabels}</g>
      <g>${xLabels}</g>
      <g>${seriesLines}</g>
      <g>${legend}</g>
    </svg>
  `;
}

export function buildDashboardViewModel({
  snapshot,
  snapshotError,
  cachedSnapshot,
  history,
  historyError,
  lang = currentLanguage
} = {}) {
  const text = textFor(lang);
  const hasLiveSnapshot = Boolean(snapshot);
  const hasCachedSnapshot = !hasLiveSnapshot && Boolean(cachedSnapshot);
  const effectiveSnapshot = hasLiveSnapshot ? snapshot : hasCachedSnapshot ? cachedSnapshot : null;
  const snapshotState = hasLiveSnapshot ? "live" : hasCachedSnapshot ? "stale" : "error";
  const primaryRows = cloneRows(effectiveSnapshot?.primaryRows, snapshotState === "stale");
  const europeRows = cloneRows(effectiveSnapshot?.europeRows, snapshotState === "stale");
  const asiaRows = cloneRows(effectiveSnapshot?.asiaRows, snapshotState === "stale");
  const chartModel = buildChartModel(history, lang);

  let statusMessage = text.loading;
  if (snapshotState === "live") {
    statusMessage = `${text.updatePrefix}: ${formatUpdatedAt(effectiveSnapshot.generatedAt, lang)}`;
    if (historyError) {
      statusMessage += `, ${text.trendPaused}`;
    }
  } else if (snapshotState === "stale") {
    statusMessage = `${text.stalePrefix}: ${formatUpdatedAt(effectiveSnapshot.generatedAt, lang)}`;
    if (historyError) {
      statusMessage += `, ${text.trendPaused}`;
    }
  } else if (snapshotError) {
    statusMessage = `${text.errorPrefix}: ${snapshotError.message}`;
  }

  let chart = {
    state: "unavailable",
    message: snapshotState === "error" ? text.chartLoadFirst : text.chartUnavailable,
    svg: ""
  };

  if (snapshotState !== "error" && !historyError) {
    if (chartModel.points.length > 0 && chartModel.series.some((item) => item.values.some((value) => Number.isFinite(value)))) {
      chart = {
        state: "ready",
        message: "",
        svg: buildChartSvg(chartModel, lang)
      };
    } else {
      chart = {
        state: "unavailable",
        message: text.chartNoHistory,
        svg: ""
      };
    }
  } else if (snapshotState !== "error" && historyError) {
    chart = {
      state: "unavailable",
      message: text.chartTablesStillAvailable,
      svg: ""
    };
  }

  return {
    snapshotState,
    statusMessage,
    primaryCards: primaryRows,
    europeSummary: europeRows,
    asiaSummary: asiaRows,
    primaryRows,
    europeRows,
    asiaRows,
    chart
  };
}

function renderPrimaryCards(rows, lang = currentLanguage) {
  const target = document.getElementById("primaryCards");
  if (!target) return;
  target.innerHTML = rows.map((row) => primaryCardToHtml(row, lang)).join("");
}

function renderAsiaSummary(rows, lang = currentLanguage) {
  const target = document.getElementById("asiaSummary");
  if (!target) return;
  target.innerHTML = rows.map((row) => asiaItemToHtml(row, lang)).join("");
}

function renderEuropeSummary(rows, lang = currentLanguage) {
  const target = document.getElementById("europeSummary");
  if (!target) return;
  target.innerHTML = rows.map((row) => asiaItemToHtml(row, lang)).join("");
}

function renderRows(elementId, rows, lang = currentLanguage) {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.innerHTML = rows.map((row) => rowToHtml(row, lang)).join("");
}

function renderChart(chartView, lang = currentLanguage) {
  const text = textFor(lang);
  const chart = document.getElementById("trendChart");
  if (!chart) return;

  if (!chartView || chartView.state !== "ready" || !chartView.svg) {
    chart.innerHTML = `<div class="chart-empty">${escapeHtml(chartView?.message || text.chartUnavailable)}</div>`;
    return;
  }

  chart.innerHTML = `
    <div class="chart-caption">${escapeHtml(text.chartCaption)}</div>
    ${chartView.svg}
  `;
}

function applyStaticText(lang = currentLanguage) {
  const text = textFor(lang);
  if (typeof document === "undefined") return;

  document.documentElement.lang = text.htmlLang;
  document.title = text.title;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (key && text[key]) {
      node.textContent = text[key];
    }
  });
  document.querySelectorAll(".language-option").forEach((button) => {
    const isActive = button.getAttribute("data-lang") === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderDashboard(viewModel, lang = currentLanguage) {
  applyStaticText(lang);
  renderPrimaryCards(viewModel.primaryCards || [], lang);
  renderEuropeSummary(viewModel.europeSummary || [], lang);
  renderAsiaSummary(viewModel.asiaSummary || [], lang);
  renderRows("primaryRows", viewModel.primaryRows || [], lang);
  renderRows("asiaRows", viewModel.asiaRows || [], lang);
  renderChart(viewModel.chart, lang);

  const statusBar = document.getElementById("statusBar");
  if (statusBar) {
    statusBar.textContent = viewModel.statusMessage;
  }
}

function getStorage() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage;
}

function readLanguage(storage = getStorage()) {
  if (!storage) return "zh";
  const saved = storage.getItem(LANG_CACHE_KEY);
  return saved === "en" ? "en" : "zh";
}

function writeLanguage(lang, storage = getStorage()) {
  if (!storage) return;
  try {
    storage.setItem(LANG_CACHE_KEY, lang === "en" ? "en" : "zh");
  } catch {
    // Ignore storage write errors so the toggle still works for this session.
  }
}

function syncDetailDisclosureForViewport() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const shouldCollapse = window.matchMedia("(max-width: 720px)").matches;
  document.querySelectorAll(".collapsible-detail").forEach((detail) => {
    detail.open = !shouldCollapse;
  });
}

function readCachedSnapshot(storage) {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(SNAPSHOT_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedSnapshot(snapshot, storage) {
  if (!storage || !snapshot) {
    return;
  }

  try {
    storage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage write errors so the dashboard can still render.
  }
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    const fileName = path.split("/").at(-1) || path;
    throw new Error(`${fileName} ${response.status}`);
  }

  return response.json();
}

async function loadSnapshotResource(storage = getStorage()) {
  try {
    const snapshot = await fetchJson("./data/rates.json");
    writeCachedSnapshot(snapshot, storage);
    return { snapshot };
  } catch (snapshotError) {
    return {
      snapshot: null,
      snapshotError,
      cachedSnapshot: readCachedSnapshot(storage)
    };
  }
}

async function loadHistoryResource() {
  try {
    return { history: await fetchJson("./data/history.json") };
  } catch (historyError) {
    return { history: null, historyError };
  }
}

async function loadDashboard() {
  const storage = getStorage();
  currentLanguage = readLanguage(storage);
  applyStaticText(currentLanguage);
  const [snapshotResult, historyResult] = await Promise.all([
    loadSnapshotResource(storage),
    loadHistoryResource()
  ]);

  const viewModel = buildDashboardViewModel({
    ...snapshotResult,
    ...historyResult,
    lang: currentLanguage
  });

  renderDashboard(viewModel, currentLanguage);
  return { viewModel, snapshotResult, historyResult };
}

if (typeof document !== "undefined") {
  let currentViewModel = null;
  let currentInputs = null;
  const refreshButton = document.getElementById("refreshButton");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      window.location.reload();
    });
  }

  document.querySelectorAll(".language-option").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLanguage = button.getAttribute("data-lang") === "en" ? "en" : "zh";
      currentLanguage = nextLanguage;
      writeLanguage(nextLanguage);
      if (currentInputs) {
        currentViewModel = buildDashboardViewModel({
          ...currentInputs.snapshotResult,
          ...currentInputs.historyResult,
          lang: nextLanguage
        });
        renderDashboard(currentViewModel, nextLanguage);
      } else {
        applyStaticText(nextLanguage);
      }
    });
  });

  syncDetailDisclosureForViewport();

  loadDashboard().then(({ viewModel, snapshotResult, historyResult }) => {
    currentViewModel = viewModel;
    currentInputs = { snapshotResult, historyResult };
  }).catch((error) => {
    const statusBar = document.getElementById("statusBar");
    if (statusBar) {
      statusBar.textContent = `${textFor(currentLanguage).errorPrefix}: ${error.message}`;
    }
  });
}
