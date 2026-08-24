import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface MobileViewTheme2Props {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  tab?: string;
}

const statusVariant = (status: string) =>
  status === "Settled"
    ? "success"
    : status === "SettlementInitiated"
      ? "warning"
      : "default";

/**
 * Theme-2 mobile COD list: one white sheet bled to the screen edges
 * (`app-bleed-x`), each settlement a tappable row divided by a hairline — the
 * same chat-list read as the order directory. The row leads with the collecting
 * agent's initials avatar; the settlement id gets the first line, the agent and
 * the order ref sit under it, and the right rail carries the cash
 * amount as a bubble-green pill over a labelled collection date. The handover action closes the
 * row while the money is still pending.
 */
const MobileViewTheme2: React.FC<MobileViewTheme2Props> = ({
  loading,
  data,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`skeleton-${idx}`}
            className="tw:animate-pulse tw:px-4 tw:py-3"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full tw:bg-gray-200"></div>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:h-4 tw:w-36 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:mt-2 tw:h-3 tw:w-44 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:mt-2 tw:h-3 tw:w-28 tw:rounded tw:bg-gray-200"></div>
              </div>
              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:ms-auto tw:h-3 tw:w-20 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:ms-auto tw:mt-2 tw:h-4 tw:w-14 tw:rounded tw:bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="app-bleed-x tw:border-y tw:border-slate-100 tw:bg-white">
        <NoData />
      </div>
    );
  }

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
      {data.map((row, idx) => {
        const agentName = row.shipmentUserInfo?.name || "-";
        const canHandover = row.status === "SettlementInitiated";

        return (
          <div
            key={row._id || idx}
            role="button"
            tabIndex={0}
            className="tw:w-full tw:cursor-pointer tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:active:bg-slate-50"
            onClick={() => appNav.to(`/dashboard/orders/view/${row.orderId}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                appNav.to(`/dashboard/orders/view/${row.orderId}`);
              }
            }}
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <InitialsAvatar name={agentName} />

              <div className="tw:min-w-0 tw:flex-1">
                {/* Settlement ids run long and carry no redundant prefix, so
                    they wrap rather than truncate — the tail is the part that
                    tells two settlements apart. */}
                <p className="tw:text-sm tw:font-bold tw:text-slate-900 tw:wrap-break-word">
                  {row.settlementId}
                </p>
                {/* Who collected the cash — the fact this page reconciles. */}
                <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500 tw:wrap-break-word">
                  {agentName}
                </p>

                <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1">
                  <AppBadge
                    variant={statusVariant(row.status)}
                    className="tw:px-1.5 tw:py-0 tw:text-[10px]"
                  >
                    {row.status}
                  </AppBadge>
                </div>

                {/* Order ref as a muted meta line — the collection date now
                    lives in the right rail, so the row carries one date only. */}
                <p className="tw:mt-1 tw:text-[11px] tw:text-slate-400 tw:wrap-break-word">
                  {t("orderId")}: {row.orderRefId || "-"}
                </p>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                {/* The cash itself as a bubble-green pill — the unread-badge
                    slot in a WhatsApp chat row. It leads the rail rather than
                    trails it: on a reconciliation list the amount is the
                    number the eye scans down. */}
                <span
                  className="tw:inline-block tw:rounded-full tw:px-2 tw:py-0.5 tw:text-xs tw:font-bold tw:whitespace-nowrap tw:tabular-nums"
                  style={{
                    backgroundColor: "var(--wa-bubble)",
                    color: "var(--wa-bubble-text)",
                  }}
                >
                  <Amount value={row.totalAmount} decimalPlaces={2} />
                </span>
                {/* The row carries one date only — when the cash was
                    collected — so it gets an explicit label above it instead
                    of sitting bare next to the amount where a reader has to
                    guess which date it is. */}
                {row.settledOn && (
                  <>
                    <span className="tw:mt-1.5 tw:block tw:whitespace-nowrap tw:text-[10px] tw:tracking-wide tw:text-slate-400 tw:uppercase">
                      {t("collectedOn")}
                    </span>
                    <span className="tw:block tw:whitespace-nowrap tw:text-[11px] tw:text-slate-500">
                      <DateFormat
                        value={row.settledOn}
                        formatStr="dd MMM, hh:mm a"
                      />
                    </span>
                  </>
                )}
              </div>
            </div>

            {canHandover && (
              <div
                className="tw:mt-2 tw:flex tw:justify-end tw:ps-13"
                onClick={(event) => event.stopPropagation()}
              >
                <AppButton
                  type="button"
                  size="small"
                  onClick={() => callback({ action: "handover", data: row })}
                >
                  {t("handover")}
                </AppButton>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileViewTheme2;
