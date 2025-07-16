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
}

const SearchLabPanel = ({
  setAvailableLabPanels,
  setLoading,
  setTotalPages,
  setTotalNumberOfLabPanels,
  currentPage,
  setError,
  pageSize,
}: SearchLabPanelParams) => {
  const [searchInput, setSearchInput] = useState<string>("");
  const [filters, setFilters] = useState<labPanelFilter>({});

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    setLoading(true);
    fetchLabPanelsPaginated(currentPage, pageSize, debouncedFilters)
      .then((data) => {
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
          setFilters({ panel_name: e.target.value });
        }}
        value={searchInput}
      />
    </div>
  );
};

export default SearchLabPanel;
