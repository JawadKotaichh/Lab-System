const entries = new Map<string, { expires: number; promise: Promise<unknown> }>();
let account = "";
export function invalidateReferenceData() {
  entries.clear();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("reference-data-changed"));
}
export async function referenceData<T>(key: string, load: () => Promise<T>): Promise<T> {
  const current = typeof localStorage === "undefined" ? "" : localStorage.getItem("auth_user") ?? "";
  if (current !== account) { entries.clear(); account = current; }
  let entry = entries.get(key);
  if (!entry || entry.expires <= Date.now()) {
    const next = { expires: Infinity, promise: Promise.resolve().then(load) as Promise<unknown> };
    next.promise = next.promise.then(value => { next.expires = Date.now() + 60_000; return value; }, error => {
      if (entries.get(key) === next) entries.delete(key);
      throw error;
    });
    entries.set(key, next); entry = next;
  }
  return structuredClone(await entry.promise) as T;
}
