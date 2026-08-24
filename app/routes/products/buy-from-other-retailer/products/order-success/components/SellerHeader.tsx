import { MapPin, Phone } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import { formatAddress, type SellerInfo } from "../helper";

interface Props {
  seller: SellerInfo;
  totalAmount: number;
  totalItemsLabel: string;
}

// A clean seller summary header: who the order is with, one line of contact
// detail, and the payable total parked on the right.
const SellerHeader = ({ seller, totalAmount, totalItemsLabel }: Props) => {
  const name = seller.franchiseName || "Seller";
  const initial = name.trim().charAt(0).toUpperCase();
  const address = formatAddress(seller.address);

  return (
    <div className="tw:border-b tw:border-gray-200 tw:bg-gray-50 tw:px-4 tw:py-3">
      <div className="tw:flex tw:items-center tw:gap-3">
        <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-sm tw:font-bold tw:text-white">
          {initial}
        </div>

        <div className="tw:min-w-0 tw:flex-1 tw:overflow-hidden">
          <div className="tw:truncate tw:font-semibold tw:leading-tight tw:text-gray-900">
            {name}
          </div>
          <div className="tw:mt-0.5 tw:flex tw:min-w-0 tw:flex-col tw:items-start tw:gap-1 tw:text-[11px] tw:text-gray-500 sm:tw:flex-row sm:tw:items-center sm:tw:gap-1.5">
            {seller.mobile && (
              <a
                href={`tel:${seller.mobile}`}
                className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:font-medium tw:text-primary"
              >
                <Phone size={11} strokeWidth={2.5} />
                {seller.mobile}
              </a>
            )}
            {seller.mobile && address && (
              <span className="tw:hidden tw:text-gray-300 sm:tw:inline">·</span>
            )}
            {address && (
              <span className="tw:flex tw:min-w-0 tw:max-w-full tw:items-center tw:gap-1">
                <MapPin size={11} strokeWidth={2.5} className="tw:shrink-0" />
                <span className="tw:truncate">{address}</span>
              </span>
            )}
          </div>
        </div>

        <div className="tw:shrink-0 tw:text-right">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
            Total
          </div>
          <Amount
            value={totalAmount}
            className="tw:text-base tw:font-bold tw:text-gray-900"
          />
          {totalItemsLabel && (
            <div className="tw:text-[11px] tw:leading-tight tw:text-gray-500">
              {totalItemsLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerHeader;
