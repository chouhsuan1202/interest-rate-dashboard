export function normalizeRate(input) {
  if (input === null || input === undefined) {
    return { display: "無資料", numericValue: null, unit: "%", isRange: false };
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    return { display: `${input.toFixed(2)}%`, numericValue: input, unit: "%", isRange: false };
  }

  if (typeof input === "string" && input.trim()) {
    return { display: input.trim(), numericValue: null, unit: "", isRange: false };
  }

  if (
    typeof input === "object" &&
    input !== null &&
    typeof input.min === "number" &&
    typeof input.max === "number" &&
    Number.isFinite(input.min) &&
    Number.isFinite(input.max)
  ) {
    return {
      display: `${input.min.toFixed(2)}-${input.max.toFixed(2)}%`,
      numericValue: null,
      unit: "%",
      isRange: true
    };
  }

  return { display: "無資料", numericValue: null, unit: "%", isRange: false };
}
