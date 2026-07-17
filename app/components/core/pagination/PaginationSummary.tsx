import clsx from "clsx";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";

interface PaginationConfig {
  startSlNo: number;
  endSlNo: number;
  totalRecords: number;
}

interface PaginationSummaryProps {
  paginationConfig: PaginationConfig;
  loadingTotalRecords: boolean;
  fwSize?: "sm" | "md";
  className?: string;
  template?: number;
  loadedCount?: number;
}

const PaginationSummary = ({
  paginationConfig,
  loadingTotalRecords,
  fwSize = "md",
  className = "",
  template = 2,
  loadedCount,
}: PaginationSummaryProps): JSX.Element => {
  const getFontSizeClass = (): string => {
    switch (fwSize) {
      case "md":
        return "tw:text-base";
      case "sm":
        return "tw:text-xs";
      default:
        return "";
    }
  };

  const getEndNumber = (): number => {
    return Math.min(paginationConfig.endSlNo, paginationConfig.totalRecords);
  };

  const formatNumber = (num: number): string => {
    return Number(num).toLocaleString("en-IN");
  };

  const { t } = useTranslation(["common"]);

  if (loadingTotalRecords) {
    return <span className="me-2">...</span>;
  }

  if (!paginationConfig.totalRecords) {
    return <></>;
  }

  if (template === 2) {
    return (
      <div className={clsx(className, "tw:text-gray-500", getFontSizeClass())}>
        <span>
          {t("pagination.showingTotal", {
            count: loadedCount,
            total: formatNumber(paginationConfig.totalRecords),
          })}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx(className, "tw:text-gray-500", getFontSizeClass())}>
      <span>
        {t("pagination.showingRange", {
          start: paginationConfig.startSlNo,
          end: getEndNumber(),
          total: formatNumber(paginationConfig.totalRecords),
        })}
      </span>
    </div>
  );
};

export default PaginationSummary;
