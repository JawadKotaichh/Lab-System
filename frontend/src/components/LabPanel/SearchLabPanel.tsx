import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type labPanel, type labPanelFilter } from "../types";
import { fetchLabPanelsPaginated } from "../utils";
import { useDebounce } from "../react-table/Debounce";

interface SearchLabPanelParams {
  setAvailableLabPanels: Dispatch<SetStateAction<labPanel[]>>;
  currentPage: number;
  pageSize: number;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setTotalPages: Dispatch<SetStateAction<number>>;
  setTotalNumberOfLabPanels: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}

const SearchLabPanel = ({
  setAvailableLabPanels,
  setLoading,
  setTotalPages,
  setTotalNumberOfLabPanels,
  currentPage,
  setError,
  pageSize,
  searchInput,
  setSearchInput,
}: SearchLabPanelParams) => {
  const [filters, setFilters] = useState<labPanelFilter>({});

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    console.log("I entered effect");
    console.log("searchInput: ", searchInput);
    console.log("debouncedFilters: ", debouncedFilters);
    if (!debouncedFilters.panel_name) return;

    setLoading(true);
    fetchLabPanelsPaginated(currentPage, pageSize, debouncedFilters)
      .then((data) => {
        console.log("Fetched Data: ", data.lab_panels);
        console.log("");
        setAvailableLabPanels(data.lab_panels);
        setTotalPages(data.total_pages);
        setTotalNumberOfLabPanels(data.TotalNumberOfPanels);
      })
      .catch((err) => setError(err.message ?? err.toString()))
      .finally(() => setLoading(false));
  }, [
    currentPage,
    pageSize,
    setLoading,
    setAvailableLabPanels,
    setTotalPages,
    setTotalNumberOfLabPanels,
    setError,
    debouncedFilters,
  ]);

  return (
    <div>
      <input
        placeholder="Search Lab Panel..."
        className="mb-10 text-xl rounded-s-m grow border border-gray-400 p-2 w-full h-15"
        onChange={(e) => {
          setSearchInput(e.target.value);
          console.log("I entered");
          setFilters({ panel_name: e.target.value });
        }}
        value={searchInput}
      />
    </div>
  );
};

export default SearchLabPanel;
