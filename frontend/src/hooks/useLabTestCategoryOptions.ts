import { useEffect, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { labTestCategoryParams } from "../components/types";
import {
  fetchAllFinancialTransactions,
  fetchAllLabTestTypeCategories,
} from "../components/utils";

type Option = { value: string; label: string };

const labTestCategoryCache: { options: Option[] | null } = { options: null };
const financialTransactionCache: { options: Option[] | null } = {
  options: null,
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
  const [options, setOptions] = useState<Option[]>(
    financialTransactionCache.options ?? []
  );

  useEffect(() => {
    if (financialTransactionCache.options) {
      setOptions(financialTransactionCache.options);
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      try {
        const transactions = await fetchAllFinancialTransactions();
        const uniqueCategories = Array.from(
          new Set(transactions.map((transaction) => transaction.category))
        ).filter(Boolean);
        const nextOptions = uniqueCategories.map((category) => ({
          value: category,
          label: category,
        }));
        financialTransactionCache.options = nextOptions;
        if (!cancelled) {
          setOptions(nextOptions);
        }
      } catch (err) {
        console.error("Failed to load financial transaction categories", err);
      }
    };

    void loadCategories();

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
