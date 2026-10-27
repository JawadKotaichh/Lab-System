import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
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
      pageSize: Math.min(100, positiveNumber(params.get("pageSize"), 50)),
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

// Preserve unchanged slices: opening a filter or changing sort must not refetch data.
const reconcileState = (previous: SavedTableState, next: SavedTableState): SavedTableState => {
  const pagination = previous.pagination.pageIndex === next.pagination.pageIndex && previous.pagination.pageSize === next.pagination.pageSize ? previous.pagination : next.pagination;
  const columnFilters = JSON.stringify(previous.columnFilters) === JSON.stringify(next.columnFilters) ? previous.columnFilters : next.columnFilters;
  const sorting = JSON.stringify(previous.sorting) === JSON.stringify(next.sorting) ? previous.sorting : next.sorting;
  const showFilters = JSON.stringify(previous.showFilters) === JSON.stringify(next.showFilters) ? previous.showFilters : next.showFilters;
  return pagination === previous.pagination && columnFilters === previous.columnFilters && sorting === previous.sorting && showFilters === previous.showFilters
    ? previous : { pagination, columnFilters, sorting, showFilters };
};

export const usePersistedTableState = (defaultSorting: SortingState = []) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const pathKey = location.pathname;
  const search = searchParams.toString();
  const defaultSortingRef = useRef(defaultSorting);
  const [state, setState] = useState<SavedTableState>(() => searchParams.size > 0
    ? readState(searchParams, defaultSortingRef.current)
    : tableStateByPath.get(pathKey) ?? readState(new URLSearchParams(), defaultSortingRef.current));
  const stateRef = useRef(state);
  const lastLocation = useRef({ path: pathKey, search });

  useEffect(() => {
    tableStateByPath.set(pathKey, stateRef.current);
  }, [pathKey, state]);

  // Only user actions write the URL. A URL-restoration effect must never write
  // the previous render's filters back over an incoming navigation.
  const updateState = useCallback((update: (previous: SavedTableState) => SavedTableState) => {
    const previous = stateRef.current;
    const next = reconcileState(previous, update(previous));
    if (next === previous) return;
    stateRef.current = next;
    tableStateByPath.set(pathKey, next);
    setState(next);
    const params = writeState(next);
    const nextSearch = params.toString();
    if (nextSearch !== lastLocation.current.search || pathKey !== lastLocation.current.path) {
      lastLocation.current = { path: pathKey, search: nextSearch };
      setSearchParams(params, { replace: true });
    }
  }, [pathKey, setSearchParams]);

  useEffect(() => {
    const previousLocation = lastLocation.current;
    if (previousLocation.path === pathKey && previousLocation.search === search) return;
    lastLocation.current = { path: pathKey, search };
    const next = reconcileState(stateRef.current,
      previousLocation.path !== pathKey && !searchParams.size
        ? tableStateByPath.get(pathKey) ?? readState(searchParams, defaultSortingRef.current)
        : readState(searchParams, defaultSortingRef.current));
    stateRef.current = next;
    tableStateByPath.set(pathKey, next);
    setState(next);
  }, [pathKey, search, searchParams]);

  const setPagination = useCallback((update: SetStateAction<PaginationState>) => updateState(previous => {
    const next = typeof update === "function" ? update(previous.pagination) : update;
    return { ...previous, pagination: {
      pageIndex: Number.isInteger(next.pageIndex) && next.pageIndex >= 0 ? next.pageIndex : 0,
      pageSize: Number.isInteger(next.pageSize) && next.pageSize > 0 ? Math.min(100, next.pageSize) : 50,
    } };
  }), [updateState]);
  const setColumnFilters = useCallback((update: SetStateAction<ColumnFiltersState>) => updateState(previous => {
    const next = typeof update === "function" ? update(previous.columnFilters) : update;
    if (JSON.stringify(previous.columnFilters) === JSON.stringify(next)) return previous;
    return { ...previous, columnFilters: next, pagination: { ...previous.pagination, pageIndex: 0 } };
  }), [updateState]);
  const setSorting = useCallback((update: SetStateAction<SortingState>) => updateState(previous => ({
    ...previous, sorting: typeof update === "function" ? update(previous.sorting) : update,
  })), [updateState]);
  const setShowFilters = useCallback((update: SetStateAction<Record<string, boolean>>) => updateState(previous => ({
    ...previous, showFilters: typeof update === "function" ? update(previous.showFilters) : update,
  })), [updateState]);

  return { ...state, setPagination, setColumnFilters, setSorting, setShowFilters };
};
