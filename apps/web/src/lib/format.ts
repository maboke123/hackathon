// English month names to match the interface, Belgian notation for amounts.
const dateLocale = "en-BE";
const numberLocale = "nl-BE";

const currencyFormat = new Intl.NumberFormat(numberLocale, {
  style: "currency",
  currency: "EUR",
});
const numberFormat = new Intl.NumberFormat(numberLocale, {
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat(dateLocale, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const periodFormat = new Intl.DateTimeFormat(dateLocale, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: number): string {
  return currencyFormat.format(value);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatPeriod(period: string): string {
  return periodFormat.format(new Date(`${period}-01T00:00:00Z`));
}

export function formatDays(days: number): string {
  return `${formatNumber(days)} ${days === 1 ? "day" : "days"}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
