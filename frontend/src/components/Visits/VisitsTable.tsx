import { useNavigate } from "react-router-dom";
// import DateRangePicker from './DataRangePicker';
import React, { useEffect, useState } from "react";
// import api from '../../../api';
import { fetchVisitsPaginated } from "../utils";
import { type visitData } from "../types";
import Pagination from "../Pagination";
import { pageListTitle, tableHead, tableItem } from "../../style";
import { getVisitsColumns } from "../tableData";
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

const VisitsTable: React.FC = () => {
  const [data, setData] = useState<visitData[]>([]);
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
  const visitsCols = getVisitsColumns(
    navigate,
    showFilters,
    toggleFilter,
    setError
  );
  const table = useReactTable({
    data,
    columns: visitsCols,
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
  // const [visibleVisits] = useState<[]>([]);
  // const today = new Date().toISOString().split("T")[0];
  // const [startDate, setStartDate] = useState<string>(today);
  // const [endDate, setEndDate] = useState<string>(today);

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
        const res = await fetchVisitsPaginated(
          pagination.pageIndex + 1,
          pagination.pageSize,
          filters
        );
        setData(res.visitsData);
        setTotalPages(res.total_pages);
        setTotalNumberOfPaginatedItems(res.TotalNumberOfVisits);
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
    window.addEventListener("visit-deleted", handleRefresh);
    return () => window.removeEventListener("visit-deleted", handleRefresh);
  }, []);

  if (loading) return <div>Loading visits...</div>;

  return (
    <div className="p-8 bg-white">
      <h1 className={pageListTitle}>Visits</h1>
      {error && <div className="text-red-600">{error}</div>}

      <GenericTable
        table={table}
        loading={loading}
        tableHeadStyle={tableHead}
        cellStyle={tableItem}
        noDataMessage="No visits found"
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

// {
//   /* <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-center bg-white p-4 rounded-xl shadow-md">             */
// }
// {
//   /* <DateRangePicker startDate={startDate} endDate={endDate} setEndDate={setEndDate} setStartDate={setStartDate}/>
//                     <button
//                         onClick={handleSubmit}
//                         className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
//                         >
//                             Submit
//                     </button>
//                     <p className="mt-4 text-gray-700">{status}</p> */
// }

// {
//   /* </div> */
// }

export default VisitsTable;
