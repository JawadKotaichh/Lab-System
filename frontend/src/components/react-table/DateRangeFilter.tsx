import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { useDebounce } from "./Debounce";

type DateRangeValue = {
  start?: string;
  end?: string;
};

type DateRangeFilterProps<TData> = {
  column: Column<TData, unknown>;
  label: string;
  showFilter: boolean;
  toggleShowFilter: () => void;
  withFilter: boolean;
};

export function DateRangeFilter<TData>({
  column,
  label,
  showFilter,
  toggleShowFilter,
  withFilter,
}: DateRangeFilterProps<TData>) {
  const initial = column.getFilterValue() as DateRangeValue | undefined;
  const [draft, setDraft] = useState<DateRangeValue>({
    start: initial?.start ?? "",
    end: initial?.end ?? "",
  });
  const debounced = useDebounce(draft, 1500);
  const fromId = `${column.id}-from`;
  const toId = `${column.id}-to`;

  useEffect(() => {
    const current = column.getFilterValue() as DateRangeValue | undefined;
    const currentStart = current?.start ?? "";
    const currentEnd = current?.end ?? "";
    const nextStart = debounced.start ?? "";
    const nextEnd = debounced.end ?? "";

    if (!nextStart && !nextEnd) {
      if (currentStart || currentEnd) {
        column.setFilterValue(undefined);
      }
      return;
    }

    if (currentStart !== nextStart || currentEnd !== nextEnd) {
      column.setFilterValue({
        start: nextStart || undefined,
        end: nextEnd || undefined,
      });
    }
  }, [debounced, column]);

  const canSort = column.getCanSort();
  const sortDir = column.getIsSorted();

  return (
    <div>
      <div className="flex items-center justify-center mt-4">
        <span className="text-base whitespace-nowrap">{label}</span>

        {withFilter && (
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
            setDraft({ start: "", end: "" });
            column.setFilterValue(undefined);
          }}
          aria-label="Reset filter"
        >
          X
        </button>
      </div>

      {showFilter && (
        <div className="mt-2 grid grid-cols-[3.5rem_1fr] items-center gap-x-2 gap-y-2 p-2">
          <label
            htmlFor={fromId}
            className="text-sm whitespace-nowrap text-right"
          >
            From:
          </label>
          <input
            id={fromId}
            type="date"
            className="border rounded p-1 h-9 w-full text-center"
            value={draft.start ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, start: e.target.value }))
            }
            aria-label="From date"
          />
          <label
            htmlFor={toId}
            className="text-sm whitespace-nowrap text-right"
          >
            To:
          </label>
          <input
            id={toId}
            type="date"
            className="border rounded p-1 h-9 w-full text-center"
            value={draft.end ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, end: e.target.value }))
            }
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}
