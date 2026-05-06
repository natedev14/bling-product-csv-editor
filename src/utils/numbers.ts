export function parseBrazilianNumber(value: string | undefined) {
  if (!value) return 0;
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isZeroBrazilianNumber(value: string | undefined) {
  return parseBrazilianNumber(value) === 0;
}
