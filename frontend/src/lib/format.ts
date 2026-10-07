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
  if (Number.isNaN(number)) return "Rs 0";
  return `Rs ${number.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}