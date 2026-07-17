import { Hash, MapPin, Phone, Store } from "lucide-react";
import type { InvoiceBuyer } from "../types";

interface BuyerProps {
  buyer: InvoiceBuyer;
  /** When provided, shows a one-tap action to set the buyer to the logged-in store. */
  onUseMyStore?: () => void;
}

const Buyer = ({ buyer, onUseMyStore }: BuyerProps) => {
  const address = buyer.address?.addressLine;

  return (
    <div className="tw:flex tw:flex-col tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:p-3">
        <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-50 tw:text-emerald-600">
          <Store size={16} />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
            Buyer
          </div>
          <div className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900 tw:wrap-break-word">
            {buyer.name || "-"}
          </div>
        </div>
        {onUseMyStore && (
          <button
            onClick={onUseMyStore}
            className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-md tw:bg-emerald-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-emerald-700 tw:transition-colors tw:hover:bg-emerald-100"
          >
            <Store size={12} />
            Use my store
          </button>
        )}
      </div>

      {(buyer.gstin || buyer.mobileNumber || address) && (
        <div className="tw:space-y-2 tw:border-t tw:border-gray-100 tw:px-3 tw:py-2.5">
          {buyer.gstin && (
            <div className="tw:flex tw:items-start tw:gap-2">
              <Hash size={14} className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400" />
              <div className="tw:min-w-0">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  GSTIN
                </div>
                <div className="tw:font-mono tw:text-xs tw:text-gray-700 tw:break-all">
                  {buyer.gstin}
                </div>
              </div>
            </div>
          )}
          {buyer.mobileNumber && (
            <div className="tw:flex tw:items-start tw:gap-2">
              <Phone size={14} className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400" />
              <div className="tw:min-w-0">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  Mobile
                </div>
                <div className="tw:text-xs tw:text-gray-700">
                  {buyer.mobileNumber}
                </div>
              </div>
            </div>
          )}
          {address && (
            <div className="tw:flex tw:items-start tw:gap-2">
              <MapPin size={14} className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400" />
              <div className="tw:min-w-0">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  Address
                </div>
                <div className="tw:whitespace-pre-line tw:text-xs tw:text-gray-600">
                  {address}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Buyer;
