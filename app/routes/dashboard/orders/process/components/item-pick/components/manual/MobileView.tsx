import { Divide, Trash2Icon, XCircle } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import SanpshotPicker from "~/shared/catalog/components/snapshot-picker/SanpshotPicker";
import PickedSanpshotsInfo from "../snapshots-info/PickedSanpshotsInfo";
import PriceLockedNote from "../PriceLockedNote";
import Divider from "~/components/core/divider/Divider";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const MobileView: React.FC<{
  products?: any[];
  callback: (a: { action: string; data?: any }) => void;
  loading?: boolean;
}> = ({ products = [], callback, loading = false }) => {
  const { t } = useTranslation();

  const handleRemove = (dealId: string) => {
    callback({
      action: "remove",
      data: { dealId },
    });
  };

  const snapshotCallback = (
    data: { action: string; data: any },
    product: any
  ) => {
    if (data.action === "update" && data.data?.updatedMasterData?.length > 0) {
      if (product && data.data.updatedMasterData.length > 0) {
        callback({
          action: "update-snapshots",
          data: {
            product: product,
            snapshots: data.data.updatedMasterData,
          },
        });
      }
    } else {
      callback({
        action: "remove",
        data: { dealId: product.dealId },
      });
    }
  };

  return (
    <div className="tw:space-y-3">
      {products && products.length > 0 ? (
        <div className="tw:mt-2 tw:space-y-3">
          {products.map((product, idx) => {
            const key = product.dealId || `idx-${idx}`;
            return (
              <AppCard key={key} noPadding={true}>
                <div className="tw:p-3">
                  <div className="tw:font-medium tw:text-sm tw:mb-2">
                    {product.dealName || product.name || "--"}
                  </div>

                  <div className="tw:flex tw:gap-2 tw:items-center tw:flex-wrap tw:mb-2">
                    {product.dealRefId && (
                      <div className="tw:text-xs tw:text-gray-500">
                        ID: {product.dealRefId}
                      </div>
                    )}
                    <div className="tw:flex tw:gap-2">
                      {product.sku && (
                        <div className="tw:text-xs tw:text-gray-500">
                          SKU: {product.dealId}
                        </div>
                      )}

                      <LocationsBlock locations={product.locations} />
                    </div>
                    <PriceLockedNote product={product} />
                  </div>

                  <Divider />

                  <div className="tw:grid tw:gap-2 tw:grid-cols-3 tw:items-center">
                    <div className="tw:flex tw:gap-1 tw:text-xs tw:items-center">
                      <span className="tw:text-gray-500">{t("ordered")}: </span>
                      <span className="tw:font-semibold">
                        <DisplayQty
                          qty={product.orderedQty || 0}
                          isLooseQty={false}
                          uom={product.selectedStockUom}
                        />
                      </span>
                    </div>

                    <div className="tw:flex tw:text-xs tw:items-center tw:justify-center tw:gap-1">
                      <span className="tw:text-gray-500">{t("picking")}: </span>
                      <SanpshotPicker
                        dealId={product.dealId}
                        snapshots={product.snapshots}
                        callback={(data) => snapshotCallback(data, product)}
                        maxQuantity={product.orderedQty}
                        mrp={product.mrp}
                        dealName={product.dealName}
                        selectedStockUom={product.selectedStockUom}
                        overridePrice={product.overridePrice}
                      />
                    </div>

                    <div className="tw:flex tw:flex-col tw:items-end">
                      {product.snapshots?.length > 0 && (
                        <PickedSanpshotsInfo
                          pickedSanpshots={product.snapshots}
                          selectedStockUom={product.selectedStockUom}
                        />
                      )}

                      {(product.pickedQty || 0) > 0 && (
                        <AppButton
                          onClick={() => handleRemove(product.dealId)}
                          size="small"
                          fill="clear"
                          className="tw:text-red-500 tw:px-0!"
                        >
                          {t("cancelPick")}
                          <XCircle size={14} />
                        </AppButton>
                      )}
                    </div>
                  </div>

                  {product._pendingQty > 0 && (
                    <div className="tw:flex tw:gap-4 tw:mt-2 tw:text-xs">
                      <div
                        className={`tw:flex tw:gap-1 ${
                          (product._pendingQty || 0) > 0
                            ? "tw:text-red-500"
                            : "tw:text-gray-600"
                        }`}
                      >
                        <span>{t("pendingToPick")}: </span>
                        <span className="tw-font-semibold ">
                          <DisplayQty
                            qty={product._pendingQty || 0}
                            isLooseQty={false}
                            uom={product.selectedStockUom}
                          />
                        </span>
                      </div>

                      {/* picked */}
                      <div className="tw:flex tw:gap-1 tw:text-green-600">
                        <span>{t("picked")}: </span>
                        <span className="tw-font-semibold">
                          <DisplayQty
                            qty={product.pickedQty || 0}
                            isLooseQty={false}
                            uom={product.selectedStockUom}
                          />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </AppCard>
            );
          })}
        </div>
      ) : (
        <div className="tw:text-gray-500">No products added yet.</div>
      )}
    </div>
  );
};

export default MobileView;
