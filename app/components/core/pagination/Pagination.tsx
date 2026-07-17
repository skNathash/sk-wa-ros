import { memo, useEffect, useRef, useState } from "react";

interface PaginationProps {
  totalRecords: number;
  rowsPerPage: number;
  callback?: (data: { activePage: number; startSlNo: number; endSlNo: number }) => void;
  activePage?: number;
  size?: "sm" | "md" | "lg";
}

interface PaginationState {
  showNext: boolean;
  showPrev: boolean;
  showLast: boolean;
  showFirst: boolean;
  activePage: number;
  pages: number;
}

const Pagination = ({
  totalRecords,
  rowsPerPage,
  callback,
  activePage = 1,
  size = "md",
}: PaginationProps) => {
  const triggerCb = useRef(false);
  const maxSteps = 5;
  const [data, setData] = useState<PaginationState>({
    showNext: false,
    showPrev: false,
    showLast: false,
    showFirst: false,
    activePage,
    pages: 1,
  });
  const [displayNums, setDisplayNums] = useState<number[]>([]);

  useEffect(() => {
    const pages = Math.ceil(totalRecords / rowsPerPage);
    const hasMore = pages > maxSteps;
    triggerCb.current = false;
    setData({
      showFirst: hasMore,
      showLast: hasMore,
      showNext: hasMore,
      showPrev: hasMore,
      activePage,
      pages,
    });
  }, [totalRecords, rowsPerPage, activePage]);

  useEffect(() => {
    const n = getDisplayNums();
    setDisplayNums(n);
  }, [data.activePage, data.pages]);

  useEffect(() => {
    if (triggerCb.current && callback) {
      callback({
        activePage: data.activePage,
        startSlNo: data.activePage * rowsPerPage - rowsPerPage + 1,
        endSlNo: Math.min(data.activePage * rowsPerPage, totalRecords),
      });
      triggerCb.current = false;
    }
  }, [data.activePage, rowsPerPage, callback, totalRecords]);

  const getDisplayNums = (): number[] => {
    const arr: number[] = [];
    const iterVal = Math.floor(maxSteps / 2);

    for (let i = data.activePage - iterVal; i < data.activePage; i++) {
      if (i > 0) {
        arr.push(i);
      }
    }

    const start = arr.length !== iterVal ? arr.length + 1 : data.activePage;
    const last = data.activePage + iterVal + (iterVal - arr.length);

    for (let i = start; i < last; i++) {
      if (i <= data.pages) {
        arr.push(i);
      }
    }

    return arr;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.pages) {
      setData((prev) => ({ ...prev, activePage: newPage }));
      triggerCb.current = true;
    }
  };

  const onNextClick = () => handlePageChange(data.activePage + 1);
  const onPrevClick = () => handlePageChange(data.activePage - 1);
  const onLastClick = () => handlePageChange(data.pages);
  const onFirstClick = () => handlePageChange(1);
  const onNumClick = (val: number) => handlePageChange(val);

  if (!totalRecords || displayNums.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="pagination navigation" className="d-inline-block">
      <ul className={`pagination pagination-${size} cursor-pointer`}>
        {data.showFirst && (
          <li className={`page-item ${data.activePage === 1 ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={onFirstClick}
              aria-label="First page"
              disabled={data.activePage === 1}
            >
              <span aria-hidden="true">First</span>
            </button>
          </li>
        )}

        {data.showPrev && (
          <li className={`page-item ${data.activePage === 1 ? "disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={onPrevClick}
              aria-label="Previous page"
              disabled={data.activePage === 1}
            >
              <span aria-hidden="true">Previous</span>
            </button>
          </li>
        )}

        {displayNums.map((pageNum) => (
          <li
            key={pageNum}
            className={`page-item ${data.activePage === pageNum ? "active" : ""}`}
          >
            <button
              type="button"
              className="page-link"
              onClick={() => onNumClick(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={data.activePage === pageNum ? "page" : undefined}
            >
              {pageNum}
            </button>
          </li>
        ))}

        {data.showNext && (
          <li
            className={`page-item ${
              data.activePage >= data.pages ? "disabled" : ""
            }`}
          >
            <button
              type="button"
              className="page-link"
              onClick={onNextClick}
              aria-label="Next page"
              disabled={data.activePage >= data.pages}
            >
              <span aria-hidden="true">Next</span>
            </button>
          </li>
        )}

        {data.showLast && (
          <li
            className={`page-item ${
              data.activePage >= data.pages ? "disabled" : ""
            }`}
          >
            <button
              type="button"
              className="page-link"
              onClick={onLastClick}
              aria-label="Last page"
              disabled={data.activePage >= data.pages}
            >
              <span aria-hidden="true">Last</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default memo(Pagination);
