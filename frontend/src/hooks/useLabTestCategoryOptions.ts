import { useEffect, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { labTestCategoryParams } from "../types";
import { fetchAllLabTestTypeCategories } from "../utils";

type Option = { value: string; label: string };

const cache: { options: Option[] | null } = { options: null };

export const useLabTestCategoryOptions = () => {
  const [options, setOptions] = useState<Option[]>(cache.options ?? []);

  useEffect(() => {
    if (cache.options) {
      setOptions(cache.options);
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      try {
        const categories = await fetchAllLabTestTypeCategories();
        const nextOptions = categories.map((category: labTestCategoryParams) => ({
          value: category.lab_test_category_id,
          label: category.lab_test_category_name,
        }));
        cache.options = nextOptions;
        if (!cancelled) {
          setOptions(nextOptions);
        }
      } catch (err) {
        console.error("Failed to load lab test categories", err);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return options;
};

export const buildLabTestFilters = (
  columnFilters: ColumnFiltersState
): Record<string, string> =>
  columnFilters.reduce<Record<string, string>>((acc, filter) => {
    if (!filter.value) return acc;
    const value = String(filter.value);
    if (filter.id === "lab_test_category_name") {
      acc["lab_test_category_id"] = value;
    } else {
      acc[filter.id] = value;
    }
    return acc;
  }, {});
