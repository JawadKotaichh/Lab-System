import {
  useReactTable,
  type ColumnFiltersState,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { UserPlus } from "lucide-react";

import { useEffect, useState } from "react";
import type { patientInfo } from "../types";
import { fetchPatientsPaginated } from "../utils";
import {
  pageListTitle,
  // tableCreateButton,
  tableHead,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import Pagination from "../Pagination";
import { getPatientsColumns } from "../tableData";
import GenericTable from "../react-table/GeneralTable";
import LoadingPage from "../LoadingPage/LoadingPage";

const PatientTable = () => {
  const [data, setData] = useState<patientInfo[]>([]);
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

  const PatientsCols = getPatientsColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError
  );

  const table = useReactTable({
    data,
    columns: PatientsCols,
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
        const res = await fetchPatientsPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters
        );
        setData(res.patients);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfPatients);
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
    window.addEventListener("patient-deleted", handleRefresh);
    return () => window.removeEventListener("patient-deleted", handleRefresh);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener("patients:changed", handleRefresh);
    return () => window.removeEventListener("patients:changed", handleRefresh);
  }, []);

  if (loading) return <LoadingPage title="Loading patients ..." />;

  return (
    <div className="p-8 bg-white">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className={pageListTitle}>Patients List</h1>
        {/* <button
          className={`${tableCreateButton} ml-auto text-xl`}
          onClick={() => navigate(`/patients/create-patient`)}
        >
          Create Patient
        </button> */}
        <button
          type="button"
          onClick={() => navigate(`/patients/create-patient`)}
          className="
            h-10 inline-flex items-center gap-2
            w-fit shrink-0 rounded-lg bg-blue-600 px-4
            text-sm font-medium text-white
            shadow-sm
            hover:bg-blue-700
            active:scale-95 transition
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
          "
        >
          <UserPlus className="h-4 w-4" />
          Create Patient
        </button>
      </div>
      {error && <div className="text-red-600">{error}</div>}

      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No patients found"
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

export default PatientTable;
