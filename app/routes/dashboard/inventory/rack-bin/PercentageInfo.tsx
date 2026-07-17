import React from "react";
import AppCard from "~/components/core/card/AppCard";
import "~/styles/rack-bin.css";
import { BIN_STATUSES } from "./helper";
import { useTranslation } from "react-i18next";

const PercentageInfo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppCard className="percentage-info-blk tw:py-4">
      <div className="tw:flex tw:items-center tw:gap-6 tw:flex-wrap">
        <span className="tw:font-medium tw:text-base">
          {t("binCapacityStatus")}:
        </span>
        {BIN_STATUSES.map((status) => (
          <span key={status.label} className="tw:flex tw:items-center tw:gap-1">
            <span
              className={`tw:w-5 tw:h-5 tw:inline-block tw:rounded ${status.colorClass}`}
            />
            <span className="tw:text-gray-700 tw:text-sm">
              {t(status.langKey)}
            </span>
          </span>
        ))}
      </div>
    </AppCard>
  );
};

export default PercentageInfo;
