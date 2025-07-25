import { toWords } from "number-to-words";

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
export default function amountToWords(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  const dollarWords = toWords(dollars);
  const centWords = cents > 0 ? toWords(cents) : "";

  const dollarLabel = dollars === 1 ? "Dollar" : "Dollars";
  const centLabel = cents === 1 ? "Cent" : "Cents";

  const raw =
    cents > 0
      ? `${dollarWords} ${dollarLabel} and ${centWords} ${centLabel}`
      : `${dollarWords} ${dollarLabel}`;

  return titleCase(raw);
}
