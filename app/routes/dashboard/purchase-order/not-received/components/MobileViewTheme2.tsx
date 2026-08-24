import { AlertTriangle, Check, ChevronRight, Truck } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import ReceiveBoxFlow from "~/shared/purchase-order/components/receive-box-flow/ReceiveBoxFlow";
import { isPackageReceived, type PackageStateKey } from "../helper";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any; index?: number }) => void;
  loading: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
};

/**
 * Icon per lifecycle state. Everything else about the state (label, tile and
 * badge classes) plus `initials`, `avatarCls`, `isToday` and `isYesterday` is
 * resolved once in `helper.getData`; this list only renders it.
 */
const STATE_ICONS: Record<PackageStateKey, typeof Truck> = {
  short: AlertTriangle,
  received: Check,
  waiting: Truck,
};

/**
 * Theme-2 (WhatsApp look) list for yet-to-receive packages.
 *
 * Runs edge to edge on mobile (`app-bleed-x`) so the rows read as one
 * continuous feed rather than a stack of cards. Each row is:
 *
 *   [state tile]  BOX NO                             ₹ amount   ›
 *                 ● vendor · order no
 *                 date · time · items · units          [ STATUS ]
 *
 * Tapping the row opens the box contents; the chevron starts the inward flow.
 */
const MobileViewTheme2 = ({ data, callback, loading }: Props) => {
  if (!loading && (!data || data.length === 0)) return null;

  if (loading) {
    return (
      <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-card tw:shadow-sm tw:divide-y tw:divide-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="tw:flex tw:gap-3 tw:p-3.5 tw:animate-pulse">
            <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl tw:bg-muted" />
            <div className="tw:flex-1">
              <div className="tw:h-4 tw:w-2/3 tw:rounded tw:bg-muted tw:mb-2" />
              <div className="tw:h-3 tw:w-1/2 tw:rounded tw:bg-muted tw:mb-2" />
              <div className="tw:h-3 tw:w-2/5 tw:rounded tw:bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Bottom margin clears the floating Create-PO FAB so the last row's chevron
  // stays tappable; desktop has no FAB overlap so a small gap is enough.
  return (
    <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-card tw:shadow-sm tw:divide-y tw:divide-border/60 tw:mb-24 tw:md:mb-4 tw:md:grid tw:md:grid-cols-3 tw:md:divide-y-0 tw:md:gap-3 tw:md:bg-transparent tw:md:shadow-none tw:md:rounded-none tw:md:overflow-visible">
      {data.map((row, idx) => {
        const { key, tileCls, badgeCls, label } = row.state || {};
        const Icon = STATE_ICONS[key as PackageStateKey] || Truck;

        return (
          <div
            key={row._id || idx}
            role="button"
            tabIndex={0}
            onClick={() =>
              callback({ action: "view-items", data: row, index: idx })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                callback({ action: "view-items", data: row, index: idx });
              }
            }}
            className="tw:flex tw:cursor-pointer tw:items-start tw:gap-3 tw:px-4 tw:py-3 tw:transition-colors tw:active:bg-muted tw:hover:bg-muted/50 tw:md:rounded-2xl tw:md:bg-card tw:md:shadow-sm"
          >
            {/* State tile — what the package is doing right now */}
            <div
              className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl ${tileCls}`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>

            <div className="tw:min-w-0 tw:flex-1">
              {/* Box no … amount */}
              <div className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:min-w-0 tw:flex-1 tw:break-all tw:text-[15px] tw:font-bold tw:leading-tight tw:text-foreground">
                  {row?.refNo || "--"}
                </span>
                <Amount
                  value={row?.totalValue ?? row?.payableAmount ?? 0}
                  decimalPlaces={0}
                  className="tw:shrink-0 tw:text-[15px] tw:font-bold tw:leading-tight tw:text-foreground"
                />
              </div>

              {/* Vendor · order no */}
              <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5">
                <span
                  className={`tw:flex tw:h-4 tw:w-4 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[9px] tw:font-bold ${row.avatarCls}`}
                >
                  {row.initials}
                </span>
                <span className="tw:min-w-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-foreground">
                  {row?.from?.name || "N/A"}
                </span>
                <span className="tw:shrink-0 tw:text-muted-foreground">·</span>
                <span className="tw:shrink-0 tw:text-[13px] tw:text-muted-foreground">
                  {row?.orderData?.refId || "--"}
                </span>
              </div>

              {/* Date · time · items · units … status */}
              <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
                <p className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[12px] tw:text-muted-foreground">
                  {row?.createdAt ? (
                    <>
                      {row.isToday ? (
                        <>
                          Today ·{" "}
                          <DateFormat
                            value={row.createdAt}
                            formatStr="hh:mm a"
                          />
                        </>
                      ) : row.isYesterday ? (
                        "Yesterday"
                      ) : (
                        <DateFormat value={row.createdAt} formatStr="dd MMM" />
                      )}
                      {" · "}
                    </>
                  ) : null}
                  {row?.totalItems ?? "--"} items
                  {row?.totalUnits != null ? ` · ${row.totalUnits}u` : ""}
                </p>

                <span
                  className={`tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:leading-none ${badgeCls}`}
                >
                  {label}
                </span>
              </div>
            </div>

            {/* Chevron starts the inward flow — ReceiveBoxFlow swallows the
                click so it never also opens the box-contents modal. Already
                received packages keep the affordance as a plain chevron, which
                falls through to the row's box-contents tap. */}
            {isPackageReceived(row) ? (
              <span className="tw:-mr-1 tw:flex tw:shrink-0 tw:items-center tw:self-center tw:p-1 tw:text-muted-foreground">
                <ChevronRight size={18} />
              </span>
            ) : (
              <ReceiveBoxFlow
                data={row}
                index={idx}
                onReceived={() =>
                  callback({ action: "received", data: row, index: idx })
                }
              >
                <button
                  type="button"
                  aria-label="Inward"
                  className="tw:-mr-1 tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:self-center tw:p-1 tw:text-muted-foreground tw:transition-colors tw:hover:text-foreground"
                >
                  <ChevronRight size={18} />
                </button>
              </ReceiveBoxFlow>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileViewTheme2;
