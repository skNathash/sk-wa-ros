import {
  CheckCircle2,
  Hash,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Truck,
} from "lucide-react";
import type { InvoiceVendor, SimilarVendor } from "../types";

interface VendorProps {
  vendor: InvoiceVendor;
  selectedVendor?: SimilarVendor;
  onChangeVendor?: () => void;
  onCreateVendor?: () => void;
}

const Vendor = ({
  vendor,
  selectedVendor,
  onChangeVendor,
  onCreateVendor,
}: VendorProps) => {
  const displayVendor = selectedVendor || vendor;
  const hasSimilarVendors =
    vendor.similarVendors && vendor.similarVendors.length > 0;
  const hasMatchedVendor = !!vendor.matchedVendor;
  const showActions = !hasMatchedVendor && !selectedVendor;
  const address =
    displayVendor.address?.addressLine || vendor.address?.addressLine;

  return (
    <div className="tw:flex tw:flex-col tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:p-3">
        <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-indigo-50 tw:text-indigo-600">
          <Truck size={16} />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
            Vendor
          </div>
          <div className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900 tw:wrap-break-word">
            {displayVendor.name || "-"}
          </div>
        </div>
        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
          {hasMatchedVendor && (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-green-50 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-green-700">
              <CheckCircle2 size={12} />
              Matched
            </span>
          )}
          {showActions && hasSimilarVendors && onChangeVendor && (
            <button
              onClick={onChangeVendor}
              className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:bg-blue-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-blue-600 tw:transition-colors tw:hover:bg-blue-100"
            >
              <RefreshCw size={12} />
              Change
            </button>
          )}
          {showActions && onCreateVendor && (
            <button
              onClick={onCreateVendor}
              className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:bg-green-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-green-600 tw:transition-colors tw:hover:bg-green-100"
            >
              <Plus size={12} />
              Create
            </button>
          )}
        </div>
      </div>

      {(displayVendor.gstin || displayVendor.mobileNumber || address) && (
        <div className="tw:space-y-2 tw:border-t tw:border-gray-100 tw:px-3 tw:py-2.5">
          {displayVendor.gstin && (
            <div className="tw:flex tw:items-start tw:gap-2">
              <Hash size={14} className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400" />
              <div className="tw:min-w-0">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  GSTIN
                </div>
                <div className="tw:font-mono tw:text-xs tw:text-gray-700 tw:break-all">
                  {displayVendor.gstin}
                </div>
              </div>
            </div>
          )}
          {displayVendor.mobileNumber && (
            <div className="tw:flex tw:items-start tw:gap-2">
              <Phone size={14} className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400" />
              <div className="tw:min-w-0">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  Mobile
                </div>
                <div className="tw:text-xs tw:text-gray-700">
                  {displayVendor.mobileNumber}
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

export default Vendor;
