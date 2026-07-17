import { MapPin, Phone, Store } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import { formatAddress, type SellerInfo } from "../helper";

interface Props {
  seller: SellerInfo;
  totalAmount: number;
  totalItemsLabel: string;
}

const SellerHeader = ({ seller, totalAmount, totalItemsLabel }: Props) => {
  return (
    <div className="tw:pb-3 tw:mb-3 tw:border-b tw:border-gray-100">
      <div className="tw:flex tw:items-center tw:gap-3">
        <div className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:shrink-0">
          <Store className="tw:w-5 tw:h-5 tw:text-primary" />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-base tw:font-bold tw:text-gray-900 tw:truncate tw:leading-tight">
            {seller.franchiseName || "Seller"}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
            {totalItemsLabel}
          </div>
        </div>
        <div className="tw:text-right tw:shrink-0">
          <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wider tw:leading-none">
            Total
          </div>
          <Amount
            value={totalAmount}
            className="tw:text-lg tw:font-bold tw:text-gray-900"
          />
        </div>
      </div>
      {(seller.mobile ||
        (seller.address && formatAddress(seller.address))) && (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1 tw:mt-2.5 tw:pl-[52px]">
          {seller.mobile && (
            <a
              href={`tel:${seller.mobile}`}
              className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-primary tw:font-medium"
            >
              <Phone className="tw:w-3.5 tw:h-3.5" />
              {seller.mobile}
            </a>
          )}
          {seller.address && formatAddress(seller.address) && (
            <div className="tw:inline-flex tw:items-start tw:gap-1 tw:text-xs tw:text-gray-600">
              <MapPin className="tw:w-3.5 tw:h-3.5 tw:shrink-0 tw:mt-0.5" />
              <span>{formatAddress(seller.address)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerHeader;
