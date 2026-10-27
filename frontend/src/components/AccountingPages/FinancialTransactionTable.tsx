import { getApiErrorMessage } from "../../api";
import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchFinancialTransactionsPaginated } from "../utils";
import { financialTransaction } from "../types";
import Pagination from "../Pagination";
import { pageListTitle, tableHead, tableItem } from "../../style";
import { getFinancialTransactionColumns } from "../tableData";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import GenericTable from "../react-table/GeneralTable";
import PlusButtonMenu from "../PlusButtonMenu";
import {
  buildFinancialTransactionsFilters,
  useFinancialTransactionsOptions,
} from "../../hooks/useLabTestCategoryOptions";
import { FilePlus } from "lucide-react";
import { usePersistedTableState } from "../../hooks/usePersistedTableState";

const FinancialTransactionsTable: React.FC = () => {
  const [data, setData] = useState<financialTransaction[]>([]);
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
  const { categoryOptions, currencyOptions, typeOptions } =
    useFinancialTransactionsOptions();

  const financialTransactionCols = useMemo(() => getFinancialTransactionColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError,
    { categoryOptions, currencyOptions, typeOptions }
  ), [navigate, showFilters, toggleFilter, setError, categoryOptions, currencyOptions, typeOptions]);
  const table = useReactTable({
    data,
    columns: financialTransactionCols,
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
  const plusActions = [
    {
      label: "Add Income",
      onClick: () => {
        navigate("/financial-transactions/create-transaction/income");
      },
    },
    {
      label: "Add Expense",
      onClick: () =>
        navigate("/financial-transactions/create-transaction/expense"),
      className: "text-red-600",
    },
  ];

  useEffect(() => {
    const controller = new AbortController();
    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        const filters = buildFinancialTransactionsFilters(columnFilters);
        const res = await fetchFinancialTransactionsPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setData(res.financial_transactions);
        setTotalPages(Math.max(1, res.total_pages));
        setTotalNumberOfPaginatedItems(res.TotalNumberOfFinancialTransactions);
      } catch (err) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Could not load financial transactions"));
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
    window.addEventListener("financialTransaction-deleted", handleRefresh);
    return () =>
      window.removeEventListener("financialTransaction-deleted", handleRefresh);
  }, []);


  return (
    <div className="p-8 bg-white">
      <div className="flex items-center justify-between">
        <h1 className={pageListTitle}>Financial Transactions</h1>
        <PlusButtonMenu variant="toolbar" actions={plusActions} />
        <button
          type="button"
          onClick={() => navigate(`/financial-transactions/summary`)}
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
          <FilePlus className="h-4 w-4" />
          Get summary
        </button>
      </div>

      {error && <div role="alert" className="my-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
      {loading && <p role="status" className="my-3 text-sm text-gray-600">Loading financial transactions…</p>}
      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No financial transactions found"
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

export default FinancialTransactionsTable;
