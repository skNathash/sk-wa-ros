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

interface StatementData {
  _id: string;
  paymentDate: string | Date;
  notes?: string;
  sourceReference?: string;
  statementType?: "credit" | "debit";
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  sourceType?: string;
  _sourceTypeLbl?: string;
  sourceVariantColor?: string;
  sourceRedirectionUrl?: string;
  [key: string]: any;
}

interface ChatViewProps {
  loading?: boolean;
  data: StatementData[];
  callback: (payload: { action: string; data?: any }) => void;
}

// Deterministic sender tints, echoing how WhatsApp colours each chat
// participant. Picked by a stable hash of the party name so the same
// contact always reads in the same colour down the feed.
const NAME_TINTS = [
  "tw:text-teal-700",
  "tw:text-emerald-700",
  "tw:text-sky-700",
  "tw:text-amber-700",
  "tw:text-rose-700",
  "tw:text-violet-700",
  "tw:text-indigo-700",
];

const nameTint = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % NAME_TINTS.length;
  }
  return NAME_TINTS[hash];
};

const toDate = (value: string | Date) =>
  typeof value === "string" ? parseISO(value) : value;

// Day-separator label — mirrors WhatsApp's centred "TODAY / YESTERDAY / date"
// chips that break the feed into days.
const dayLabel = (value: string | Date) => {
  const d = toDate(value);
  if (!isValid(d)) return "";
  if (isToday(d)) return `TODAY · ${format(d, "dd MMM")}`;
  if (isYesterday(d)) return `YESTERDAY · ${format(d, "dd MMM")}`;
  return format(d, "dd MMM yyyy").toUpperCase();
};

const dayKey = (value: string | Date) => {
  const d = toDate(value);
  return isValid(d) ? format(d, "yyyy-MM-dd") : "";
};

// Counterparty name for the bubble heading: the store's counterpart on the
// transaction (vendor on a PO, otherwise whichever party the ledger recorded),
// falling back to the source-type label so a bubble always has a heading.
const partyName = (row: StatementData) => row.toParty?.name || "—";

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
            <Skeleton className="tw:h-24 tw:w-3/4 tw:rounded-2xl" />
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
          const isCredit = row.statementType === "credit";
          const key = dayKey(row.paymentDate);
          const showDivider = key !== lastDay;
          lastDay = key;

          const name = partyName(row);
          const partyLabel = row.toParty?._type || row.fromParty?._type;

          const bubble = (
            <div
              className={clsx(
                "tw:flex",
                isCredit ? "tw:justify-end" : "tw:justify-start",
              )}
            >
              <div
                className={clsx(
                  "tw:relative tw:max-w-[85%] tw:min-w-[62%] tw:rounded-2xl tw:px-3.5 tw:py-2.5 tw:shadow-sm",
                  isCredit
                    ? "tw:bg-[var(--wa-bubble,#e7f4d7)] tw:rounded-tr-sm"
                    : "tw:bg-white tw:rounded-tl-sm",
                )}
              >
                {/* Party heading + source-type chip. The counterparty type
                    (vendor / customer / retailer) rides inline after the name
                    instead of taking its own line. */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span
                    className={clsx(
                      "tw:text-sm tw:font-bold tw:truncate",
                      nameTint(name),
                    )}
                  >
                    {name}
                    {partyLabel && (
                      <span className="tw:ml-1 tw:text-[11px] tw:font-normal tw:text-gray-500">
                        · {partyLabel}
                      </span>
                    )}
                  </span>
                  {row.sourceType && row._sourceTypeLbl && (
                    <AppBadge
                      variant={(row.sourceVariantColor as any) || "primary"}
                      className="tw:shrink-0 tw:text-[10px]"
                    >
                      {row._sourceTypeLbl}
                    </AppBadge>
                  )}
                </div>

                {/* Signed amount */}
                <div className="tw:flex tw:items-baseline tw:gap-2 tw:mt-1">
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

                {/* Notes / description. The reference is appended only when the
                    notes don't already contain it — server notes frequently
                    embed it, which used to print the same number twice. */}
                {(row.notes || row.sourceReference) && (
                  <div className="tw:text-xs tw:text-gray-600 tw:mt-1 tw:leading-snug">
                    {row.notes || "-"}
                    {row.sourceReference &&
                      !(row.notes || "").includes(row.sourceReference) && (
                        <span className="tw:font-mono tw:text-gray-500">
                          {row.notes ? " · " : ""}
                          {row.sourceReference}
                        </span>
                      )}
                  </div>
                )}

                {/* Running balance + timestamp on one row — opening → closing
                    on the left, time and read ticks flush right. */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-1.5">
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500">
                    <span className="tw:uppercase tw:tracking-wide">
                      {t("balance")}
                    </span>
                    <Amount
                      value={row.balanceBefore ?? 0}
                      decimalPlaces={2}
                      className="tw:text-gray-500"
                    />
                    <span>→</span>
                    <Amount
                      value={row.balanceAfter ?? 0}
                      decimalPlaces={2}
                      className="tw:text-gray-700 tw:font-semibold"
                    />
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-gray-400">
                    <span>{format(toDate(row.paymentDate), "h:mm a")}</span>
                    {isCredit && (
                      <CheckCheck size={13} className="tw:text-sky-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

          return (
            <React.Fragment key={rowId}>
              {showDivider && (
                <DayDivider>{dayLabel(row.paymentDate)}</DayDivider>
              )}
              <AppLink
                className="tw:block"
                noUnderline
                asLink
                href={row.sourceRedirectionUrl}
              >
                <div
                  onClick={(e) => {
                    if (row.sourceType === "PAYMENT") {
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
