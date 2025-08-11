const fmt = (v: unknown) =>
  v === undefined || v === null || v === "" ? "—" : String(v);

export default function renderNormalValue(
  nv: unknown,
  opts?: { ascii?: boolean }
): string {
  const le = opts?.ascii ? "<=" : "≤";
  const ge = opts?.ascii ? ">=" : "≥";
  if (typeof nv !== "object" || nv === null) return "—";
  const rec = nv as Record<string, unknown>;

  if ("male_normal_value_type" in rec && "female_normal_value_type" in rec) {
    const part = (x: unknown) => {
      if (typeof x !== "object" || x === null) return "—";
      const r = x as Record<string, unknown>;
      const prefix = r.description ? String(r.description) + " " : "";
      if ("normal_value" in r) return prefix + fmt(r.normal_value);
      if ("lower_bound_value" in r && "upper_bound_value" in r)
        return (
          prefix + `${fmt(r.lower_bound_value)} – ${fmt(r.upper_bound_value)}`
        );
      if ("lower_bound_value" in r)
        return prefix + `${ge} ${fmt(r.lower_bound_value)}`;
      if ("upper_bound_value" in r)
        return prefix + `${le} ${fmt(r.upper_bound_value)}`;
      return "—";
    };

    const md = part(rec.male_normal_value_type);
    const fd = part(rec.female_normal_value_type);
    const head = rec.description ? String(rec.description) + " | " : "";
    return `${head}M: ${md} | F: ${fd}`;
  }
  const prefix = rec.description ? String(rec.description) + " " : "";
  if ("normal_value" in rec) return prefix + fmt(rec.normal_value);
  if ("lower_bound_value" in rec && "upper_bound_value" in rec)
    return (
      prefix + `${fmt(rec.lower_bound_value)} – ${fmt(rec.upper_bound_value)}`
    );
  if ("lower_bound_value" in rec)
    return prefix + `${ge} ${fmt(rec.lower_bound_value)}`;
  if ("upper_bound_value" in rec)
    return prefix + `${le} ${fmt(rec.upper_bound_value)}`;
  return "—";
}
