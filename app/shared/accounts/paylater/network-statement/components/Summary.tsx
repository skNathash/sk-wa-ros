import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import AppBadge from "~/components/core/badge/AppBadge";
import { useTranslation } from "react-i18next";

const Summary = ({
  userId,
  refresh,
  type,
}: {
  userId: string;
  refresh: boolean;
  type: "b2c" | "b2b";
}) => {
  const { t } = useTranslation(["common"]);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchSummary();
  }, [userId, type]);

  useEffect(() => {
    if (refresh) {
      fetchSummary();
    }
  }, [refresh, type]);

  const fetchSummary = async () => {
    setLoading(true);
    const response = await PaylaterService.validateEligibility({
      userInfo: {
        id: userId,
        type: type === "b2c" ? "customer" : "franchise",
      },
      franchiseInfo: {
        id: AuthService.getLoggedInUserId(),
      },
    });
    setSummary(response.data.data);
    setLoading(false);
  };

  const usedPercent =
    summary?.paylaterInfo?.creditLimit > 0
      ? Math.min(
          100,
          ((summary?.paylaterInfo?.totalPayableAmount ?? 0) /
            summary.paylaterInfo.creditLimit) *
            100,
        )
      : 0;

  return (
    <div className="tw:mb-4 tw:rounded-2xl tw:bg-gradient-to-br tw:from-blue-800 tw:to-blue-950 tw:text-white tw:p-5 tw:relative tw:overflow-hidden">
      {/* Decorative circles */}
      <div className="tw:absolute tw:top-[-30px] tw:right-[-30px] tw:w-40 tw:h-40 tw:rounded-full tw:bg-white/5" />
      <div className="tw:absolute tw:bottom-[-40px] tw:right-[40px] tw:w-52 tw:h-52 tw:rounded-full tw:bg-white/5" />

      {/* Top row: Status & Expiry */}
      <div className="tw:flex tw:items-center tw:justify-between tw:relative tw:z-10">
        <div>
          <p className="tw:text-[10px] tw:uppercase tw:tracking-widest tw:text-blue-300 tw:mb-1">
            {t("walletStatus")}
          </p>
          {loading ? (
            <AppSpinner className="tw:w-5 tw:h-5" />
          ) : (
            <AppBadge variant={summary?.paylaterInfo?._statusColor}>
              {summary?.paylaterInfo?._statusLbl}
            </AppBadge>
          )}
        </div>
        <div className="tw:text-right">
          <p className="tw:text-[10px] tw:uppercase tw:tracking-widest tw:text-blue-300 tw:mb-1">
            {t("expiryDate")}
          </p>
          {loading ? (
            <AppSpinner className="tw:w-5 tw:h-5" />
          ) : summary?.paylaterInfo?.validityEndDate ? (
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium">
              <DateFormat
                value={summary?.paylaterInfo?.validityEndDate as Date}
                formatStr="dd MMM yyyy"
              />
              {summary?.paylaterInfo?.validityPeriod && (
                <span className="tw:text-xs tw:text-blue-300">
                  ({summary.paylaterInfo.validityPeriod})
                </span>
              )}
            </div>
          ) : (
            <span className="tw:text-sm tw:font-medium">--/--</span>
          )}
        </div>
      </div>

      {/* Credit Limit (hero number) */}
      <div className="tw:mt-5 tw:relative tw:z-10">
        <p className="tw:text-[10px] tw:uppercase tw:tracking-widest tw:text-blue-300 tw:mb-1">
          {t("creditLimit")}
        </p>
        {loading ? (
          <AppSpinner className="tw:w-6 tw:h-6" />
        ) : summary?.paylaterInfo?.creditLimit !== undefined ? (
          <Amount
            value={summary?.paylaterInfo?.creditLimit as number}
            decimalPlaces={2}
            className="tw:text-2xl tw:font-bold tw:text-white"
          />
        ) : (
          <span className="tw:text-2xl tw:font-bold">--</span>
        )}
      </div>

      {/* Usage bar */}
      <div className="tw:mt-4 tw:relative tw:z-10">
        <div className="tw:w-full tw:h-1.5 tw:rounded-full tw:bg-white/15">
          <div
            className="tw:h-1.5 tw:rounded-full tw:bg-gradient-to-r tw:from-orange-400 tw:to-orange-500 tw:transition-all tw:duration-500"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom row: Used & Available */}
      <div className="tw:mt-3 tw:flex tw:justify-between tw:relative tw:z-10">
        <div>
          <p className="tw:text-[10px] tw:uppercase tw:tracking-widest tw:text-blue-300 tw:mb-0.5">
            {t("usedLimit")}
          </p>
          {loading ? (
            <AppSpinner className="tw:w-5 tw:h-5" />
          ) : (
            <Amount
              value={summary?.paylaterInfo?.totalPayableAmount ?? 0}
              decimalPlaces={2}
              className="tw:text-sm tw:font-semibold tw:text-orange-400"
            />
          )}
        </div>
        <div className="tw:text-right">
          <p className="tw:text-[10px] tw:uppercase tw:tracking-widest tw:text-blue-300 tw:mb-0.5">
            {t("availableLimit")}
          </p>
          {loading ? (
            <AppSpinner className="tw:w-5 tw:h-5" />
          ) : (
            <Amount
              value={summary?.paylaterInfo?.creditAvailable ?? 0}
              decimalPlaces={2}
              className="tw:text-sm tw:font-semibold tw:text-green-400"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;
