import {
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

const parseRange = (v: string): { low: number; high: number } | null => {
  const m = v.match(/^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)(?:\s*.*)?$/);
  if (!m) return null;
  return { low: Number(m[1]), high: Number(m[2]) };
};

const toNum = (v: string | number): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const normalizeGender = (g: string) => {
  const x = normText(g);
  if (x === "male") return "male";
  if (x === "female") return "female";
  return null;
};

function analyseNonGender(nv: NV, result: string | number): boolean {
  if (typeof result === "string") {
    const r = parseRange(result);
    if (r) {
      if (isUAndL(nv))
        return r.low >= nv.lower_bound_value && r.high <= nv.upper_bound_value;
      if (isUpperOnly(nv))
        return r.high < nv.upper_bound_value && r.low < nv.upper_bound_value;
      if (isLowerOnly(nv))
        return r.low > nv.lower_bound_value && r.high > nv.lower_bound_value;
      return normText(nv.description) === normText(result);
    }
  }
  if (isUAndL(nv)) {
    const n = toNum(result);
    if (n === null) return false;
    return n >= nv.lower_bound_value && n <= nv.upper_bound_value;
  }

  if (isUpperOnly(nv)) {
    const n = toNum(result);
    if (n === null) return false;
    return n < nv.upper_bound_value;
  }

  if (isLowerOnly(nv)) {
    const n = toNum(result);
    if (n === null) return false;
    return n > nv.lower_bound_value;
  }

  if (isPosNeg(nv)) {
    const expected = normText(nv.normal_value);
    const got = normText(result);

    if (!expected) return false;
    if (expected === "positive") return got !== "negative";
    if (expected === "negative") return got === "negative";
    return got === expected;
  }

  return normText(nv.description) === normText(result);
}

export default function AnalyseResult(
  nv: NV,
  result: string | number,
  gender: string
): boolean {
  if (isByGender(nv)) {
    const g = normalizeGender(gender);
    if (!g) return false;
    const picked =
      g === "male" ? nv.male_normal_value_type : nv.female_normal_value_type;
    return analyseNonGender(picked as unknown as NV, result);
  }

  return analyseNonGender(nv, result);
}

// export default function AnalyseResult(
//   nv: NV,
//   result: string | number,
//   gender: string
// ): boolean {
//   const m = String(result).match(
//     /^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)$/
//   );
//   if (m) {
//     const low = Number(m[1]);
//     const high = Number(m[2]);
//     if (isUAndL(nv)) {
//       return low >= nv.lower_bound_value && high <= nv.upper_bound_value;
//     } else if (isUpperOnly(nv)) {
//       return low <= nv.upper_bound_value && high <= nv.upper_bound_value;
//     } else if (isLowerOnly(nv)) {
//       return low >= nv.lower_bound_value && high >= nv.lower_bound_value;
//     } else if (isByGender(nv)) {
//       const g = normText(gender);
//       const picked =
//         g === "male"
//           ? nv.male_normal_value_type
//           : g === "female"
//           ? nv.female_normal_value_type
//           : null;
//     } else {
//       return normText(nv.description) === normText(result);
//     }
//   }
//   const normalValueType = guessNVType(nv);

//   switch (normalValueType) {
//     case "upper_and_lower_bound_only":
//       if (!isUAndL(nv)) return false;
//       return (
//         Number(nv.lower_bound_value) <= Number(result) &&
//         Number(nv.upper_bound_value) >= Number(result)
//       );
//     case "upper_bound_only":
//       if (!isUpperOnly(nv)) return false;
//       return Number(result) < Number(nv.upper_bound_value);

//     case "lower_bound_only":
//       if (!isLowerOnly(nv)) return false;
//       return Number(result) > Number(nv.lower_bound_value);

//     case "positive_or_negative":
//       if (!isPosNeg(nv)) return false;
//       return normText(nv.normal_value) === normText(result);

//     case "normal_value_by_gender": {
//       if (!isByGender(nv)) return false;

//       const g = normText(gender);
//       const picked =
//         g === "male"
//           ? nv.male_normal_value_type
//           : g === "female"
//           ? nv.female_normal_value_type
//           : null;

//       if (!picked) return false;
//       return normText(picked) === normText(result);
//     }
//     case "description_only":
//     default:
//       if (!("description" in nv)) return false;
//       return normText(nv.description) === normText(result);
//   }
// }
