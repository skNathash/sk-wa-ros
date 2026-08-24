import clsx from "clsx";
import { format, isToday, isValid, isYesterday, parseISO } from "date-fns";
import { Camera, CheckCheck, Mic, Plus } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";

interface SKStatementData {
  _id: string;
  createdAt?: string | Date;
  payoutType?: "Credit" | "Debit";
  type?: string;
  comments?: string;
  entityId?: string;
  amount?: number;
  _openingBalance?: number;
  _closingBalance?: number;
  sourceType?: string;
  sourceVariantColor?: string;
  sourceRedirectionUrl?: string;
  [key: string]: any;
}

interface ChatViewProps {
  loading?: boolean;
  data: SKStatementData[];
  callback?: (payload: { action: string; data?: any }) => void;
}

const toDate = (value: string | Date | undefined) =>
  typeof value === "string" ? parseISO(value) : value;

const dayLabel = (value: string | Date | undefined) => {
  const d = toDate(value);
  if (!d || !isValid(d)) return "";
  if (isToday(d)) return `TODAY · ${format(d, "dd MMM")}`;
  if (isYesterday(d)) return `YESTERDAY · ${format(d, "dd MMM")}`;
  return format(d, "dd MMM yyyy").toUpperCase();
};

const dayKey = (value: string | Date | undefined) => {
  const d = toDate(value);
  return d && isValid(d) ? format(d, "yyyy-MM-dd") : "";
};

const isCreditRow = (row: SKStatementData) =>
  row.payoutType && row.payoutType.toLowerCase() === "credit";

const DayDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tw:flex tw:justify-center tw:my-3">
    <span className="tw:bg-white tw:text-gray-500 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.1em] tw:px-3 tw:py-1 tw:rounded-full tw:shadow-sm">
      {children}
    </span>
  </div>
);

const ChatView: React.FC<ChatViewProps> = ({ loading, data, callback }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`skeleton-${idx}`}
            className={clsx(
              "tw:flex",
              idx % 2 === 0 ? "tw:justify-end" : "tw:justify-start",
            )}
          >
            <Skeleton className="tw:h-32 tw:w-3/4 tw:rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  let lastDay = "";

  return (
    <div className="tw:pb-24">
      <div className="tw:flex tw:flex-col tw:gap-2">
        {data.map((row, idx) => {
          const rowId = row._id || `row-${idx}`;
          const isCredit = isCreditRow(row);
          const dateValue = row.createdAt;
          const key = dayKey(dateValue);
          const showDivider = key !== lastDay;
          lastDay = key;

          const bubble = (
            <div
              className={clsx(
                "tw:flex",
                isCredit ? "tw:justify-end" : "tw:justify-start",
              )}
            >
              <div
                className={clsx(
                  "tw:relative tw:max-w-[90%] tw:min-w-[62%] tw:rounded-2xl tw:px-3.5 tw:py-2.5 tw:shadow-sm",
                  isCredit
                    ? "tw:bg-(--wa-bubble,#e7f4d7) tw:rounded-tr-sm"
                    : "tw:bg-white tw:rounded-tl-sm",
                )}
              >
                {/* Type + payout-type badges */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  {row.type ? (
                    <AppBadge
                      variant={(row.sourceVariantColor as any) || "primary"}
                      className="tw:text-[10px]"
                    >
                      {row.type}
                    </AppBadge>
                  ) : (
                    <span />
                  )}
                  <AppBadge
                    variant={isCredit ? "success" : "danger"}
                    className="tw:text-[10px]"
                  >
                    {row.payoutType?.toUpperCase() ||
                      (isCredit ? t("credit") : t("debit"))}
                  </AppBadge>
                </div>

                {/* Signed amount */}
                <div className="tw:flex tw:items-baseline tw:gap-2 tw:mt-1.5">
                  <span
                    className={clsx(
                      "tw:text-lg tw:font-bold",
                      isCredit
                        ? "tw:text-green-700 wa-amt-in"
                        : "tw:text-red-600 wa-amt-out",
                    )}
                  >
                    {isCredit ? "+" : "−"}
                  </span>
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className={clsx(
                      "tw:text-lg tw:font-bold",
                      isCredit
                        ? "tw:text-green-700 wa-amt-in"
                        : "tw:text-red-600 wa-amt-out",
                    )}
                  />
                </div>

                {/* Description */}
                {row.comments && (
                  <div className="tw:text-xs tw:text-gray-600 tw:mt-1 tw:leading-snug">
                    {row.comments}
                  </div>
                )}

                {/* Reference ID */}
                {row.entityId && (
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-1.5 tw:text-xs">
                    <span className="tw:text-gray-500">{t("reference")}:</span>
                    <span className="tw:font-mono tw:text-gray-700">
                      {row.entityId}
                    </span>
                  </div>
                )}

                {/* Opening → Closing balance */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-2 tw:pt-2 tw:border-t tw:border-black/5">
                  <div className="tw:flex tw:flex-col tw:gap-0.5">
                    <span className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-500">
                      {t("openingBalance")}
                    </span>
                    <Amount
                      value={row._openingBalance ?? 0}
                      decimalPlaces={2}
                      className="tw:text-xs tw:font-semibold tw:text-gray-700"
                    />
                  </div>
                  <span className="tw:text-xs tw:text-gray-400">→</span>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:items-end">
                    <span className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-500">
                      {t("closingBalance")}
                    </span>
                    <Amount
                      value={row._closingBalance ?? 0}
                      decimalPlaces={2}
                      className="tw:text-xs tw:font-semibold tw:text-gray-700"
                    />
                  </div>
                </div>

                {/* Timestamp */}
                <div className="tw:flex tw:items-center tw:justify-end tw:gap-1 tw:mt-1 tw:text-[10px] tw:text-gray-400">
                  <span>
                    {format(toDate(dateValue) || new Date(), "h:mm a")}
                  </span>
                  {isCredit && (
                    <CheckCheck size={13} className="tw:text-sky-500" />
                  )}
                </div>
              </div>
            </div>
          );

          return (
            <React.Fragment key={rowId}>
              {showDivider && <DayDivider>{dayLabel(dateValue)}</DayDivider>}
              <AppLink
                className="tw:block"
                noUnderline
                asLink
                href={row.sourceRedirectionUrl}
              >
                <div
                  onClick={(e) => {
                    if (row.sourceType === "PAYMENT" && callback) {
                      e.preventDefault();
                      callback({ action: "viewPayment", data: row });
                    }
                  }}
                >
                  {bubble}
                </div>
              </AppLink>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ChatView;
