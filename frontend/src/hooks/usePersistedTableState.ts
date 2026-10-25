import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";

type SavedTableState = {
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
  showFilters: Record<string, boolean>;
};

const tableStateByPath = new Map<string, SavedTableState>();

const positiveNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const readState = (
  params: URLSearchParams,
  defaultSorting: SortingState,
): SavedTableState => {
  const filters: ColumnFiltersState = [];
  const dateFilters = new Map<string, { start?: string; end?: string }>();

  for (const [key, value] of params.entries()) {
    if (!key.startsWith("f.")) continue;
    const filterKey = key.slice(2);
    const dateMatch = /^(.*)\.(start|end)$/.exec(filterKey);
    if (dateMatch) {
      const id = dateMatch[1];
      const bound = dateMatch[2];
      const current = dateFilters.get(id) ?? {};
      if (bound === "start") current.start = value;
      else current.end = value;
      dateFilters.set(id, current);
    } else {
      filters.push({ id: filterKey, value });
    }
  }
  for (const [id, value] of dateFilters) filters.push({ id, value });

  let sorting = defaultSorting;
  const savedSorting = params.get("sort");
  if (savedSorting) {
    try {
      const parsed: unknown = JSON.parse(savedSorting);
      if (Array.isArray(parsed)) sorting = parsed as SortingState;
    } catch {
      // Ignore malformed shared/bookmarked URLs.
    }
  }

  const showFilters = Object.fromEntries(
    (params.get("open") ?? "")
      .split(",")
      .filter(Boolean)
      .map((id) => [id, true]),
  );

  return {
    pagination: {
      pageIndex: positiveNumber(params.get("page"), 1) - 1,
      pageSize: positiveNumber(params.get("pageSize"), 50),
    },
    columnFilters: filters,
    sorting,
    showFilters,
  };
};

const writeState = (state: SavedTableState) => {
  const params = new URLSearchParams();
  params.set("page", String(state.pagination.pageIndex + 1));
  params.set("pageSize", String(state.pagination.pageSize));
  if (state.sorting.length) params.set("sort", JSON.stringify(state.sorting));

  for (const filter of state.columnFilters) {
    if (!filter.value) continue;
    if (typeof filter.value === "object" && filter.value !== null) {
      const range = filter.value as { start?: string; end?: string };
      if (range.start) params.set(`f.${filter.id}.start`, range.start);
      if (range.end) params.set(`f.${filter.id}.end`, range.end);
    } else {
      params.set(`f.${filter.id}`, String(filter.value));
    }
  }

  const open = Object.entries(state.showFilters)
    .filter(([, shown]) => shown)
    .map(([id]) => id);
  if (open.length) params.set("open", open.join(","));
  return params;
};

export const usePersistedTableState = (defaultSorting: SortingState = []) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const pathKey = location.pathname;
  const defaultSortingRef = useRef(defaultSorting);
  const initial =
    searchParams.size > 0
      ? readState(searchParams, defaultSortingRef.current)
      : tableStateByPath.get(pathKey) ??
        readState(new URLSearchParams(), defaultSortingRef.current);
  const [pagination, setPagination] = useState<PaginationState>(
    initial.pagination,
  );
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>(
    initial.columnFilters,
  );
  const [sorting, setSorting] = useState<SortingState>(initial.sorting);
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>(
    initial.showFilters,
  );
  const lastWrittenSearch = useRef(searchParams.toString());
  const setColumnFilters = (next: SetStateAction<ColumnFiltersState>) => {
    setColumnFiltersState(next);
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    );
  };

  useEffect(() => {
    const nextState = { pagination, columnFilters, sorting, showFilters };
    tableStateByPath.set(pathKey, nextState);
    const next = writeState(nextState);
    const nextSearch = next.toString();
    if (nextSearch !== searchParams.toString()) {
      lastWrittenSearch.current = nextSearch;
      setSearchParams(next, { replace: true });
    }
  }, [pathKey, pagination, columnFilters, sorting, showFilters, setSearchParams]);

  useEffect(() => {
    if (searchParams.toString() === lastWrittenSearch.current) return;
    const next = readState(searchParams, defaultSortingRef.current);
    setPagination(next.pagination);
    setColumnFiltersState(next.columnFilters);
    setSorting(next.sorting);
    setShowFilters(next.showFilters);
  }, [searchParams]);

  return {
    pagination,
    setPagination,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    showFilters,
    setShowFilters,
  };
};
