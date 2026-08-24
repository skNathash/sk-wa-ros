import { Info, Pencil, RotateCcw, Tag, TrendingDown } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import { DISCOUNT_DECIMAL_PLACES } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import UomPriceService from "~/services/UomPriceService";

interface EditPriceModalProps {
  show: boolean;
  data: {
    cartId: string;
    dealId: string;
    dealName?: string;
    currentPrice: number;
    dealPrice: number;
    mrp: number;
    leastMrp: number;
    /** Stock uom of the item — gm/ml prices are edited per kg/ltr. */
    uom?: string;
    hasOverride?: boolean;
  } | null;
  callback: (params: { action: string; data?: any }) => void;
}

const QUICK_DISCOUNTS = [5, 10, 15, 20];

const EditPriceModal: React.FC<EditPriceModalProps> = ({
  show,
  data,
  callback,
}) => {
  const appToast = useAppToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // gm/ml deals carry per-gm/per-ml prices on the API but are edited per
  // kg/ltr, so every number below is in display scale and only the saved
  // price is converted back.
  const uom = data?.uom;
  const isSmallUom = UomPriceService.isSmallUom(uom);
  const displayUom = UomPriceService.getDisplayUom(uom);
  const baseUom = UomPriceService.getBaseUom(uom);
  const perUomLabel = isSmallUom ? ` / ${displayUom}` : "";

  useEffect(() => {
    if (show && data) {
      setPrice(
        String(UomPriceService.toDisplayPrice(data.currentPrice, data.uom) ?? ""),
      );
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [show, data]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const mrp = Number(UomPriceService.toDisplayPrice(data?.mrp || 0, uom)) || 0;
  const currentPrice =
    Number(UomPriceService.toDisplayPrice(data?.currentPrice || 0, uom)) || 0;
  const dealPrice =
    Number(UomPriceService.toDisplayPrice(data?.dealPrice || 0, uom)) || 0;
  const currentDiscountPct =
    mrp > 0
      ? CommonService.calculateDiscount(
          mrp,
          currentPrice,
          DISCOUNT_DECIMAL_PLACES,
        )
      : 0;

  const newPriceNum = Number(price);
  const isValidPrice =
    price !== "" &&
    !isNaN(newPriceNum) &&
    newPriceNum > 0 &&
    (mrp === 0 || newPriceNum <= mrp);

  const newDiscountPct = useMemo(() => {
    if (!isValidPrice || mrp <= 0) return null;
    return CommonService.calculateDiscount(
      mrp,
      newPriceNum,
      DISCOUNT_DECIMAL_PLACES,
    );
  }, [isValidPrice, mrp, newPriceNum]);

  const savingsAmount = isValidPrice && mrp > 0 ? mrp - newPriceNum : 0;

  const validate = (val: string) => {
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0) return "Enter a valid price";
    if (mrp && num > mrp)
      return `Cannot exceed MRP (₹${CommonService.roundedByDecimalPlace(mrp, 2)}${perUomLabel})`;
    return "";
  };

  const applyQuickDiscount = (pct: number) => {
    if (mrp <= 0) return;
    const newVal = String(CommonService.calculateDiscountedPrice(pct, mrp));
    setPrice(newVal);
    setError("");
    inputRef.current?.focus();
  };

  const handleSave = async () => {
    if (!data) return;
    const err = validate(price);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    const response = await SellerCatalogService.updateCartItemPrice({
      cartId: data.cartId,
      dealId: data.dealId,
      overridePrice: Number(UomPriceService.toApiPrice(price, uom)),
    });
    setSaving(false);
    if (response.statusCode === 200) {
      appToast.show({
        msg: response.data?.message || "Price updated",
        color: "success",
      });
      callback({ action: "updated", data: response.data?.data });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to update price",
        color: "danger",
      });
    }
  };

  const handleRemoveOverride = async () => {
    if (!data) return;
    setRemoving(true);
    const response = await SellerCatalogService.removeCartItemPriceOverride({
      cartId: data.cartId,
      dealId: data.dealId,
    });
    setRemoving(false);
    if (response.statusCode === 200) {
      appToast.show({
        msg: response.data?.message || "Price override removed",
        color: "success",
      });
      callback({ action: "removed", data: response.data?.data });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to remove override",
        color: "danger",
      });
    }
  };

  const priceChanged = isValidPrice && newPriceNum !== currentPrice;

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:md:max-w-md"
      backdropDismiss={false}
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-blue-50 tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <Pencil className="tw:w-4 tw:h-4 tw:text-blue-600" />
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <h2 className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
              Edit Price
            </h2>
            {data?.dealName && (
              <p className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight tw:line-clamp-2">
                {data.dealName}
              </p>
            )}
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          {/* Price summary cards */}
          <div className="tw:grid tw:grid-cols-3 tw:gap-2">
            <div className="tw:bg-gray-50 tw:border tw:border-gray-100 tw:rounded-lg tw:px-2.5 tw:py-2">
              <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1">
                <Tag className="tw:w-3 tw:h-3 tw:text-gray-400" />
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
                  MRP
                </div>
              </div>
              <Amount
                value={mrp}
                decimalPlaces={2}
                className="tw:text-sm tw:font-bold tw:text-gray-800"
              />
              {isSmallUom && (
                <span className="tw:text-[9px] tw:font-medium tw:text-gray-500 tw:ml-0.5">
                  /{displayUom}
                </span>
              )}
            </div>
            <div className="tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-lg tw:px-2.5 tw:py-2">
              <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1">
                <Tag className="tw:w-3 tw:h-3 tw:text-blue-500" />
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-blue-700">
                  Actual Price
                </div>
              </div>
              <Amount
                value={dealPrice}
                decimalPlaces={2}
                className="tw:text-sm tw:font-bold tw:text-blue-700"
              />
              {isSmallUom && (
                <span className="tw:text-[9px] tw:font-medium tw:text-blue-600 tw:ml-0.5">
                  /{displayUom}
                </span>
              )}
            </div>
            <div className="tw:bg-green-50 tw:border tw:border-green-100 tw:rounded-lg tw:px-2.5 tw:py-2">
              <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1">
                <TrendingDown className="tw:w-3 tw:h-3 tw:text-green-600" />
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-green-700">
                  Selling Now
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-1">
                <span className="tw:flex tw:items-baseline">
                  <Amount
                    value={currentPrice}
                    decimalPlaces={2}
                    className="tw:text-sm tw:font-bold tw:text-green-700"
                  />
                  {isSmallUom && (
                    <span className="tw:text-[9px] tw:font-medium tw:text-green-600 tw:ml-0.5">
                      /{displayUom}
                    </span>
                  )}
                </span>
                {currentDiscountPct > 0 && (
                  <span className="tw:text-[9px] tw:font-bold tw:text-green-700 tw:bg-green-100 tw:rounded-full tw:px-1 tw:py-0.5 tw:shrink-0">
                    {CommonService.roundedByDecimalPlace(currentDiscountPct, 1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price input */}
          <div>
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
              <label className="tw:text-xs tw:font-semibold tw:text-gray-700">
                New Selling Price{isSmallUom ? ` (per ${displayUom})` : ""}
              </label>
              {mrp > 0 && (
                <span className="tw:text-[10px] tw:text-gray-400">
                  Max ₹{CommonService.roundedByDecimalPlace(mrp, 2)}
                  {perUomLabel}
                </span>
              )}
            </div>
            <div className="tw:relative">
              <span
                className={`tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-base tw:font-semibold ${
                  error ? "tw:text-red-400" : "tw:text-gray-400"
                }`}
              >
                ₹
              </span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min={0}
                max={mrp}
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== "" && mrp > 0 && Number(val) > mrp) return;
                  setPrice(val);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                className={`tw:w-full tw:border-2 tw:rounded-lg tw:pl-8 ${
                  isSmallUom ? "tw:pr-14" : "tw:pr-3"
                } tw:py-2.5 tw:text-lg tw:font-bold tw:text-gray-900 tw:outline-none tw:transition-colors focus:tw:border-blue-500 ${
                  error
                    ? "tw:border-red-400 tw:bg-red-50"
                    : "tw:border-gray-200 tw:bg-white"
                }`}
                placeholder="0.00"
              />
              {isSmallUom && (
                <span className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-xs tw:font-semibold tw:text-gray-400">
                  / {displayUom}
                </span>
              )}
            </div>
            {isSmallUom && (
              <p className="tw:text-[10px] tw:text-gray-400 tw:mt-1">
                =&nbsp;
                <Amount
                  value={Number(UomPriceService.toApiPrice(price, uom)) || 0}
                  decimalPlaces={4}
                />
                &nbsp;/ {baseUom} — billed on the {baseUom} quantity
              </p>
            )}

            {/* Quick discount presets */}
            {mrp > 0 && (
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-2">
                <span className="tw:text-[10px] tw:font-medium tw:text-gray-400 tw:uppercase tw:tracking-wide">
                  Quick:
                </span>
                {QUICK_DISCOUNTS.map((pct) => {
                  const presetPrice = CommonService.calculateDiscountedPrice(
                    pct,
                    mrp,
                  );
                  const isActive = isValidPrice && Math.abs(newPriceNum - presetPrice) < 0.01;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyQuickDiscount(pct)}
                      className={`tw:text-[11px] tw:font-semibold tw:px-2 tw:py-1 tw:rounded-md tw:border tw:transition-colors ${
                        isActive
                          ? "tw:bg-blue-600 tw:border-blue-600 tw:text-white"
                          : "tw:bg-white tw:border-gray-200 tw:text-gray-600 hover:tw:border-blue-400 hover:tw:text-blue-600"
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback line */}
            <div className="tw:mt-2 tw:min-h-[18px]">
              {error ? (
                <p className="tw:text-[11px] tw:font-medium tw:text-red-500">
                  {error}
                </p>
              ) : newDiscountPct !== null && priceChanged ? (
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span className="tw:text-[11px] tw:font-semibold tw:text-blue-600">
                    New Discount: {CommonService.roundedByDecimalPlace(newDiscountPct, 2)}%
                  </span>
                  {savingsAmount > 0 && (
                    <span className="tw:text-[11px] tw:font-semibold tw:text-green-600">
                      Customer saves ₹{CommonService.roundedByDecimalPlace(savingsAmount, 2)}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Info banner */}
          <div className="tw:flex tw:items-start tw:gap-2 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:px-3 tw:py-2">
            <Info className="tw:w-4 tw:h-4 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
            <p className="tw:text-[11px] tw:text-amber-800 tw:leading-snug">
              This price change applies <b>only to this order</b>. The original
              price will be restored for future orders.
            </p>
          </div>

          {/* Actions */}
          <div className="tw:flex tw:gap-2 tw:pt-1">
            {data?.hasOverride && (
              <AppButton
                color="danger"
                fill="outline"
                onClick={handleRemoveOverride}
                isLoading={removing}
                disabled={saving || removing}
                className="tw:flex-1"
              >
                <span className="tw:flex tw:items-center tw:justify-center tw:gap-1.5">
                  <RotateCcw className="tw:w-3.5 tw:h-3.5" />
                  Reset
                </span>
              </AppButton>
            )}
            <AppButton
              onClick={handleSave}
              isLoading={saving}
              disabled={saving || removing || !isValidPrice}
              className="tw:flex-1"
            >
              Update Price
            </AppButton>
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default EditPriceModal;
