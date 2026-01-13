import {
  guessNVType,
  isByGender,
  isLowerOnly,
  isPosNeg,
  isUAndL,
  isUpperOnly,
} from "../LabTest/guessNormalValueType";
import type { NV } from "../types";

const normText = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

export default function AnalyseResult(
  nv: NV,
  result: string | number,
  gender: string
): boolean {
  const normalValueType = guessNVType(nv);

  switch (normalValueType) {
    case "upper_and_lower_bound_only":
      if (!isUAndL(nv)) return false;
      return (
        Number(nv.lower_bound_value) <= Number(result) &&
        Number(nv.upper_bound_value) >= Number(result)
      );
    case "upper_bound_only":
      if (!isUpperOnly(nv)) return false;
      return Number(result) < Number(nv.upper_bound_value);

    case "lower_bound_only":
      if (!isLowerOnly(nv)) return false;
      return Number(result) > Number(nv.lower_bound_value);

    case "positive_or_negative":
      if (!isPosNeg(nv)) return false;
      return normText(nv.normal_value) === normText(result);

    case "normal_value_by_gender": {
      if (!isByGender(nv)) return false;

      const g = normText(gender);
      const picked =
        g === "male"
          ? nv.male_normal_value_type
          : g === "female"
          ? nv.female_normal_value_type
          : null;

      if (!picked) return false;
      return normText(picked) === normText(result);
    }
    case "description_only":
    default:
      if (!("description" in nv)) return false;
      return normText(nv.description) === normText(result);
  }
}
