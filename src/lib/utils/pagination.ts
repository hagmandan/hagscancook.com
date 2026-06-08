export function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  return Number.isNaN(n) || n < 1 ? 1 : n
}
