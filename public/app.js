const PRODUCT_ORDER = ["policy_rate", "mortgage", "personal_credit", "stock_collateral"];
const SNAPSHOT_CACHE_KEY = "interest-rate-dashboard.snapshot";
const CHART_SERIES = [
  { label: "美國", aliases: ["us"], color: "#0f5f8f" },
  { label: "歐洲 / 荷蘭", aliases: ["euro_nl", "euro"], color: "#2f6f65" },
  { label: "台灣", aliases: ["tw"], color: "#8a4f7d" }
];

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

function formatChartDate(isoString) {
  const date = new Date(isoString);
  if (!isValidDate(date)) {
    return "無日期";
  }

  return new Intl.DateTimeFormat("zh-TW", {
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

export function formatUpdatedAt(isoString) {
  if (!isoString) return "無時間戳";

  const date = new Date(isoString);
  if (!isValidDate(date)) {
    return "無時間戳";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function qualityLabel(quality) {
  const labels = {
    official: "官方",
    market: "市場",
    broker: "券商",
    manual: "手動",
    unavailable: "無資料"
  };

  return labels[quality] || "無資料";
}

function sourceHtml(cell) {
  if (!cell.sourceUrl) {
    return '<span class="cell-meta">無來源</span>';
  }

  const sourceName = escapeHtml(cell.sourceName || "Source");
  const sourceUrl = escapeHtml(cell.sourceUrl);
  return `<a class="cell-meta" href="${sourceUrl}" target="_blank" rel="noreferrer">來源：${sourceName}</a>`;
}

function noteHtml(cell) {
  if (!cell.notes) {
    return "";
  }

  return `<div class="cell-meta note">${escapeHtml(cell.notes)}</div>`;
}

function cellToHtml(cell) {
  const staleFlag = cell.stale ? '<span class="stale-flag">沿用上次</span>' : "";

  return `
    <td class="${cell.stale ? "stale" : ""}">
      <div class="cell-stack">
        <div class="rate-value">${escapeHtml(cell.display)}</div>
        <div class="quality-line">
          <span class="quality">${escapeHtml(qualityLabel(cell.quality))}</span>
          ${staleFlag}
        </div>
        ${sourceHtml(cell)}
        <div class="cell-meta">更新：${escapeHtml(formatUpdatedAt(cell.fetchedAt))}</div>
        ${noteHtml(cell)}
      </div>
    </td>
  `;
}

export function rowToHtml(row) {
  return `
    <tr>
      <th scope="row">${escapeHtml(row.label)}</th>
      ${PRODUCT_ORDER.map((productId) => cellToHtml(row.cells[productId] || createEmptyCell())).join("")}
    </tr>
  `;
}

function cardMetricHtml(label, cell) {
  const safeCell = cell || createEmptyCell();
  const staleFlag = safeCell.stale ? '<span class="stale-flag">沿用上次</span>' : "";

  return `
    <div class="card-metric">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(safeCell.display)}</strong>
      <span class="metric-meta">${escapeHtml(qualityLabel(safeCell.quality))}${staleFlag ? ` ${staleFlag}` : ""}</span>
    </div>
  `;
}

function brokerNotesHtml(cell) {
  const safeCell = cell || createEmptyCell();
  const bullets = splitNotes(safeCell.notes);
  const source = safeCell.sourceUrl
    ? `<a href="${escapeHtml(safeCell.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(safeCell.sourceName || "來源")}</a>`
    : '<span>無來源</span>';

  return `
    <div class="broker-notes">
      <div class="broker-notes-head">
        <span>股票質押 / 券商</span>
        <strong>${escapeHtml(safeCell.display)}</strong>
      </div>
      <ul>
        ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
      <div class="broker-source">來源：${source}</div>
    </div>
  `;
}

export function primaryCardToHtml(row) {
  const cells = row?.cells || {};
  return `
    <article class="primary-card">
      <div class="primary-card-head">
        <h3>${escapeHtml(row.label)}</h3>
        <div class="primary-source">${sourceHtml(cells.policy_rate || createEmptyCell())}</div>
      </div>
      <div class="primary-metrics">
        ${cardMetricHtml("政策利率", cells.policy_rate)}
        ${cardMetricHtml("房貸", cells.mortgage)}
        ${cardMetricHtml("信貸", cells.personal_credit)}
      </div>
      ${brokerNotesHtml(cells.stock_collateral)}
    </article>
  `;
}

export function asiaItemToHtml(row) {
  const policyRate = row?.cells?.policy_rate || createEmptyCell();
  const staleClass = policyRate.stale ? " stale" : "";

  return `
    <a class="asia-pill${staleClass}" href="${escapeHtml(policyRate.sourceUrl || "#")}" target="_blank" rel="noreferrer">
      <span>${escapeHtml(row.shortLabel || row.label)}</span>
      <strong>${escapeHtml(policyRate.display)}</strong>
    </a>
  `;
}

export function buildChartModel(history) {
  const points = Array.isArray(history)
    ? history.map((entry) => ({
        observedAt: entry.observedAt,
        shortLabel: formatChartDate(entry.observedAt)
      }))
    : [];

  const series = CHART_SERIES.map((item) => ({
    ...item,
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

export function buildChartSvg(model) {
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
    <svg viewBox="0 0 ${width} ${height}" class="trend-svg" role="img" aria-label="美國、歐洲 / 荷蘭、台灣政策利率趨勢">
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
  historyError
} = {}) {
  const hasLiveSnapshot = Boolean(snapshot);
  const hasCachedSnapshot = !hasLiveSnapshot && Boolean(cachedSnapshot);
  const effectiveSnapshot = hasLiveSnapshot ? snapshot : hasCachedSnapshot ? cachedSnapshot : null;
  const snapshotState = hasLiveSnapshot ? "live" : hasCachedSnapshot ? "stale" : "error";
  const primaryRows = cloneRows(effectiveSnapshot?.primaryRows, snapshotState === "stale");
  const europeRows = cloneRows(effectiveSnapshot?.europeRows, snapshotState === "stale");
  const asiaRows = cloneRows(effectiveSnapshot?.asiaRows, snapshotState === "stale");
  const chartModel = buildChartModel(history);

  let statusMessage = "讀取利率資料中...";
  if (snapshotState === "live") {
    statusMessage = `更新：${formatUpdatedAt(effectiveSnapshot.generatedAt)}`;
    if (historyError) {
      statusMessage += "，趨勢暫停";
    }
  } else if (snapshotState === "stale") {
    statusMessage = `沿用：${formatUpdatedAt(effectiveSnapshot.generatedAt)}`;
    if (historyError) {
      statusMessage += "，趨勢暫停";
    }
  } else if (snapshotError) {
    statusMessage = `無法讀取 dashboard 資料：${snapshotError.message}`;
  }

  let chart = {
    state: "unavailable",
    message: snapshotState === "error" ? "利率資料載入後才會顯示趨勢圖。" : "趨勢圖暫時無法讀取。",
    svg: ""
  };

  if (snapshotState !== "error" && !historyError) {
    if (chartModel.points.length > 0 && chartModel.series.some((item) => item.values.some((value) => Number.isFinite(value)))) {
      chart = {
        state: "ready",
        message: "",
        svg: buildChartSvg(chartModel)
      };
    } else {
      chart = {
        state: "unavailable",
        message: "目前還沒有足夠歷史資料可顯示趨勢圖。",
        svg: ""
      };
    }
  } else if (snapshotState !== "error" && historyError) {
    chart = {
      state: "unavailable",
      message: "趨勢圖暫時無法讀取，利率表與來源連結仍可使用。",
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

function renderPrimaryCards(rows) {
  const target = document.getElementById("primaryCards");
  if (!target) return;
  target.innerHTML = rows.map((row) => primaryCardToHtml(row)).join("");
}

function renderAsiaSummary(rows) {
  const target = document.getElementById("asiaSummary");
  if (!target) return;
  target.innerHTML = rows.map((row) => asiaItemToHtml(row)).join("");
}

function renderEuropeSummary(rows) {
  const target = document.getElementById("europeSummary");
  if (!target) return;
  target.innerHTML = rows.map((row) => asiaItemToHtml(row)).join("");
}

function renderRows(elementId, rows) {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.innerHTML = rows.map((row) => rowToHtml(row)).join("");
}

function renderChart(chartView) {
  const chart = document.getElementById("trendChart");
  if (!chart) return;

  if (!chartView || chartView.state !== "ready" || !chartView.svg) {
    chart.innerHTML = `<div class="chart-empty">${escapeHtml(chartView?.message || "趨勢圖暫時無法讀取。")}</div>`;
    return;
  }

  chart.innerHTML = `
    <div class="chart-caption">依每日保存紀錄顯示政策利率趨勢。</div>
    ${chartView.svg}
  `;
}

function renderDashboard(viewModel) {
  renderPrimaryCards(viewModel.primaryCards || []);
  renderEuropeSummary(viewModel.europeSummary || []);
  renderAsiaSummary(viewModel.asiaSummary || []);
  renderRows("primaryRows", viewModel.primaryRows || []);
  renderRows("asiaRows", viewModel.asiaRows || []);
  renderChart(viewModel.chart);

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
  const [snapshotResult, historyResult] = await Promise.all([
    loadSnapshotResource(storage),
    loadHistoryResource()
  ]);

  const viewModel = buildDashboardViewModel({
    ...snapshotResult,
    ...historyResult
  });

  renderDashboard(viewModel);
}

if (typeof document !== "undefined") {
  const refreshButton = document.getElementById("refreshButton");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      window.location.reload();
    });
  }

  loadDashboard().catch((error) => {
    const statusBar = document.getElementById("statusBar");
    if (statusBar) {
      statusBar.textContent = `無法讀取 dashboard 資料：${error.message}`;
    }
  });
}
