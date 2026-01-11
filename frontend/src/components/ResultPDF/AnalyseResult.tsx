export default function AnalyseResult(nv: unknown, result: string): boolean[] {
  const normText = (v: unknown) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const analyse = (x: unknown): boolean => {
    if (typeof x === "string") return normText(x) === normText(result);

    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;

    if ("normal_value" in r) {
      const expected = normText(r.normal_value);
      const got = normText(result);

      if (!expected) return false;
      if (expected === "positive") return got !== "negative";
      if (expected === "negative") return got === "negative";

      return got === expected;
    }

    if ("lower_bound_value" in r && "upper_bound_value" in r) {
      return (
        Number(r.lower_bound_value) < Number(result) &&
        Number(r.upper_bound_value) > Number(result)
      );
    }
    if ("lower_bound_value" in r) {
      return Number(r.lower_bound_value) <= Number(result);
    }
    if ("upper_bound_value" in r) {
      return Number(r.upper_bound_value) >= Number(result);
    }

    const getString = (key: string) =>
      typeof r[key] === "string" ? (r[key] as string) : undefined;

    const desc =
      getString("description") ??
      getString("normal_value_description") ??
      getString("reference_range_description") ??
      getString("reference_range") ??
      getString("text");

    if (desc) {
      return normText(desc) === normText(result);
    }

    return false;
  };

  if (typeof nv === "object" && nv !== null) {
    const rec = nv as Record<string, unknown>;
    if ("male_normal_value_type" in rec && "female_normal_value_type" in rec) {
      return [
        analyse(rec.male_normal_value_type),
        analyse(rec.female_normal_value_type),
      ];
    }
  }

  return [analyse(nv)];
}
