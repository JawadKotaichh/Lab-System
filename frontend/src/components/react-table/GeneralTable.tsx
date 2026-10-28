import { Fragment } from "react";
import { flexRender, type Row, type Table } from "@tanstack/react-table";

interface GenericTableProps<TData> {
  table: Table<TData>;
  loading?: boolean;
  noDataMessage?: string;
  tableStyle?: string;
  tableHeadStyle?: string;
  cellStyle?: string;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  renderFooterRow?: (table: Table<TData>) => React.ReactNode;
}

const GenericTable = <TData,>({
  table,
  loading = false,
  noDataMessage = "No records found",
  tableStyle = "overflow-y-auto overflow-visible relative border rounded-b-sm w-full table-auto bg-white shadow text-center",
  tableHeadStyle,
  cellStyle = "px-4 py-2",
  renderFooterRow,
  renderExpandedRow,
}: GenericTableProps<TData>) => (
  <div className="w-full ">
    <table className={tableStyle}>
      <thead className={tableHeadStyle}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="px-2 py-2 text-center">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <tr className="border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cellStyle}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {renderExpandedRow && row.getIsExpanded() && (
                <tr><td colSpan={row.getVisibleCells().length} className="bg-gray-50 p-4">{renderExpandedRow(row)}</td></tr>
              )}
            </Fragment>
          ))
        ) : (
          <tr>
            <td colSpan={table.getAllLeafColumns().length} className="py-4">
              {loading ? "Loading…" : noDataMessage}
            </td>
          </tr>
        )}
      </tbody>
      {renderFooterRow ? <tfoot>{renderFooterRow(table)}</tfoot> : null}
    </table>
  </div>
);

export default GenericTable;
