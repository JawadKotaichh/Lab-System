export default function AnalyseResult(nv: unknown, result: string): boolean[] {
  const rec = nv as Record<string, unknown>;
  const analyse = (x: unknown) => {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    if ("normal_value" in r) {
      return r.normal_value === "Positive"
        ? result !== "Negative"
        : result === "Negative";
    }
    if ("lower_bound_value" in r && "upper_bound_value" in r) {
      return (
        Number(r.lower_bound_value) <= Number(result) &&
        Number(r.upper_bound_value) >= Number(result)
      );
    }
    if ("lower_bound_value" in r) {
      return Number(r.lower_bound_value) <= Number(result);
    }
    if ("upper_bound_value" in r) {
      return Number(r.upper_bound_value) >= Number(result);
    }

    return false;
  };
  if ("male_normal_value_type" in rec && "female_normal_value_type" in rec) {
    return [
      analyse(rec.male_normal_value_type),
      analyse(rec.female_normal_value_type),
    ];
  }
  return [analyse(rec)];
}
