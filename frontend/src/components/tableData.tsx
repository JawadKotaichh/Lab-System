import React from "react";
import { tableHandleButton } from "../style";
import type { NavigateFunction } from "react-router-dom";
import type {
  insuranceCompanyParams,
  labPanelsWithIdsList,
  labTest,
  labTestCategoryParams,
  lower_bound_only,
  normal_value_by_gender,
  patientInfo,
  patientPanelResult,
  patientTestResult,
  positive_or_negative,
  upper_and_lower_bound_only,
  upper_bound_only,
  description_only,
  visitData,
} from "./types";
import {
  InsuranceEditPageURL,
  labTestCategoryEditPageURL,
  labTestEditPageURL,
  visitEditPageURL,
} from "./data";
import {
  handleAdd,
  handleAddLabTest,
  handleDeleteInsuranceCompany,
  handleDeleteLabTest,
  handleDeleteLabTestCategory,
  handleDeletePatient,
  handleDeleteVisit,
  handleNewVisit,
} from "./Function";
import { ColumnFilter } from "./react-table/ColumnFilter";

export interface LabTestColumnOptions {
  showAddForLabPanels?: boolean;
  setShowAddForLabPanels?: React.Dispatch<React.SetStateAction<boolean>>;
  data?: labPanelsWithIdsList;
  setData?: React.Dispatch<React.SetStateAction<labPanelsWithIdsList>>;
  setAddError?: React.Dispatch<React.SetStateAction<string>>;
  pagination?: PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationState>>;
  visit_id?: string;
  panelResults?: patientPanelResult[];
  setPanelResults?: React.Dispatch<React.SetStateAction<patientPanelResult[]>>;
  standAloneTestResults?: patientTestResult[];
  setStandAloneTestResults?: React.Dispatch<
    React.SetStateAction<patientTestResult[]>
  >;
  onAddedRefresh?: () => Promise<void>;
  showTestsTable?: boolean;
  setShowTestsTable?: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalPages?: React.Dispatch<React.SetStateAction<number>>;
  setTotalNumberOfTests?: React.Dispatch<React.SetStateAction<number>>;
  labTestCategoryOptions?: { value: string; label: string }[];
  existingLabTestTypeIds?: Set<string>;
  markExistingLabTestIdsDirty?: () => void;
}
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import renderNormalValue from "./renderNormalValue";
import MeatballsMenu from "./react-table/MeatBallsMenu";

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
      accessorKey: "currency",
      header: ({ column }) => (
        <ColumnFilter
          withFilter={false}
          column={column}
          placeholder="Search currency..."
          label="Currency"
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
        const company = row.original;
        return (
          <div className="flex justify-center">
            <MeatballsMenu
              items={[
                {
                  label: "Edit",
                  onClick: () =>
                    navigate(
                      `${InsuranceEditPageURL}${company.insurance_company_id}`
                    ),
                },
                {
                  label: "Delete",
                  onClick: () =>
                    handleDeleteInsuranceCompany({
                      elementID: company.insurance_company_id,
                      setError,
                    }),
                  className: "text-red-600",
                },
              ]}
            />
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
          <div className="flex justify-center">
            <MeatballsMenu
              items={[
                {
                  label: "Edit",
                  onClick: () =>
                    navigate(`/patients/edit-patient/${patient_id}`),
                },
                {
                  label: "Delete",
                  onClick: () =>
                    handleDeletePatient({
                      elementID: patient_id,
                      setError,
                    }),
                  className: "text-red-600",
                },
                {
                  label: "New Visit",
                  onClick: () =>
                    handleNewVisit(
                      insurance_company_name,
                      patient,
                      navigate,
                      setError
                    ),
                  className: "text-blue-600",
                },
              ]}
            />
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
  options?: LabTestColumnOptions
): ColumnDef<labTest>[] {
  const {
    showAddForLabPanels,
    setShowAddForLabPanels,
    data,
    setData,
    setAddError,
    pagination,
    setPagination,
    visit_id,
    panelResults,
    setPanelResults,
    standAloneTestResults,
    setStandAloneTestResults,
    onAddedRefresh,
    showTestsTable,
    setShowTestsTable,
    setTotalPages,
    setTotalNumberOfTests,
    labTestCategoryOptions,
    existingLabTestTypeIds,
    markExistingLabTestIdsDirty,
  } = options ?? {};
  type BoundsNV =
    | upper_and_lower_bound_only
    | upper_bound_only
    | lower_bound_only;
  type NormalValue = BoundsNV | positive_or_negative | normal_value_by_gender;
  type GenderInnerNV = BoundsNV | positive_or_negative | description_only;
  const isBoundsNV = (x: GenderInnerNV): x is BoundsNV =>
    "upper_bound_value" in x || "lower_bound_value" in x;
  const fmtBounds = (x: BoundsNV) => {
    if ("upper_bound_value" in x && "lower_bound_value" in x) {
      return `${x.lower_bound_value} – ${x.upper_bound_value}`;
    }
    if ("upper_bound_value" in x) return `≤ ${x.upper_bound_value}`;
    return `≥ ${x.lower_bound_value}`;
  };

  const fmtGenderInner = (x: GenderInnerNV) => {
    if ("normal_value" in x) return x.normal_value;
    if (isBoundsNV(x)) return fmtBounds(x);
    if ("description" in x) return x.description || "—";
    return "—";
  };

  const toNormalValueText = (row: labTest): string => {
    return (row.normal_value_list ?? [])
      .map((nv: NormalValue) => {
        const desc = nv.description ? `(${nv.description}) ` : "";
        if (
          "male_normal_value_type" in nv &&
          "female_normal_value_type" in nv
        ) {
          return `${desc}M: ${fmtGenderInner(
            nv.male_normal_value_type
          )} | F: ${fmtGenderInner(nv.female_normal_value_type)}`;
        }
        if ("normal_value" in nv) {
          return `${desc}${nv.normal_value}`;
        }
        return `${desc}${fmtBounds(nv)}`;
      })
      .join(" | ");
  };
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnFilter
          withFilter
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
          withFilter
          column={column}
          placeholder="Search NSSF ID…"
          label="NSSF ID"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
        />
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = Number(rowA.getValue(columnId)) || 0;
        const b = Number(rowB.getValue(columnId)) || 0;
        return a - b;
      },
    },
    {
      accessorKey: "lab_test_category_name",
      header: ({ column }) => (
        <ColumnFilter
          withFilter
          column={column}
          placeholder="Search lab category…"
          label="Category"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
          options={labTestCategoryOptions}
        />
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = ((rowA.getValue(columnId) as string) || "").toLowerCase();
        const b = ((rowB.getValue(columnId) as string) || "").toLowerCase();
        return a.localeCompare(b);
      },
    },
    {
      accessorKey: "unit",
      header: ({ column }) => (
        <ColumnFilter
          withFilter
          column={column}
          placeholder="Search unit…"
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
          withFilter
          column={column}
          placeholder="Search L …"
          label="L"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
        />
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = Number(rowA.getValue(columnId)) || 0;
        const b = Number(rowB.getValue(columnId)) || 0;
        return a - b;
      },
    },
    {
      id: "normal_value",
      header: ({ column }) => (
        <ColumnFilter
          withFilter
          column={column}
          placeholder="Search normal value…"
          label="Normal Value"
          showFilter={!!showFilters[column.id]}
          toggleShowFilter={() => toggleFilter(column.id)}
        />
      ),
      accessorFn: (row) => toNormalValueText(row),
      cell: ({ row }) => {
        const list = row.original.normal_value_list ?? [];
        if (!list.length) return <span className="text-gray-400">—</span>;
        return (
          <div className="text-left">
            {list.map((nv, i) => (
              <div key={i}>{renderNormalValue(nv)}</div>
            ))}
          </div>
        );
      },
      sortingFn: (rowA, rowB, columnId) => {
        const a = ((rowA.getValue(columnId) as string) || "").toLowerCase();
        const b = ((rowB.getValue(columnId) as string) || "").toLowerCase();
        return a.localeCompare(b);
      },
    },

    {
      id: "actions",
      enableSorting: false,
      header: () => <div className="text-xl mt-4 text-center">Actions</div>,
      cell: ({ row }) => {
        const { lab_test_id } = row.original;

        const items: {
          label: string;
          onClick: () => void;
          className?: string;
        }[] = [];

        if (showAdd) {
          items.push({
            label: "Add",
            className: "text-blue-600",
            onClick: () => {
              if (
                !pagination ||
                !setPagination ||
                !visit_id ||
                !setAddError ||
                !standAloneTestResults ||
                !setStandAloneTestResults ||
                !panelResults ||
                !setPanelResults ||
                !setShowTestsTable ||
                !setTotalNumberOfTests ||
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
                panelResults,
                setPanelResults,
                standAloneTestResults,
                setStandAloneTestResults,
                setShowTestsTable,
                // setTotalNumberOfTests,
                setError,
                showTestsTable,
                existingLabTestTypeIds,
                markExistingLabTestIdsDirty,
                // setTotalPages,
                lab_test_id,
                refreshResults: onAddedRefresh,
              });
            },
          });
        } else if (
          showAddForLabPanels &&
          setAddError &&
          setData &&
          data &&
          setShowAddForLabPanels
        ) {
          items.push({
            label: "Add",
            className: "text-blue-600",
            onClick: () =>
              handleAdd({
                lab_test_id,
                lab_test: row.original,
                data,
                setAddError,
                setShowAddForLabPanels,
                setData,
                setError,
              }),
          });
        } else {
          items.push(
            {
              label: "Edit",
              onClick: () => navigate(`${labTestEditPageURL}${lab_test_id}`),
            },
            {
              label: "Delete",
              className: "text-red-600",
              onClick: () =>
                handleDeleteLabTest({
                  elementID: lab_test_id,
                  setError,
                }),
            }
          );
        }
        if (items.length == 1) {
          return (
            <div className="flex justify-center">
              {items.map((item) => (
                <button
                  className={tableHandleButton}
                  onClick={() => item.onClick()}
                >
                  {item.label}
                </button>
              ))}
            </div>
          );
        } else {
          return (
            <div className="flex justify-center">
              <MeatballsMenu items={items} />
            </div>
          );
        }
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
          <div className="flex justify-center">
            <MeatballsMenu
              items={[
                {
                  label: "Edit",
                  onClick: () =>
                    navigate(
                      `${labTestCategoryEditPageURL}${lab_test_category_id}`
                    ),
                },
                {
                  label: "Delete",
                  onClick: () =>
                    handleDeleteLabTestCategory({
                      elementID: lab_test_category_id,
                      setError,
                    }),
                  className: "text-red-600",
                },
              ]}
            />
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
          label="Date"
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
          label=" Name"
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
    // {
    //   accessorKey: "total_price",
    //   cell: ({ row }) => `${row.original.total_price.toFixed(2)} $ `,
    //   header: ({ column }) => (
    //     <ColumnFilter
    //       withFilter={false}
    //       column={column}
    //       placeholder="Search price..."
    //       label="Total Price"
    //       showFilter={!!showFilters[column.id]}
    //       toggleShowFilter={() => toggleFilter(column.id)}
    //     />
    //   ),
    //   sortingFn: (rowA, rowB, columnId) => {
    //     const a = parseFloat(rowA.getValue(columnId) as string) || 0;
    //     const b = parseFloat(rowB.getValue(columnId) as string) || 0;
    //     return a - b;
    //   },
    // },
    {
      accessorKey: "total_price_with_insurance",
      cell: ({ row }) => {
        const currency = row.original.currency ?? "$";
        if (currency === "USD")
          return `${row.original.total_price_with_insurance.toFixed(2)} $`;
        else
          return `${row.original.total_price_with_insurance.toLocaleString(
            "en-US"
          )} LBP`;
      },
      header: ({ column }) => (
        <ColumnFilter
          withFilter={false}
          column={column}
          placeholder="Search price..."
          label="Price & Insurance"
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
          <div className="flex justify-center">
            <MeatballsMenu
              items={[
                {
                  label: "Edit",
                  onClick: () =>
                    navigate(`${visitEditPageURL}${visit_id}`, {
                      state: {
                        patientData: {
                          ...patient,
                          insurance_company_name: insurance_company_name,
                        },
                      },
                    }),
                },
                {
                  label: "Preview Result",
                  onClick: () => navigate(`/result/${visit_id}`),
                  className: "text-blue-600",
                },
                {
                  label: "View Invoice",
                  onClick: () => navigate(`/invoice/${visit_id}`),
                  className: "text-blue-600",
                },
                {
                  label: "Delete",
                  onClick: () =>
                    handleDeleteVisit({
                      elementID: visit_id,
                      setError,
                    }),
                  className: "text-red-600",
                },
              ]}
            />
          </div>
        );
      },
    },
  ];
}
