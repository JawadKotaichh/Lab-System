import React from "react";
import { tableHandleButton, tableDeleteButton } from "../style";
import type { NavigateFunction } from "react-router-dom";
import type { insuranceCompanyParams, labTest, patientInfo } from "./types";
import { InsuranceEditPageURL, labTestEditPageURL } from "./data";
import {
  handleDeleteInsuranceCompany,
  handleDeleteLabTest,
  handleDeletePatient,
} from "./Function";
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
                  elementID: company.insurance_company_id,
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

export function getPatientsColumns(
  navigate: NavigateFunction,
  showFilters: Record<string, boolean>,
  toggleFilter: (id: string) => void,
  setError: React.Dispatch<React.SetStateAction<string>>
): ColumnDef<patientInfo>[] {
  return [
    {
      accessorKey: "name",
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
      accessorKey: "gender",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search gender..."
          label="Gender"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]}
        />
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = (rowA.getValue(columnId) as string).toLowerCase();
        const b = (rowB.getValue(columnId) as string).toLowerCase();
        return a.localeCompare(b);
      },
    },
    {
      accessorKey: "DOB",
      cell: ({ getValue }) => {
        const iso = getValue<string>() ?? "";
        return iso.split("T")[0];
      },
      header: ({ column }) => (
        <ColumnFilter
          inputType="date"
          column={column}
          placeholder="Search DOB…"
          label="DOB"
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
      accessorKey: "insurance_company_name",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search insurance company..."
          label="Insurance Company"
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
      accessorKey: "phone_number",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search phone number..."
          label="Phone Number"
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
        const { patient_id } = row.original;
        return (
          <div className="flex gap-2 justify-center">
            <button
              className={tableHandleButton}
              onClick={() => navigate(`/patients/edit-patient/${patient_id}`)}
            >
              Edit
            </button>
            <button
              className={tableDeleteButton}
              onClick={() =>
                handleDeletePatient({
                  elementID: patient_id,
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

export function getLabTestColumns(
  navigate: NavigateFunction,
  showFilters: Record<string, boolean>,
  toggleFilter: (id: string) => void,
  setError: React.Dispatch<React.SetStateAction<string>>
): ColumnDef<labTest>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search name…"
          label="Lab Test"
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
      accessorKey: "nssf_id",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search Nssf Id..."
          label="NSSF ID"
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
      accessorKey: "lab_test_category_name",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search lab category"
          label="Category"
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
      accessorKey: "unit",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search unit..."
          label="Unit"
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
      accessorKey: "price",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search price..."
          label="Price"
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
      accessorKey: "lower_bound",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search lower boound..."
          label="Lower Bound"
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
      accessorKey: "upper_bound",
      header: ({ column }) => (
        <ColumnFilter
          column={column}
          placeholder="Search upper bound..."
          label="Upper Bound"
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
      id: "actions",
      enableSorting: false,
      header: () => <div className="text-xl mt-4 text-center">Actions</div>,
      cell: ({ row }) => {
        const { lab_test_id } = row.original;
        return (
          <div className="flex gap-2 justify-center">
            <button
              className={tableHandleButton}
              onClick={() => navigate(`${labTestEditPageURL}${lab_test_id}`)}
            >
              Edit
            </button>
            <button
              className={tableDeleteButton}
              onClick={() =>
                handleDeleteLabTest({
                  elementID: lab_test_id,
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
