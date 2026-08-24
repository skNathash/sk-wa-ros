import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AuthService from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { InventoryActivityLog as InventoryActivityLogItem } from "~/types/CommonTypes";
import { formatActivityTime, sortByLatest } from "./helper";
import AppLink from "~/components/core/link/AppLink";
import { useInventoryStockUpdated } from "~/shared/inventory/events";

type Props = {
  limit?: number;
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  className?: string;
};

// Flat initial-chip tints, one per badge variant. Muted on purpose: the chip is
// a scan aid for the activity kind, not a warning of its own.
const TONE: Record<string, string> = {
  success: "tw:bg-emerald-50 tw:text-emerald-700",
  warning: "tw:bg-amber-50 tw:text-amber-700",
  danger: "tw:bg-red-50 tw:text-red-600",
  secondary: "tw:bg-violet-50 tw:text-violet-700",
  primary: "tw:bg-blue-50 tw:text-blue-700",
};

/** Green for stock in, red for stock out, neutral for price moves and values. */
const valueTone = (value: string) => {
  if (value.includes("→")) return "tw:text-slate-700";
  if (value.startsWith("+")) return "tw:text-emerald-600";
  if (value.startsWith("-")) return "tw:text-red-600";
  return "tw:text-slate-700";
};

/**
 * Seller-wide inventory activity feed — stock, price and status changes as a
 * dense flat list. Fetches its own logs on mount so it can be dropped into any
 * pane without the host wiring up the data.
 */
const InventoryActivityLog = ({
  limit = 12,
  title = "Recent Activity",
  className = "",
}: Props) => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryActivityLogItem[]>([]);

  // A stock addition writes a new log entry — pull the feed again.
  const stockToken = useInventoryStockUpdated();

  useEffect(() => {
    let alive = true;

    const fetchLogs = async () => {
      const resolvedSellerId = AuthService.getLoggedInUserId();

      if (!resolvedSellerId) {
        if (alive) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const logs =
          await SellerCatalogService.getSellerActivityLogs(resolvedSellerId);

        console.log("logs", logs);

        if (alive) {
          setItems(sortByLatest(logs).slice(0, limit));
        }
      } catch (error) {
        if (alive) {
          setItems([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      alive = false;
    };
  }, [limit, stockToken]);

  return (
    <div className={className}>
      {title ? (
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
          {!loading && items.length > 0 ? ` · ${items.length}` : ""}
        </p>
      ) : null}

      {/* `app-bleed-x` — theme-2 mobile / side pane only: the feed is pulled out
          of the page gutter so the rows touch both screen edges. Hairlines top
          and bottom instead of a card border, since there are no side edges. */}
      <div
        className={clsx(
          "app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white",
          title && "tw:mt-2",
        )}
      >
        {loading ? (
          // Placeholder rows at the real row height so the pane doesn't jump.
          [0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2"
            >
              <span className="tw:size-7 tw:shrink-0 tw:animate-pulse tw:rounded-md tw:bg-slate-100" />
              <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1.5">
                <span className="tw:h-3 tw:w-2/3 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                <span className="tw:h-2.5 tw:w-1/2 tw:animate-pulse tw:rounded tw:bg-slate-100" />
              </span>
              <span className="tw:h-2.5 tw:w-10 tw:shrink-0 tw:animate-pulse tw:rounded tw:bg-slate-100" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="tw:px-3 tw:py-4 tw:text-center tw:text-xs tw:text-slate-500">
            {t("noActivityFound")}
          </p>
        ) : (
          items.map((item, index) => {
            const { title: name, subtitle, valueLabel, badgeVariant } = item;
            const timeLabel = formatActivityTime(item?.loggedAt);

            return (
              <div
                key={item?.id || `${name}-${index}`}
                className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2"
              >
                <span
                  className={clsx(
                    "tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:text-[10px] tw:font-bold",
                    TONE[badgeVariant as string] || TONE.primary,
                  )}
                >
                  {item.code}
                </span>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:text-xs tw:font-semibold tw:mb-1">
                    {item.action?.replace("_", " ")}
                  </div>
                  <div className="tw:truncate tw:text-xs tw:leading-tight tw:text-slate-500">
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/products/view/${item.id}`}
                    >
                      {name}
                    </AppLink>
                  </div>
                  {/* {subtitle ? (
                    <div className="tw:truncate tw:text-[11px] tw:leading-tight tw:text-slate-500">
                      {subtitle}
                    </div>
                  ) : null} */}
                </div>

                <div className="tw:shrink-0 tw:text-right">
                  {valueLabel ? (
                    <div
                      className={clsx(
                        "app-amount tw:text-[11px] tw:font-bold tw:leading-tight",
                        valueTone(String(valueLabel)),
                      )}
                    >
                      {valueLabel}
                    </div>
                  ) : null}
                  {timeLabel ? (
                    <div className="tw:text-[10px] tw:leading-tight tw:text-slate-400">
                      {timeLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventoryActivityLog;
