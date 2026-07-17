import React, { useState } from "react";
import { Ticket, Trash2, CheckCircle2, ChevronDown } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import useAppToast from "~/hooks/useAppToast";
import CouponService from "~/services/CouponService";
import type { CouponInfo } from "../types";
import CouponModal from "../modals/CouponModal";

interface ApplyCouponProps {
  cartId: string;
  couponInfo?: CouponInfo;
  callback: (payload: { action: string; data: any }) => void;
}

const ApplyCoupon: React.FC<ApplyCouponProps> = ({
  cartId,
  couponInfo,
  callback,
}) => {
  const appToast = useAppToast();

  const [expanded, setExpanded] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleApply = async (couponCode?: string) => {
    const codeToUse = (couponCode ?? code)?.toString().trim();
    if (!codeToUse) {
      appToast.show({ msg: "Please enter a coupon code", color: "danger" });
      return;
    }
    setLoading(true);
    try {
      const resp = await CouponService.applyCartCoupon(cartId, codeToUse);
      if (resp.statusCode === 200) {
        const discount =
          resp?.data?.discount ??
          resp?.data?.couponDiscount ??
          resp?.data?.rewardedAmount ??
          0;
        appToast.show({ msg: "Coupon applied", color: "success" });
        setCode("");
        setExpanded(false);
        callback({
          action: "couponApplied",
          data: { cartId, code: codeToUse, discount },
        });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to apply coupon",
          color: "danger",
        });
      }
    } catch (err) {
      appToast.show({
        msg: (err as any)?.message || "Failed to apply coupon",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const resp = await CouponService.removeCartCoupon(cartId);
      if (resp.statusCode === 200) {
        appToast.show({ msg: "Coupon removed", color: "success" });
        callback({ action: "couponRemoved", data: { cartId } });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to remove coupon",
          color: "danger",
        });
      }
    } catch (err) {
      appToast.show({
        msg: (err as any)?.message || "Failed to remove coupon",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalCallback = (payload: { action: string; data?: any }) => {
    if (payload.action === "close") {
      setShowModal(false);
    } else if (payload.action === "apply") {
      setShowModal(false);
      const codeFromModal = payload.data?.code;
      if (codeFromModal) handleApply(codeFromModal);
    }
  };

  // Applied state — compact green chip with remove
  if (couponInfo?.couponApplied && couponInfo.code) {
    return (
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-2.5 tw:py-1.5 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-md">
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
          <CheckCircle2
            size={14}
            className="tw:text-green-600 tw:shrink-0"
            strokeWidth={2.25}
          />
          <div className="tw:flex tw:flex-col tw:min-w-0">
            <span className="tw:text-[10px] tw:font-medium tw:text-green-700 tw:leading-tight">
              Coupon applied
            </span>
            <span className="tw:flex tw:items-baseline tw:gap-1 tw:min-w-0">
              <span className="tw:text-xs tw:font-semibold tw:text-green-800 tw:truncate">
                {couponInfo.code}
              </span>
              {couponInfo.totalCouponDiscount > 0 && (
                <span className="tw:text-xs tw:text-green-700 tw:shrink-0">
                  (−<Amount value={couponInfo.totalCouponDiscount} />)
                </span>
              )}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="tw:flex tw:items-center tw:gap-1 tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:text-red-600 tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-md tw:hover:bg-red-100 tw:transition-colors tw:shrink-0 tw:disabled:opacity-60"
          aria-label="Remove coupon"
        >
          <Trash2 size={14} strokeWidth={2.25} />
          {loading ? "Removing..." : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Trigger — clickable row with chevron */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:w-full"
      >
        <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium tw:text-primary">
          <Ticket size={15} strokeWidth={2.25} />
          Apply coupon
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.25}
          className={`tw:text-gray-500 tw:transition-transform ${
            expanded ? "tw:rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="tw:mt-2.5 tw:space-y-3">
          {/* Inline code input */}
          <div className="tw:flex tw:items-center tw:gap-2">
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Enter coupon code"
              className="tw:flex-1 tw:min-w-0 tw:px-2.5 tw:py-1.5 tw:text-sm tw:border tw:border-gray-300 tw:rounded-md tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary tw:focus:border-transparent"
            />
            <AppButton
              onClick={() => handleApply()}
              isLoading={loading}
              size="small"
              className="tw:px-3 tw:shrink-0"
            >
              Apply
            </AppButton>
          </div>

          {/* View all available coupons */}
          <div className="tw:flex tw:justify-end">
            <button
              type="button"
              className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-primary tw:hover:text-primary/80 tw:transition-colors"
              onClick={() => setShowModal(true)}
            >
              <Ticket size={13} strokeWidth={2.25} />
              View available coupons
            </button>
          </div>
        </div>
      )}

      <CouponModal
        show={showModal}
        cartId={cartId}
        callback={handleModalCallback}
      />
    </>
  );
};

export default ApplyCoupon;
