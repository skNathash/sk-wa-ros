import { PackageX, Plus, Timer } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";

interface InsufficientStockBannerProps {
  count: number;
  showShipLaterButton?: boolean;
  onShipLater: () => void;
}

const PRODUCTS_ANCHOR_ID = "order-products-section";

const InsufficientStockBanner = ({
  count,
  showShipLaterButton,
  onShipLater,
}: InsufficientStockBannerProps) => {
  const handleAddStock = () => {
    const el = document.getElementById(PRODUCTS_ANCHOR_ID);
    CommonService.scrollToView(el);
  };

  return (
    <div className="tw:sticky tw:top-15 tw:z-40 tw:mb-4 tw:rounded-lg tw:bg-orange-50 tw:ring-1 tw:ring-orange-200/80 tw:px-3 tw:py-2.5 tw:flex tw:items-center tw:gap-3 tw:flex-wrap tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-md tw:bg-orange-500 tw:text-white tw:shrink-0">
        <PackageX size={16} strokeWidth={2.4} />
      </div>

      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:text-[14px] tw:leading-tight tw:text-orange-950">
          <span className="tw:font-bold tw:tabular-nums">{count}</span>{" "}
          <span className="tw:font-semibold">
            item{count > 1 ? "s" : ""} not in stock
          </span>
        </div>
        <div className="tw:text-[12px] tw:text-orange-900/70 tw:leading-snug tw:mt-0.5">
          Add stock now, or send these items later.
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-2 tw:w-full tw:sm:w-auto">
        <AppButton
          color="success"
          size="small"
          onClick={handleAddStock}
          className="tw:flex-1 tw:sm:flex-none tw:font-semibold"
        >
          <Plus size={14} />
          Add Stock
        </AppButton>

        {showShipLaterButton ? (
          <AppButton
            color="warning"
            fill="outline"
            size="small"
            onClick={onShipLater}
            className="tw:flex-1 tw:sm:flex-none tw:font-semibold"
          >
            <Timer size={14} />
            Ship Later
          </AppButton>
        ) : null}
      </div>
    </div>
  );
};

export default InsufficientStockBanner;
