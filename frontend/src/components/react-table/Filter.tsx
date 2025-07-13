import type { Column } from "@tanstack/react-table";

export function Filter<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>;
}) {
  const value = (column.getFilterValue() ?? "") as string;
  return (
    <input
      className="mt-1 p-1 border rounded w-full text-sm text-center"
      placeholder="🔍 Filter…"
      value={value}
      onChange={(e) => column.setFilterValue(e.target.value)}
    />
  );
}
