import { ChevronRight, MapPin, Phone, Plus, User } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import type { SimilarVendor } from "../types";

interface ChooseVendorModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  vendors: SimilarVendor[];
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "tw:bg-blue-100 tw:text-blue-700",
  "tw:bg-emerald-100 tw:text-emerald-700",
  "tw:bg-violet-100 tw:text-violet-700",
  "tw:bg-amber-100 tw:text-amber-700",
  "tw:bg-rose-100 tw:text-rose-700",
];

const ChooseVendorModal = ({
  show,
  callback,
  vendors,
}: ChooseVendorModalProps) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleSelect = (vendor: SimilarVendor) => {
    callback({ action: "select", data: vendor });
  };

  const handleCreate = () => {
    callback({ action: "create" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-lg tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>Choose Vendor</AppModal.Title>
      <AppModal.Content className="tw:h-[90vh] tw:overflow-y-auto">
        <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-3 tw:mb-4">
          <p className="tw:text-sm tw:text-amber-800">
            We found <span className="tw:font-semibold">{vendors.length} vendors</span> matching the scanned invoice. Select the correct one or create a new vendor.
          </p>
        </div>
        <div className="tw:space-y-3">
          {vendors.map((vendor, index) => (
            <button
              key={vendor.id}
              type="button"
              onClick={() => handleSelect(vendor)}
              className="tw:w-full tw:text-left tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:hover:border-blue-400 tw:hover:bg-blue-50/30 tw:hover:shadow-sm tw:transition-all tw:flex tw:items-start tw:gap-3 tw:group"
            >
              <div
                className={`tw:w-10 tw:h-10 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold tw:shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
              >
                {getInitials(vendor.name)}
              </div>
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {vendor.name}
                </div>
                {vendor.gstin && (
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    GSTIN: <span className="tw:font-mono tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded">{vendor.gstin}</span>
                  </div>
                )}
                <div className="tw:flex tw:flex-wrap tw:gap-x-4 tw:gap-y-1 tw:mt-1.5">
                  {vendor.contactPerson && (
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                      <User size={12} />
                      {vendor.contactPerson}
                    </div>
                  )}
                  {vendor.mobileNumber && (
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                      <Phone size={12} />
                      {vendor.mobileNumber}
                    </div>
                  )}
                </div>
                {vendor.address?.addressLine && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-400 tw:mt-1 tw:truncate">
                    <MapPin size={12} className="tw:shrink-0" />
                    {vendor.address.addressLine}
                  </div>
                )}
              </div>
              <ChevronRight
                size={18}
                className="tw:text-gray-300 tw:group-hover:text-blue-400 tw:shrink-0 tw:mt-2.5 tw:transition-colors"
              />
            </button>
          ))}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-between tw:gap-3">
          <AppButton size="small" color="primary" onClick={handleCreate}>
            <Plus size={14} />
            Create Vendor
          </AppButton>
          <AppButton size="small" fill="outline" color="secondary" onClick={handleClose}>
            Cancel
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ChooseVendorModal;
