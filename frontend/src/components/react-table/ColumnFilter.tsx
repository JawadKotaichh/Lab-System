import { useEffect, useState } from "react";
import { useDebounce } from "./Debounce";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import type { Column } from "@tanstack/react-table";

export function ColumnFilter<TData, TValue>({
  column,
  placeholder,
  label,
  showFilter,
  toggleShowFilter,
  options,
  inputType = "text",
  withFilter,
}: {
  column: Column<TData, TValue>;
  placeholder: string;
  label: string;
  showFilter: boolean;
  toggleShowFilter: () => void;
  inputType?: string;
  options?: { value: string; label: string }[];
  withFilter: boolean;
}) {
  const initial = (column.getFilterValue() as string) ?? "";
  const [draft, setDraft] = useState(initial);
  const debounced = useDebounce(draft, 500);

  useEffect(() => {
    const current = (column.getFilterValue() as string) ?? "";
    if (debounced !== current) {
      column.setFilterValue(debounced || undefined);
    }
  }, [debounced, column]);

  const canSort = column.getCanSort();
  const sortDir = column.getIsSorted();

  return (
    <div>
      <div className="flex items-center justify-center mt-4">
        <span className="text-base whitespace-nowrap">{label}</span>

        {withFilter && (
          <>
            <button
              type="button"
              className="ml-2 p-1 cursor-pointer"
              onClick={toggleShowFilter}
              aria-label={showFilter ? "Hide filter" : "Show filter"}
            >
              <Filter
                className={`w-5 h-5 transition-colors ${
                  showFilter ? "text-blue-600" : "text-gray-500"
                }`}
              />
            </button>
          </>
        )}

        <button
          type="button"
          className={` p-1 ${sortDir ? "text-blue-600" : "text-gray-500"} ${
            canSort ? "cursor-pointer" : "cursor-not-allowed"
          }`}
          onClick={canSort ? column.getToggleSortingHandler() : undefined}
          disabled={!canSort}
          aria-label={
            sortDir === "asc"
              ? "Sorted ascending, click to toggle"
              : sortDir === "desc"
              ? "Sorted descending, click to toggle"
              : "Click to sort"
          }
        >
          {sortDir === "asc" ? (
            <ArrowUp className="w-5 h-5" />
          ) : sortDir === "desc" ? (
            <ArrowDown className="w-5 h-5" />
          ) : (
            <ArrowUpDown className="w-5 h-5" />
          )}
        </button>

        <button
          type="button"
          className={
            column.getFilterValue()
              ? "text-blue-500 cursor-pointer"
              : "text-gray-500 cursor-pointer"
          }
          onClick={() => {
            setDraft("");
            column.setFilterValue(undefined);
          }}
          aria-label="Reset filter"
        >
          X
        </button>
      </div>

      {showFilter && (
        <div className="mt-2 flex items-center p-2">
          {options ? (
            <select
              className="border rounded p-1 flex-1 text-center h-9"
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(e) =>
                column.setFilterValue(e.target.value || undefined)
              }
            >
              <option value="">All</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={inputType}
              className="border rounded p-1 h-9 flex-1 text-center"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
      )}
    </div>
  );
}
