import React, { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import { AuthService } from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import { Loader2, Info, Coins, Wallet, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
  data?: {
    name?: string;
    currentFee?: number;
    _id?: string;
  };
};

const PlanFeeModal: React.FC<Props> = ({ show, callback, data }) => {
  const { t } = useTranslation("platformFee");
  const planName = data?.name || "";
  const currentFee = Number(data?.currentFee || 0);
  const [fee, setFee] = useState<number>(currentFee);
  const [feeInput, setFeeInput] = useState<string>(currentFee.toString());
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  const user = AuthService.getLoggedInUser();
  const userName = user?.name || "Wallet";

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleConfirm = () => {
    if (fee < currentFee) {
      setFeeError(t("feeCannotBeLess"));
      return;
    }
    if (balance !== null && balance < fee) {
      setBalanceError(t("insufficientBalanceForFee"));
      return;
    }
    callback({ action: "confirm", data: { fee } });
  };

  // Reset or any setup when modal opens
  useEffect(() => {
    if (show) {
      setFee(currentFee); // Reset to current fee
      setFeeInput(currentFee.toString()); // Reset input
      setFeeError(null); // Reset error
      // fetch latest wallet balance when modal opens
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
      // reset local balance state when modal closes
      setBalance(null);
      setLoadingBalance(false);
      setBalanceError(null);
      setFeeError(null);
    }
  }, [show, currentFee]);

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose} noShadow>
        <div className="tw:flex tw:flex-col">
          <div className="tw:text-xs tw:font-normal tw:text-gray-500 tw:mb-0.5">
            {t("step1Of2")}
          </div>
          <div className="tw:font-bold tw:text-lg">{t("setPlanAmount")}</div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:flex tw:flex-col tw:gap-4">
          {/* Step Indicator */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:px-1">
            <div className="tw:h-1.5 tw:flex-1 tw:bg-blue-600 tw:rounded-full"></div>
            <div className="tw:h-1.5 tw:flex-1 tw:bg-gray-200 tw:rounded-full"></div>
          </div>

          {/* Plan Info Card */}
          <div className="tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-xl tw:p-4">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:p-2 tw:bg-blue-100 tw:rounded-lg">
                <Info className="tw:w-5 tw:h-5 tw:text-blue-600" />
              </div>
              <div>
                <div className="tw:text-[10px] tw:font-bold tw:text-blue-600 tw:uppercase tw:tracking-wider">
                  {t("selectedPlan")}
                </div>
                <div className="tw:text-base tw:font-bold tw:text-gray-900">
                  {planName}
                </div>
              </div>
            </div>

            <div className="tw:mt-4 tw:pt-3 tw:border-t tw:border-blue-100 tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-blue-700 tw:font-medium">
                {t("minimumAmountRequired")}
              </span>
              <span className="tw:text-sm tw:font-bold tw:text-blue-900">
                <Amount value={currentFee} />
              </span>
            </div>
          </div>

          {/* Input Section */}
          <div className="tw:bg-white tw:border-2 tw:border-gray-100 tw:rounded-xl tw:p-4 tw:shadow-sm">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <Coins className="tw:w-4 tw:h-4 tw:text-amber-500" />
              <span className="tw:text-sm tw:font-bold tw:text-gray-800">
                {t("howMuchWouldYouLikeToPay")}
              </span>
            </div>

            <div className="tw:relative">
              <div className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400 tw:font-bold">
                ₹
              </div>
              <input
                type="number"
                value={feeInput}
                onChange={(e) => {
                  const valStr = e.target.value;
                  setFeeInput(valStr);
                  const val = Number(valStr) || 0;
                  setFee(val);
                  if (val < currentFee) {
                    setFeeError(
                      t("amountMustBeAtLeast", { amount: currentFee })
                    );
                  } else {
                    setFeeError(null);
                  }
                }}
                className="tw:w-full tw:pl-7 tw:pr-3 tw:py-3 tw:text-xl tw:font-bold tw:border-2 tw:border-gray-200 tw:rounded-xl tw:focus:outline-none tw:focus:border-blue-500 tw:transition-colors"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <p className="tw:mt-3 tw:text-[11px] tw:text-gray-500 tw:leading-relaxed">
              {t("amountCalculationNote")}
            </p>

            {feeError && (
              <div className="tw:mt-2 tw:text-xs tw:text-red-500 tw:font-medium tw:flex tw:items-center tw:gap-1">
                <span>{t("warningSymbol")}</span> {feeError}
              </div>
            )}
          </div>

          {/* Wallet Section */}
          <div
            className={`tw:rounded-xl tw:p-4 tw:border-2 ${balance !== null && balance < fee ? "tw:bg-red-50 tw:border-red-100" : "tw:bg-green-50 tw:border-green-100"}`}
          >
            <div className="tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div
                  className={`tw:p-1.5 tw:rounded-lg ${balance !== null && balance < fee ? "tw:bg-red-100" : "tw:bg-green-100"}`}
                >
                  <Wallet
                    className={`tw:w-4 tw:h-4 ${balance !== null && balance < fee ? "tw:text-red-600" : "tw:text-green-600"}`}
                  />
                </div>
                <div className="tw:flex tw:flex-col">
                  <span className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:uppercase">
                    {t("yourWalletBalance")}
                  </span>
                  <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                    {loadingBalance ? (
                      <Loader2 className="tw:w-3 tw:h-3 tw:animate-spin tw:text-gray-400" />
                    ) : (
                      <Amount value={balance ?? 0} />
                    )}
                  </div>
                </div>
              </div>

              {!loadingBalance && balance !== null && balance >= fee && (
                <div className="tw:text-right">
                  <span className="tw:text-[10px] tw:font-bold tw:text-green-600 tw:uppercase tw:block">
                    {t("remaining")}
                  </span>
                  <span className="tw:text-sm tw:font-bold tw:text-green-700">
                    <Amount value={balance - fee} />
                  </span>
                </div>
              )}
            </div>

            {balanceError ? (
              <div className="tw:mt-2 tw:text-[11px] tw:text-red-600 tw:font-medium font-medium">
                {balanceError}
              </div>
            ) : (
              balance !== null &&
              balance < fee && (
                <div className="tw:mt-2 tw:text-[11px] tw:text-red-600 tw:font-bold">
                  {t("insufficientBalanceWarning")}
                </div>
              )
            )}
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:justify-end tw:gap-2 tw:w-full">
          <AppButton
            type="button"
            fill="clear"
            color="medium"
            onClick={handleClose}
            className="tw:flex-1 tw:sm:flex-none"
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            type="button"
            color="primary"
            onClick={handleConfirm}
            className="tw:flex-1 tw:sm:flex-none tw:font-bold"
            disabled={
              loadingBalance ||
              fee <= 0 ||
              fee < currentFee ||
              (balance !== null && balance < fee)
            }
          >
            <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
              <span>
                {loadingBalance ? t("pleaseWait") : t("nextConfirmDetails")}
              </span>
              {!loadingBalance && <ArrowRight className="tw:w-4 tw:h-4" />}
            </div>
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PlanFeeModal;
