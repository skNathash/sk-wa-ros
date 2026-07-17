import {
  AlertCircle,
  ArrowRight,
  Info,
  Loader2,
  Lock,
  PlusCircle,
  Wallet,
} from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";

interface Props {
  show: boolean;
  plan?: any;
  onClose: (success?: boolean) => void;
}

const TopUpPlanModal: FC<Props> = ({ show, plan, onClose }) => {
  const { t } = useTranslation("platformFee");
  const appToast = useAppToast();
  const [amount, setAmount] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = AuthService.getLoggedInUser()?.name || "Wallet";

  const planDetails = plan?.planDetails || {};
  const taxPercentage = planDetails.taxPercentage || 0;
  const isInclusiveTax = planDetails.isInclusiveTax || false;
  const minAmount = planDetails.subscriptionAmount || 0;

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const fid = AuthService.getLoggedInUserId(true);
      if (fid) {
        const resp = await FranchiseService.getBalance(fid);
        setWalletBalance(resp.balance || 0);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchBalance();
      setAmount("");
      setError(null);
    }
  }, [show]);

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t("enterValidAmount"));
      return;
    }

    if (numAmount < minAmount) {
      setError(t("minimumTopUpAmount", { amount: minAmount }));
      return;
    }

    if (totalDebit > walletBalance) {
      setError(t("notEnoughMoneyInWallet"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        planId: plan?.planId,
        topupAmount: numAmount,
        isUpgradePlan: true,
      };

      const resp = await FranchiseService.subscribeServiceFeePlan(payload);

      if (resp?.data?.success || resp?.statusCode === 200) {
        appToast.show({
          msg: t("platformFeeTopUpSuccessful"),
          color: "success",
        });
        onClose(true);
      } else {
        appToast.show({
          msg: resp?.data?.message || t("failedToTopUpPlan"),
          color: "danger",
        });
      }
    } catch (err: any) {
      appToast.show({
        msg: err?.message || t("somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const taxAmount = (parsedAmount * taxPercentage) / 100;
  const totalDebit = isInclusiveTax ? parsedAmount : parsedAmount + taxAmount;
  const isInvalid =
    !amount ||
    parsedAmount <= 0 ||
    parsedAmount < minAmount ||
    totalDebit > walletBalance;
  const remainingWalletBalance = Math.max(0, walletBalance - totalDebit);

  return (
    <AppModal
      show={show}
      callback={() => onClose()}
      className="tw:max-h-[90vh]"
    >
      <AppModal.Title onClose={() => onClose()} noShadow>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:p-1.5 tw:bg-blue-100 tw:rounded-lg">
            <PlusCircle className="tw:text-blue-600 tw:w-4 tw:h-4" />
          </div>
          <span className="tw:font-bold tw:text-base">
            {t("topUpPlatformPercentagePlan")}
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:py-2 tw:max-h-[90vh]">
        <div className="tw:space-y-4">
          <div className="tw:bg-blue-50/50 tw:border tw:border-blue-100/50 tw:rounded-xl tw:p-3 tw:flex tw:gap-3">
            <div className="tw:mt-0.5">
              <Info size={14} className="tw:text-blue-600" />
            </div>
            <div className="tw:space-y-1.5">
              <p className="tw:text-[11px] tw:text-blue-900 tw:font-bold tw:uppercase tw:tracking-wide">
                {t("howThisPlanWorks")}
              </p>
              <p className="tw:text-[11px] tw:text-blue-900 tw:leading-relaxed">
                {t("planWorksExplanation")}
              </p>
            </div>
          </div>

          {/* Current Status Section */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <div className="tw:p-3 tw:bg-gray-50 tw:rounded-xl tw:border tw:border-gray-100">
              <span className="tw:text-[9px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                {t("currentWalletBalance")}
              </span>
              <div className="tw:font-black tw:text-gray-900">
                {loading ? (
                  <Loader2 className="tw:w-3 tw:h-3 tw:animate-spin tw:text-blue-600" />
                ) : (
                  <Amount value={walletBalance} className="tw:text-base" />
                )}
              </div>
            </div>
            <div className="tw:p-3 tw:bg-blue-50 tw:rounded-xl tw:border tw:border-blue-100">
              <span className="tw:text-[9px] tw:font-bold tw:text-blue-600 tw:uppercase tw:tracking-wider">
                {t("currentPlanLimit")}
              </span>
              <div className="tw:font-black tw:text-blue-800">
                <Amount
                  value={plan?.availableAmount || 0}
                  className="tw:text-base"
                />
              </div>
            </div>
          </div>

          <div className="tw:space-y-2">
            <label className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wide">
              {t("howMuchMoneyToAddToPlan")}
            </label>
            <div className="tw:relative">
              <div className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-lg tw:font-black tw:text-gray-400">
                ₹
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val);
                  const numVal = parseFloat(val);
                  if (!isNaN(numVal) && numVal > 0 && numVal < minAmount) {
                    setError(t("minimumTopUpAmount", { amount: minAmount }));
                  } else {
                    setError(null);
                  }
                }}
                disabled={submitting}
                className="tw:w-full tw:pl-8 tw:pr-3 tw:py-3 tw:text-xl tw:font-black tw:text-gray-900 tw:bg-white tw:border-2 tw:border-gray-200 tw:rounded-xl tw:focus:outline-none tw:focus:border-blue-500 tw:transition-all"
                placeholder="0.00"
              />
            </div>
            {error && (
              <div className="tw:mt-2 tw:text-xs tw:text-red-500 tw:font-medium tw:flex tw:items-center tw:gap-1">
                <span>⚠</span> {error}
              </div>
            )}
          </div>

          {/* Transaction Preview */}
          {parsedAmount > 0 && !error && totalDebit <= walletBalance ? (
            <div className="tw:bg-gray-50 tw:rounded-xl tw:border tw:border-dashed tw:border-gray-200 tw:p-3 tw:space-y-2">
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <span className="tw:text-gray-500">{t("planTopUpAmount")}</span>
                <span className="tw:font-bold tw:text-gray-900">
                  <Amount value={parsedAmount} />
                </span>
              </div>
              {taxAmount > 0 && (
                <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                  <span className="tw:text-gray-500">
                    {t("gstWithPercentage", {
                      taxPercentage,
                      included: isInclusiveTax ? "(included)" : "",
                    })}
                  </span>
                  <span className="tw:font-bold tw:text-gray-900">
                    {isInclusiveTax ? "" : "+"} <Amount value={taxAmount} />
                  </span>
                </div>
              )}
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:pt-2 tw:border-t tw:border-gray-100">
                <span className="tw:text-gray-700 tw:font-medium">
                  {t("totalMoneyToDebit")}
                </span>
                <span className="tw:font-bold tw:text-red-500">
                  - <Amount value={totalDebit} />
                </span>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <span className="tw:text-gray-700 tw:font-medium">
                  {t("newPlanLimit")}
                </span>
                <span className="tw:font-black tw:text-emerald-600">
                  <Amount value={(plan?.availableAmount || 0) + parsedAmount} />
                </span>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:border-gray-100">
                <span className="tw:text-gray-700 tw:font-medium">
                  {t("remainingWalletBalance")}
                </span>
                <span className="tw:font-black tw:text-gray-900">
                  <Amount value={remainingWalletBalance} />
                </span>
              </div>
              <div className="tw:flex tw:items-center tw:gap-2 tw:justify-center tw:pt-1">
                <div className="tw:text-[10px] tw:text-blue-600 tw:font-bold tw:flex tw:items-center tw:gap-1">
                  <span>{t("userBalance", { username })}</span>
                  <ArrowRight size={10} />
                  <span>{t("platformFeePlan")}</span>
                </div>
              </div>
            </div>
          ) : null}

          {!error && parsedAmount && totalDebit > walletBalance ? (
            <div className="tw:p-2.5 tw:bg-amber-50 tw:border tw:border-amber-100 tw:rounded-xl tw:text-amber-700 tw:text-[10px] tw:font-bold tw:flex tw:items-center tw:gap-2">
              <Lock size={14} />
              <span>
                {t("insufficientWalletBalanceWithAmount", {
                  amount: "₹" + CommonService.formattedAmount(walletBalance, 2),
                })}
              </span>
            </div>
          ) : null}
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:mt-2">
        <div className="tw:flex tw:gap-2 tw:w-full">
          <AppButton
            fill="clear"
            color="medium"
            className="tw:flex-1 tw:rounded-lg tw:h-10 tw:text-xs tw:font-bold"
            onClick={() => onClose()}
            disabled={submitting}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            color="primary"
            className="tw:flex-1 tw:rounded-lg tw:h-10 tw:text-xs tw:font-black"
            disabled={isInvalid || submitting}
            onClick={handleTopUp}
            isLoading={submitting}
          >
            {submitting ? t("processing") : t("payAndTopUpPlan")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default TopUpPlanModal;
