import { useId, useState } from "react";

type Rule = { name: string; label: string; error: string | null };
export const required = (value: unknown, label: string): string | null =>
  String(value ?? "").trim() ? null : `${label} is required.`;
export const numberError = (value: unknown, label: string, positive = false, integer = false): string | null => {
  if (required(value, label)) return `${label} is required.`;
  const number = Number(value);
  if (!Number.isFinite(number) || (positive ? number <= 0 : number < 0) || (integer && !Number.isInteger(number))) {
    return `${label} must be a ${positive ? "positive" : "non-negative"} ${integer ? "whole number" : "number"}.`;
  }
  return null;
};
export const dateError = (value: unknown, label: string): string | null => {
  if (required(value, label)) return `${label} is required.`;
  const text = value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : String(value);
  const parsed = new Date(`${text}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text
    ? null : `Enter a valid ${label.toLowerCase()}.`;
};
export const moneyError = (value: string, label: string, signed = false): string | null => {
  if (!value.trim()) return `${label} is required.`;
  if (!/^-?\d+(?:\.\d{1,3})?$/.test(value) || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 1e12 || (!signed && Number(value) < 0)) {
    return `${label} must be ${signed ? "a number" : "a non-negative number"} with up to three decimal places.`;
  }
  return null;
};

export function useFormValidation(rules: Rule[], revealField?: (name: string) => void) {
  const prefix = useId();
  const [submitted, setSubmitted] = useState(false);
  const errors = rules.filter(rule => rule.error);
  const id = (name: string) => `${prefix}-${name}`;
  const error = (name: string) => submitted ? rules.find(rule => rule.name === name)?.error ?? null : null;
  const focus = (name: string) => {
    revealField?.(name);
    // Wait for validation messages and any paginated input to render before focusing.
    window.requestAnimationFrame(() => document.getElementById(id(name))?.focus());
  };
  return {
    errors: submitted ? errors : [],
    error,
    field: (name: string) => ({ id: id(name), "aria-invalid": Boolean(error(name)), "aria-describedby": error(name) ? `${id(name)}-error` : undefined }),
    id,
    focus,
    validate: () => {
      setSubmitted(true);
      if (errors.length) focus(errors[0].name);
      return errors.length === 0;
    },
  };
}
export type FormValidation = ReturnType<typeof useFormValidation>;
type Validation = FormValidation;

export function ValidationSummary({ validation }: { validation: Validation }) {
  if (!validation.errors.length) return null;
  return <div role="alert" className="my-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
    <p className="font-semibold">Please fix the following fields:</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">{validation.errors.map(rule => <li key={rule.name}>
      <button type="button" className="cursor-pointer text-left underline" onClick={() => validation.focus(rule.name)}>{rule.error}</button>
    </li>)}</ul>
  </div>;
}
export function FieldError({ validation, name }: { validation: Validation; name: string }) {
  const message = validation.error(name);
  return message ? <p id={`${validation.id(name)}-error`} className="mt-1 text-sm text-red-700">{message}</p> : null;
}
