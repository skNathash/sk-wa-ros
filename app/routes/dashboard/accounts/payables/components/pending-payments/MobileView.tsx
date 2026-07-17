import React from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";
import { useTranslation } from "react-i18next";

interface MobileViewData {
  _id: string;
  toParty: {
    name: string;
    _type: string;
    redirectionUrl: string;
  };
  amount: number;
  dueDate: string | Date;
  status: string;
  [key: string]: any;
}

interface MobileViewProps {
  loading?: boolean;
  data: MobileViewData[];
}

const MobileView: React.FC<MobileViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
        <AppSpinner className="tw:w-8 tw:h-8" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <NoData>
        <h5 className="tw:mb-2">{t("noPendingPaymentsFound")}</h5>
      </NoData>
    );
  }

  return (
    <div className="tw:space-y-4">
      {data.map((item, idx) => (
        <div key={item._id || idx}>
          <div className="tw:space-y-3 tw:p-4 tw:border tw:border-gray-100 tw:rounded-lg">
            {/* Vendor Name */}
            <div className="tw:flex tw:justify-between tw:items-start">
              <div className="tw:flex-1">
                <AppLink href={item.toParty.redirectionUrl} asLink>
                  <h3 className="tw:font-semibold tw:text-gray-900 tw:text-sm">
                    {item.toParty?.name || "-"}
                  </h3>
                </AppLink>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:uppercase">
                  {item.toParty?._type}
                </p>
              </div>
              <AppBadge
                variant={item._statusColor || "default"}
                className="tw:text-xs"
              >
                {item._status}
              </AppBadge>
            </div>

            {/* Amount */}
            <div className="tw:border-t tw:border-gray-100 tw:pt-3">
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">
                  {t("amount")}
                </span>
                <span className="tw:font-semibold tw:text-gray-900">
                  <Amount value={item.amount} decimalPlaces={2} />
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-gray-500">
                {t("dueDate")}
              </span>
              <span className="tw:text-sm tw:text-gray-700">
                <DateFormat value={item.dueDate} formatStr="dd MMM yyyy" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
