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
import { LoaderCircle } from "lucide-react";
import type {
  labTest,
  patientPanelResult,
  patientTestResult,
  updateInvoiceData,
} from "../types";
import { fetchLabTestTypePaginated } from "../utils";
import { useNavigate } from "react-router-dom";
import { getLabTestColumns } from "../tableData";
import {
  buildLabTestFilters,
  useLabTestCategoryOptions,
} from "../../hooks/useLabTestCategoryOptions";
import Pagination from "../Pagination";
import {
  tableHead,
  tableItem,
} from "../../style";
import GenericTable from "../react-table/GeneralTable";

interface TestsList {
  onSelectTest?: (test: labTest) => void;
  addError: string;
  showTestsTable: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  showAdd: boolean;
  visit_id: string;
  panelResults: patientPanelResult[];
  setPanelResults: React.Dispatch<React.SetStateAction<patientPanelResult[]>>;
  standAloneTestResults: patientTestResult[];
  setStandAloneTestResults: React.Dispatch<
    React.SetStateAction<patientTestResult[]>
  >;
  setAddError: React.Dispatch<React.SetStateAction<string>>;
  setShowTestsTable: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalNumberOfTests?: React.Dispatch<React.SetStateAction<number>>;
  refreshResults: () => Promise<void>;
  existingLabTestTypeIds: Set<string>;
  markExistingLabTestIdsDirty: () => void;
  setUpdatedInvoiceData: React.Dispatch<
    React.SetStateAction<updateInvoiceData>
  >;
  setCurrency: React.Dispatch<React.SetStateAction<string>>;
}

const AddTestResultTable: React.FC<TestsList> = ({
  onSelectTest,
  addError,
  visit_id,
  showTestsTable,
  standAloneTestResults,
  setPanelResults,
  setStandAloneTestResults,
  panelResults,
  existingLabTestTypeIds,
  markExistingLabTestIdsDirty,
  setAddError,
  setShowTestsTable,
  showAdd,
  error,
  setError,
  refreshResults,
  setUpdatedInvoiceData,
  setCurrency,
}: TestsList) => {
  const [data, setData] = useState<labTest[]>([]);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const toggleFilter = (colId: string) =>
    setShowFilters((s) => ({ ...s, [colId]: !s[colId] }));

  const handleSetPage = (page: number) => {
    setPagination((old: PaginationState) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old: PaginationState) => ({
      ...old,
      pageSize: size,
      pageIndex: 0,
    }));
  };

  const labTestCategoryOptions = useLabTestCategoryOptions();

  const labTestCols = getLabTestColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError,
    showAdd,
    {
      onSelectTest,
      pagination,
      setPagination,
      visit_id,
      panelResults,
      setPanelResults,
      standAloneTestResults,
      setStandAloneTestResults,
      existingLabTestTypeIds,
      setAddError,
      showTestsTable,
      setShowTestsTable,
      setTotalPages,
      setTotalNumberOfTests: setTotalNumberOfPaginatedItems,
      onAddedRefresh: refreshResults,
      labTestCategoryOptions,
      markExistingLabTestIdsDirty,
      setUpdatedInvoiceData,
      setCurrency,
    }
  );

  const labTestsTable = useReactTable({
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
    if (!showTestsTable) {
      return;
    }

    let cancelled = false;
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
        if (cancelled) return;
        setData(res.lab_tests);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfTests);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "Could not load available lab tests"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPage();
    return () => { cancelled = true; };
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    columnFilters,
    showTestsTable,
    setError,
    setTotalPages,
  ]);

  useEffect(() => {
    setPagination((old) =>
      old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }
    );
  }, [columnFilters]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-test-result-title"
      className={
        showTestsTable
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          : "hidden"
      }
      aria-hidden={!showTestsTable}
    >
      <div className="bg-white p-6 rounded shadow-lg w-[96vw] max-w-[96rem] max-h-[80vh] overflow-y-auto">
        <div className="p-8 bg-white">
          {error && <div role="alert" className="my-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
          {addError && <div className="text-red-600">{addError}</div>}

          <header className="mb-5 flex items-start justify-between gap-4">
            <h1 id="add-test-result-title" className="text-2xl font-semibold">Add Lab Test Result</h1>
            <CloseButton label="Close add test result dialog" onClick={() => setShowTestsTable(false)} />
          </header>
          <div aria-busy={loading}>
            {loading ? (
              <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-gray-600">
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                Loading lab tests…
              </div>
            ) : <>
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
            </>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTestResultTable;
