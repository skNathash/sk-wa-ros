import React from "react";
import { useTranslation } from "react-i18next";

interface DealScopeBadgeProps {
  isLocalDeal?: boolean;
  className?: string;
  size?: "xs" | "sm";
}

const DealScopeBadge: React.FC<DealScopeBadgeProps> = ({
  isLocalDeal,
  className = "",
  size = "xs",
}) => {
  const { t } = useTranslation(["common"]);
  const baseCls =
    size === "sm"
      ? "tw:text-[11px] tw:px-1.5 tw:py-0.5"
      : "tw:text-[10px] tw:px-1.5 tw:py-0.5";

  if (isLocalDeal) {
    return (
      <span
        title={t("localDealTooltip")}
        className={`tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-amber-50 tw:text-amber-700 tw:font-semibold tw:border tw:border-amber-200 ${baseCls} ${className}`}
      >
        L
      </span>
    );
  }

  return null;

  // return (
  //   <span
  //     title={t("globalDealTooltip")}
  //     className={`tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-sky-50 tw:text-sky-700 tw:font-semibold tw:border tw:border-sky-200 ${baseCls} ${className}`}
  //   >
  //     <Globe size={iconSize} />
  //     {t("globalDeal")}
  //   </span>
  // );
};

export default DealScopeBadge;
