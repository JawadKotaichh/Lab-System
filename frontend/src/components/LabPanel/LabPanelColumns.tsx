import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import ActionButton from "../ActionButton";
import { ColumnFilter } from "../react-table/ColumnFilter";
import type { labPanel, labPanelFilter } from "../types";
import renderNormalValue from "../renderNormalValue";
import { tableItem, tableItemPanel } from "../../style";

type Option = { value: string; label: string };
export function buildLabPanelFilters(filters: ColumnFiltersState): labPanelFilter {
  const allowed = new Set(["panel_name", "nssf_id", "lab_panel_price", "lab_panel_category_id"]);
  return Object.fromEntries(filters.filter(filter => allowed.has(filter.id) && String(filter.value ?? "").trim())
    .map(filter => [filter.id, String(filter.value).trim()]));
}

export function getLabPanelColumns(showFilters: Record<string, boolean>, toggleFilter: (id: string) => void,
  categories: Option[], edit: (id: string) => void, remove: (id: string) => void): ColumnDef<labPanel>[] {
  const fields = [
    { key: "panel_name", label: "Lab Panel", placeholder: "Search panel name…" },
    { key: "nssf_id", label: "NSSF ID", placeholder: "Search NSSF ID…" },
    { key: "lab_panel_category_id", label: "Category", placeholder: "Search category…" },
    { key: "lab_panel_price", label: "L", placeholder: "Search L…" },
  ] as const;
  return [
    ...fields.map(({key, label, placeholder}): ColumnDef<labPanel> => ({
      accessorKey: key,
      header: ({ column }) => <ColumnFilter withFilter column={column} label={label} placeholder={placeholder}
        showFilter={!!showFilters[column.id]} toggleShowFilter={() => toggleFilter(column.id)}
        options={key === "lab_panel_category_id" ? categories : undefined} />,
      cell: ({ row, getValue }) => key === "lab_panel_category_id"
        ? categories.find(category => category.value === row.original.lab_panel_category_id)?.label ?? "—"
        : String(getValue() ?? "—"),
      ...(key === "lab_panel_category_id" ? {sortingFn: (a, b) => {
        const name = (panel: labPanel) => categories.find(category => category.value === panel.lab_panel_category_id)?.label ?? "";
        return name(a.original).localeCompare(name(b.original));
      }} : {}),
    })),
    { id: "tests", header: "Tests", enableSorting: false, cell: ({ row }) => (
      <ActionButton variant="secondary" icon={row.getIsExpanded() ? ChevronDown : ChevronRight}
        aria-label={`${row.getIsExpanded() ? "Hide" : "Show"} tests for ${row.original.panel_name}`}
        aria-expanded={row.getIsExpanded()} onClick={row.getToggleExpandedHandler()}>
        {row.original.lab_tests.length} tests
      </ActionButton>
    )},
    { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <ActionButton icon={Pencil} onClick={() => edit(row.original.id)}>Edit</ActionButton>
        <ActionButton variant="remove" icon={Trash2} aria-label={`Delete lab panel ${row.original.panel_name}`}
          onClick={() => remove(row.original.id)} />
      </div>
    )},
  ];
}

export function PanelTestDetails({ panel }: { panel: labPanel }) {
  return <section aria-label={`Tests in ${panel.panel_name}`}>
    <h2 className="mb-3 text-left font-semibold">{panel.panel_name} — Tests</h2>
    {panel.lab_tests.length ? <div className="overflow-x-auto"><table className="w-full border bg-white text-center">
      <thead><tr>{["NSSF ID", "Lab Test", "Category", "Unit", "L", "Normal Value"].map(label =>
        <th key={label} className={tableItemPanel}>{label}</th>)}</tr></thead>
      <tbody>{panel.lab_tests.map((test, index) => <tr key={`${test.lab_test_id}-${index}`}>
        <td className={tableItem}>{test.nssf_id}</td><td className={tableItem}>{test.name}</td>
        <td className={tableItem}>{test.lab_test_category_name}</td><td className={tableItem}>{test.unit}</td>
        <td className={tableItem}>{test.price}</td><td className={tableItem}>{test.normal_value_list?.length
          ? test.normal_value_list.map((value, index) => <div key={index}>{renderNormalValue(value)}</div>) : <span className="text-gray-400">—</span>}</td>
      </tr>)}</tbody>
    </table></div> : <p>No tests in this panel.</p>}
  </section>;
}
