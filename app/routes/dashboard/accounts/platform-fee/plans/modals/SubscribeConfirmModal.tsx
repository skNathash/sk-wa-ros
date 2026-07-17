import React, { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import AmountInWords from "~/components/core/amount-in-words/AmountInWords";
import { AuthService } from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import {
  Loader2,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type OperationalFee = {
  type: string;
  value: number;
  discountPercent: number;
  discountSubscriptionAmount: number;
  isActive: boolean;
  isFree: boolean;
  displayName: string;
  refId: string;
};

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
  data?: {
    name?: string;
    amount?: number;
    gst?: number;
    _id?: string;
    subscriptionAmount?: number;
    isMultiStep?: boolean;
    isInclusiveTax?: boolean;
    taxPercentage?: number;
    setupFee?: number;
    setupFeeInfo?: {
      value: number;
      isInclusiveTax?: boolean;
      taxPercentage?: number;
    };
    operationalFeesList?: OperationalFee[];
    amountTo?: number;
    isExistingUser?: boolean;
    planDurationDays?: number;
    typeOfPlan?: string;
  };
};

const SubscribeConfirmModal: React.FC<Props> = ({ show, callback, data }) => {
  const { t } = useTranslation("platformFee");
  const planName = data?.name || "";
  const isInclusiveTax = data?.isInclusiveTax || false;
  const setupFeeBase = data?.isExistingUser
    ? 0
    : (data?.setupFeeInfo?.value ?? data?.setupFee ?? 0);
  const setupFeeTaxPercentage = data?.setupFeeInfo?.taxPercentage || 0;
  const setupFeeIsInclusiveTax = !!data?.setupFeeInfo?.isInclusiveTax;
  const setupFeeTax = setupFeeIsInclusiveTax
    ? 0
    : (setupFeeBase * setupFeeTaxPercentage) / 100;
  const setupFee = setupFeeBase + setupFeeTax;
  const operationalFeesList =
    data?.operationalFeesList?.filter((f) => f.isActive) || [];
  const hasOperationalFees = operationalFeesList.length > 0;

  const [selectedFeeRefId, setSelectedFeeRefId] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Derive amounts from selected operational fee or fallback to data props
  const selectedFee = hasOperationalFees
    ? operationalFeesList.find((f) => f.refId === selectedFeeRefId) ||
      operationalFeesList[0]
    : null;

  const subscriptionAmount = selectedFee
    ? selectedFee.discountSubscriptionAmount
    : Number(data?.amount || 0);
  const discountPercent = selectedFee?.discountPercent || 0;

  const baseDurationDays = data?.planDurationDays || 0;
  // fee.value represents number of months (1, 3, 6, 12 ...). When an
  // operational fee is selected we express validity as months; otherwise
  // fall back to the plan's base duration in days.
  const selectedDurationMonths = selectedFee ? selectedFee.value || 0 : 0;

  const gstAmount = isInclusiveTax
    ? 0
    : (subscriptionAmount * (data?.taxPercentage || 0)) / 100;
  const total = subscriptionAmount + gstAmount + setupFee;

  // Original (non-discounted) total — used to show strikethrough price
  // for Hybrid plans when an operational fee discount is applied.
  const originalSubscriptionAmount = selectedFee
    ? (data?.subscriptionAmount || 0) * (selectedFee.value || 1)
    : subscriptionAmount;
  const originalGstAmount = isInclusiveTax
    ? 0
    : (originalSubscriptionAmount * (data?.taxPercentage || 0)) / 100;
  const originalTotal =
    originalSubscriptionAmount + originalGstAmount + setupFee;
  const showOriginalTotal =
    data?.typeOfPlan === "Hybrid" &&
    discountPercent > 0 &&
    originalTotal > total;

  const user = AuthService.getLoggedInUser();
  const userName = user?.name || "Wallet";

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleConfirm = () => {
    callback({
      action: "confirm",
      data: {
        plan: { _id: data?._id, subscriptionAmount },
        amount: subscriptionAmount,
        operationalFeeId: selectedFee?.refId,
        snapshot: {
          planName,
          subscriptionAmount,
          gstAmount,
          taxPercentage: data?.taxPercentage || 0,
          isInclusiveTax,
          setupFeeBase,
          setupFeeTax,
          setupFee,
          setupFeeTaxPercentage,
          setupFeeIsInclusiveTax,
          total,
          selectedFeeName: selectedFee?.displayName,
          discountPercent,
          amountTo: data?.amountTo,
          planDurationDays: baseDurationDays,
          selectedDurationMonths,
          walletBalance: balance,
        },
      },
    });
  };

  // Reset selected fee when modal opens
  useEffect(() => {
    if (show && hasOperationalFees) {
      setSelectedFeeRefId(operationalFeesList[0]?.refId || "");
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      const fetch = async () => {
        setLoadingBalance(true);
        setBalanceError(null);
        try {
          const fid = AuthService.getLoggedInUserId(true);
          if (!fid) {
            setBalanceError(t("unableToFindFranchiseId"));
            setBalance(0);
            return;
          }
          const resp: any = await FranchiseService.getBalance(fid);
          const bal = (resp && resp.balance) || 0;
          setBalance(bal);
        } catch (err) {
          console.error("Error fetching balance in modal:", err);
          setBalanceError(t("couldNotFetchWalletBalance"));
          setBalance(0);
        } finally {
          setLoadingBalance(false);
        }
      };
      fetch();
    } else {
      setBalance(null);
      setLoadingBalance(false);
      setBalanceError(null);
    }
  }, [show]);

  const isInsufficientBalance = balance !== null && balance < total;

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose} noShadow>
        <div className="tw:flex tw:flex-col">
          {data?.isMultiStep && (
            <div className="tw:text-xs tw:font-normal tw:text-gray-500 tw:mb-0.5">
              {t("step2Of2")}
            </div>
          )}
          <div className="tw:font-bold tw:text-lg">{t("confirmPayment")}</div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:flex tw:flex-col tw:gap-2.5 tw:py-1">
          {/* Step Indicator */}
          {data?.isMultiStep && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:px-1 tw:mb-1">
              <div className="tw:h-1.5 tw:flex-1 tw:bg-blue-600 tw:rounded-full"></div>
              <div className="tw:h-1.5 tw:flex-1 tw:bg-blue-600 tw:rounded-full"></div>
            </div>
          )}
          {/* Main Visual Flow */}
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-3 tw:bg-gray-50 tw:py-2 tw:px-3 tw:rounded-lg tw:border tw:border-gray-100">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <div className="tw:p-1 tw:bg-blue-100 tw:rounded-full">
                <Wallet className="tw:w-3.5 tw:h-3.5 tw:text-blue-600" />
              </div>
              <span className="tw:text-[10px] tw:font-semibold tw:text-gray-500 tw:uppercase">
                {t("yourWallet")}
              </span>
            </div>
            <ArrowRight className="tw:w-4 tw:h-4 tw:text-gray-400" />
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <div className="tw:p-1 tw:bg-green-100 tw:rounded-full">
                <CheckCircle2 className="tw:w-3.5 tw:h-3.5 tw:text-green-600" />
              </div>
              <span className="tw:text-[10px] tw:font-semibold tw:text-gray-500 tw:uppercase">
                {t("newPlan")}
              </span>
            </div>
          </div>

          {/* Payment Message */}
          <div className="tw:text-center">
            <p className="tw:text-sm tw:text-gray-600">
              Your are about to buy <strong>{planName}</strong> plan
            </p>
          </div>

          {/* Setup Fee + Duration Selector */}
          {(setupFee > 0 || hasOperationalFees) && (
            <div className="tw:bg-gray-50 tw:rounded-xl tw:p-3 tw:border tw:border-gray-200">
              {/* Setup Fee Block */}
              {setupFee > 0 && (
                <div className="tw:flex tw:items-center tw:justify-between tw:p-2.5 tw:bg-white tw:rounded-lg tw:border tw:border-gray-200">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-sm tw:font-semibold tw:text-gray-700">
                      {t("setupFee", { defaultValue: "Setup Fee" })}
                    </span>
                    <span className="tw:text-[10px] tw:text-gray-500 tw:leading-snug">
                      {t("setupFeeLifetimeNote", {
                        defaultValue:
                          "Setup fee is charged only for the first time.",
                      })}
                    </span>
                  </div>
                  <div className="tw:flex tw:flex-col tw:items-end">
                    <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                      <Amount value={setupFee} />
                    </span>
                    {setupFeeTaxPercentage > 0 && (
                      <span className="tw:inline-block tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-gray-100 tw:text-[9px] tw:font-semibold tw:text-gray-500">
                        incl. of GST ({setupFeeTaxPercentage}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Plus Icon Connector */}
              {setupFee > 0 && hasOperationalFees && (
                <div className="tw:flex tw:items-center tw:justify-center tw:my-2">
                  <div className="tw:w-7 tw:h-7 tw:rounded-full tw:bg-blue-100 tw:flex tw:items-center tw:justify-center tw:border-2 tw:border-blue-200">
                    <span className="tw:text-blue-600 tw:font-bold tw:text-sm tw:leading-none">
                      +
                    </span>
                  </div>
                </div>
              )}

              {/* Operational Fees / Duration Selector */}
              {hasOperationalFees && (
                <>
                  <div className="tw:text-xs tw:font-bold tw:text-gray-700 tw:mb-2 tw:uppercase">
                    {t("chooseDuration", { defaultValue: "Choose Duration" })}
                  </div>
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    {operationalFeesList.map((fee) => (
                      <button
                        key={fee.refId}
                        type="button"
                        onClick={() => setSelectedFeeRefId(fee.refId)}
                        className={`tw:flex tw:items-center tw:justify-between tw:p-2.5 tw:rounded-lg tw:border-2 tw:transition-all tw:text-left ${
                          selectedFeeRefId === fee.refId
                            ? "tw:border-blue-500 tw:bg-blue-50"
                            : "tw:border-gray-200 tw:bg-white hover:tw:border-gray-300"
                        }`}
                      >
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <div
                            className={`tw:w-4 tw:h-4 tw:rounded-full tw:border-2 tw:flex tw:items-center tw:justify-center ${
                              selectedFeeRefId === fee.refId
                                ? "tw:border-blue-500"
                                : "tw:border-gray-300"
                            }`}
                          >
                            {selectedFeeRefId === fee.refId && (
                              <div className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-blue-500" />
                            )}
                          </div>
                          <div>
                            <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                              {fee.displayName}
                            </span>
                            {fee.discountPercent > 0 && (
                              <span className="tw:ml-2 tw:inline-block tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-green-100 tw:text-green-700 tw:text-[10px] tw:font-bold">
                                {fee.discountPercent}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="tw:text-right">
                          {fee.discountPercent > 0 && (
                            <div className="tw:text-xs tw:text-gray-400 tw:line-through">
                              <Amount
                                value={
                                  (data?.subscriptionAmount || 0) * fee.value +
                                  (isInclusiveTax
                                    ? 0
                                    : ((data?.subscriptionAmount || 0) *
                                        fee.value *
                                        (data?.taxPercentage || 0)) /
                                      100)
                                }
                              />
                            </div>
                          )}
                          <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                            <Amount
                              value={
                                fee.discountSubscriptionAmount +
                                (isInclusiveTax
                                  ? 0
                                  : (fee.discountSubscriptionAmount *
                                      (data?.taxPercentage || 0)) /
                                    100)
                              }
                            />
                          </div>
                          {(data?.taxPercentage || 0) > 0 && (
                            <span className="tw:inline-block tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-gray-100 tw:text-[9px] tw:font-semibold tw:text-gray-500">
                              incl. of GST ({data?.taxPercentage}%)
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Amount Box */}
          <div className="tw:bg-white tw:border-2 tw:border-blue-500 tw:rounded-xl tw:p-3.5 tw:shadow-sm">
            <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:font-bold tw:mb-1 tw:text-center">
              {t("totalToPay")}
            </div>
            <div className="tw:flex tw:items-baseline tw:justify-center tw:gap-2">
              {showOriginalTotal && (
                <div className="tw:text-base tw:font-semibold tw:text-gray-400 tw:line-through">
                  <Amount value={originalTotal} />
                </div>
              )}
              <div className="tw:text-2xl tw:font-black tw:text-blue-600 tw:text-center">
                <Amount value={total} />
              </div>
              {showOriginalTotal && (
                <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-green-100 tw:text-green-700 tw:text-[10px] tw:font-bold">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Fee Breakdown */}
            {(() => {
              let _step = 0;
              const setupStep = setupFee > 0 ? ++_step : 0;
              const subStep = ++_step;
              const gstStep = (data?.taxPercentage || 0) > 0 ? ++_step : 0;
              const totalStep = ++_step;
              return (
                <div className="tw:mt-2 tw:pt-2 tw:border-t tw:border-dashed tw:border-gray-200 tw:flex tw:flex-col tw:gap-1.5 tw:text-xs tw:text-gray-500">
                  {/* Setup Cost — only when applicable */}
                  {setupFee > 0 && (
                    <div className="tw:flex tw:justify-between">
                      <span>
                        <span className="tw:font-semibold tw:text-gray-600">
                          {setupStep}.
                        </span>{" "}
                        {t("setupFee", { defaultValue: "Setup Fee" })}{" "}
                        <span className="tw:text-[10px] tw:font-normal tw:text-gray-500">
                          (one time)
                        </span>
                      </span>
                      <span className="tw:font-medium tw:text-gray-500">
                        <Amount value={setupFee} />
                      </span>
                    </div>
                  )}

                  {/* Ops Fee rate x months = total */}
                  {selectedFee && (
                    <div className="tw:flex tw:justify-between">
                      <span>
                        <span className="tw:font-semibold tw:text-gray-600">
                          {subStep}.
                        </span>{" "}
                        {selectedFee.displayName}:{" "}
                        <Amount value={data?.subscriptionAmount || 0} />
                        /mo × {selectedFee.value}
                        {discountPercent > 0 && (
                          <span className="tw:ml-1.5 tw:inline-block tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-green-100 tw:text-green-700 tw:text-[10px] tw:font-bold">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </span>
                      <span className="tw:font-medium tw:text-gray-500 tw:flex tw:items-center tw:gap-1.5">
                        {discountPercent > 0 && (
                          <span className="tw:text-gray-400 tw:line-through">
                            <Amount
                              value={
                                (data?.subscriptionAmount || 0) *
                                (selectedFee.value || 0)
                              }
                            />
                          </span>
                        )}
                        <Amount value={subscriptionAmount} />
                      </span>
                    </div>
                  )}
                  {!selectedFee && (
                    <div className="tw:flex tw:justify-between">
                      <span>
                        <span className="tw:font-semibold tw:text-gray-600">
                          {subStep}.
                        </span>{" "}
                        {t("subscriptionFee", {
                          defaultValue: "Subscription Fee",
                        })}
                      </span>
                      <span className="tw:font-medium tw:text-gray-500">
                        <Amount value={subscriptionAmount} />
                      </span>
                    </div>
                  )}

                  {/* GST */}
                  {(data?.taxPercentage || 0) > 0 && (
                    <div className="tw:flex tw:justify-between">
                      <span>
                        <span className="tw:font-semibold tw:text-gray-600">
                          {gstStep}.
                        </span>{" "}
                        GST ({data?.taxPercentage}%)
                      </span>
                      <span className="tw:font-medium tw:text-gray-500">
                        {isInclusiveTax ? (
                          <span className="tw:text-gray-400 tw:text-[10px]">
                            Included
                          </span>
                        ) : (
                          <Amount value={gstAmount} />
                        )}
                      </span>
                    </div>
                  )}

                  {/* Subscription Fee subtotal */}
                  {/* <div className="tw:flex tw:justify-between tw:pt-1 tw:border-t tw:border-dashed tw:border-gray-200">
                <span className="tw:font-semibold tw:text-gray-700">
                  <span className="tw:text-gray-600">{totalStep}.</span>{" "}
                  {t("subtotal", { defaultValue: "Subtotal" })}
                </span>
                <span className="tw:font-semibold tw:text-gray-900">
                  <Amount value={subscriptionAmount + gstAmount} />
                </span>
              </div> */}

                  {/* Grand Total */}
                  <div className="tw:flex tw:justify-between tw:pt-1 tw:border-t tw:border-gray-300">
                    <span className="tw:font-bold tw:text-gray-800">
                      {t("totalSubscriptionFee", {
                        defaultValue: "Total Subscription Fee",
                      })}{" "}
                      {/* {setupStep > 0 && (
                    <span className="tw:text-[10px] tw:font-normal tw:text-gray-500">
                      ({setupStep} + {totalStep})
                    </span>
                  )} */}
                    </span>
                    <span className="tw:font-bold tw:text-blue-600">
                      <Amount value={total} />
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Purchase Limit Credit — Hybrid plans only */}
          {data?.typeOfPlan === "Hybrid" && data?.amountTo ? (
            <div className="tw:bg-purple-50 tw:rounded-xl tw:p-3 tw:border tw:border-purple-200">
              <div className="tw:text-xs tw:font-bold tw:text-purple-700 tw:uppercase tw:mb-1.5">
                {t("inventoryCredit", {
                  defaultValue: "Inventory Credit",
                })}
              </div>
              <div className="tw:flex tw:items-baseline tw:gap-1.5">
                <span className="tw:text-xl tw:font-bold tw:text-purple-900">
                  <AmountInWords value={data.amountTo * 12} />
                </span>
                <span className="tw:text-xs tw:text-purple-500 tw:font-medium">
                  / {t("year", { defaultValue: "year" })}
                </span>
              </div>
            </div>
          ) : null}

          {/* Wallet Summary Section */}
          <div
            className={`tw:rounded-xl tw:p-3 tw:border-2 ${isInsufficientBalance ? "tw:bg-red-50 tw:border-red-200" : "tw:bg-green-50 tw:border-green-200"}`}
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div
                  className={`tw:p-1.5 tw:rounded-lg ${isInsufficientBalance ? "tw:bg-red-100" : "tw:bg-green-100"}`}
                >
                  <Wallet
                    className={`tw:w-4 tw:h-4 ${isInsufficientBalance ? "tw:text-red-600" : "tw:text-green-600"}`}
                  />
                </div>
                <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                  {t("currentWalletBalance")}
                </span>
              </div>
              <div className="tw:text-base tw:font-bold">
                {loadingBalance ? (
                  <Loader2 className="tw:w-5 tw:h-5 tw:animate-spin tw:text-gray-400" />
                ) : (
                  <Amount value={balance ?? 0} />
                )}
              </div>
            </div>

            {balanceError ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-red-600 tw:bg-white tw:p-2 tw:rounded-lg tw:border tw:border-red-100">
                <AlertCircle className="tw:w-4 tw:h-4" />
                <span>{balanceError}</span>
              </div>
            ) : isInsufficientBalance ? (
              <div className="tw:bg-white tw:p-2.5 tw:rounded-lg tw:border tw:border-red-100">
                <div className="tw:flex tw:items-start tw:gap-2">
                  <AlertCircle className="tw:w-4 tw:h-4 tw:text-red-600 tw:flex-shrink-0 tw:mt-0.5" />
                  <div>
                    <div className="tw:text-sm tw:font-bold tw:text-red-700">
                      {t("notEnoughBalance")}
                    </div>
                    <p className="tw:text-xs tw:text-red-600 tw:mt-0.5">
                      You need <Amount value={total - (balance ?? 0)} /> more in
                      your wallet to buy this plan.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tw:bg-white tw:p-2.5 tw:rounded-lg tw:border tw:border-green-100">
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
                  <span className="tw:text-xs tw:text-gray-500">
                    {t("balanceAfterPayment")}
                  </span>
                  <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                    <Amount value={balance !== null ? balance - total : 0} />
                  </span>
                </div>
                <div className="tw:text-[10px] tw:text-green-600 tw:flex tw:items-center tw:gap-1">
                  <CheckCircle2 className="tw:w-3 tw:h-3" />
                  <span>{t("safeToProceed")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Simple Note for rural people */}
          <div className="tw:bg-amber-50 tw:p-2.5 tw:rounded-lg tw:border tw:border-amber-100">
            <p className="tw:text-[11px] tw:text-amber-800 tw:leading-relaxed">
              <span className="tw:font-bold">Note:</span> Once you confirm, the
              amount will be debited immediately. Your plan will be activated.
            </p>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:flex-row tw:gap-2 tw:w-full">
          {data?.isMultiStep ? (
            <AppButton
              type="button"
              fill="clear"
              color="medium"
              onClick={handleClose}
              className="tw:flex-1"
            >
              {t("goBack")}
            </AppButton>
          ) : null}
          {isInsufficientBalance && !loadingBalance && !balanceError ? (
            <AppButton
              type="button"
              color="success"
              onClick={() => callback({ action: "depositMoney" })}
              className="tw:flex-1 tw:font-bold"
            >
              {t("insufficientBalance", {
                defaultValue: "Insufficient Balance",
              })}{" "}
              - {t("depositMoney", { defaultValue: "Deposit Money" })}
            </AppButton>
          ) : (
            <AppButton
              type="button"
              color="primary"
              onClick={handleConfirm}
              disabled={loadingBalance || !!balanceError}
              className="tw:flex-1 tw:font-bold"
            >
              {loadingBalance ? (
                t("checkingBalance")
              ) : (
                <>
                  {t("pay", { defaultValue: "Pay" })} <Amount value={total} />
                </>
              )}
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SubscribeConfirmModal;
