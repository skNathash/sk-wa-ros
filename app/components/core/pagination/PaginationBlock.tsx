import type { FC } from "react";
import Pagination from "./Pagination";
import PaginationSummary from "./PaginationSummary";
import clsx from "clsx";

interface PaginationConfig {
  totalRecords: number;
  rowsPerPage: number;
  activePage: number;
  startSlNo: number;
  endSlNo: number;
}

interface PaginationBlockProps {
  paginationConfig: PaginationConfig;
  paginationCb: (data: { activePage: number; startSlNo: number; endSlNo: number }) => void;
  loadingTotalRecords: boolean;
  showSummary?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PaginationBlock: FC<PaginationBlockProps> = ({
  paginationConfig,
  paginationCb,
  loadingTotalRecords,
  showSummary = false,
  className = "",
  size = "md",
}) => {
  // Early return if we have records but rowsPerPage is greater than totalRecords
  if (
    paginationConfig.totalRecords > 0 &&
    paginationConfig.rowsPerPage > paginationConfig.totalRecords
  ) {
    return null;
  }

  return (
    <div className={clsx("row g-0 align-items-center", className)}>
      {showSummary && (
        <div className="col">
          <PaginationSummary
            loadingTotalRecords={loadingTotalRecords}
            paginationConfig={paginationConfig}
          />
        </div>
      )}
      <div className="col-auto ms-auto">
        <Pagination
          totalRecords={paginationConfig.totalRecords}
          rowsPerPage={paginationConfig.rowsPerPage}
          callback={paginationCb}
          activePage={paginationConfig.activePage}
          size={size}
        />
      </div>
    </div>
  );
};

export default PaginationBlock;
