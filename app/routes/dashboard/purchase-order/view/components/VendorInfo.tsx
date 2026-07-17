import {
  Building2,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import { useState } from "react";
import clsx from "clsx";

interface VendorInfoProps {
  vendor: Record<string, any>;
}

const VendorInfo: React.FC<VendorInfoProps> = ({ vendor }) => {
  const appNav = useAppNav();

  const { isMobile } = useScreenView();

  const [isExpanded, setIsExpanded] = useState(isMobile ? false : true);

  const handleExpand = () => {
    if (!isMobile) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  if (!vendor) return null;

  // Compose address string
  const address = vendor.address
    ? [
        vendor.address.line1,
        vendor.address.line2,
        vendor.address.city,
        vendor.address.state,
        vendor.address.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <AppCard
      className={clsx(!isExpanded ? "tw:!pb-2" : "")}
      title={
        <div
          className="tw:flex tw:justify-between tw:w-full tw:sm:cursor-pointer"
          onClick={handleExpand}
        >
          <div className="tw:flex-1">Vendor Information</div>
          {isMobile ? (
            <div>
              <button>
                {isExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>
          ) : null}
        </div>
      }
      icon={<Building2 size={16} />}
    >
      <div
        className={clsx(
          "tw:space-y-4 tw:text-sm",
          isExpanded ? "tw:block" : "tw:hidden"
        )}
      >
        <div className="tw:flex tw:items-center tw:gap-2">
          <AppLink
            asLink
            href={`/dashboard/vendor/view/${vendor._id}`}
            className="tw:font-bold tw:text-lg tw:cursor-pointer tw:text-black"
            noUnderline
          >
            {vendor.name}
          </AppLink>
          <VendorTypeBadge
            type={vendor._vendorType}
            color={vendor._vendorTypeColor}
            description={vendor._vendorTypeInfo}
          />
        </div>
        <AppLink
          asLink
          href={`/dashboard/vendor/view/${vendor._id}`}
          className="tw:text-blue-600 tw:cursor-pointer tw:mb-1 tw:-mt-2 tw:text-base"
        >
          {vendor.vendorId}
        </AppLink>
        <div className="tw:space-y-2 tw:mt-2">
          {vendor.email ? (
            <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-600">
              <Mail size={16} />
              <span className="tw:flex-1">{vendor.email || "-"}</span>
            </div>
          ) : null}

          <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-600">
            <Phone size={16} />
            <span className="tw:flex-1">{vendor.mobile || "-"}</span>
          </div>

          {address && (
            <div className="tw:flex tw:items-start tw:gap-2 tw:text-gray-600">
              <MapPin size={16} />
              <span className="tw:flex-1">{address}</span>
            </div>
          )}

          {/* GST number - check common vendor fields */}
          {vendor.gst_no ? (
            <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-600">
              <span className="tw:flex-1 tw-font-medium">GST:</span>
              <span className="tw:flex-1">{vendor.gst_no}</span>
            </div>
          ) : null}
        </div>
        {/* <Divider className="tw:!my-2" />
        <div>
          <AppButton
            color="primary"
            fill="clear"
            className="tw:text-blue-600"
            size="small"
            onClick={() => appNav.to(`/dashboard/vendor/view/${vendor._id}`)}
          >
            View Vendor Details &rarr;
          </AppButton>
        </div> */}
      </div>
    </AppCard>
  );
};

export default VendorInfo;
