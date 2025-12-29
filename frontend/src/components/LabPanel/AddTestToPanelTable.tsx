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
import type { labPanelsWithIdsList, labTest } from "../types";
import { fetchLabTestTypePaginated } from "../utils";
import { useNavigate } from "react-router-dom";
import { getLabTestColumns } from "../tableData";
import {
  buildLabTestFilters,
  useLabTestCategoryOptions,
} from "../../hooks/useLabTestCategoryOptions";
import Pagination from "../Pagination";
import {
  pageListTitle,
  tableDeleteButton,
  tableHead,
  tableItem,
} from "../../style";
import GenericTable from "../react-table/GeneralTable";
import LoadingPage from "../LoadingPage/LoadingPage";

interface TestsList {
  addError: string;
  data: labPanelsWithIdsList;
  setData: React.Dispatch<React.SetStateAction<labPanelsWithIdsList>>;
  setAddError: React.Dispatch<React.SetStateAction<string>>;
  showAddForLabPanels: boolean;
  setShowAddForLabPanels: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  error: string;
}

const AddTestToPanelTable: React.FC<TestsList> = ({
  data,
  error,
  addError,
  setData,
  setAddError,
  setShowAddForLabPanels,
  showAddForLabPanels,
  setError,
}: TestsList) => {
  const [labTests, setLabTests] = useState<labTest[]>([]);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const toggleFilter = (colId: string) =>
    setShowFilters((s) => ({ ...s, [colId]: !s[colId] }));

  const labTestCategoryOptions = useLabTestCategoryOptions();

  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };

  const labTestCols = getLabTestColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError,
    false,
    {
      showAddForLabPanels,
      setShowAddForLabPanels,
      data,
      setData,
      setAddError,
      labTestCategoryOptions,
    }
  );

  const labTestsTable = useReactTable({
    data: labTests,
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
        setLabTests(res.lab_tests);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfTests);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    columnFilters,
    setError,
    setTotalPages,
  ]);

  useEffect(() => {
    setPagination((old) =>
      old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }
    );
  }, [columnFilters]);

  if (loading) return <LoadingPage title="Loading Lab Tests ..." />;

  return (
    <>
      {showAddForLabPanels && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-fit max-h-[80vh] overflow-y-auto">
            <div className="p-8 bg-white">
              {error && <div className="text-red-600">{error}</div>}
              {addError && <div className="text-red-600">{addError}</div>}

              {showAddForLabPanels && (
                <>
                  <h1 className={pageListTitle}>Add Lab Test</h1>
                  <button
                    className={tableDeleteButton + " mb-2"}
                    onClick={() => setShowAddForLabPanels(false)}
                  >
                    Close
                  </button>
                  <GenericTable
                    table={labTestsTable}
                    loading={loading}
                    tableHeadStyle={tableHead}
                    cellStyle={tableItem}
                    noDataMessage="No lab tests found"
                  />

                  <Pagination
                    TotalNumberOfPaginatedItems={totalNumberOfPaginatedItems}
                    currentPage={pagination.pageIndex + 1}
                    totalPages={totalPages}
                    setCurrentPage={handleSetPage}
                    pageSize={pagination.pageSize}
                    setPageSize={handleSetPageSize}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTestToPanelTable;
