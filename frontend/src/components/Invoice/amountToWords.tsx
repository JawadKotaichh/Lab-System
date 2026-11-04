import { toWords } from "number-to-words";

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
export default function amountToWords(
  amount: number,
  currency: string
): string {
  const prefix = amount < 0 ? "Minus " : "";
  if (currency === "USD") {
    const units = Math.abs(displayMoneyUnits(amount, currency));
    const dollars = Math.floor(units / 100);
    const cents = units % 100;

    const dollarWords = toWords(dollars);
    const centWords = cents > 0 ? toWords(cents) : "";

    const dollarLabel = dollars === 1 ? "Dollar" : "Dollars";
    const centLabel = cents === 1 ? "Cent" : "Cents";

    const raw =
      cents > 0
        ? `${dollarWords} ${dollarLabel} and ${centWords} ${centLabel}`
        : `${dollarWords} ${dollarLabel}`;

    return prefix + titleCase(raw);
  } else {
    const pounds = Math.abs(displayMoneyUnits(amount, currency));
    const poundWords = toWords(pounds);
    const poundLabel = pounds === 1 ? "Lebanese Pound" : "Lebanese Pounds";
    const raw = `${poundWords} ${poundLabel}`;
    return prefix + titleCase(raw);
  }
}

export function displayMoneyUnits(amount: number, currency: string): number {
  const scaled = Math.abs(amount) * (currency === "USD" ? 100 : 1);
  return Math.sign(amount) * Math.round(scaled + Math.min(1e-8, Number.EPSILON * scaled));
}
