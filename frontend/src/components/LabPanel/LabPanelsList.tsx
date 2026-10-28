import { useCallback, useEffect, useMemo, useState } from "react";
import { getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../../api";
import { pageListTitle, tableHead, tableItem } from "../../style";
import { usePersistedTableState } from "../../hooks/usePersistedTableState";
import { useLabTestCategoryOptions } from "../../hooks/useLabTestCategoryOptions";
import type { labPanel } from "../types";
import { fetchLabPanelsPaginated } from "../utils";
import { labPanelApiURL, labPanelCreatePageURL, labPanelEditPageURL } from "../data";
import ActionButton from "../ActionButton";
import Pagination from "../Pagination";
import GenericTable from "../react-table/GeneralTable";
import { buildLabPanelFilters, getLabPanelColumns, PanelTestDetails } from "./LabPanelColumns";

const LabPanelsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<labPanel[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { pagination, setPagination, columnFilters, setColumnFilters, sorting, setSorting,
    showFilters, setShowFilters } = usePersistedTableState();
  const categories = useLabTestCategoryOptions();
  const toggleFilter = useCallback((id: string) => setShowFilters(previous => ({...previous, [id]: !previous[id]})), [setShowFilters]);
  const edit = useCallback((id: string) => navigate(`${labPanelEditPageURL}${id}`), [navigate]);
  const remove = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lab panel?")) return;
    try {
      await api.delete(`${labPanelApiURL}/${id}`);
      // Reload totals and refill the page from the server after a confirmed delete.
      setRefreshKey(previous => previous + 1);
    } catch (error) { setError(getApiErrorMessage(error, "Could not delete lab panel")); }
  }, []);
  const columns = useMemo(() => getLabPanelColumns(showFilters, toggleFilter, categories, edit, remove),
    [showFilters, toggleFilter, categories, edit, remove]);
  const table = useReactTable({
    data, columns, pageCount: totalPages, state: {pagination, columnFilters, sorting},
    manualPagination: true, manualFiltering: true,
    onPaginationChange: setPagination, onColumnFiltersChange: setColumnFilters, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getRowId: row => row.id, getRowCanExpand: () => true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError("");
      try {
        const response = await fetchLabPanelsPaginated(pagination.pageIndex + 1, pagination.pageSize,
          buildLabPanelFilters(columnFilters), controller.signal);
        if (controller.signal.aborted) return;
        const pages = Math.max(1, response.total_pages);
        if (pagination.pageIndex >= pages) {
          setPagination(previous => ({...previous, pageIndex: pages - 1}));
          return;
        }
        setData(response.lab_panels); setTotalPages(pages); setTotalItems(response.TotalNumberOfLabPanels);
      } catch (error) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(error, "Could not load lab panels"));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [pagination.pageIndex, pagination.pageSize, columnFilters, refreshKey]);

  return <div className="p-8 bg-white">
    <div className="mb-4 flex items-center justify-between gap-4">
      <h1 className={pageListTitle}>Lab Panels</h1>
      <ActionButton icon={ClipboardList} onClick={() => navigate(labPanelCreatePageURL)}>Create Lab Panel</ActionButton>
    </div>
    {location.state?.savedMessage && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{location.state.savedMessage}</p>}
    {error && <div role="alert" className="my-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
    {loading && <p role="status" className="my-3 text-sm text-gray-600">Loading lab panels…</p>}
    <GenericTable table={table} loading={loading} tableHeadStyle={tableHead} cellStyle={tableItem}
      noDataMessage="No lab panels found" renderExpandedRow={row => <PanelTestDetails panel={row.original} />} />
    <Pagination TotalNumberOfPaginatedItems={totalItems} currentPage={pagination.pageIndex + 1} totalPages={totalPages}
      setCurrentPage={page => setPagination(previous => ({...previous, pageIndex: page - 1}))} pageSize={pagination.pageSize}
      setPageSize={size => setPagination(previous => ({...previous, pageSize: size, pageIndex: 0}))} />
  </div>;
};
export default LabPanelsList;
