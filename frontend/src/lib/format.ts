export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMoney(value: string | number): string {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) ? `Rs ${number}` : `Rs ${number.toFixed(2)}`;
}