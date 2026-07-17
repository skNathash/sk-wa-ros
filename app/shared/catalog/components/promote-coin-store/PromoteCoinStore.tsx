import { ArrowRight, Coins } from "lucide-react";
import { useNavigate } from "react-router";
import AppButton from "~/components/core/button/AppButton";

const PromoteCoinStore = () => {
  const navigate = useNavigate();

  const handleViewDeals = () => {
    navigate("/products/coin-store-deals");
  };

  if (1) {
    return null;
  }

  return (
    <div className="tw:relative tw:overflow-hidden tw:bg-linear-to-r tw:from-amber-50 tw:to-orange-50 tw:border tw:border-amber-200/60 tw:rounded-2xl tw:p-3 tw:mb-4 tw:flex tw:items-center tw:gap-3 tw:shadow-[0_2px_10px_-4px_rgba(245,158,11,0.2)] hover:tw:shadow-[0_4px_15px_-4px_rgba(245,158,11,0.3)] tw:transition-all">
      <div className="tw:absolute tw:top-0 tw:right-0 tw:w-32 tw:h-32 tw:bg-amber-200/20 tw:rounded-full tw:-mr-16 tw:-mt-16 tw:blur-3xl" />

      <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:bg-amber-500 tw:rounded-xl tw:shrink-0 tw:shadow-lg tw:shadow-amber-200 tw:z-10">
        <Coins className="tw:text-white" size={20} />
      </div>

      <div className="tw:flex-1 tw:min-w-0 tw:z-10">
        <h3 className="tw:text-[13px] tw:font-bold tw:text-amber-900 tw:leading-tight">
          Coin Store deals!
        </h3>
        <p className="tw:text-[11px] tw:text-amber-800/80 tw:line-clamp-1 tw:mt-0.5">
          Share exclusive offers to your customer & boost your sales.
        </p>
      </div>

      <AppButton
        onClick={handleViewDeals}
        color="warning"
        fill="solid"
        size="small"
        className="tw:shrink-0 tw:!h-8 tw:!px-4 tw:rounded-lg tw:font-bold tw:text-[11px] tw:z-10 tw:shadow-sm"
      >
        <span>View</span>
        <ArrowRight className="tw:ml-1 tw:h-3.5 tw:w-3.5" />
      </AppButton>
    </div>
  );
};
export default PromoteCoinStore;
