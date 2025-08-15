import type {
  lower_bound_only,
  normal_value_by_gender,
  NV,
  NVType,
  positive_or_negative,
  upper_and_lower_bound_only,
  upper_bound_only,
} from "../types";

export const isUAndL = (v: NV): v is upper_and_lower_bound_only =>
  "lower_bound_value" in v &&
  "upper_bound_value" in v &&
  !("male_normal_value_type" in v);

export const isUpperOnly = (v: NV): v is upper_bound_only =>
  "upper_bound_value" in v &&
  !("lower_bound_value" in v) &&
  !("male_normal_value_type" in v);

export const isLowerOnly = (v: NV): v is lower_bound_only =>
  "lower_bound_value" in v &&
  !("upper_bound_value" in v) &&
  !("male_normal_value_type" in v);

export const isPosNeg = (v: NV): v is positive_or_negative =>
  "normal_value" in v && !("male_normal_value_type" in v);

export const isByGender = (v: NV): v is normal_value_by_gender =>
  "male_normal_value_type" in v && "female_normal_value_type" in v;

export const guessNVType = (v: NV): NVType => {
  if (isByGender(v)) return "normal_value_by_gender";
  if (isUAndL(v)) return "upper_and_lower_bound_only";
  if (isUpperOnly(v)) return "upper_bound_only";
  if (isLowerOnly(v)) return "lower_bound_only";
  if (isPosNeg(v)) return "positive_or_negative";
  return "description_only";
};
