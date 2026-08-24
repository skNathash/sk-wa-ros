import clsx from "clsx";
import { AlertTriangle, CheckCircle2, CreditCard, FileText } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppSwiper from "~/components/core/swiper";
import type { OrderSummary } from "../../helper";
import { getSummaryData } from "./helper";

type SummaryAccent = "blue" | "emerald" | "amber" | "rose";

type SummaryItem = {
  key: string;
  label: string;
  value: React.ReactNode;
  /** Render `value` as currency. */
  isAmount?: boolean;
  subLabel?: React.ReactNode;
  accent?: SummaryAccent;
};

type SummaryProps = {
  /** Aggregates from `sales/order/ordersummary/{sellerId}`. */
  summary?: OrderSummary;
  /** Overrides the tiles derived from `summary`. */
  data?: SummaryItem[];
  loading?: boolean;
  className?: string;
};

const accentStyles: Record<
  SummaryAccent,
  { value: string; chip: string; blob: string }
> = {
  blue: {
    value: "tw:text-slate-900",
    chip: "tw:bg-blue-50 tw:text-blue-500",
    blob: "tw:bg-blue-100/70",
  },
  emerald: {
    value: "tw:text-emerald-600",
    chip: "tw:bg-emerald-50 tw:text-emerald-500",
    blob: "tw:bg-emerald-100/70",
  },
  amber: {
    value: "tw:text-amber-600",
    chip: "tw:bg-amber-50 tw:text-amber-500",
    blob: "tw:bg-amber-100/70",
  },
  rose: {
    value: "tw:text-rose-600",
    chip: "tw:bg-rose-50 tw:text-rose-500",
    blob: "tw:bg-rose-100/70",
  },
};

const iconClass = "tw:w-3.5 tw:h-3.5";

const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  slidesPerView: 1.8,
  mousewheel: {
    forceToAxis: true,
  },
  breakpoints: {
    1024: {
      slidesPerView: 3,
    },
  },
};

const icons: Record<string, React.ReactNode> = {
  totalOrders: <FileText className={iconClass} />,
  paidToSeller: <CheckCircle2 className={iconClass} />,
  paymentDue: <CreditCard className={iconClass} />,
  overduePaylater: <AlertTriangle className={iconClass} />,
};

const Summary = ({ summary, data, loading, className }: SummaryProps) => {
  const items = data || getSummaryData(summary);

  return (
    <AppSwiper
      config={swiperConfig}
      className={clsx(loading && "tw:animate-pulse", className)}
    >
      {items.map((item) => {
        const accent = accentStyles[item.accent || "blue"];
        return (
          <AppSwiper.Slide key={item.key}>
            <div className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:p-4 tw:shadow-[0_1px_2px_rgba(15,23,42,0.04)] tw:transition-shadow tw:hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
              <div
                aria-hidden
                className={clsx(
                  "tw:pointer-events-none tw:absolute tw:-top-6 tw:-right-6 tw:h-24 tw:w-24 tw:rounded-full",
                  accent.blob,
                )}
              />
              <div className="tw:relative tw:flex tw:items-center tw:gap-2">
                <span
                  className={clsx(
                    "tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                    accent.chip,
                  )}
                >
                  {icons[item.key] || <FileText className={iconClass} />}
                </span>
                <span className="tw:truncate tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500">
                  {item.label}
                </span>
              </div>
              <div
                className={clsx(
                  "tw:relative tw:mt-2 tw:text-2xl tw:font-bold tw:leading-tight tw:font-serif!",
                  accent.value,
                )}
              >
                {item.isAmount ? (
                  <Amount value={Number(item.value) || 0} decimalPlaces={0} />
                ) : (
                  item.value
                )}
              </div>
              {item.subLabel ? (
                <div className="tw:relative tw:mt-1 tw:text-xs tw:text-slate-500 tw:font-mono!">
                  {item.subLabel}
                </div>
              ) : null}
            </div>
          </AppSwiper.Slide>
        );
      })}
    </AppSwiper>
  );
};

export default Summary;
export type { SummaryItem, SummaryProps, SummaryAccent };
