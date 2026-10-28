import { getApiErrorMessage } from "../../api";
import { useNavigate } from "react-router-dom";
// import DateRangePicker from './DataRangePicker';
import React, { useCallback, useEffect, useMemo, useState } from "react";
// import api from '../../../api';
import { fetchVisitsPaginated } from "../utils";
import { type visitData } from "../types";
import Pagination from "../Pagination";
import { pageListTitle, tableHead, tableItem } from "../../style";
import { getVisitsColumns } from "../tableData";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import GenericTable from "../react-table/GeneralTable";
import { usePersistedTableState } from "../../hooks/usePersistedTableState";

const VisitsTable: React.FC = () => {
  const [data, setData] = useState<visitData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);

  const {
    sorting,
    setSorting,
    pagination,
    setPagination,
    columnFilters,
    setColumnFilters,
    showFilters,
    setShowFilters,
  } = usePersistedTableState([{ id: "visit_date", desc: true }]);
  const currentPage = pagination.pageIndex + 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const toggleFilter = useCallback((colId: string) =>
    setShowFilters((s) => ({ ...s, [colId]: !s[colId] })), [setShowFilters]);

  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };
  const visitsCols = useMemo(() => getVisitsColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError
  ), [navigate, showFilters, toggleFilter, setError]);
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
  // const [visibleVisits] = useState<[]>([]);
  // const today = new Date().toISOString().split("T")[0];
  // const [startDate, setStartDate] = useState<string>(today);
  // const [endDate, setEndDate] = useState<string>(today);

  useEffect(() => {
    const controller = new AbortController();
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
        const res = await fetchVisitsPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setData(res.visitsData);
        setTotalPages(Math.max(1, res.total_pages));
        setTotalNumberOfPaginatedItems(res.TotalNumberOfVisits);
      } catch (err) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Could not load visits"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadPage();
    return () => controller.abort();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters, refreshKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener("visit-deleted", handleRefresh);
    return () => window.removeEventListener("visit-deleted", handleRefresh);
  }, []);


  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Visits</h1>
      {error && <div role="alert" className="my-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

      {loading && <p role="status" className="my-3 text-sm text-gray-600">Loading visits…</p>}
      <GenericTable
        columnWidths={{ patient_phone_number: 200, total_price_with_insurance: 240 }}
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
export default VisitsTable;
