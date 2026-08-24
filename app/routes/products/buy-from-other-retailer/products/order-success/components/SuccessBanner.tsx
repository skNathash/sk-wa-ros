import { CheckCircle2, Package, Store } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";

interface Props {
  totalOrders: number;
  totalSellers: number;
}

// A clear, friendly confirmation header. It leads with a single success icon
// and a short message, then shows the key numbers so the user knows at a glance
// how many orders and sellers are involved.
const SuccessBanner = ({ totalOrders, totalSellers }: Props) => {
  const orderLabel = totalOrders === 1 ? "order" : "orders";
  const sellerLabel = totalSellers === 1 ? "seller" : "sellers";

  return (
    <AppCard
      noPadding
      className="tw:rounded-2xl tw:shadow-sm tw:mb-6 tw:text-center tw:px-6 tw:py-7"
    >
      <div className="tw:mx-auto tw:mb-3 tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-green-100">
        <CheckCircle2
          size={30}
          strokeWidth={2.25}
          className="tw:text-green-600"
        />
      </div>

      <h2 className="tw:text-xl tw:font-bold tw:text-gray-900">
        Order placed successfully
      </h2>
      <p className="tw:mx-auto tw:mt-1 tw:max-w-md tw:text-sm tw:text-gray-500">
        Your {orderLabel} {totalOrders === 1 ? "has" : "have"} been submitted to
        the seller{totalSellers > 1 ? "s" : ""} for processing.
      </p>

      <div className="tw:mx-auto tw:mt-5 tw:flex tw:max-w-sm tw:items-center tw:justify-center tw:gap-3">
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-gray-50 tw:px-3 tw:py-2.5">
          <Package size={16} strokeWidth={2.25} className="tw:text-gray-400" />
          <div className="tw:text-left">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
              Orders
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight">
              {totalOrders} {orderLabel}
            </div>
          </div>
        </div>

        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-gray-50 tw:px-3 tw:py-2.5">
          <Store size={16} strokeWidth={2.25} className="tw:text-gray-400" />
          <div className="tw:text-left">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
              Sellers
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight">
              {totalSellers} {sellerLabel}
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default SuccessBanner;
