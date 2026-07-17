import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import clsx from "clsx";
import { Building2, Calendar } from "lucide-react";
import VendorInfo from "./VendorInfo";

interface SaleData {
  _id: string;
  customerInfo: {
    name: string;
    [key: string]: any;
  };
  _payableAmount: number;
  payment: string;
  createdAt: string | Date;
  [key: string]: any;
}

interface MobileViewProps {
  loading?: boolean;
  data: SaleData[];
}

const MobileView: React.FC<MobileViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);
  if (loading) {
    return (
      <div className="tw:space-y-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-20 tw:rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        {t("noDataFound")}
      </div>
    );
  }

  return (
    <>
      {data.map((row, idx) => (
        <div
          key={row._id || idx}
          className="tw:p-4 tw:border tw:border-gray-200 tw:rounded-lg tw:mb-4"
        >
          <div className="tw:mb-3">
            <div className="tw:flex tw:gap-2 tw:mb-2 tw:flex-col">
              <AppBadge variant={row.sourceVariantColor || "default"}>
                {row._sourceTypeLbl || "-"}
              </AppBadge>
              <div className="tw:text-sm tw:text-slate-500 tw:flex tw:items-center tw:gap-2">
                <Calendar size={16} className="tw:text-slate-400" />
                <DateFormat value={row.transactionDate} />
              </div>
            </div>
            <p className="tw:text-sm tw:text-gray-700 tw:mb-2">
              {row.description || "-"}

              <VendorInfo vendor={row._vendorInfo} />
            </p>
            <AppLink
              asLink
              href={row.sourceRedirectionUrl}
              className="tw:text-xs tw:bg-gray-100 tw:text-gray-600 tw:px-2 tw:py-1 tw:rounded"
            >
              <code>{row.sourceReference || "-"}</code>
            </AppLink>

            <div className="tw:flex tw:justify-between tw:items-center tw:mt-4 tw:gap-2">
              <div>
                <Amount
                  value={row.amount}
                  decimalPlaces={2}
                  className="tw:font-medium"
                />
              </div>

              <div className="tw:flex tw:gap-2 tw:items-end">
                <AppBadge className="tw:uppercase" variant="light">
                  {row.paymentMethod || "-"}
                </AppBadge>

                <AppBadge variant={row._statusColor || "default"}>
                  {row._status}
                </AppBadge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default MobileView;
