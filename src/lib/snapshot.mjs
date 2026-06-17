import { REGIONS } from "../data/regions.mjs";
import { PRODUCTS } from "../data/products.mjs";
import { normalizeRate } from "./normalize.mjs";

function unavailableCell(product) {
  return {
    productId: product.id,
    label: product.label,
    display: "無資料",
    numericValue: null,
    quality: "unavailable",
    sourceName: "",
    sourceUrl: "",
    fetchedAt: "",
    stale: false,
    notes: "尚未設定可靠公開數值。"
  };
}

function findPreviousCell(previousSnapshot, regionId, productId) {
  if (!previousSnapshot) {
    return null;
  }

  const rows = [...(previousSnapshot.primaryRows || []), ...(previousSnapshot.asiaRows || [])];
  const row = rows.find((candidate) => candidate.regionId === regionId);
  return row?.cells?.[productId] || null;
}

function staleCellFromPrevious(previousCell) {
  return {
    ...previousCell,
    stale: true,
    notes: "最新抓取失敗，顯示上次成功資料。"
  };
}

function buildValueCell({ product, source, fallbackCell, fetchedAt, defaultQuality }) {
  if (!source) {
    return fallbackCell ? staleCellFromPrevious(fallbackCell) : unavailableCell(product);
  }

  const normalized = normalizeRate(source.value);

  return {
    productId: product.id,
    label: product.label,
    display: normalized.display,
    numericValue: normalized.numericValue,
    quality: source.quality || defaultQuality,
    sourceName: source.sourceName || "",
    sourceUrl: source.sourceUrl || "",
    fetchedAt,
    stale: false,
    notes: source.notes || ""
  };
}

function buildRow({ region, policyRates, manualRates, previousSnapshot }) {
  const cells = {};

  for (const product of PRODUCTS) {
    if (product.kind === "policy") {
      const source = policyRates?.rates?.[region.policyRateKey];
      const previousCell = findPreviousCell(previousSnapshot, region.id, product.id);
      cells[product.id] = buildValueCell({
        product,
        source,
        fallbackCell: previousCell,
        fetchedAt: policyRates?.asOf || "",
        defaultQuality: "official"
      });
      continue;
    }

    const source = manualRates?.[region.id]?.[product.id];
    const previousCell = findPreviousCell(previousSnapshot, region.id, product.id);
    cells[product.id] = buildValueCell({
      product,
      source,
      fallbackCell: previousCell,
      fetchedAt: source?.fetchedAt || "",
      defaultQuality: "manual"
    });
  }

  return {
    regionId: region.id,
    label: region.label,
    shortLabel: region.shortLabel,
    group: region.group,
    cells
  };
}

export function buildSnapshot({ policyRates, manualRates, now, previousSnapshot }) {
  const rows = REGIONS.map((region) =>
    buildRow({ region, policyRates, manualRates, previousSnapshot })
  );

  return {
    generatedAt: now,
    productLabels: Object.fromEntries(PRODUCTS.map((product) => [product.id, product.label])),
    primaryRows: rows.filter((row) => row.group === "primary"),
    europeRows: rows.filter((row) => row.group === "europe"),
    asiaRows: rows.filter((row) => row.group === "asia")
  };
}
