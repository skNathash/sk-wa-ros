import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import Amount from "~/components/core/amount/Amount";
import PurchaseOrderService from "~/services/PurchaseOrderService";

/** Window (in days) the recap covers — also what the API defaults to. */
const SUMMARY_DAYS = 7;

interface PurchaseSummary {
  days?: number;
  ordersPlaced?: {
    orders?: number;
    sellers?: number;
    amount?: number;
  };
  boxesReceived?: {
    boxes?: number;
    orders?: number;
    senders?: number;
    units?: number;
    shortShipped?: number;
    shortUnits?: number;
  };
  paymentsMade?: {
    amount?: number;
    payments?: number;
    byMode?: Array<{
      mode?: string;
      label?: string;
      payments?: number;
      count?: number;
      amount?: number;
    }>;
  };
  dueSoon?: {
    windowDays?: number;
    amount?: number;
    dues?: number;
    paylaterDues?: number;
    orders?: number;
    undatedDues?: number;
  };
}

interface WeekSummaryRow {
  key: string;
  icon: string;
  /** Tint behind the emoji badge. */
  iconClass: string;
  label: string;
  caption: string;
  /** Numeric count, or an amount when `isAmount` is set. */
  value: number;
  isAmount?: boolean;
  valueClass: string;
  /** Where the row drills down to. */
  href: string;
}

const count = (value: unknown) => Number(value) || 0;

const plural = (n: number, singular: string, suffix = "s") =>
  `${n} ${singular}${n === 1 ? "" : suffix}`;

/** Joins the non-empty caption parts, falling back to a neutral line. */
const caption = (parts: Array<string | false | undefined>, fallback: string) =>
  parts.filter(Boolean).join(" · ") || fallback;

const paymentModeCaption = (summary: PurchaseSummary) => {
  const payments = count(summary.paymentsMade?.payments);
  const modes = (summary.paymentsMade?.byMode ?? [])
    .map((mode) => {
      const label = mode.label || mode.mode;
      if (!label) return "";
      const modeCount = count(mode.payments ?? mode.count);
      return modeCount ? `${modeCount} ${label}` : label;
    })
    .filter(Boolean);

  return caption(
    modes,
    payments ? plural(payments, "payment") : "No payments yet",
  );
};

const buildRows = (summary: PurchaseSummary): WeekSummaryRow[] => {
  const sellers = count(summary.ordersPlaced?.sellers);
  const shortShipped = count(summary.boxesReceived?.shortShipped);
  const senders = count(summary.boxesReceived?.senders);
  const units = count(summary.boxesReceived?.units);
  const paylaterDues = count(summary.dueSoon?.paylaterDues);
  const undatedDues = count(summary.dueSoon?.undatedDues);
  const dues = count(summary.dueSoon?.dues);
  const dueWindow = count(summary.dueSoon?.windowDays) || SUMMARY_DAYS;

  return [
    {
      key: "orders",
      icon: "🛒",
      iconClass: "tw:bg-slate-100",
      label: "New orders placed",
      caption: sellers ? `across ${plural(sellers, "seller")}` : "No sellers yet",
      value: count(summary.ordersPlaced?.orders),
      valueClass: "tw:text-[#0f5132]",
      href: "/dashboard/purchase-order/main",
    },
    {
      key: "boxes",
      icon: "📦",
      iconClass: "tw:bg-amber-50",
      label: "Boxes received",
      caption: caption(
        [
          senders > 0 && `from ${plural(senders, "sender")}`,
          units > 0 && plural(units, "unit"),
          shortShipped > 0 && `${shortShipped} short-shipped`,
        ],
        "Nothing received yet",
      ),
      value: count(summary.boxesReceived?.boxes),
      valueClass: "tw:text-amber-500",
      href: "/dashboard/purchase-order/recently-received",
    },
    {
      key: "payments",
      icon: "💰",
      iconClass: "tw:bg-emerald-50",
      label: "Payments made",
      caption: paymentModeCaption(summary),
      value: count(summary.paymentsMade?.amount),
      isAmount: true,
      valueClass: "tw:text-emerald-500",
      href: "/dashboard/accounts/transactions",
    },
    {
      key: "due",
      icon: "🔔",
      iconClass: "tw:bg-rose-50",
      label: `Due next ${dueWindow} days`,
      caption: caption(
        [
          paylaterDues > 0 && `${paylaterDues} PayLater dues`,
          !paylaterDues && dues > 0 && plural(dues, "due"),
          undatedDues > 0 && `${undatedDues} undated`,
        ],
        "Nothing due",
      ),
      value: count(summary.dueSoon?.amount),
      isAmount: true,
      valueClass: "tw:text-rose-500",
      href: "/dashboard/accounts/payables",
    },
  ];
};

/**
 * "This week" activity recap — one row per weekly metric with an emoji badge,
 * a label/caption pair and the count or amount on the right. Fetches the
 * purchase summary for the last {@link SUMMARY_DAYS} days.
 */
const WeekSummary = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PurchaseSummary>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await PurchaseOrderService.getPurchaseSummary({
          days: SUMMARY_DAYS,
        });
        if (!active) return;
        setSummary(response.data?.data ?? {});
      } catch (error) {
        console.error("Purchase summary error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSummary();
    return () => {
      active = false;
    };
  }, []);

  const rows = buildRows(summary);

  return (
    <div className={className}>
      <p className="tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        This week
      </p>

      {/* Hairline separators come from the 1px grid gap showing the container
          background, so they stay correct at any column count. */}
      <div className="tw:grid tw:grid-cols-1 tw:gap-px tw:overflow-hidden tw:rounded-2xl tw:bg-slate-200/70 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:sm:grid-cols-2">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => navigate(row.href)}
            className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:bg-white tw:p-3 tw:text-left tw:transition-colors tw:hover:bg-slate-50 tw:sm:gap-4 tw:sm:p-4"
          >
            <span
              className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-lg tw:sm:h-11 tw:sm:w-11 tw:sm:text-xl ${row.iconClass}`}
              aria-hidden="true"
            >
              {row.icon}
            </span>

            <div className="tw:min-w-0 tw:flex-1">
              <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-700">
                {row.label}
              </p>
              {loading ? (
                <span className="tw:mt-1 tw:block tw:h-3 tw:w-24 tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
              ) : (
                <p className="tw:truncate tw:text-xs tw:text-gray-500">
                  {row.caption}
                </p>
              )}
            </div>

            {loading ? (
              <span className="tw:h-5 tw:w-12 tw:shrink-0 tw:animate-pulse tw:rounded-full tw:bg-slate-200" />
            ) : row.isAmount ? (
              <Amount
                value={row.value}
                decimalPlaces={0}
                className={`tw:shrink-0 tw:text-base tw:font-bold tw:sm:text-lg ${row.valueClass}`}
              />
            ) : (
              <span
                className={`tw:shrink-0 tw:text-base tw:font-bold tw:sm:text-lg ${row.valueClass}`}
              >
                {row.value}
              </span>
            )}

            <ChevronRight
              className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-slate-300"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekSummary;
