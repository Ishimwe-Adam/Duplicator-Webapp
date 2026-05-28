export function formatFRW(amount: number): string {
  return `FRW ${amount.toLocaleString("en-RW")}`;
}

export function formatFRWRange(min: number, max: number): string {
  return `FRW ${min.toLocaleString("en-RW")} – ${max.toLocaleString("en-RW")}`;
}
