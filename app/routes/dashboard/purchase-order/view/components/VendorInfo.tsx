import {
  Building2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import EntityThumb from "~/components/core/img/EntityThumb";
import ImgRender from "~/components/core/img/ImgRender";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface VendorInfoProps {
  vendor: Record<string, any>;
}

const getInitials = (name?: string) => {
  if (!name) return "V";
  const parts = name.trim().split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const VendorInfo: React.FC<VendorInfoProps> = ({ vendor }) => {
  const { isMobile } = useScreenView();
  const [isExpanded, setIsExpanded] = useState(isMobile ? false : true);

  const handleExpand = () => {
    if (!isMobile) return;
    setIsExpanded(!isExpanded);
  };

  if (!vendor) return null;

  const primaryContact =
    vendor._primaryContact || vendor._contact || vendor.contact?.[0];
  const mobile =
    vendor.mobile || primaryContact?.mobile || primaryContact?.phone || "";

  const location = [vendor.address?.city, vendor.address?.state]
    .filter(Boolean)
    .join(", ");

  const fullAddress =
    vendor._fullAddress ||
    (vendor.address
      ? [
          vendor.address.line1 || vendor.address.doorNo,
          vendor.address.line2 || vendor.address.street,
          vendor.address.city,
          vendor.address.state,
          vendor.address.pincode || vendor.address.postcode,
        ]
          .filter(Boolean)
          .join(", ")
      : null);

  const displayLocation = location || fullAddress;
  const vendorUrl = `/dashboard/vendor/view/${vendor._id || vendor.id}`;
  const phoneDigits = String(mobile).replace(/\D/g, "");
  const waNumber =
    phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  const handleWhatsApp = () => {
    if (!waNumber) return;
    const url = CommonService.prepareWhatsappMessage("", waNumber);
    CommonService.windowOpenHandler(url, () => {});
  };

  const handleCall = () => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  };

  return (
    <AppCard
      className={clsx("tw:h-full tw:mb-0!", !isExpanded && "tw:pb-2!")}
      headerClassName="tw:border-b tw:border-gray-100 tw:pb-3"
      iconClassName="tw:mr-0!"
      title={
        // `flex-1 min-w-0` — not `w-full`: this row is a flex sibling of the
        // card's icon, so a full-width child overflows the header by the icon
        // and gap and the chevron lands outside the card's padding (clipped by
        // `overflow-clip`) instead of aligned with the values below.
        <div
          className="tw:flex tw:flex-1 tw:min-w-0 tw:items-center tw:justify-between tw:gap-2 tw:sm:cursor-pointer"
          onClick={handleExpand}
        >
          <div className="tw:min-w-0 tw:truncate">Vendor Information</div>
          {isMobile ? (
            <button
              type="button"
              aria-label="Toggle vendor details"
              className="tw:shrink-0 tw:text-gray-400"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          ) : null}
        </div>
      }
      icon={<Building2 size={16} className="tw:text-gray-500" />}
    >
      <div
        className={clsx(
          // The card body has no bottom padding of its own (so a collapsed
          // group closes flush against its header) — this block ends in
          // buttons rather than a padded row, so it supplies its own.
          "tw:space-y-4 tw:pb-3 tw:text-sm",
          isExpanded ? "tw:block" : "tw:hidden",
        )}
      >
        <div className="tw:flex tw:items-start tw:gap-3">
          <AppLink asLink href={vendorUrl} noUnderline>
            {vendor.assetId ? (
              <EntityThumb
                name={vendor.name}
                assetId={vendor.assetId}
                boxClassName="tw:w-11 tw:h-11 tw:rounded-full tw:shrink-0 tw:ring-1 tw:ring-gray-100"
                imgClassName="tw:rounded-full"
                initialClassName="tw:text-sm"
                fit="cover"
              />
            ) : (
              <div
                className="tw:w-11 tw:h-11 tw:rounded-full tw:shrink-0 tw:bg-blue-500 tw:text-white tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold"
                aria-label={vendor.name}
              >
                {getInitials(vendor.name)}
              </div>
            )}
          </AppLink>

          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mb-1">
              <AppLink
                asLink
                href={vendorUrl}
                className="tw:font-semibold tw:text-base tw:text-gray-900 tw:truncate"
                noUnderline
              >
                {vendor.name}
              </AppLink>

              {vendor._vendorType ? (
                <VendorTypeBadge
                  type={vendor._vendorType}
                  color={vendor._vendorTypeColor}
                  description={vendor._vendorTypeInfo}
                  size="sm"
                  hideInfo
                />
              ) : null}
            </div>

            {vendor.vendorId && (
              <AppLink
                asLink
                href={vendorUrl}
                className="tw:inline-flex tw:text-xs tw:font-semibold tw:text-emerald-600 tw:hover:underline"
                noUnderline
              >
                {vendor.vendorId}
              </AppLink>
            )}
          </div>
        </div>

        <div className="tw:space-y-2.5">
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-600">
            <Phone size={14} className="tw:shrink-0 tw:text-gray-400" />
            <span className="tw:font-medium">{mobile || "-"}</span>
          </div>

          {displayLocation && (
            <div className="tw:flex tw:items-start tw:gap-2 tw:text-gray-600">
              <MapPin
                size={14}
                className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400"
              />
              <span className="tw:font-medium tw:leading-snug">
                {displayLocation}
              </span>
            </div>
          )}
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:pt-1">
          <AppButton
            fill="solid"
            color="success"
            size="small"
            className="tw:w-full tw:font-semibold tw:gap-1.5"
            onClick={handleWhatsApp}
            disabled={!waNumber}
          >
            <ImgRender
              src="whatsapp-logo.png"
              className="tw:w-4 tw:h-4 tw:object-cover tw:brightness-0 tw:invert"
            />
            WhatsApp
          </AppButton>
          <AppButton
            fill="outline"
            color="light"
            size="small"
            className="tw:w-full tw:font-semibold tw:gap-1.5"
            onClick={handleCall}
            disabled={!mobile}
          >
            <Phone className="tw:w-3.5 tw:h-3.5" />
            Call
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default VendorInfo;
