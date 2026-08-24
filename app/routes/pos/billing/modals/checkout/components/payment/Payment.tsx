import { produce } from "immer";
import { cloneDeep, debounce } from "lodash";
import {
  ArrowLeft,
  Award,
  Banknote,
  CreditCard,
  Smartphone,
  User,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import { AppCheckbox, AppInput, AppSelect } from "~/components/core/form";
import { Input } from "~/components/ui/input";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import PaylaterService from "~/services/PaylaterService";

interface PaymentProps {
  callback?: (args: { action: string; data?: any }) => void;
  totalAmount: number;
  assisted?: boolean;
  discount?: number;
  // Quick-checkout B2B: the buyer is a retailer (franchise), so paylater
  // eligibility must be checked against this id with type "franchise"
  // instead of the form customer (which carries no _id in that flow).
  paylaterUserId?: string;
  paylaterUserType?: "customer" | "franchise";
}

interface PaymentOption {
  label: string;
  value: string;
  amount: number | null;
  checked: boolean;
}

const Payment = ({
  callback,
  totalAmount,
  assisted,
  discount = 0,
  paylaterUserId,
  paylaterUserType = "customer",
}: PaymentProps) => {
  const { t } = useTranslation(["posbilling"]);

  const appToast = useAppToast();

  const { register, setValue, control, getValues } = useFormContext();

  const [
    customer,
    paymentMethod,
    option,
    redemptionValue,
    roundOffOrderAmount,
  ] = useWatch({
    control,
    name: [
      "customer",
      "paymentMethod",
      "option",
      "redemptionValue",
      "roundOffOrderAmount",
    ],
  });

  const [paymentOptions, setPaymentOptions] = useState<Array<PaymentOption>>(
    [],
  );

  const redemption = Number(redemptionValue || 0);
  const rawPayableAmount = CommonService.roundedByDecimalPlace(
    Math.max(Number(totalAmount) - redemption - discount, 0),
    2,
  );
  // Only round off when the user opts in via the checkbox.
  const hasDecimal = rawPayableAmount % 1 !== 0;
  const payableAmount = roundOffOrderAmount
    ? Math.round(rawPayableAmount)
    : rawPayableAmount;

  // Payable before any coin redemption is applied. Redeeming coins is not
  // allowed when this is ₹1 or less.
  const payableBeforeRedemption = CommonService.roundedByDecimalPlace(
    Math.max(Number(totalAmount) - discount, 0),
    2,
  );
  const canRedeem = payableBeforeRedemption > 1;
  // At least ₹1 must remain payable — the full amount can never be redeemed
  // with coins. Since 1 coin = ₹1, cap redeemable coins so the leftover
  // payable stays ≥ ₹1, bounded by the customer's coin balance.
  const maxRedeemablePoints = Math.max(
    0,
    Math.min(
      customer?.points ?? 0,
      Math.floor(payableBeforeRedemption - 1),
    ),
  );

  useEffect(() => {
    const sm = getValues("selectedPaymentMethods") || [];
    let options = [
      {
        label: "Cash",
        value: "cash",
        amount: !sm?.length ? payableAmount : 0,
        checked: !sm?.length ? true : false,
      },
      { label: "UPI", value: "upi", amount: 0, checked: false },
    ];
    options?.forEach((method: any) => {
      const existingOption = sm?.find(
        (option: any) => option.value === method.value,
      );

      if (existingOption) {
        method.amount = existingOption?.amount ?? 0;
        method.checked = existingOption?.checked ?? false;
      }
    });
    setPaymentOptions(cloneDeep(options));
  }, [getValues]);

  // On pages that open straight into the payment step (B2B quick checkout),
  // this component mounts before the cart summary loads, so the init effect
  // above fills cash with 0. Once the payable amount is known, fill cash with
  // it — but only once, and only while the user hasn't picked a method yet.
  const [didAutofillCash, setDidAutofillCash] = useState(false);
  useEffect(() => {
    if (didAutofillCash || payableAmount <= 0) return;
    const sm = getValues("selectedPaymentMethods") || [];
    if (sm.length) {
      setDidAutofillCash(true);
      return;
    }
    setPaymentOptions(
      produce((draft) => {
        draft.forEach((opt) => {
          const isCash = opt.value === "cash";
          opt.checked = isCash;
          opt.amount = isCash ? payableAmount : null;
        });
      }),
    );
    setDidAutofillCash(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payableAmount, didAutofillCash]);

  const [upiPayments, setUpiPayments] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const [loadingUpiPayments, setLoadingUpiPayments] = useState(false);
  const [showPaylater, setShowPaylater] = useState(false);
  const [checkingPaylater, setCheckingPaylater] = useState(false);
  const [paylaterWallet, setPaylaterWallet] = useState<{
    balance: number;
    creditLimit: number;
    eligible: boolean;
    message: string;
  }>({
    balance: 0,
    creditLimit: 0,
    eligible: false,
    message: "",
  });

  const [cashToReturn, setCashToReturn] = useState<number | null>(null);

  const hasSelectedUpiPayment = paymentOptions.some(
    (option) => option.value === "upi" && option.checked,
  );

  const loadUpiPayments = async () => {
    const paymentConfig = await FranchiseService.getConfigs();
    const data = paymentConfig.data?.data?.[0]?.paymentMethodConfig || [];
    return data.map((e: any) => ({
      label: e.displayName,
      value: e.paymentMethod,
    }));
  };

  useEffect(() => {
    const fetchUpiPayments = async () => {
      setLoadingUpiPayments(true);
      const data = await loadUpiPayments();
      setUpiPayments(data);
      setLoadingUpiPayments(false);
    };
    fetchUpiPayments();
  }, []);

  useEffect(() => {
    const totalEntered = paymentOptions.reduce(
      (acc, curr) => acc + (curr.amount ?? 0),
      0,
    );
    const value = totalEntered - payableAmount;
    setCashToReturn(CommonService.roundedByDecimalPlace(value, 2));
  }, [paymentOptions, payableAmount]);

  // When the round-off toggle changes the payable amount, reset the
  // payment allocation to a single cash entry for the rounded amount so
  // the inputs don't keep showing the old (un-rounded) decimal value.
  useEffect(() => {
    if (isPaylater) return;
    setValue("paymentMethod", "");
    setValue("upiPayment", "");
    setValue("upiReferenceNumber", "");
    setPaymentOptions(
      produce((draft) => {
        draft.forEach((opt) => {
          const isCash = opt.value === "cash";
          opt.checked = isCash;
          opt.amount = isCash ? payableAmount : null;
        });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOffOrderAmount]);

  // Check paylater eligibility for the buyer. B2C uses the form customer;
  // quick-checkout B2B passes the retailer id with type "franchise".
  const paylaterId = paylaterUserId || customer?._id;
  useEffect(() => {
    const check = async () => {
      setShowPaylater(false);
      if (!paylaterId) return;
      try {
        setCheckingPaylater(true);
        const resp: any = await PaylaterService.validateEligibility({
          userInfo: { id: paylaterId, type: paylaterUserType },
          franchiseInfo: { id: AuthService.getLoggedInUserId() },
        });

        const d = resp.data || {};
        const available = d?.data?.paylaterInfo?.creditAvailable ?? 0;

        // store available balance for UI and checks
        setPaylaterWallet({
          balance: Number(available) || 0,
          creditLimit: Number(d?.data?.paylaterInfo?.creditLimit ?? 0),
          eligible: d?.data?.eligible ?? false,
          message: d?.data?.reason ?? "Something went wrong",
        });

        if (
          resp?.statusCode === 200 &&
          Object.keys(d?.data?.paylaterInfo ?? {}).length > 0
        ) {
          setShowPaylater(true);
        } else {
          setShowPaylater(false);
        }
      } catch (e) {
        console.error("Error checking paylater eligibility:", e);
        setShowPaylater(false);
      } finally {
        setCheckingPaylater(false);
      }
    };

    check();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paylaterId, paylaterUserType]);

  const debounceSearch = useCallback(
    debounce(async (coins: number) => {
      const redeemableAmount = Math.max(Number(totalAmount) - discount, 0);
      const payload = {
        customerId: customer?._id,
        franchiseId: AuthService.getLoggedInUserId(),
        initialCartValue: redeemableAmount,
        coinsIntendedToRedeem: coins,
        orderType: "STORE_ORDER",
        orderAmount: redeemableAmount,
        blockCoin: false,
      };

      const resp = await LoyaltyPointService.redeemAtStorePoints(payload);

      if (resp.statusCode === 200) {
        // store redemptionValue from nested response (data.data.redemptionValue)
        const value = resp.data?.data?.redemptionValue ?? 0;
        const numericValue = Number(value) || 0;

        setValue("redemptionValue", numericValue);

        // If redemption value applied, clear any selected payment options
        if (numericValue > 0) {
          setValue("selectedPaymentMethods", []);
          setValue("changeToReturn", 0);
          setValue("paymentMethod", "");
          setValue("upiPayment", "");
          setValue("upiReferenceNumber", "");

          setPaymentOptions(
            produce((draft) => {
              draft.forEach((option) => {
                option.checked = false;
                option.amount = null;
              });
            }),
          );
        }
      } else {
        setValue("loyaltyPoints", "");
        setValue("redemptionValue", 0);
        appToast.show({
          msg: resp.data?.message || "Failed to redeem coins",
          color: "danger",
        });
      }
    }, 800),
    [totalAmount, customer, discount],
  );

  const handleLoyaltyPointsChange = () => {
    const value = getValues("loyaltyPoints");

    if (!canRedeem) {
      setValue("loyaltyPoints", "");
      setValue("redemptionValue", 0);
      return;
    }

    if (!value) {
      // clear any previously calculated redemption value when input is cleared
      setValue("redemptionValue", 0);
      // clear any entered cash/upi values so they get recalculated for the full amount
      setValue("selectedPaymentMethods", []);
      setValue("changeToReturn", 0);
      setValue("paymentMethod", "");
      setValue("upiPayment", "");
      setValue("upiReferenceNumber", "");
      setPaymentOptions(
        produce((draft) => {
          draft.forEach((option) => {
            option.checked = false;
            option.amount = null;
          });
        }),
      );
      return;
    }

    if (value < 0) {
      setValue("loyaltyPoints", "");
    }

    if (value > maxRedeemablePoints) {
      setValue("loyaltyPoints", maxRedeemablePoints);
    }

    debounceSearch(getValues("loyaltyPoints"));
  };

  const handleBack = () => {
    if (callback) {
      callback({ action: "back" });
    }
  };

  const handleContinue = () => {
    // If paylater is selected, ensure sufficient balance for the payable amount
    if (paymentMethod === "paylater") {
      // Consider payable amount after redemption (calculated above)
      const payable = payableAmount;

      // Treat null balance as insufficient
      const available = paylaterWallet.balance ?? 0;

      if (available < payable) {
        appToast.show({
          msg: t("checkoutModal.payment.paylater.insufficientBalance", {
            available,
            payable,
            defaultValue: `Insufficient paylater balance (available: ${available}).`,
          }),
          color: "danger",
        });
        return;
      }
    } else if (!assisted) {
      const noPaymentSelected = paymentOptions.every(
        (option) => !option.checked,
      );

      if (noPaymentSelected) {
        appToast.show({
          msg: "Please select at least one payment method",
          color: "danger",
        });
        return;
      }

      const enteredAmount = paymentOptions.reduce(
        (acc, curr) => acc + (curr.amount ?? 0),
        0,
      );
      if (enteredAmount < payableAmount) {
        appToast.show({
          msg: "Amount entered cannot be less than the payable order amount",
          color: "danger",
        });
        return;
      }

      if (hasSelectedUpiPayment && !upiPayments.length) {
        appToast.show({
          msg: "Please select a UPI payment method",
          color: "danger",
        });
        return;
      }
    }

    if (callback) {
      if (assisted && paymentMethod !== "paylater") {
        // Assisted order: default to COD, no payment selection needed
        setValue("paymentMethod", "cash");
        setValue("selectedPaymentMethods", [
          { value: "cash", amount: payableAmount },
        ]);
        setValue("changeToReturn", 0);
      } else {
        const selectedPayments = paymentOptions.filter(
          (option) => option.checked && option.amount && option.amount > 0,
        );
        setValue(
          "selectedPaymentMethods",
          paymentMethod === "paylater"
            ? [
                {
                  value: "paylater",
                  amount: payableAmount,
                },
              ]
            : selectedPayments,
        );
        setValue(
          "changeToReturn",
          paymentMethod === "paylater" ? 0 : (cashToReturn ?? 0),
        );
      }
      callback({ action: "next" });
    }
  };

  const onMaxPoints = () => {
    if (!canRedeem) return;
    setValue("loyaltyPoints", maxRedeemablePoints);
    debounceSearch(maxRedeemablePoints);
  };

  // const onUpiChange = async () => {
  //   setValue("paymentMethod", "upi");

  //   setLoadingUpiPayments(true);
  //   const data = await loadUpiPayments();
  //   if (data.length > 0) {
  //     setUpiPayments(data);
  //     setValue("upiPayment", data[0].paymentMethod);
  //   } else {
  //     setUpiPayments([]);
  //     setValue("upiPayment", "");
  //   }
  //   setLoadingUpiPayments(false);
  // };

  const handlePaymentAmountChange = (index: number, amount: number) => {
    const orderAmount = payableAmount;

    setValue("paymentMethod", "");

    setPaymentOptions(
      produce((draft) => {
        let a: number | null = amount;
        if (a <= 0) {
          a = null;
        }
        draft[index].amount = a;
        draft[index].checked = !!a;

        const remainingAmount = orderAmount - (draft[index].amount ?? 0);

        if (draft[index].value === "upi" && !draft[index].checked) {
          setValue("upiReferenceNumber", "");
        }

        draft.forEach((option, i) => {
          if (i === index) return;
          option.amount = CommonService.roundedByDecimalPlace(
            Math.max(remainingAmount, 0),
            2,
          );
          option.checked = option.amount > 0;

          if (option.value === "upi" && !option.checked) {
            setValue("upiPayment", "");
            setValue("upiReferenceNumber", "");
          }
        });
      }),
    );
  };

  const handlePaymentOptionChange = (index: number, checked: boolean) => {
    const orderAmount = payableAmount;
    setValue("paymentMethod", "");
    setPaymentOptions(
      produce((draft) => {
        draft[index].checked = checked;
        const total = draft.reduce((acc, curr) => acc + (curr.amount ?? 0), 0);
        draft[index].amount = checked ? Math.max(orderAmount - total, 0) : null;

        const enteredAmount = draft.reduce(
          (acc, curr) => acc + (curr.amount ?? 0),
          0,
        );

        const split = (orderAmount - enteredAmount) / (draft.length - 1);
        draft.forEach((option, i) => {
          if (i === index) return;
          if (option.checked) {
            option.amount = CommonService.roundedByDecimalPlace(
              (option.amount || 0) + Math.max(split, 0),
              2,
            );
          }
        });
      }),
    );
  };

  const handlePaylaterChange = (checked: boolean) => {
    setValue("paymentMethod", checked ? "paylater" : null);
    setValue("selectedPaymentMethods", []);
    setValue("changeToReturn", 0);
    setPaymentOptions(
      produce((draft) => {
        draft.forEach((option) => {
          option.checked = false;
          option.amount = null;
        });
      }),
    );
  };

  const isPaylater = paymentMethod === "paylater";

  const iconFor = (value: string) => {
    if (value === "cash") return Banknote;
    if (value === "upi") return Smartphone;
    return Wallet;
  };

  // Method theming — tinted icon chip per method for instant recognition
  const themeFor = (value: string) => {
    if (value === "cash")
      return {
        iconBg: "tw:bg-emerald-50",
        iconColor: "tw:text-emerald-600",
        ring: "tw:ring-emerald-500/30",
        border: "tw:border-emerald-500",
      };
    if (value === "upi")
      return {
        iconBg: "tw:bg-violet-50",
        iconColor: "tw:text-violet-600",
        ring: "tw:ring-violet-500/30",
        border: "tw:border-violet-500",
      };
    return {
      iconBg: "tw:bg-amber-50",
      iconColor: "tw:text-amber-600",
      ring: "tw:ring-amber-500/30",
      border: "tw:border-amber-500",
    };
  };

  const allocatedAmount = paymentOptions.reduce(
    (acc, curr) => acc + (curr.amount ?? 0),
    0,
  );
  const allocationPct = payableAmount
    ? Math.min((allocatedAmount / payableAmount) * 100, 100)
    : 0;
  const isFullyAllocated =
    payableAmount > 0 && allocatedAmount >= payableAmount;
  const remainingToAllocate = Math.max(payableAmount - allocatedAmount, 0);

  const hasCoins =
    !assisted && option !== "walkin" && Number(customer?.points ?? 0) > 0;

  return (
    <div className="tw:font-sans tw:text-gray-900 tw:space-y-4">
      {/* To pay summary */}
      <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:px-5 tw:py-3 tw:shadow-sm">
        {customer?.name && (
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1.5 tw:text-gray-600 tw:min-w-0">
            <User className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
            {customer?._id ? (
              <AppLink
                asLink
                href={`/dashboard/network/view/b2c/${customer._id}`}
                className="tw:text-xs tw:font-medium tw:text-gray-900 tw:truncate hover:tw:underline"
              >
                {customer.name}
              </AppLink>
            ) : (
              <span className="tw:text-xs tw:font-medium tw:text-gray-900 tw:truncate">
                {customer.name}
              </span>
            )}
          </div>
        )}
        {(redemption > 0 || discount > 0) && (
          <div className="tw:space-y-1 tw:pb-3 tw:mb-3 tw:border-b tw:border-dashed tw:border-gray-200">
            <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
              <span className="tw:text-gray-500">Bill total</span>
              <span className="tw:tabular-nums tw:text-gray-700">
                <Amount value={Number(totalAmount)} />
              </span>
            </div>
            {discount > 0 && (
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <span className="tw:text-emerald-700 tw:flex tw:items-center tw:gap-1 tw:font-semibold">
                  Cart Discount
                </span>
                <span className="tw:tabular-nums tw:text-emerald-700 tw:font-bold">
                  −<Amount value={discount} />
                </span>
              </div>
            )}
            {redemption > 0 && (
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <span className="tw:text-emerald-700 tw:flex tw:items-center tw:gap-1">
                  <Award className="tw:w-3 tw:h-3" />
                  KingCoins redeemed
                </span>
                <span className="tw:tabular-nums tw:text-emerald-700 tw:font-medium">
                  −<Amount value={redemption} />
                </span>
              </div>
            )}
          </div>
        )}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-gray-500 tw:font-semibold">
            {redemption > 0 || discount > 0 ? "Final payable" : "To pay"}
          </div>
          <div className="tw:text-2xl tw:font-bold tw:tabular-nums tw:tracking-tight tw:text-gray-900">
            <Amount value={payableAmount} />
          </div>
        </div>
        {hasDecimal && (
          <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-dashed tw:border-gray-200 tw:flex tw:items-center tw:justify-between">
            <AppCheckbox
              label={t("checkoutModal.summary.roundOff", "Round off")}
              value={!!roundOffOrderAmount}
              onChange={(checked) =>
                setValue("roundOffOrderAmount", checked, { shouldDirty: true })
              }
            />
            <span className="tw:text-xs tw:tabular-nums tw:text-gray-500">
              {roundOffOrderAmount ? (
                <>
                  {Math.round(rawPayableAmount) - rawPayableAmount >= 0
                    ? "+"
                    : "−"}
                  <Amount
                    value={Math.abs(
                      Math.round(rawPayableAmount) - rawPayableAmount,
                    )}
                    decimalPlaces={2}
                  />
                </>
              ) : (
                <Amount value={rawPayableAmount} decimalPlaces={2} />
              )}
            </span>
          </div>
        )}
      </div>

      {/* KingCoins redemption */}
      {hasCoins && (
        <div className="tw:rounded-lg tw:border tw:border-amber-300 tw:bg-amber-50/40 tw:px-3 tw:py-2.5 tw:space-y-2">
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-500 tw:text-white">
              <Award className="tw:w-4 tw:h-4" />
            </span>
            <div className="tw:flex tw:flex-col tw:leading-tight">
              <span className="tw:text-sm tw:font-semibold tw:text-amber-900">
                Redeem KingCoins
              </span>
              <span className="tw:text-[11px] tw:text-amber-700">
                Balance{" "}
                <span className="tw:font-semibold tw:tabular-nums">
                  {customer?.points}
                </span>{" "}
                · 1 coin = ₹1
              </span>
            </div>
            {redemption > 0 && (
              <span className="tw:ml-auto tw:rounded-full tw:bg-emerald-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-emerald-700 tw:tabular-nums">
                −<Amount value={redemption} /> applied
              </span>
            )}
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:relative tw:flex-1">
              <AppInput
                type="number"
                name="loyaltyPoints"
                register={register}
                onChange={handleLoyaltyPointsChange}
                disabled={!canRedeem}
                inputClassName="tw:h-9 tw:text-sm tw:bg-white tw:disabled:opacity-60"
                placeholder={`Coins to redeem (max ${maxRedeemablePoints})`}
              />
            </div>
            <button
              type="button"
              onClick={onMaxPoints}
              disabled={!canRedeem}
              className="tw:text-xs tw:font-semibold tw:px-3 tw:py-2 tw:rounded-md tw:bg-amber-600 tw:text-white hover:tw:bg-amber-700 tw:transition tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
            >
              Max
            </button>
          </div>
          {!canRedeem && (
            <p className="tw:text-[11px] tw:text-amber-700">
              Coins can't be redeemed when the payable amount is ₹1.
            </p>
          )}
        </div>
      )}

      {/* Methods */}
      {!assisted && (
        <div className="tw:space-y-3">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:font-semibold tw:text-gray-500">
              Payment method
            </div>
            <div className="tw:text-[11px] tw:text-gray-400">
              {isPaylater
                ? "Paylater on — uncheck below to switch"
                : "Tap to select · split allowed"}
            </div>
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
            {paymentOptions.map((opt, index) => {
              const active = opt.checked;
              const Icon = iconFor(opt.value);
              const disabled = isPaylater;
              const theme = themeFor(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`tw:group tw:relative tw:flex tw:items-center tw:gap-2.5 tw:rounded-lg tw:border tw:px-3 tw:py-2.5 tw:transition tw:duration-150 ${
                    disabled
                      ? "tw:opacity-50 tw:cursor-not-allowed tw:border-gray-200 tw:bg-white"
                      : active
                        ? `${theme.border} tw:bg-white tw:cursor-pointer tw:shadow-xs`
                        : "tw:border-gray-200 tw:bg-white hover:tw:border-gray-300 hover:tw:bg-gray-50/50 tw:cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    disabled={disabled}
                    onChange={(e) =>
                      handlePaymentOptionChange(index, e.target.checked)
                    }
                    className="tw:sr-only"
                  />
                  <span
                    className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:transition ${
                      active ? theme.iconBg : "tw:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`tw:w-4 tw:h-4 tw:transition ${
                        active ? theme.iconColor : "tw:text-gray-500"
                      }`}
                    />
                  </span>
                  <div className="tw:flex tw:flex-col tw:shrink-0 tw:min-w-14">
                    <span
                      className={`tw:text-sm tw:leading-tight ${
                        active
                          ? "tw:font-semibold tw:text-gray-900"
                          : "tw:font-medium tw:text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="tw:text-[10px] tw:text-gray-400 tw:uppercase tw:tracking-wide">
                      {opt.value === "cash" ? "Bills & coins" : "Scan to pay"}
                    </span>
                  </div>
                  <div className="tw:relative tw:flex-1 tw:min-w-0">
                    <span
                      className={`tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:pointer-events-none tw:transition ${
                        active ? "tw:text-gray-700" : "tw:text-gray-400"
                      }`}
                    >
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={opt.amount ?? ""}
                      min={0}
                      disabled={disabled}
                      onChange={(e) =>
                        handlePaymentAmountChange(index, Number(e.target.value))
                      }
                      placeholder="0"
                      className={`tw:h-10 tw:pl-7 tw:pr-3 tw:text-base tw:font-semibold tw:bg-white tw:tabular-nums tw:text-right tw:border-gray-200 ${
                        active ? "tw:text-gray-900" : "tw:text-gray-500"
                      }`}
                    />
                  </div>
                </label>
              );
            })}
          </div>

          {/* UPI details */}
          {hasSelectedUpiPayment && (
            <div className="tw:rounded-xl tw:border tw:border-violet-200 tw:bg-violet-50/40 tw:p-3 tw:space-y-2">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-violet-700">
                <Smartphone className="tw:w-3.5 tw:h-3.5" />
                UPI details
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                <Controller
                  control={control}
                  name="upiPayment"
                  render={({ field }) => (
                    <AppSelect
                      value={field.value}
                      options={upiPayments}
                      onChange={field.onChange}
                      inputClassName="tw:w-full tw:h-9 tw:text-sm tw:bg-white"
                      placeholder="UPI app"
                    />
                  )}
                />
                <AppInput
                  type="text"
                  name="upiReferenceNumber"
                  register={register}
                  placeholder="Reference no."
                  inputClassName="tw:h-9 tw:text-sm tw:bg-white"
                />
              </div>
            </div>
          )}

          {/* Paylater — single compact row */}
          {showPaylater && (
            <label
              className={`tw:flex tw:items-center tw:gap-2.5 tw:rounded-lg tw:border tw:px-3 tw:py-2.5 tw:transition ${
                !paylaterWallet.eligible
                  ? "tw:border-dashed tw:border-gray-200 tw:bg-gray-50 tw:cursor-not-allowed"
                  : isPaylater
                    ? "tw:border-indigo-500 tw:bg-indigo-50/30 tw:cursor-pointer tw:shadow-xs"
                    : "tw:border-gray-200 tw:bg-white hover:tw:border-indigo-300 tw:cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={isPaylater}
                disabled={!paylaterWallet.eligible}
                onChange={(e) => handlePaylaterChange(e.target.checked)}
                className="tw:w-4 tw:h-4 tw:accent-indigo-600 tw:shrink-0 tw:cursor-pointer disabled:tw:cursor-not-allowed"
              />
              <span
                className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:transition ${
                  !paylaterWallet.eligible
                    ? "tw:bg-gray-100 tw:text-gray-400"
                    : isPaylater
                      ? "tw:bg-indigo-50 tw:text-indigo-600"
                      : "tw:bg-gray-100 tw:text-gray-500"
                }`}
              >
                <CreditCard className="tw:w-4 tw:h-4" />
              </span>
              <div className="tw:flex tw:flex-col tw:shrink-0 tw:min-w-0">
                <span
                  className={`tw:text-sm tw:font-medium tw:leading-tight ${
                    !paylaterWallet.eligible
                      ? "tw:text-gray-500"
                      : isPaylater
                        ? "tw:text-indigo-900 tw:font-semibold"
                        : "tw:text-gray-900"
                  }`}
                >
                  Paylater
                </span>
                <span className="tw:text-[10px] tw:text-gray-400 tw:uppercase tw:tracking-wide tw:truncate">
                  {paylaterWallet.eligible
                    ? "Credit account"
                    : paylaterWallet.message}
                </span>
              </div>
              {paylaterWallet.eligible && (
                <div className="tw:flex-1 tw:text-right">
                  <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                    Available
                  </div>
                  <div
                    className={`tw:text-sm tw:font-semibold tw:tabular-nums ${
                      isPaylater ? "tw:text-indigo-700" : "tw:text-gray-900"
                    }`}
                  >
                    <Amount value={paylaterWallet.balance ?? 0} />
                  </div>
                </div>
              )}
            </label>
          )}
        </div>
      )}

      {/* Change-to-return */}
      {!assisted && cashToReturn && cashToReturn > 0 ? (
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-emerald-200 tw:bg-gradient-to-r tw:from-emerald-50 tw:to-emerald-50/30 tw:px-4 tw:py-3">
          <div className="tw:flex tw:items-center tw:gap-2.5">
            <span className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-500 tw:text-white tw:text-base tw:font-bold">
              ↺
            </span>
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:font-medium tw:text-emerald-700">
                Return change
              </span>
              <span className="tw:text-[11px] tw:text-emerald-600">
                Hand back to customer
              </span>
            </div>
          </div>
          <span className="tw:text-xl tw:font-bold tw:text-emerald-700 tw:tabular-nums">
            <Amount value={cashToReturn} />
          </span>
        </div>
      ) : null}

      <div className="tw:pt-1">
        {loadingUpiPayments ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-2">
            <AppSpinner />
          </div>
        ) : (
          <div className="tw:flex tw:gap-2">
            <AppButton
              size="default"
              fill="outline"
              color="dark"
              className="tw:px-4"
              onClick={handleBack}
            >
              <span className="tw:flex tw:items-center tw:gap-1">
                <ArrowLeft className="tw:w-4 tw:h-4" />
                {t("checkoutModal.payment.actions.back")}
              </span>
            </AppButton>
            <AppButton
              size="default"
              fill="solid"
              color="dark"
              className="tw:flex-1"
              onClick={handleContinue}
            >
              <span className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:text-sm tw:font-semibold">
                {t("checkoutModal.payment.actions.continue")}
                {payableAmount > 0 && (
                  <span className="tw:tabular-nums tw:border-l tw:border-white/30 tw:pl-2 tw:ml-1">
                    <Amount value={payableAmount} />
                  </span>
                )}
                <span className="tw:text-base tw:leading-none">→</span>
              </span>
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
