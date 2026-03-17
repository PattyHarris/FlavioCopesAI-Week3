export function formatCurrencyFromCents(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

export function dollarsToCents(value) {
  const normalized = String(value || "").replace(/[^0-9.]/g, "");
  if (!normalized) {
    return 0;
  }

  const [wholePart, decimalPart = ""] = normalized.split(".");
  const whole = Number.parseInt(wholePart || "0", 10);
  const cents = Number.parseInt((decimalPart + "00").slice(0, 2), 10);

  return whole * 100 + cents;
}

export function centsToInputValue(cents) {
  return ((cents || 0) / 100).toFixed(2);
}
