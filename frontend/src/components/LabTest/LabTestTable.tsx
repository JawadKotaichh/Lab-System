import {
  useReactTable,
  type ColumnFiltersState,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import type { labTest } from "../types";
import { fetchLabTestTypePaginated } from "../utils";
import {
  pageListTitle,
  // tableCreateButton,
  tableHead,
  tableItem,
} from "../../style";
import { FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../Pagination";
import { getLabTestColumns } from "../tableData";
import {
  buildLabTestFilters,
  useLabTestCategoryOptions,
} from "../../hooks/useLabTestCategoryOptions";
import GenericTable from "../react-table/GeneralTable";
import { handleCreateLabTest } from "../Function";
import LoadingPage from "../LoadingPage/LoadingPage";

const LabTestTable = () => {
  const [data, setData] = useState<labTest[]>([]);
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

  const labTestCategoryOptions = useLabTestCategoryOptions();

  const labTestCols = getLabTestColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError,
    false,
    { labTestCategoryOptions }
  );

  const table = useReactTable({
    data,
    columns: labTestCols,
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
        const filters = buildLabTestFilters(columnFilters);
        const res = await fetchLabTestTypePaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters
        );
        setData(res.lab_tests);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfTests);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters, refreshKey]);

  useEffect(() => {
    setPagination((old) =>
      old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }
    );
  }, [columnFilters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener("lab-test-deleted", handleRefresh);
    return () => window.removeEventListener("lab-test-deleted", handleRefresh);
  }, []);

  if (loading) return <LoadingPage title="Loading lab tests ..." />;

  return (
    <div className="p-8 bg-white">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className={pageListTitle}>Lab Test List</h1>
        <button
          type="button"
          onClick={() => handleCreateLabTest(navigate)}
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
          <FlaskConical className="h-4 w-4" />
          Create Lab Test
        </button>

        {/* <button
          className={`${tableCreateButton} ml-auto text-xl`}
          onClick={() => handleCreateLabTest(navigate)}
        >
          Create Lab Test
        </button> */}
      </div>
      {error && <div className="text-red-600">{error}</div>}

      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No lab tests found"
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

export default LabTestTable;
