import { Info, Pencil, RotateCcw, Tag, TrendingDown } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { DISCOUNT_DECIMAL_PLACES } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";

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

  useEffect(() => {
    if (show && data) {
      setPrice(String(data.currentPrice ?? ""));
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [show, data]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const mrp = data?.mrp || 0;
  const currentPrice = data?.currentPrice || 0;
  const dealPrice = data?.dealPrice || 0;
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
    if (mrp && num > mrp) return `Cannot exceed MRP (₹${mrp})`;
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
      overridePrice: Number(price),
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
          <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <Pencil className="tw:w-4 tw:h-4 tw:text-primary" />
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <h2 className="wa-section-label">Edit Price</h2>
            {data?.dealName && (
              <p className="tw:text-sm tw:font-bold tw:text-foreground tw:leading-tight tw:line-clamp-2">
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
            <div className="tw:bg-muted tw:border tw:border-border tw:rounded-lg tw:px-2.5 tw:py-2">
              <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1">
                <Tag className="tw:w-3 tw:h-3 tw:text-muted-foreground" />
                <div className="wa-section-label tw:text-[10px]">MRP</div>
              </div>
              <Amount
                value={mrp}
                decimalPlaces={2}
                className="wa-amount tw:text-sm tw:font-bold tw:text-foreground"
              />
            </div>
            <div className="tw:bg-primary/5 tw:border tw:border-primary/15 tw:rounded-lg tw:px-2.5 tw:py-2">
              <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1">
                <Tag className="tw:w-3 tw:h-3 tw:text-primary" />
                <div className="wa-section-label tw:text-[10px] tw:text-primary">
                  Actual Price
                </div>
              </div>
              <Amount
                value={dealPrice}
                decimalPlaces={2}
                className="wa-amount tw:text-sm tw:font-bold tw:text-primary"
              />
            </div>
            <div className="wa-incart tw:rounded-lg tw:px-2.5 tw:py-2 tw:border tw:border-transparent">
              <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1">
                <TrendingDown className="tw:w-3 tw:h-3" />
                <div className="wa-section-label tw:text-[10px]" style={{ color: "var(--wa-bubble-text)" }}>
                  Selling Now
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-1">
                <Amount
                  value={currentPrice}
                  decimalPlaces={2}
                  className="wa-amount tw:text-sm tw:font-bold"
                />
                {currentDiscountPct > 0 && (
                  <span className="wa-mono tw:text-[9px] tw:font-bold tw:bg-white/60 tw:rounded-full tw:px-1 tw:py-0.5 tw:shrink-0">
                    {CommonService.roundedByDecimalPlace(currentDiscountPct, 1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price input */}
          <div>
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
              <label className="tw:text-xs tw:font-semibold tw:text-foreground">
                New Selling Price
              </label>
              {mrp > 0 && (
                <span className="wa-mono tw:text-[10px] tw:text-muted-foreground">
                  Max ₹{CommonService.roundedByDecimalPlace(mrp, 2)}
                </span>
              )}
            </div>
            <div className="tw:relative">
              <span
                className={`tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-base tw:font-semibold ${
                  error ? "tw:text-destructive" : "tw:text-muted-foreground"
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
                className={`wa-amount tw:w-full tw:border-2 tw:rounded-lg tw:pl-8 tw:pr-3 tw:py-2.5 tw:text-lg tw:font-bold tw:text-foreground tw:outline-none tw:transition-colors focus:tw:border-primary ${
                  error
                    ? "tw:border-destructive tw:bg-destructive/5"
                    : "tw:border-border tw:bg-card"
                }`}
                placeholder="0.00"
              />
            </div>

            {/* Quick discount presets */}
            {mrp > 0 && (
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-2">
                <span className="wa-section-label">Quick off:</span>
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
                      data-active={isActive ? "true" : "false"}
                      className="wa-chip wa-mono tw:text-[11px] tw:px-2 tw:py-1"
                    >
                      -{pct}%
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback line */}
            <div className="tw:mt-2 tw:min-h-[18px]">
              {error ? (
                <p className="tw:text-[11px] tw:font-medium tw:text-destructive">
                  {error}
                </p>
              ) : newDiscountPct !== null && priceChanged ? (
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span className="wa-mono tw:text-[11px] tw:font-semibold tw:text-primary">
                    New Discount: {CommonService.roundedByDecimalPlace(newDiscountPct, 2)}%
                  </span>
                  {savingsAmount > 0 && (
                    <span className="wa-mono tw:text-[11px] tw:font-semibold" style={{ color: "var(--wa-bubble-text)" }}>
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
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || removing || !isValidPrice}
              className="wa-cta tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-1.5 tw:h-10 tw:rounded-xl tw:text-sm tw:font-bold tw:cursor-pointer tw:transition-all tw:disabled:cursor-not-allowed"
            >
              {saving && <AppSpinner size="xs" />}
              Update Price
            </button>
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default EditPriceModal;
