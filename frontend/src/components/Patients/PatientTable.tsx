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
import type { insuranceCompanyParams, patientInfo } from "../types";
import { fetchPatientsPaginated } from "../utils";
import {
  pageListTitle,
  tableCreateButton,
  tableHead,
  tableItem,
} from "../../style";
import { useNavigate } from "react-router-dom";
import Pagination from "../Pagination";
import { getPatientsColumns } from "../tableData";
import GenericTable from "../react-table/GeneralTable";
import api from "../../api";

interface Option {
  value: string;
  label: string;
}

const PatientTable = () => {
  const [data, setData] = useState<patientInfo[]>([]);
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
  const [, setInsuranceOptions] = useState<Option[]>([]);
  const [, setInsuranceCompanies] = useState<insuranceCompanyParams[]>([]);

  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const toggleFilter = (colId: string) =>
    setShowFilters((s) => ({ ...s, [colId]: !s[colId] }));

  const handleSetPage = (page: number) => {
    setPagination((old) => ({ ...old, pageIndex: page - 1 }));
  };
  const handleSetPageSize = (size: number) => {
    setPagination((old) => ({ ...old, pageSize: size, pageIndex: 0 }));
  };

  useEffect(() => {
    async function loadInsurance() {
      const resp = await api.get("/insurance_company/all");
      setInsuranceCompanies(resp.data);
      const list: { id: string; insurance_company_name: string }[] = resp.data;
      setInsuranceOptions(
        list.map((ic) => ({
          value: ic.id,
          label: ic.insurance_company_name,
        }))
      );
    }
    loadInsurance();
  }, []);
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
  }, [pagination.pageIndex, pagination.pageSize, columnFilters]);

  if (loading) return <div>Loading Patients...</div>;

  return (
    <div className="p-8 bg-white">
      <div className="grid grid-cols-2">
        <h1 className={pageListTitle}>Patients List</h1>
        <button
          className={`${tableCreateButton} ml-auto text-xl`}
          onClick={() => navigate(`/patients/create-patient`)}
        >
          Create Patient
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
        noDataMessage="No patients found"
      />
    </div>
  );
};

export default PatientTable;
