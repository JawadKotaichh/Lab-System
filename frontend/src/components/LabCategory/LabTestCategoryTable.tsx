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
import type { labTestCategoryParams } from "../types";
import { fetchLabTestCategoryPaginated } from "../utils";
import {
  pageListTitle,
  tableCreateButton,
  tableHead,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import Pagination from "../Pagination";
import { getLabTestCategoryColumns } from "../tableData";
import GenericTable from "../react-table/GeneralTable";
import { handleCreateLabTestCategory } from "../Function";

const LabTestCategoryTable = () => {
  const [data, setData] = useState<labTestCategoryParams[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const currentPage = pagination.pageIndex + 1;

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

  const labTestCategoryCols = getLabTestCategoryColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError
  );

  const table = useReactTable({
    data,
    columns: labTestCategoryCols,
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
        const res = await fetchLabTestCategoryPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters
        );
        setData(res.lab_test_categories);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfLabTestCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters]);

  if (loading) return <div>Loading Lab Tests Categories...</div>;

  return (
    <div className="p-8 bg-white">
      <div className="grid grid-cols-2">
        <h1 className={pageListTitle}>Lab Tests Category List</h1>
        <button
          className={`${tableCreateButton} ml-auto text-xl`}
          onClick={() => handleCreateLabTestCategory(navigate)}
        >
          Create Lab Test Category
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <Pagination
        TotalNumberOfPaginatedItems={totalNumberOfPaginatedItems}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={handleSetPage}
        pageSize={pagination.pageSize}
        setPageSize={handleSetPageSize}
      />
      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No lab test categories found"
      />
    </div>
  );
};

export default LabTestCategoryTable;
