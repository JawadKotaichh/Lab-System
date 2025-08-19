import React from "react";

interface SearchLabPanelProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
}

const SearchLabPanel: React.FC<SearchLabPanelProps> = ({
  searchInput,
  setSearchInput,
}) => {
  const handleClearSearch = () => {
    setSearchInput("");
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
            type="button"
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
