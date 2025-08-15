import React, { useEffect, useState } from "react";
import type { labPanel, labPanelFilter } from "../types";
import { fetchLabPanelsPaginated } from "../utils";

interface SearchLabPanelProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  setAvailableLabPanels: React.Dispatch<React.SetStateAction<labPanel[]>>;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  currentPage: number;
  setTotalPages: (pages: number) => void;
  setTotalNumberOfLabPanels: (count: number) => void;
  pageSize: number;
}

const SearchLabPanel: React.FC<SearchLabPanelProps> = ({
  searchInput,
  setSearchInput,
  setAvailableLabPanels,
  setError,
  setLoading,
  currentPage,
  setTotalPages,
  setTotalNumberOfLabPanels,
  pageSize,
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchInput]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearch.trim()) return;

      try {
        setLoading(true);
        const filters: labPanelFilter = {};
        filters.panel_name = debouncedSearch;
        const response = await fetchLabPanelsPaginated(
          currentPage,
          pageSize,
          filters
        );

        setAvailableLabPanels(response.lab_panels);
        setTotalPages(response.total_pages);
        setTotalNumberOfLabPanels(response.TotalNumberOfPanels);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [
    debouncedSearch,
    currentPage,
    pageSize,
    setAvailableLabPanels,
    setError,
    setLoading,
    setTotalPages,
    setTotalNumberOfLabPanels,
  ]);

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
  };

  return (
    <div className="relative mb-4">
      <div className="flex items-center">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by panel name..."
          className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>
      <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
    </div>
  );
};

export default SearchLabPanel;
