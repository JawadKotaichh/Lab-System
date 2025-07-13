import React from "react";
import { tableHandleButton, tableDeleteButton } from "../style";
import type { NavigateFunction } from "react-router-dom";
import type { insuranceCompanyParams } from "./types";
import { InsuranceEditPageURL } from "./data";
import { handleDeleteInsuranceCompany } from "./Function";
import { ColumnFilter } from "./react-table/ColumnFilter";
import type { ColumnDef } from "@tanstack/react-table";

export function getInsuranceCompanyColumns(
  navigate: NavigateFunction,
  showFilters: Record<string, boolean>,
  toggleFilter: (id: string) => void,
  setError: React.Dispatch<React.SetStateAction<string>>
): ColumnDef<insuranceCompanyParams>[] {
  return [
    {
      accessorKey: "insurance_company_name",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search name…"
          label="Name"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
        />
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = (rowA.getValue(columnId) as string).toLowerCase();
        const b = (rowB.getValue(columnId) as string).toLowerCase();
        return a.localeCompare(b);
      },
    },
    {
      accessorKey: "rate",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search rate…"
          label="Rate"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
        />
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = parseFloat(rowA.getValue(columnId) as string) || 0;
        const b = parseFloat(rowB.getValue(columnId) as string) || 0;
        return a - b;
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div className="text-xl mt-4 text-center">Actions</div>,
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex gap-2 justify-center">
            <button
              className={tableHandleButton}
              onClick={() =>
                navigate(
                  `${InsuranceEditPageURL}${company.insurance_company_id}`
                )
              }
            >
              Edit
            </button>
            <button
              className={tableDeleteButton}
              onClick={() =>
                handleDeleteInsuranceCompany({
                  insurance_company_id: company.insurance_company_id,
                  setError,
                })
              }
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];
}
