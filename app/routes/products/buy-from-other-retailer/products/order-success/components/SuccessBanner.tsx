import { CheckCircle2 } from "lucide-react";

interface Props {
  totalOrders: number;
  totalSellers: number;
}

const SuccessBanner = ({ totalSellers }: Props) => {
  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:bg-linear-to-r tw:from-green-50 tw:to-white tw:px-4 tw:py-3 tw:rounded-xl tw:border tw:border-green-200 tw:mb-3">
      <div className="tw:w-11 tw:h-11 tw:shrink-0 tw:rounded-full tw:bg-green-100 tw:flex tw:items-center tw:justify-center">
        <CheckCircle2 className="tw:w-7 tw:h-7 tw:text-green-600" />
      </div>
      <div className="tw:min-w-0">
        <div className="tw:text-base tw:font-bold tw:text-gray-900 tw:leading-tight">
          Order placed
        </div>
        <div className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
          Ordered from {totalSellers} {totalSellers > 1 ? "sellers" : "seller"}
        </div>
      </div>
    </div>
  );
};

export default SuccessBanner;
