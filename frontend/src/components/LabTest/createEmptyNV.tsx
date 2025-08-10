import type { NV, NVType, upper_and_lower_bound_only } from "../types";

const createEmptyNormalValues = (t: NVType): NV => {
  switch (t) {
    case "upper_and_lower_bound_only":
      return { description: "", lower_bound_value: 0, upper_bound_value: 0 };
    case "upper_bound_only":
      return { description: "", upper_bound_value: 0 };
    case "lower_bound_only":
      return { description: "", lower_bound_value: 0 };
    case "positive_or_negative":
      return { description: "", normal_value: "" };
    case "normal_value_by_gender": {
      const inner: upper_and_lower_bound_only = {
        description: "",
        lower_bound_value: 0,
        upper_bound_value: 0,
      };
      return {
        description: "",
        male_normal_value_type: { ...inner },
        female_normal_value_type: { ...inner },
      };
    }
  }
};
export default createEmptyNormalValues;
