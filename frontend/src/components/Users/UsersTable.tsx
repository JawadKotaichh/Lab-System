import { useState } from "react";
import { user } from "../types";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { getUsersColumns } from "../tableData";
import { useNavigate } from "react-router-dom";

const UsersTable = () => {
  const [data, setData] = useState<user[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const currentPage = pagination.pageIndex + 1;

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const toogleFilters = (colId: string) =>
    setShowFilters((s) => ({ ...s, [colId]: !s[colId] }));
  const handlePage = (page: number) =>
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  const handleSetPageSize = (newPageSize: number) =>
    setPagination((old) => ({ ...old, pageSize: newPageSize, pageIndex: 0 }));

  const UsersCols = getUsersColumns(
    navigate,
    showFilters,
    toogleFilters,
    setError
  );

  const table = useReactTable({
    data,
    columns: UsersCols,
    pageCount: totalPages,
    state: { pagination, columnFilters, sorting },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: false,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
};

export default UsersTable;
