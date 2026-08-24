import { Check, XCircle } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import SanpshotPicker from "~/shared/catalog/components/snapshot-picker/SanpshotPicker";
import PickedSanpshotsInfo from "../snapshots-info/PickedSanpshotsInfo";
import PriceLockedNote from "../PriceLockedNote";
import { useTranslation } from "react-i18next";
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
    product: any,
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
    <div>
      {products && products.length > 0 ? (
        <div className="op-pick-rows tw:mt-2">
          {products.map((product, idx) => {
            const key = product.dealId || `idx-${idx}`;
            const fullyPicked = (product.percentage || 0) >= 100;
            const partiallyPicked =
              !fullyPicked && (product.pickedQty || 0) > 0;
            const rowPrice = product.overridePrice ?? product.mrp;
            return (
              <div
                key={key}
                className={`op-row op-pick-row ${fullyPicked ? "is-picked" : ""} ${
                  partiallyPicked ? "is-partial" : ""
                }`}
              >
                {/* Identity line — check, monogram tile, name + bin/qty meta,
                    price on the right. */}
                <div className="tw:flex tw:items-center tw:gap-2.5">
                  <div className="op-check">
                    {fullyPicked && <Check size={14} />}
                  </div>
                  <div
                    className="op-tile"
                    style={{ backgroundColor: product._tile?.color }}
                  >
                    {product._tile?.code}
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="op-row-title tw:font-medium tw:text-sm tw:truncate">
                      {product.dealName || product.name || "--"}
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-0.5 tw:text-xs tw:text-gray-500 tw:flex-wrap">
                      <LocationsBlock
                        locations={product.locations}
                        small
                        hideIcon
                      />
                      <span>
                        · {t("ordered").toLowerCase()}{" "}
                        <span className="tw:font-semibold tw:text-gray-800">
                          <DisplayQty
                            qty={product.orderedQty || 0}
                            isLooseQty={false}
                            uom={product.selectedStockUom}
                          />
                        </span>
                      </span>
                    </div>
                  </div>
                  {rowPrice != null && (
                    <div className="op-pick-price">
                      <Amount value={rowPrice} decimalPlaces={2} />
                    </div>
                  )}
                </div>

                {/* Reference codes + price-lock note. */}
                {(product.dealRefId || product.sku) && (
                  <div className="tw:flex tw:gap-2 tw:items-center tw:flex-wrap tw:mt-1.5 tw:text-[11px] tw:text-gray-400">
                    {product.dealRefId && <span>ID: {product.dealRefId}</span>}
                    {product.sku && <span>SKU: {product.dealId}</span>}
                    <PriceLockedNote product={product} />
                  </div>
                )}

                {/* Picking controls. */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-2">
                  <div className="tw:flex tw:text-xs tw:items-center tw:gap-1">
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

                  <div className="tw:flex tw:items-center tw:gap-2">
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
                  <div className="tw:flex tw:gap-4 tw:mt-1.5 tw:text-xs">
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
