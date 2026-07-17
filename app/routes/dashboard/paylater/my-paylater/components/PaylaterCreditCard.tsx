import { CreditCard, Store } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";

interface Props {
  data: any;
}

const PaylaterCreditCard: React.FC<Props> = ({ data }) => {
  const status = data?.status || "";
  const statusColor = data?._statusColor || "default";
  const statusLbl = data?._statusLbl || status;
  const fromName = data?.franchiseInfo?.name || "-";
  const validityEnd = data?.validityEndDate;
  const validityPeriod = data?.validityPeriod || "-";
  const creditLimit = data?.creditLimit ?? data?.approvedLimit ?? 0;
  const creditAvailable = data?.creditAvailable ?? 0;
  const isApproved = status === "Approved";

  const gradient = isApproved
    ? "tw:from-indigo-600 tw:via-purple-600 tw:to-pink-500"
    : "tw:from-slate-600 tw:via-slate-700 tw:to-slate-800";

  const pct =
    creditLimit > 0
      ? Math.min(100, Math.max(0, (creditAvailable / creditLimit) * 100))
      : 0;

  return (
    <div
      className={`tw:relative tw:bg-linear-to-br ${gradient} tw:rounded-2xl tw:p-5 tw:text-white tw:shadow-xl tw:overflow-hidden tw:w-full tw:min-h-56`}
    >
      <div className="tw:absolute tw:-top-16 tw:-right-16 tw:w-48 tw:h-48 tw:rounded-full tw:bg-white/10" />
      <div className="tw:absolute tw:-bottom-20 tw:-left-10 tw:w-48 tw:h-48 tw:rounded-full tw:bg-white/5" />

      <div className="tw:relative tw:flex tw:flex-col tw:h-full tw:gap-4">
        <div className="tw:flex tw:justify-between tw:items-start">
          <div className="tw:flex tw:items-center tw:gap-2">
            <CreditCard size={22} />
            <div className="tw:text-sm tw:font-semibold tw:tracking-wide">
              PayLater
            </div>
          </div>
          <AppBadge variant={statusColor}>{statusLbl}</AppBadge>
        </div>

        <div>
          <div className="tw:text-[10px] tw:uppercase tw:opacity-70 tw:tracking-wider">
            Credit Limit
          </div>
          <div className="tw:text-2xl tw:font-bold tw:tracking-wide">
            <Amount value={creditLimit} />
          </div>
        </div>

        <div>
          <div className="tw:flex tw:justify-between tw:items-end tw:mb-1">
            <div>
              <div className="tw:text-[10px] tw:uppercase tw:opacity-70 tw:tracking-wider">
                Available
              </div>
              <div className="tw:text-lg tw:font-semibold">
                <Amount value={creditAvailable} />
              </div>
            </div>
            <div className="tw:text-[11px] tw:opacity-80">
              {pct.toFixed(0)}%
            </div>
          </div>
          <div className="tw:h-1.5 tw:bg-white/20 tw:rounded-full tw:overflow-hidden">
            <div
              className="tw:h-full tw:bg-white tw:rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="tw:flex tw:justify-between tw:items-end tw:gap-3 tw:mt-auto">
          <div className="tw:min-w-0">
            <div className="tw:text-[10px] tw:uppercase tw:opacity-70 tw:tracking-wider tw:flex tw:items-center tw:gap-1">
              <Store size={10} /> Credited By
            </div>
            <div className="tw:text-sm tw:font-semibold tw:truncate">
              {fromName}
            </div>
          </div>
          <div className="tw:text-right">
            <div className="tw:text-[10px] tw:uppercase tw:opacity-70 tw:tracking-wider">
              Valid Thru
            </div>
            <div className="tw:text-sm tw:font-semibold">
              {validityEnd ? (
                <DateFormat value={validityEnd} formatStr="MM/yy" />
              ) : (
                validityPeriod
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaylaterCreditCard;
