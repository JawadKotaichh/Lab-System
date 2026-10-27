import type { PaginationParams } from "./types";

const Pagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
  pageSize,
  setPageSize,
}: PaginationParams) => {
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    if (Number.isInteger(newSize) && newSize > 0) {
      setPageSize(Math.min(100, newSize));
      setCurrentPage(1);
    }
  };
  return (
    <div className="bottom-0 right-0 mt-5 mb-5 flex gap-4 items-center">
      <button
        className="border rounded-sm w-20 px-2 py-1 hover:bg-green-500"
        disabled={currentPage <= 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {Math.max(1, totalPages)}
      </span>
      <button
        className="border rounded-sm w-20 px-2 py-1 hover:bg-green-500"
        disabled={currentPage >= Math.max(1, totalPages)}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Next
      </button>

      <span>Page size</span>
      <input
        type="number"
        min="1"
        max="100"
        step="1"
        value={pageSize}
        className="w-20 px-2 py-1 border rounded text-center"
        placeholder="Page Size"
        onChange={(e) => handlePageSizeChange(e)}
      />
    </div>
  );
};
export default Pagination;
