import { useEffect, useState } from "react";

const formatNumber = (value: number) =>
  Number.isFinite(value) ? String(value) : "";

const parseFraction = (raw: string): number | null => {
  const text = raw.trim();
  if (!text) return null;

  const match = text.match(
    /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/
  );
  if (match) {
    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return null;
    }
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

const FractionInput: React.FC<{
  value: number;
  onChange: (next: number) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder }) => {
  const [draft, setDraft] = useState<string>(formatNumber(value));

  useEffect(() => {
    setDraft(formatNumber(value));
  }, [value]);

  const commit = () => {
    const parsed = parseFraction(draft);
    if (parsed === null) {
      setDraft(formatNumber(value));
      return;
    }
    onChange(parsed);
    setDraft(formatNumber(parsed));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
};

export default FractionInput;
