import { useEffect, useMemo, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import MonthYearFilter, {
  getCurrentMonthYear,
  getMonthRange,
  type MonthYearValue,
} from "~/shared/others/month-year-filter/MonthYearFilter";

interface PaymentDay {
  date: string;
  weekday: string;
  dayOfMonth: number;
  net: number;
  /** Cash-flow direction — "out" (red) for net outflow, "in" (green) for inflow. */
  direction: "in" | "out";
}

interface PaymentCalendarData {
  totalDue: number;
  netProfit: number;
  days: PaymentDay[];
}

const mapPaymentCalendar = (data: any): PaymentCalendarData => ({
  totalDue: Number(data?.totalDue) || 0,
  netProfit: Number(data?.netProfit) || 0,
  days: (data?.days ?? []).map((item: any) => ({
    date: item?.date ?? "",
    weekday: item?.weekday ?? "",
    dayOfMonth: Number(item?.dayOfMonth) || 0,
    net: Number(item?.net) || 0,
    direction: item?.direction === "out" ? "out" : "in",
  })),
});

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 8,
  freeMode: true,
  navigation: false,
  pagination: false,
};

/**
 * Payment calendar strip showing per-day net cash flow. The section label sits
 * on the page background and the date tiles float out of the card. Fetches the
 * insights block and reads `paymentCalendar`.
 */
const PaymentCalendar = ({
  callback,
}: {
  callback: (arg: { startDate: string; endDate: string }) => void;
}) => {
  const [period, setPeriod] = useState<MonthYearValue>(getCurrentMonthYear);
  const [calendar, setCalendar] = useState<PaymentCalendarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { startDate, endDate } = useMemo(
    () => getMonthRange(period.month, period.year),
    [period.month, period.year],
  );

  useEffect(() => {
    let active = true;
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "paymentCalendar", startDate, endDate },
        });
        if (!active) return;
        setCalendar(mapPaymentCalendar(response.data?.data?.paymentCalendar));
      } catch (error) {
        console.error("Payment calendar insights error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCalendar();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  if (loading) return null;

  return (
    <div>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-1">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          Payment calendar
        </p>
        <MonthYearFilter
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </div>

      {calendar && calendar.days.length > 0 ? (
        <AppSwiper config={swiperConfig} className="tw:mt-3 tw:pb-1">
          {calendar.days.map((item) => {
            const isOut = item.direction === "out";
            return (
              <AppSwiper.Slide key={item.date} isAutoWidth>
                <div
                  className={`tw:flex tw:cursor-pointer tw:w-14 tw:flex-col tw:items-center tw:rounded-xl tw:border-t-2 tw:bg-white tw:py-2.5 tw:text-center tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 ${
                    isOut ? "tw:border-t-rose-500" : "tw:border-t-emerald-500"
                  }`}
                  onClick={() =>
                    callback({ startDate: item.date, endDate: item.date })
                  }
                >
                  <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:text-gray-500">
                    {item.weekday}
                  </span>
                  <span className="tw:my-1 tw:text-lg tw:font-bold tw:text-slate-900">
                    {item.dayOfMonth}
                  </span>
                  <Amount
                    value={item.net}
                    className={`tw:text-[10px] tw:font-semibold ${
                      isOut ? "tw:text-rose-600" : "tw:text-emerald-600"
                    }`}
                  />
                </div>
              </AppSwiper.Slide>
            );
          })}
        </AppSwiper>
      ) : (
        <div className="tw:mt-3 tw:rounded-xl tw:bg-white tw:py-6 tw:text-center tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
          <p className="tw:text-sm tw:text-gray-500">No upcoming payments</p>
        </div>
      )}
    </div>
  );
};

export default PaymentCalendar;
