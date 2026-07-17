import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import ImgRender from "~/components/core/img/ImgRender";
import { useTranslation } from "react-i18next";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";

interface Location {
  id?: string;
  location?: {
    name?: string;
    rackName?: string;
    binName?: string;
  };
}

interface PurchaseInfo {
  price?: number;
}

interface DealDetails {
  brandName?: string;
  locations?: Location[];
  purchaseInfo?: PurchaseInfo;
  maxQty?: number;
  blockedQty?: number;
  images?: string[];
}

interface Product {
  id: string;
  dealId: string;
  dealName?: string;
  dealRefId?: string;
  quantity: number;
  price: number;
  mrp?: number;
  dealDetails?: DealDetails;
  remainingQty?: number;
  cancelledQty?: number;
  finalPrice?: number;
  packSoldQty?: number;
  packType?: string;
  packQuantity?: number;
  requestedPackQuantity?: number;
  isReserveOrder?: boolean;
}

interface MobileViewProps {
  data: Product[];
  loading?: boolean;
  callback?: (action: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading = false,
  callback,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="tw:p-4 tw:space-y-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="tw:animate-pulse tw:bg-gray-100 tw:rounded-lg tw:h-32 tw:w-full"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        No data found
      </div>
    );
  }

  return (
    <div className="">
      {data.map((item, idx) => (
        <div
          key={item.id || idx}
          className="tw:p-4 tw:bg-white tw:border-b tw:border-gray-200 tw:last:border-b-0 tw:first:pt-0"
        >
          <div className="tw:flex tw:gap-3 tw:mb-3">
            <div className="tw:flex-shrink-0">
              <ImgRender
                assetId={item.dealDetails?.images?.[0]}
                alt={item.dealName}
                className="tw:w-16 tw:h-16 tw:object-contain tw:rounded-md tw:bg-gray-50"
              />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:justify-between tw:items-start tw:mb-1 tw:gap-2">
                <AppLink
                  asLink
                  href={`/dashboard/inventory/products/view/${item.dealId}`}
                  className="tw:font-semibold tw:text-sm tw:flex-1 tw:line-clamp-2 tw:mb-1"
                >
                  {item.dealName}
                </AppLink>
              </div>
              <div className="tw:text-gray-700 tw:text-sm tw:flex tw:items-center tw:gap-2">
                <div className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded tw:text-xs tw:text-gray-600 tw:truncate">
                  {item.dealRefId || "--"}
                </div>
                <div className="tw:text-xs tw:text-gray-700">
                  <span className="tw:font-medium">{t("orderedQty")}:</span>{" "}
                  <span className="tw:text-red-600 tw:font-bold tw:text-sm">
                    <DisplayQty
                      qty={item.quantity || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </span>
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap tw:mt-1">
                {item.packSoldQty && (
                  <div className="tw:text-primary tw:text-xs tw:flex tw:items-center tw:gap-1">
                    Sold in {item.packSoldQty} {item.packType}
                    <CaseQtyPopover
                      packageQty={item.packQuantity || 0}
                      sellingType={item.packType || "UNIT"}
                    />
                  </div>
                )}
                {item.isReserveOrder && <ReserveBadge template={2} />}
              </div>
            </div>
          </div>
          <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mb-1">
            <div>
              <div className="tw:font-semibold tw:text-sm">
                <Amount value={item.price || 0} decimalPlaces={2} />
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                {t("sellingPrice")}
              </div>
            </div>
            <div>
              <div className="tw:font-medium tw:text-sm">
                <Amount value={item.mrp || 0} decimalPlaces={2} />
              </div>
              <div className="tw:text-xs tw:text-gray-500">{t("mrp")}</div>
            </div>
            <div>
              <div className="tw:font-semibold tw:text-sm">
                <Amount value={item.finalPrice || 0} decimalPlaces={2} />
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                {t("finalPrice")}
              </div>
            </div>

            <div className="tw:flex tw:justify-between">
              <div>
                <div className="tw:font-bold tw:text-sm tw:text-black">
                  <DisplayQty
                    qty={item.dealDetails?.maxQty || 0}
                    isLooseQty={false}
                    uom={item.selectedStockUom}
                  />
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("availableStock")}
                </div>
              </div>
            </div>

            {/* ordered qty */}
            {/* removed purchase price - show cancelled qty if present */}
            {item.cancelledQty ? (
              <div className="tw:flex tw:justify-between">
                <div>
                  <div className="tw:text-xs">{t("cancelledQty")}</div>
                  <div className="tw:font-bold tw:text-sm tw:text-red-500">
                    <DisplayQty
                      qty={item.cancelledQty || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {item?.dealDetails?.blockedQty ? (
              <div className="tw:flex tw:justify-between">
                <div>
                  <div className="tw:font-bold tw:text-sm tw:text-red-500">
                    <DisplayQty
                      qty={item.dealDetails?.blockedQty || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {t("blockedQty")}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <hr className="tw:my-3 tw:border-gray-200" />
          <div className="tw:flex tw:items-center tw:text-sm tw:gap-2">
            <span className="tw:text-gray-600"> {t("location")}: </span>
            <LocationsBlock
              locations={item.dealDetails?.locations}
              dealId={item.dealId}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
