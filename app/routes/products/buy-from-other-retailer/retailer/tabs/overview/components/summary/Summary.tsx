import { useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import clsx from "clsx";
import { CreditCard, FileText, TrendingUp, Zap } from "lucide-react";
import {
  getPaylaterWallet,
  type PaylaterWallet,
} from "../paylater/helper";
import { fetchOrderStats, fetchPayableAmount } from "./helper";

type SummaryAccent = "rose" | "violet" | "blue" | "emerald" | "amber";

type SummaryItem = {
  value: React.ReactNode;
  label: string;
  subLabel?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: SummaryAccent;
};

type SummaryProps = {
  id?: string;
  data?: SummaryItem[];
  className?: string;
};

const accentStyles: Record<
  SummaryAccent,
  { value: string; chip: string; blob: string }
> = {
  rose: {
    value: "tw:text-rose-600",
    chip: "tw:bg-rose-50 tw:text-rose-500",
    blob: "tw:bg-rose-100/70",
  },
  violet: {
    value: "tw:text-violet-600",
    chip: "tw:bg-violet-50 tw:text-violet-500",
    blob: "tw:bg-violet-100/70",
  },
  blue: {
    value: "tw:text-blue-600",
    chip: "tw:bg-blue-50 tw:text-blue-500",
    blob: "tw:bg-blue-100/70",
  },
  emerald: {
    value: "tw:text-emerald-600",
    chip: "tw:bg-emerald-50 tw:text-emerald-500",
    blob: "tw:bg-emerald-100/70",
  },
  amber: {
    value: "tw:text-amber-500",
    chip: "tw:bg-amber-50 tw:text-amber-500",
    blob: "tw:bg-amber-100/70",
  },
};

const spinner = <AppSpinner className="tw:w-6 tw:h-6" />;
const iconClass = "tw:w-3.5 tw:h-3.5";

// Mobile shows 1.8 tiles so the cut-off third card signals "swipe for more";
// desktop fits all four across. Defined at module scope because AppSwiper
// re-initialises whenever the config identity changes.
const swiperConfig: SwiperOptions = {
  slidesPerView: 1.8,
  spaceBetween: 12,
  breakpoints: {
    1024: { slidesPerView: 4, spaceBetween: 12 },
  },
};

const Summary = ({ id, data, className }: SummaryProps) => {
  const [payable, setPayable] = useState(0);
  const [paylater, setPaylater] = useState<PaylaterWallet | null>(null);
  const [orderStats, setOrderStats] = useState({ total: 0, arriving: 0 });
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) {
      setPayable(0);
      setPaylater(null);
      setOrderStats({ total: 0, arriving: 0 });
      setLoading(false);
      return;
    }
    let active = true;
    const fetchSummaryData = async () => {
      setLoading(true);
      try {
        const [amount, paylaterData, stats] = await Promise.all([
          fetchPayableAmount(id),
          getPaylaterWallet(id).catch(() => null),
          fetchOrderStats(id),
        ]);
        if (active) {
          setPayable(amount);
          setPaylater(paylaterData);
          setOrderStats(stats);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSummaryData();
    return () => {
      active = false;
    };
  }, [id]);

  const summary: SummaryItem[] = data || [
    {
      value: loading ? spinner : <Amount value={payable} />,
      label: "YOU OWE",
      icon: <CreditCard className={iconClass} />,
      accent: "rose",
    },
    {
      value: loading ? (
        spinner
      ) : paylater ? (
        <Amount value={paylater.creditLimit} />
      ) : (
        <span>-</span>
      ),
      label: "PAYLATER LIMIT",
      subLabel: !loading
        ? paylater
          ? paylater.isSpendable
            ? `${paylater.utilisedPercentage}% used`
            : paylater.isExpired
              ? "Expired"
              : paylater.statusLabel
          : "Not active"
        : undefined,
      icon: <Zap className={iconClass} />,
      accent: "violet",
    },
    {
      value: loading ? spinner : <span>{orderStats.total}</span>,
      label: "POS · 6 MONTHS",
      subLabel:
        !loading && orderStats.arriving > 0
          ? `${orderStats.arriving} arriving`
          : undefined,
      icon: <FileText className={iconClass} />,
      accent: "blue",
    },
    // No API available for fill rate yet — static placeholder.
    {
      value: <span>98%</span>,
      label: "FILL RATE",
      subLabel: "above SK 96%",
      icon: <TrendingUp className={iconClass} />,
      accent: "emerald",
    },
  ];

  return (
    <AppSwiper config={swiperConfig} className={clsx(className)}>
      {summary.map((item, index) => {
        const accent = accentStyles[item.accent || "blue"];
        return (
          <AppSwiper.Slide key={index} isAutoHeight>
            <div className="tw:relative tw:h-full tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:p-4 tw:shadow-[0_1px_2px_rgba(15,23,42,0.04)] tw:transition-shadow tw:hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
              <div
                aria-hidden
                className={clsx(
                  "tw:pointer-events-none tw:absolute tw:-top-6 tw:-right-6 tw:h-24 tw:w-24 tw:rounded-full",
                  accent.blob,
                )}
              />
              <div className="tw:relative tw:flex tw:items-center tw:gap-2">
                {item.icon ? (
                  <span
                    className={clsx(
                      "tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                      accent.chip,
                    )}
                  >
                    {item.icon}
                  </span>
                ) : null}
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
                {item.value}
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
export type { SummaryItem, SummaryProps };
