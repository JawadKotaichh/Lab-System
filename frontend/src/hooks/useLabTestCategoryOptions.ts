import { useEffect, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { labTestCategoryParams } from "../components/types";
import {
  fetchAllfinancialTransactionsCategories,
  fetchAllfinancialTransactionsCurrencies,
  fetchAllfinancialTransactionsTypes,
  fetchAllLabTestTypeCategories,
} from "../components/utils";

type Option = { value: string; label: string };
type FinancialTransactionOptions = {
  categoryOptions: Option[];
  currencyOptions: Option[];
  typeOptions: Option[];
};

const labTestCategoryCache: { options: Option[] | null } = { options: null };
const financialTransactionCache: {
  categoryOptions: Option[] | null;
  currencyOptions: Option[] | null;
  typeOptions: Option[] | null;
} = {
  categoryOptions: null,
  currencyOptions: null,
  typeOptions: null,
};

const buildOptions = (items: unknown[], key: string): Option[] => {
  const values: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      if (item) values.push(item);
      continue;
    }
    if (item && typeof item === "object" && key in item) {
      const raw = (item as Record<string, unknown>)[key];
      if (typeof raw === "string" && raw) {
        values.push(raw);
      }
    }
  }
  const uniqueValues = Array.from(new Set(values));
  return uniqueValues.map((value) => ({ value, label: value }));
};

export const useLabTestCategoryOptions = () => {
  const [options, setOptions] = useState<Option[]>(
    labTestCategoryCache.options ?? []
  );

  useEffect(() => {
    if (labTestCategoryCache.options) {
      setOptions(labTestCategoryCache.options);
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
        labTestCategoryCache.options = nextOptions;
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
  
export const useFinancialTransactionsOptions = () => {
  const [options, setOptions] = useState<FinancialTransactionOptions>({
    categoryOptions: financialTransactionCache.categoryOptions ?? [],
    currencyOptions: financialTransactionCache.currencyOptions ?? [],
    typeOptions: financialTransactionCache.typeOptions ?? [],
  });

  useEffect(() => {
    if (
      financialTransactionCache.categoryOptions &&
      financialTransactionCache.currencyOptions &&
      financialTransactionCache.typeOptions
    ) {
      setOptions({
        categoryOptions: financialTransactionCache.categoryOptions,
        currencyOptions: financialTransactionCache.currencyOptions,
        typeOptions: financialTransactionCache.typeOptions,
      });
      return;
    }

    let cancelled = false;

    const loadOptions = async () => {
      try {
        const [categories, currencies, types] = await Promise.all([
          fetchAllfinancialTransactionsCategories(),
          fetchAllfinancialTransactionsCurrencies(),
          fetchAllfinancialTransactionsTypes(),
        ]);
        const nextCategoryOptions = buildOptions(
          categories as unknown[],
          "category"
        );
        const nextCurrencyOptions = buildOptions(
          currencies as unknown[],
          "currency"
        );
        const nextTypeOptions = buildOptions(types as unknown[], "type");
        financialTransactionCache.categoryOptions = nextCategoryOptions;
        financialTransactionCache.currencyOptions = nextCurrencyOptions;
        financialTransactionCache.typeOptions = nextTypeOptions;
        if (!cancelled) {
          setOptions({
            categoryOptions: nextCategoryOptions,
            currencyOptions: nextCurrencyOptions,
            typeOptions: nextTypeOptions,
          });
        }
      } catch (err) {
        console.error("Failed to load financial transaction options", err);
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  return options;
};



export const buildFinancialTransactionsFilters = (
  columnFilters: ColumnFiltersState
): Record<string, string> =>
  columnFilters.reduce<Record<string, string>>((acc, filter) => {
    if (!filter.value) return acc;
    const value = String(filter.value);
    if (filter.id === "currency") {
      acc["currency"] = value;
    } else if(filter.id === "type"){
        acc["type"] = value;
    }else if(filter.id === "category"){
        acc["category"] = value;
    }
    else {
      acc[filter.id] = value;
    }
    return acc;
  }, {});
