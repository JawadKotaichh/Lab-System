import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { fetchVisitsPaginated } from "../utils";
import { AuthUser, type visitData } from "../types";
import Pagination from "../Pagination";
import { pageListTitle, tableHead, tableItem } from "../../style";
import { getVisitsColumnsUser } from "../tableData";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import GenericTable from "../react-table/GeneralTable";
import LoadingPage from "../LoadingPage/LoadingPage";

const UserVisitsPage: React.FC = () => {
  const [data, setData] = useState<visitData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const currentPage = pagination.pageIndex + 1;
  const stored = localStorage.getItem("auth_user");
  const user: AuthUser | null = stored ? JSON.parse(stored) : null;
  const patientId = user?.user_id;
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const toggleFilter = (colId: string) =>
    setShowFilters((s) => ({ ...s, [colId]: !s[colId] }));

  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };
  const visitsCols = getVisitsColumnsUser(
    navigate,
    showFilters,
    toggleFilter
    // setError
  );
  const table = useReactTable({
    data,
    columns: visitsCols,
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

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        const filters = columnFilters.reduce<Record<string, string>>(
          (acc, f) => {
            acc[f.id] = String(f.value);
            return acc;
          },
          {}
        );
        if (patientId) filters["patient_id"] = patientId;
        const res = await fetchVisitsPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters
        );
        setData(res.visitsData);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfVisits);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters, patientId]);

  useEffect(() => {
    setPagination((old) =>
      old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }
    );
  }, [columnFilters]);

  if (loading) return <LoadingPage title="Loading visits ..." />;

  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>My Visits</h1>
      {error && <div className="text-red-600">{error}</div>}

      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No visits found"
      />
      <Pagination
        TotalNumberOfPaginatedItems={totalNumberOfPaginatedItems}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={handleSetPage}
        pageSize={pagination.pageSize}
        setPageSize={handleSetPageSize}
      />
    </div>
  );
};

export default UserVisitsPage;
