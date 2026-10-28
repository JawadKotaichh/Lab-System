import { secondaryButtonStyle } from "./ActionButton";
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
    <div className="my-5 flex flex-wrap gap-3 items-center">
      <button
        type="button" className={secondaryButtonStyle}
        disabled={currentPage <= 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {Math.max(1, totalPages)}
      </span>
      <button
        type="button" className={secondaryButtonStyle}
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
        aria-label="Page size" className="h-10 w-20 rounded-lg border border-blue-200 px-2 text-center focus:outline-blue-600"
        placeholder="Page Size"
        onChange={(e) => handlePageSizeChange(e)}
      />
    </div>
  );
};
export default Pagination;
