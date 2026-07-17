import React, { useState } from "react";
import { Ticket } from "lucide-react";
import ProductService from "~/services/ProductService";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import useAppToast from "~/hooks/useAppToast";
import CouponModal from "../modals/CouponModal";

interface ApplyCouponProps {
  cartId: string;
  callback: (payload: { action: string; data?: any }) => void;
}

const ApplyCoupon: React.FC<ApplyCouponProps> = ({ cartId, callback }) => {
  const apptoast = useAppToast();

  const [code, setCode] = useState<string>("");
  const [rewardedAmount, setRewardedAmount] = useState<number>(0);
  const [applied, setApplied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [showModal, setShowModal] = useState<boolean>(false);

  // handleApply accepts optional couponCode so modal can trigger applying a coupon
  const handleApply = async (couponCode?: string) => {
    const codeToUse = (couponCode ?? code)?.toString?.() || "";
    if (!codeToUse || codeToUse.trim() === "") {
      apptoast.show({ msg: "Please enter coupon code", color: "danger" });
      return;
    }
    setLoading(true);
    try {
      const payload = { cartId, couponId: codeToUse };
      const resp = await ProductService.applyCoupon(payload);
      if (resp.statusCode === 200) {
        const reward = resp?.data?.discount || 0;
        setRewardedAmount(reward);
        setApplied(true);
        setCode(codeToUse);
        apptoast.show({ msg: "Coupon applied successfully", color: "success" });
        callback({
          action: "apply_success",
          data: { response: resp, code: codeToUse },
        });
      } else {
        apptoast.show({
          msg: resp.data?.message || "Failed to apply coupon",
          color: "danger",
        });
      }
    } catch (err) {
      apptoast.show({
        msg: (err as any)?.message || "Failed to apply coupon",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setRewardedAmount(0);
    setApplied(false);
    // Inform parent about coupon removal without calling API
    apptoast.show({ msg: "Coupon removed", color: "success" });
    callback({ action: "remove", data: {} });
  };

  const handleModalCallback = (
    payload: { action: string; data?: any } | null
  ) => {
    if (!payload) return;
    const { action, data } = payload as any;
    if (action === "close") {
      setShowModal(false);
    } else if (action === "apply") {
      const codeFromModal = data?.couponCode || data?.coupon?.couponCode;
      // close modal and apply
      setShowModal(false);
      if (codeFromModal) handleApply(codeFromModal);
    }
  };

  return (
    <div className="tw:bg-white tw:p-3 tw:rounded-lg tw:border tw:border-gray-200 tw:shadow-sm">
      <div className="tw:mb-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Ticket className="tw:w-4 tw:h-4 tw:text-blue-600" />
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
            Apply Coupon
          </h3>
        </div>
      </div>
      {!applied ? (
        <div className="tw:space-y-3">
          <div className="tw:flex tw:gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter coupon code"
              className="tw:flex-1 tw:px-3 tw:py-2 tw:text-sm tw:border tw:border-gray-300 tw:rounded-md tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-blue-500 tw:focus:border-transparent"
            />
            <AppButton
              onClick={() => handleApply()}
              isLoading={loading}
              size="small"
              className="tw:px-4"
            >
              Apply
            </AppButton>
          </div>
          <button
            type="button"
            className="tw:text-xs tw:text-blue-600 tw:hover:text-blue-800 tw:underline tw:transition-colors"
            onClick={() => setShowModal(true)}
          >
            Browse available coupons
          </button>
        </div>
      ) : (
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide">
                Coupon
              </span>
              <span className="tw:font-semibold tw:text-base tw:truncate">
                {code}
              </span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-1 tw:mt-1">
              <span className="tw:text-xs tw:text-green-600 tw:font-medium">
                Discount:
              </span>
              <Amount
                value={rewardedAmount}
                className="tw:text-sm tw:font-semibold tw:text-green-700"
              />
            </div>
          </div>
          <button
            className="tw:text-xs tw:text-red-500 tw:hover:text-red-700 tw:underline tw:transition-colors tw:whitespace-nowrap"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      )}

      <CouponModal show={showModal} callback={handleModalCallback} />
    </div>
  );
};

export default ApplyCoupon;
