export function requireNumbers(raw: string[]): number[] {
  return raw.map((token) => {
    const n = Number(token);
    if (!Number.isFinite(n)) {
      throw new Error(`error: invalid number: ${token}`);
    }
    return n;
  });
}

export function numAttr(
  raw: string | undefined,
  fallback: number,
): number {
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
