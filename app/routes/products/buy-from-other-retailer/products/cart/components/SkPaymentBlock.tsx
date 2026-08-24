import clsx from "clsx";
import { IndianRupee, Plus, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import type { SelectedPaymentType } from "../types";

type SkPaymentMode = "advance" | "cod";

interface SkPaymentBlockProps {
  orderAmount: number;
  selectedPayment?: SelectedPaymentType;
  callback: (a: { action: string; data: any }) => void;
}

const buildSelectedPayment = (
  mode: SkPaymentMode,
  orderAmount: number,
): SelectedPaymentType => {
  const paymentType = mode === "advance" ? "ADVANCE" : "COD_LIMIT";

  return {
    paymentType,
    paymentMethod: paymentType,
    paymentMode: {
      type: paymentType,
      amount: orderAmount || 0,
      referenceNumber: "",
      proof: [],
      remarks: "",
    },
  };
};

const SkPaymentBlock = ({
  orderAmount,
  selectedPayment,
  callback,
}: SkPaymentBlockProps) => {
  const appNav = useAppNav();
  const hasCodLimit = FranchiseService.hasCodLimitEnabled();
  const didAutoSelect = useRef(false);

  const [loading, setLoading] = useState(true);
  const [advanceBalance, setAdvanceBalance] = useState(0);
  const [codLimit, setCodLimit] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const fid = AuthService.getLoggedInUserId(true) || "";
        if (!fid) return;

        const balanceResponse = await FranchiseService.getBalance(fid);
        if (!active) return;

        setAdvanceBalance(Number(balanceResponse.balance) || 0);
        setCodLimit(Number(balanceResponse.creditWallet) || 0);
      } catch (error) {
        console.error("Error fetching SK advance balance:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBalance();

    return () => {
      active = false;
    };
  }, []);

  // Auto-select the first sufficient SK payment mode once balances load.
  useEffect(() => {
    if (loading || selectedPayment || didAutoSelect.current) return;

    if (advanceBalance >= orderAmount) {
      didAutoSelect.current = true;
      callback({
        action: "selectPayment",
        data: { payment: buildSelectedPayment("advance", orderAmount) },
      });
      return;
    }

    if (hasCodLimit && codLimit >= orderAmount) {
      didAutoSelect.current = true;
      callback({
        action: "selectPayment",
        data: { payment: buildSelectedPayment("cod", orderAmount) },
      });
    }
  }, [
    loading,
    advanceBalance,
    codLimit,
    hasCodLimit,
    orderAmount,
    selectedPayment,
    callback,
  ]);

  // Keep selected payment amount in sync with the current order total.
  useEffect(() => {
    if (!selectedPayment || loading) return;

    const currentAmount = Number(selectedPayment.paymentMode?.amount) || 0;
    if (currentAmount === (orderAmount || 0)) return;

    const type = (selectedPayment.paymentType || "").toUpperCase();
    if (type !== "ADVANCE" && type !== "COD_LIMIT") return;

    callback({
      action: "selectPayment",
      data: {
        payment: buildSelectedPayment(
          type === "ADVANCE" ? "advance" : "cod",
          orderAmount,
        ),
      },
    });
  }, [orderAmount, selectedPayment, loading, callback]);

  const selectedType = (selectedPayment?.paymentType || "").toUpperCase();

  const selectMode = (mode: SkPaymentMode) => {
    const balance = mode === "advance" ? advanceBalance : codLimit;
    if (balance < orderAmount) return;

    callback({
      action: "selectPayment",
      data: { payment: buildSelectedPayment(mode, orderAmount) },
    });
  };

  const handleAddMoney = (e: React.MouseEvent) => {
    e.stopPropagation();
    appNav.to("/dashboard/deposit-money/options");
  };

  const renderOption = ({
    mode,
    title,
    description,
    balance,
    balanceLabel,
  }: {
    mode: SkPaymentMode;
    title: string;
    description: string;
    balance: number;
    balanceLabel: string;
  }) => {
    const paymentType = mode === "advance" ? "ADVANCE" : "COD_LIMIT";
    const isSelected = selectedType === paymentType;
    const isInsufficient = balance < orderAmount;

    return (
      <div
        key={mode}
        role="button"
        tabIndex={isInsufficient ? -1 : 0}
        aria-disabled={isInsufficient}
        onClick={() => selectMode(mode)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectMode(mode);
          }
        }}
        className={clsx(
          "tw:rounded-lg tw:border tw:px-2.5 tw:py-2 tw:transition-colors",
          isSelected
            ? "tw:border-primary tw:bg-primary/5"
            : "tw:border-gray-200 tw:bg-white",
          isInsufficient
            ? "tw:opacity-70 tw:cursor-not-allowed"
            : "tw:cursor-pointer hover:tw:border-primary/40",
        )}
      >
        <div className="tw:flex tw:items-start tw:gap-2">
          <div
            className={clsx(
              "tw:mt-0.5 tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full",
              isSelected
                ? "tw:bg-primary tw:text-white"
                : "tw:bg-gray-100 tw:text-gray-500",
            )}
          >
            <Wallet size={12} strokeWidth={2.25} />
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:text-xs tw:font-semibold tw:text-gray-900">
                {title}
              </div>
              <div
                className={clsx(
                  "tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:rounded tw:px-1.5 tw:py-0.5",
                  isSelected
                    ? "tw:bg-primary tw:text-white"
                    : "tw:bg-gray-100 tw:text-gray-500",
                )}
              >
                {isSelected ? "Selected" : mode === "advance" ? "Advance" : "COD"}
              </div>
            </div>

            <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
              {description}
            </div>

            <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1">
              <span className="tw:text-xs tw:font-semibold tw:text-gray-800">
                {balanceLabel}: <Amount value={balance} decimalPlaces={2} />
              </span>
              {isInsufficient && (
                <span className="tw:text-[11px] tw:font-medium tw:text-red-600">
                  Insufficient balance
                </span>
              )}
            </div>

            {mode === "advance" && isInsufficient && (
              <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-md tw:border tw:border-blue-100 tw:bg-blue-50 tw:px-2 tw:py-1.5">
                <div className="tw:min-w-0 tw:flex tw:items-center tw:gap-1.5">
                  <span className="tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-blue-100">
                    <Plus size={11} className="tw:text-blue-600" />
                  </span>
                  <span className="tw:text-[11px] tw:text-blue-800">
                    Top up your SK Advance Balance
                  </span>
                </div>
                <AppButton
                  size="small"
                  color="primary"
                  fill="solid"
                  className="tw:shrink-0 tw:h-7 tw:px-2 tw:text-[11px]"
                  onClick={handleAddMoney}
                >
                  <IndianRupee size={12} />
                  Add Money
                </AppButton>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Same as PaymentMode: the seller card's "Payment" label is the heading
          for this block, so it doesn't carry a second one. */}
      {loading ? (
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500 tw:py-1">
          <AppSpinner className="tw:w-3.5 tw:h-3.5" />
          Loading SK balance…
        </div>
      ) : (
        <div className="tw:space-y-2">
          {renderOption({
            mode: "advance",
            title: "Pay using Advance Balance",
            description: "Use your StoreKing advance balance to pay.",
            balance: advanceBalance,
            balanceLabel: "Balance",
          })}

          {hasCodLimit &&
            renderOption({
              mode: "cod",
              title: "Pay using COD Limit",
              description: "Use your COD limit for payment.",
              balance: codLimit,
              balanceLabel: "Limit",
            })}
        </div>
      )}
    </div>
  );
};

export default SkPaymentBlock;
