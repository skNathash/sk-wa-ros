import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  History,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

type PriceChangeHistoryItem = {
  oldPrice: Record<string, number>;
  newPrice: Record<string, number>;
  changeDate: string;
  changeType: string;
  priceTarget: string;
  changeReason: string;
  remarks: string;
  performedBy: string;
  configRef: string;
  _id: string;
};

type Props = {
  priceChangeHistory?: PriceChangeHistoryItem[];
  type?: "network" | "customer";
};

const MAX_DISPLAY_COUNT = 2;

const RecentPriceChanges = ({
  priceChangeHistory = [],
  type = "customer",
}: Props) => {
  const { t } = useTranslation(["common"]);

  const [viewMore, setViewMore] = useState(false);

  const formattedLogs = (priceChangeHistory || [])
    .filter((item: PriceChangeHistoryItem) => item.priceTarget === type)
    .slice(0, 10)
    .map((item: PriceChangeHistoryItem) => ({
      loggedAt: item.changeDate,
      loggedBy: item.performedBy,
      message: item.remarks,
      newData: item.newPrice[type ?? "customer"],
      oldData: item.oldPrice[type ?? "customer"],
      paramName: "discount",
    }));

  if (!priceChangeHistory || priceChangeHistory.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <History size={16} />
        <div className="tw:text-sm tw:font-medium">
          {t("recentPriceChanges")}
        </div>
      </div>
      {formattedLogs.map((item: any, idx: number) => (
        <div
          key={idx}
          className={clsx(
            "tw:bg-slate-50 tw:rounded-xl tw:px-5 tw:p-2 tw:mb-2 tw:flex tw:items-center tw:justify-between",
            {
              "tw:hidden": !viewMore && idx >= MAX_DISPLAY_COUNT,
            }
          )}
        >
          <div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:font-semibold tw:text-lg">
                <Amount value={item.oldData} decimalPlaces={2} />
                <span className="tw:mx-1">→</span>
                <Amount value={item.newData} decimalPlaces={2} />
              </div>
              {/* <span
                className={`tw:bg-gray-100 tw:rounded-full tw:px-2 tw:py-1 tw:text-xs tw:font-bold ${
                  item.newData < item.oldData
                    ? "tw:text-red-600"
                    : "tw:text-green-600"
                }`}
              >
                {item.discount ?? 0}%
              </span> */}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
              <DateFormat value={item.loggedAt} />
            </div>
          </div>
          <div className="tw:text-xs">
            {item.newData < item.oldData ? (
              <ArrowDownRight className="tw:w-5 tw:h-5 tw:text-red-500" />
            ) : (
              <ArrowUpRight className="tw:w-5 tw:h-5 tw:text-green-500" />
            )}
          </div>
        </div>
      ))}
      {formattedLogs.length > MAX_DISPLAY_COUNT && (
        <div className="tw:text-center tw:mt-4">
          <AppButton
            onClick={() => setViewMore(!viewMore)}
            size="small"
            fill="clear"
            className="tw:text-gray-500"
          >
            {viewMore ? (
              t("viewLess")
            ) : (
              <>
                {t("viewMore")} ({formattedLogs.length - MAX_DISPLAY_COUNT})
              </>
            )}
            <ChevronDown
              className={clsx({
                "tw:rotate-180": viewMore,
              })}
            />
          </AppButton>
        </div>
      )}
    </div>
  );
};

export default RecentPriceChanges;
