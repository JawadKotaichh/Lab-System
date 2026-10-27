import { getApiErrorMessage } from "../../api";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { insuranceCompanyParams } from "../types";
import { fetchInsuranceCompaniesPaginated } from "../utils";
import {
  pageListTitle,
  // tableCreateButton,
  tableHead,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import { InsuranceCreatePageURL } from "../data";
import Pagination from "../Pagination";
import { getInsuranceCompanyColumns } from "../tableData";
import GenericTable from "../react-table/GeneralTable";
import { Building2 } from "lucide-react";
import { usePersistedTableState } from "../../hooks/usePersistedTableState";

const InsuranceCompanyTable = () => {
  const [data, setData] = useState<insuranceCompanyParams[]>([]);
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
  } = usePersistedTableState();
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

  const InsuranceCompanyCols = useMemo(() => getInsuranceCompanyColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError
  ), [navigate, showFilters, toggleFilter, setError]);

  const table = useReactTable({
    data,
    columns: InsuranceCompanyCols,
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
        const res = await fetchInsuranceCompaniesPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setData(res.insurance_companies);
        setTotalPages(Math.max(1, res.total_pages));
        setTotalNumberOfPaginatedItems(res.totalNumberOfPaginatedItems);
      } catch (err) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Could not load insurance companies"));
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
    window.addEventListener("insurance-company-deleted", handleRefresh);
    return () =>
      window.removeEventListener("insurance-company-deleted", handleRefresh);
  }, []);

  return (
    <div className="p-8 bg-white">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className={pageListTitle}>Insurance Companies</h1>
        {/* <button
          className={`${tableCreateButton} ml-auto text-xl`}
          onClick={() => navigate(InsuranceCreatePageURL)}
        >
          Create Insurance Company
        </button> */}
        <button
          type="button"
          onClick={() => navigate(InsuranceCreatePageURL)}
          className="
            h-10 inline-flex items-center gap-2
            w-fit shrink-0 rounded-lg bg-blue-600 px-4
            text-sm font-medium text-white
            shadow-sm
            hover:bg-blue-700
            active:scale-95 transition
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer
          "
        >
          <Building2 className="h-4 w-4" />
          Create insurance company
        </button>
      </div>
      {error && <div role="alert" className="my-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

      {loading && <p role="status" className="my-3 text-sm text-gray-600">Loading insurance companies…</p>}
      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No insurance companies found"
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

export default InsuranceCompanyTable;
