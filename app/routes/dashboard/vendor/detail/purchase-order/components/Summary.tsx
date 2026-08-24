import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import {
  defaultSummaryData,
  type PurchaseOrderSummary,
} from "../helper";

const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  breakpoints: {
    0: { slidesPerView: 1.8 },
    1024: { slidesPerView: 3 },
  },
};

/**
 * Vendor purchase-order summary strip.
 *
 * Three stat cards fed by `vendor/{vendorId}/analytics?type=purchaseorder`:
 * lifetime PO count, amount already paid to the vendor and the payment still
 * pending (incl. paylater).
 */
const Summary = ({
  className,
  data = defaultSummaryData,
  loading = false,
}: {
  className?: string;
  data?: PurchaseOrderSummary;
  loading?: boolean;
}) => {
  const items = [
    {
      key: "totalPos",
      label: "Total POs · Lifetime",
      value: <span className="app-amount">{data.totalCount}</span>,
      hint: (
        <>
          <Amount value={data.totalValue} decimalPlaces={0} /> placed
        </>
      ),
      valueClass: "tw:text-gray-900",
    },
    {
      key: "paid",
      label: "Paid to vendor",
      value: <Amount value={data.paidAmount} decimalPlaces={0} />,
      hint: `${data.deliveredCount} delivered POs`,
      valueClass: "tw:text-green-700",
    },
    {
      key: "pending",
      label: "Payment pending",
      value: <Amount value={data.pendingAmount} decimalPlaces={0} />,
      hint: `${data.pendingCount} POs · incl. Paylater`,
      valueClass: "tw:text-amber-500",
    },
  ];

  return (
    <AppSwiper config={swiperConfig} className={`tw:mb-3 ${className ?? ""}`}>
      {items.map((item) => (
        <AppSwiper.Slide key={item.key} isAutoHeight>
          <AppCard
            className="tw:mb-0 tw:h-full"
            noPadding
            bodyClassName="tw:p-3"
          >
            <div className="app-label tw:uppercase tw:tracking-wider tw:text-[11px] tw:font-semibold tw:text-gray-500">
              {item.label}
            </div>
            {loading ? (
              <div className="tw:animate-pulse">
                <div className="tw:mt-1.5 tw:h-5 tw:w-20 tw:rounded tw:bg-gray-200" />
                <div className="tw:mt-1.5 tw:h-2.5 tw:w-24 tw:rounded tw:bg-gray-200" />
              </div>
            ) : (
              <>
                <div
                  className={`app-amount tw:mt-1 tw:text-lg tw:font-bold ${item.valueClass}`}
                >
                  {item.value}
                </div>
                <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
                  {item.hint}
                </div>
              </>
            )}
          </AppCard>
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

export default Summary;
