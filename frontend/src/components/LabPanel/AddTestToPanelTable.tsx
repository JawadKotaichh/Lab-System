import CloseButton from "../CloseButton";
import { getApiErrorMessage } from "../../api";
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
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { LoaderCircle } from "lucide-react";
import type { labPanelsWithIdsList, labTest } from "../types";
import { fetchLabTestTypePaginated } from "../utils";
import { useNavigate } from "react-router-dom";
import { getLabTestColumns } from "../tableData";
import {
  buildLabTestFilters,
  useLabTestCategoryOptions,
} from "../../hooks/useLabTestCategoryOptions";
import Pagination from "../Pagination";
import { tableHead, tableItem } from "../../style";
import GenericTable from "../react-table/GeneralTable";

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
        setError(getApiErrorMessage(err, "Could not load available lab tests"));
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

  return (
    <Dialog
      open={showAddForLabPanels}
      onClose={() => setShowAddForLabPanels(false)}
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
        <DialogPanel className="flex max-h-[90dvh] w-full max-w-[96rem] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">Add Lab Test</DialogTitle>
              <p className="mt-1 text-sm text-slate-500">Choose a test to add to this panel.</p>
            </div>
            <CloseButton data-autofocus label="Close add lab test dialog" onClick={() => setShowAddForLabPanels(false)} />
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6" aria-busy={loading}>
            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {addError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addError}</div>}
            {loading ? (
              <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                Loading lab tests…
              </div>
            ) : (
              <GenericTable
                table={labTestsTable}
                loading={loading}
                tableHeadStyle={tableHead}
                cellStyle={tableItem}
                noDataMessage="No lab tests found"
              />
            )}
          </div>

          <footer className="shrink-0 overflow-x-auto border-t border-slate-200 bg-slate-50 px-5 sm:px-6">
            <Pagination
              TotalNumberOfPaginatedItems={totalNumberOfPaginatedItems}
              currentPage={pagination.pageIndex + 1}
              totalPages={totalPages}
              setCurrentPage={handleSetPage}
              pageSize={pagination.pageSize}
              setPageSize={handleSetPageSize}
            />
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AddTestToPanelTable;
