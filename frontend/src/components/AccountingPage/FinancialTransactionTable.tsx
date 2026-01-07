import { useNavigate } from "react-router-dom";
// import DateRangePicker from './DataRangePicker';
import React, { useEffect, useState } from "react";
// import api from '../../../api';
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
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import GenericTable from "../react-table/GeneralTable";
import LoadingPage from "../LoadingPage/LoadingPage";
import PlusButtonMenu from "../PlusButtonMenu";
import {
  buildFinancialTransactionsFilters,
  useFinancialTransactionsOptions,
} from "src/hooks/useLabTestCategoryOptions";

const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "LBP", label: "LBP" },
];

const typeOptions = [
  { value: "Income", label: "Income" },
  { value: "Expense", label: "Expense" },
];

const FinancialTransactionsTable: React.FC = () => {
  const [data, setData] = useState<financialTransaction[]>([]);
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
  const categoryOptions = useFinancialTransactionsOptions();

  const financialTransactionCols = getFinancialTransactionColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError,
    { categoryOptions, currencyOptions, typeOptions }
  );
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
    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        const filters = buildFinancialTransactionsFilters(columnFilters);
        const res = await fetchFinancialTransactionsPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters
        );
        console.log(
          "Financial transactions Data: ",
          res.financial_transactions
        );
        setData(res.financial_transactions);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfFinancialTransactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters, refreshKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener("financialTransaction-deleted", handleRefresh);
    return () =>
      window.removeEventListener("financialTransaction-deleted", handleRefresh);
  }, []);

  useEffect(() => {
    setPagination((old) =>
      old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }
    );
  }, [columnFilters]);

  if (loading) return <LoadingPage title="Loading financial transactions..." />;

  return (
    <div className="p-8 bg-white">
      <div className="flex items-center justify-between">
        <h1 className={pageListTitle}>Financial Transactions</h1>
        <PlusButtonMenu variant="toolbar" actions={plusActions} />
      </div>

      {error && <div className="text-red-600">{error}</div>}
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
