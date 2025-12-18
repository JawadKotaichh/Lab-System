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
import type { labTest, patientPanelResult, patientTestResult } from "../types";
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

interface TestsList {
  // updatedInvoiceData: updateInvoiceData;
  // setUpdatedInvoiceData: React.Dispatch<
  //   React.SetStateAction<updateInvoiceData>
  // >;
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
}

const AddTestResultTable: React.FC<TestsList> = ({
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
  // updatedInvoiceData,
  refreshResults,
}: // setUpdatedInvoiceData,
TestsList) => {
  const [data, setData] = useState<labTest[]>([]);
  const [totalNumberOfPaginatedItems, setTotalNumberOfPaginatedItems] =
    useState(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [loading, setLoading] = useState(false);
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
      }
  );
  ///neeed adjusments
  //   const labPanelsCols = getLabTestColumns(
  //     navigate,
  //     showFilters,
  //     toggleFilter,
  //     setError,
  //     false
  //   );

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

  //   const labPanelsTable = useReactTable({
  //     data,
  //     columns: labPanelsCols,
  //     pageCount: totalPages,
  //     state: { pagination, columnFilters, sorting },
  //     manualPagination: true,
  //     manualFiltering: true,
  //     manualSorting: false,
  //     onSortingChange: setSorting,
  //     onPaginationChange: setPagination,
  //     onColumnFiltersChange: setColumnFilters,
  //     getCoreRowModel: getCoreRowModel(),
  //     getSortedRowModel: getSortedRowModel(),
  //     getPaginationRowModel: getPaginationRowModel(),
  //   });

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

  if (loading) return <div>Loading Lab Tests...</div>;

  return (
    <>
      {showTestsTable && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-fit max-h-[80vh] overflow-y-auto">
            <div className="p-8 bg-white">
              {error && <div className="text-red-600">{error}</div>}
              {addError && <div className="text-red-600">{addError}</div>}

              {showTestsTable && (
                <>
                  <h1 className={pageListTitle}>Add Lab Test Result</h1>
                  <button
                    className={tableDeleteButton + " mb-2"}
                    onClick={() => setShowTestsTable(false)}
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
              {/* {showPanelsTable && (
        <GenericTable
          table={labPanelsTable}
          loading={loading}
          tableHeadStyle={tableHead}
          cellStyle={tableItem}
          noDataMessage="No lab tests found"
        />
      )} */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTestResultTable;
