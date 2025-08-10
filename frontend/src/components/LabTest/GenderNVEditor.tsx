import { useMemo } from "react";
import type {
  GenderNV,
  GenderType,
  upper_and_lower_bound_only,
  upper_bound_only,
} from "../types";
import createEmptyNormalValues from "./createEmptyNV";

const GenderNVEditor: React.FC<{
  value: GenderNV;
  onChange: (v: GenderNV) => void;
}> = ({ value, onChange }) => {
  const t: GenderType = useMemo<GenderType>(() => {
    if ("lower_bound_value" in value && "upper_bound_value" in value)
      return "upper_and_lower_bound_only";
    if ("upper_bound_value" in value && !("lower_bound_value" in value))
      return "upper_bound_only";
    if ("lower_bound_value" in value && !("upper_bound_value" in value))
      return "lower_bound_only";
    return "positive_or_negative";
  }, [value]);

  const swap = (nextType: GenderType) =>
    onChange(createEmptyNormalValues(nextType) as GenderNV);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm w-28">Type</label>
        <select
          className="border rounded px-2 py-1"
          value={t}
          onChange={(e) => swap(e.target.value as GenderType)}
        >
          <option value="upper_and_lower_bound_only">
            Upper & Lower Bound
          </option>
          <option value="upper_bound_only">Upper Bound Only</option>
          <option value="lower_bound_only">Lower Bound Only</option>
          <option value="positive_or_negative">Positive / Negative</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm w-28">Description</label>
        <input
          className="flex-1 border rounded px-2 py-1"
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="(optional)"
        />
      </div>

      {"lower_bound_value" in value && (
        <div className="flex items-center gap-2">
          <label className="text-sm w-28">Lower bound</label>
          <input
            type="number"
            className="flex-1 border rounded px-2 py-1"
            value={value.lower_bound_value}
            onChange={(e) =>
              onChange({ ...value, lower_bound_value: Number(e.target.value) })
            }
          />
        </div>
      )}

      {"upper_bound_value" in value && (
        <div className="flex items-center gap-2">
          <label className="text-sm w-28">Upper bound</label>
          <input
            type="number"
            className="flex-1 border rounded px-2 py-1"
            value={
              (value as upper_bound_only | upper_and_lower_bound_only)
                .upper_bound_value
            }
            onChange={(e) =>
              onChange({
                ...(value as upper_bound_only | upper_and_lower_bound_only),
                upper_bound_value: Number(e.target.value),
              })
            }
          />
        </div>
      )}

      {"normal_value" in value && (
        <div className="flex items-center gap-2">
          <label className="text-sm w-28">Normal value</label>
          <select
            className="border rounded px-2 py-1"
            value={value.normal_value}
            onChange={(e) =>
              onChange({ ...value, normal_value: e.target.value })
            }
          >
            <option value="">— choose —</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default GenderNVEditor;
