import React from "react";
import { tableHandleButton, tableDeleteButton } from "../style";
import type { NavigateFunction } from "react-router-dom";
import type {
  insuranceCompanyParams,
  labTest,
  labTestCategoryParams,
  patientInfo,
  visitData,
  visitResult,
} from "./types";
import {
  InsuranceEditPageURL,
  labTestCategoryEditPageURL,
  labTestEditPageURL,
  visitEditPageURL,
} from "./data";
import {
  handleAddLabTest,
  handleDeleteInsuranceCompany,
  handleDeleteLabTest,
  handleDeleteLabTestCategory,
  handleDeletePatient,
  handleDeleteVisit,
  handleNewVisit,
} from "./Function";
import { ColumnFilter } from "./react-table/ColumnFilter";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
        const {
          name,
          insurance_company_id,
          gender,
          DOB,
          phone_number,
          patient_id,
          insurance_company_name,
        } = row.original;
        const patient = {
          patient_id,
          name,
          gender,
          DOB,
          phone_number,
          insurance_company_id,
          insurance_company_name,
        };
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
            <button
              className={tableHandleButton + " w-fit"}
              onClick={() =>
                handleNewVisit(
                  insurance_company_name,
                  patient,
                  navigate,
                  setError
                )
              }
            >
              New Visit
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
  setError: React.Dispatch<React.SetStateAction<string>>,
  showAdd: boolean,
  pagination?: PaginationState,
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>,
  visit_id?: string,
  results?: visitResult[],
  setResults?: React.Dispatch<React.SetStateAction<visitResult[]>>,
  setAddError?: React.Dispatch<React.SetStateAction<string>>,
  showTestsTable?: boolean,
  setShowTestsTable?: React.Dispatch<React.SetStateAction<boolean>>,
  setTotalPages?: React.Dispatch<React.SetStateAction<number>>,
  setTotalNumberOfTests?: React.Dispatch<React.SetStateAction<number>>
): ColumnDef<labTest>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnFilter
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
          withFilter={true}
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
        console.log("lab_Test_id: ", lab_test_id);

        if (showAdd) {
          console.log("lab_Test_id: ", lab_test_id);
          return (
            <div className="flex gap-2 justify-center">
              <button
                className={tableHandleButton}
                onClick={() => {
                  if (
                    !pagination ||
                    !setPagination ||
                    !visit_id ||
                    !setAddError ||
                    !results ||
                    !setShowTestsTable ||
                    !setTotalNumberOfTests ||
                    !setResults ||
                    !showTestsTable ||
                    !setTotalPages
                  ) {
                    return setError?.(
                      "Cannot add test, one of the parameters is not given"
                    );
                  }
                  handleAddLabTest({
                    pagination,
                    setPagination,
                    visit_id,
                    setAddError,
                    results,
                    setShowTestsTable,
                    setTotalNumberOfTests,
                    setError,
                    setResults,
                    showTestsTable,
                    setTotalPages,
                    lab_test_id,
                  });
                }}
              >
                Add
              </button>
            </div>
          );
        }
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

export function getLabTestCategoryColumns(
  navigate: NavigateFunction,
  showFilters: Record<string, boolean>,
  toggleFilter: (id: string) => void,
  setError: React.Dispatch<React.SetStateAction<string>>
): ColumnDef<labTestCategoryParams>[] {
  return [
    {
      accessorKey: "lab_test_category_name",
      header: ({ column }) => (
        <ColumnFilter
          withFilter={true}
          column={column}
          placeholder="Search name…"
          label="Category Name"
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
        const { lab_test_category_id } = row.original;
        return (
          <div className="flex gap-2 justify-center">
            <button
              className={tableHandleButton}
              onClick={() =>
                navigate(`${labTestCategoryEditPageURL}${lab_test_category_id}`)
              }
            >
              Edit
            </button>
            <button
              className={tableDeleteButton}
              onClick={() =>
                handleDeleteLabTestCategory({
                  elementID: lab_test_category_id,
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

export function getVisitsColumns(
  navigate: NavigateFunction,
  showFilters: Record<string, boolean>,
  toggleFilter: (id: string) => void,
  setError: React.Dispatch<React.SetStateAction<string>>
): ColumnDef<visitData>[] {
  return [
    {
      accessorKey: "visit_date",
      cell: ({ getValue }) => {
        const iso = getValue<string>() ?? "";
        return iso.split("T")[0];
      },
      header: ({ column }) => (
        <ColumnFilter
          withFilter={true}
          inputType="date"
          column={column}
          placeholder="Search visit date…"
          label="Visit Date"
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
      accessorKey: "patient.name",
      header: ({ column }) => (
        <ColumnFilter
          withFilter={true}
          column={column}
          placeholder="Search patient name..."
          label="Patient Name"
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
          withFilter={true}
          column={column}
          placeholder="Search insurrance company"
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
      accessorKey: "patient.phone_number",
      header: ({ column }) => (
        <ColumnFilter
          withFilter={true}
          column={column}
          inputType="tel"
          placeholder="Search phone number..."
          label="Phone Number"
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
      accessorKey: "total_price",
      cell: ({ row }) => `${row.original.total_price.toFixed(2)} $ `,
      header: ({ column }) => (
        <ColumnFilter
          withFilter={false}
          column={column}
          placeholder="Search price..."
          label="Total Price"
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
      accessorKey: "total_price_with_insurance",
      cell: ({ row }) =>
        `${row.original.total_price_with_insurance.toFixed(2)} $ `,
      header: ({ column }) => (
        <ColumnFilter
          withFilter={false}
          column={column}
          placeholder="Search price..."
          label="Price With Insurance"
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
      accessorKey: "completed_tests_results",
      cell: ({ row }) =>
        `${row.original.completed_tests_results} / ${row.original.total_tests_results}`,
      sortingFn: (rowA, rowB) => {
        const a =
          rowA.original.completed_tests_results /
          rowA.original.total_tests_results;
        const b =
          rowB.original.completed_tests_results /
          rowB.original.total_tests_results;
        return a - b;
      },
      header: ({ column }) => (
        <ColumnFilter
          withFilter={false}
          column={column}
          inputType="number"
          placeholder="Search Completed..."
          label="Completed / Total"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
        />
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div className="text-xl mt-4 text-center">Actions</div>,
      cell: ({ row }) => {
        const { visit_id, patient, insurance_company_name } = row.original;
        return (
          <div className="flex gap-2 justify-center">
            <button
              className={tableHandleButton}
              onClick={() => {
                console.log(patient);

                navigate(`${visitEditPageURL}${visit_id}`, {
                  state: {
                    patientData: {
                      ...patient,
                      insurance_company_name: insurance_company_name,
                    },
                  },
                });
              }}
            >
              Edit
            </button>
            <button
              className={tableHandleButton + " w-fit"}
              onClick={() => navigate(`/visits/${visit_id}`)}
            >
              Preview Result
            </button>
            <button
              className={tableDeleteButton}
              onClick={() =>
                handleDeleteVisit({
                  elementID: visit_id,
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
