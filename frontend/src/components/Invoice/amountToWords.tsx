import { toWords } from "number-to-words";

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
export default function amountToWords(
  amount: number,
  currency: string
): string {
  if (currency === "USD") {
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
  } else {
    const pounds = Math.round(amount);
    const poundWords = toWords(pounds);
    const poundLabel = pounds === 1 ? "Lebanese Pound" : "Lebanese Pounds";
    const raw = `${poundWords} ${poundLabel}`;
    return titleCase(raw);
  }
}
