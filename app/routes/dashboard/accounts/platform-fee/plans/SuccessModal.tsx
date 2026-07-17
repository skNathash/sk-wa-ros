import { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import {
  Wallet,
  Calendar,
  ShieldCheck,
  Receipt,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { addDays, addMonths } from "date-fns";
import DateFormat from "~/components/core/date/DateFormat";

interface PlanSnapshot {
  planName?: string;
  planTitle?: string;
  planType?: string;
  planDurationDays?: number;
  selectedDurationMonths?: number;
  subscriptionAmount: number;
  gstAmount: number;
  taxPercentage: number;
  isInclusiveTax: boolean;
  setupFeeBase: number;
  setupFeeTax: number;
  setupFee: number;
  setupFeeTaxPercentage?: number;
  setupFeeIsInclusiveTax?: boolean;
  total: number;
  selectedFeeName?: string;
  discountPercent?: number;
  amountTo?: number;
  balanceAfter: number;
  userName: string;
}

interface SuccessModalProps {
  show: boolean;
  planId: string;
  amount?: number;
  snapshot?: PlanSnapshot;
  onClose: () => void;
}

const SuccessModal = ({ show, snapshot, onClose }: SuccessModalProps) => {
  const { t } = useTranslation("platformFee");
  const appToast = useAppToast();
  const [downloading, setDownloading] = useState(false);
  const [downloadingSetupFee, setDownloadingSetupFee] = useState(false);

  const hasSetupFee = (snapshot?.setupFeeBase || 0) > 0;

  const downloadSetupFeeInvoice = async () => {
    setDownloadingSetupFee(true);
    try {
      const res = await FranchiseService.getServiceFeePlanSubscriptions({
        filter: { isSetupFeePaid: true },
      });
      const list = res?.data?.data || [];
      const item = Array.isArray(list) ? list[0] : list;
      const docId = item?.invoiceDocumentId || "";
      if (!docId) {
        appToast.show({
          color: "error",
          msg: t("failedToDownloadPlanDetails"),
        });
        return;
      }
      CommonService.assetDownload(docId);
    } catch (err) {
      console.error("Error downloading setup fee invoice", err);
      appToast.show({
        color: "error",
        msg: t("failedToDownloadPlanDetails"),
      });
    } finally {
      setDownloadingSetupFee(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      // Fetch active plan to get subscriptionId
      const activePlan = await FranchiseService.getActivePlan();
      const subscriptionId = activePlan?.subscriptionId;

      if (!subscriptionId) {
        appToast.show({
          color: "error",
          msg: t("invoiceNotAvailable"),
        });
        return;
      }

      const r = await FranchiseService.getPlatformPlanDetails(subscriptionId);
      const d = r.data.data?.invoiceDocumentId || "";

      if (!d) {
        appToast.show({
          color: "error",
          msg: t("failedToDownloadPlanDetails"),
        });
        return;
      }

      CommonService.assetDownload(d);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      appToast.show({
        color: "error",
        msg: t("errorDownloadingInvoice"),
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!show) return null;

  const planType = (snapshot?.planType || "").toUpperCase();
  const planTypeLabel =
    planType === "HYBRID"
      ? t("hybridPlan")
      : planType === "FIXED"
        ? t("fixedValuePlan")
        : planType === "PERCENTAGE"
          ? t("percentagePlan")
          : t("standard");

  // If user picked a duration (operational fee), honour it in months so
  // month boundaries line up exactly. Otherwise fall back to the plan's
  // base duration in days.
  const planEndAt = snapshot?.selectedDurationMonths
    ? addMonths(new Date(), snapshot.selectedDurationMonths)
    : snapshot?.planDurationDays
      ? addDays(new Date(), snapshot.planDurationDays)
      : null;

  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:max-w-md! tw:max-h-[90vh]"
    >
      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:mt-4 tw:space-y-4">
          <div className="tw:p-4 tw:bg-green-50 tw:text-center">
            <div className="tw:w-12 tw:h-12 tw:bg-white tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mx-auto tw:shadow-sm tw:mb-2">
              <CheckCircle className="tw:w-8 tw:h-8 tw:text-green-600" />
            </div>
            <h2 className="tw:text-lg tw:font-bold tw:text-green-900">
              {t("subscriptionActive")}
            </h2>
            <p className="tw:text-xs tw:text-green-700">
              {t("platformFeePlanUpdated")}
            </p>
          </div>

          {/* Plan Summary Card */}
          <div className="tw:bg-gray-50 tw:rounded-xl tw:p-3 tw:border tw:border-gray-100">
            <div className="tw:flex tw:justify-between tw:items-start tw:mb-2">
              <div>
                <span className="tw:text-[9px] tw:font-bold tw:text-blue-600 tw:uppercase tw:tracking-wider">
                  {t("activePlan")}
                </span>
                <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
                  {snapshot?.planTitle ||
                    snapshot?.planName ||
                    t("premiumPlan")}
                </h3>
                {snapshot?.selectedFeeName && (
                  <p className="tw:text-[10px] tw:text-gray-500 tw:mt-0.5">
                    {snapshot.selectedFeeName}
                  </p>
                )}
              </div>
              <div className="tw:bg-green-100 tw:text-green-700 tw:text-[9px] tw:font-bold tw:px-2 tw:py-0.5 tw:rounded-full tw:uppercase">
                {t("success")}
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:hidden">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:w-7 tw:h-7 tw:bg-blue-50 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <Calendar className="tw:w-3.5 tw:h-3.5 tw:text-blue-600" />
                </div>
                <div>
                  <p className="tw:text-[9px] tw:text-gray-500 tw:uppercase tw:font-medium">
                    {t("validity")}
                  </p>
                  <p className="tw:text-xs tw:font-bold tw:text-gray-900">
                    {snapshot?.selectedFeeName
                      ? snapshot.selectedFeeName
                      : t("days", { count: snapshot?.planDurationDays || 0 })}
                  </p>
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:w-7 tw:h-7 tw:bg-purple-50 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <ShieldCheck className="tw:w-3.5 tw:h-3.5 tw:text-purple-600" />
                </div>
                <div>
                  <p className="tw:text-[9px] tw:text-gray-500 tw:uppercase tw:font-medium">
                    {t("planType")}
                  </p>
                  <p className="tw:text-xs tw:font-bold tw:text-gray-900">
                    {planTypeLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="tw:bg-gray-50 tw:rounded-xl tw:p-3 tw:border tw:border-gray-100">
            <h4 className="tw:text-[9px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-widest tw:mb-2 text-center">
              {t("transactionSummary")}
            </h4>
            <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-2 tw:text-xs">
              <div className="tw:text-gray-500">
                {t("subscriptionFee", { defaultValue: "Subscription Fee" })}
                {snapshot?.selectedFeeName
                  ? ` (${snapshot.selectedFeeName})`
                  : ""}
              </div>
              <div className="tw:text-right tw:font-semibold tw:text-gray-900">
                <Amount value={snapshot?.subscriptionAmount || 0} />
              </div>

              {(snapshot?.taxPercentage || 0) > 0 && (
                <>
                  <div className="tw:text-gray-500">
                    GST ({snapshot?.taxPercentage}%)
                  </div>
                  <div className="tw:text-right tw:font-semibold tw:text-gray-900">
                    {snapshot?.isInclusiveTax ? (
                      <span className="tw:text-gray-400 tw:text-[10px]">
                        Included
                      </span>
                    ) : (
                      <Amount value={snapshot?.gstAmount || 0} />
                    )}
                  </div>
                </>
              )}

              {(snapshot?.setupFeeBase || 0) > 0 && (
                <>
                  <div className="tw:text-gray-500">
                    {t("setupFee", { defaultValue: "Setup Fee" })} (
                    {t("setupFeeFirstTimeOnly", {
                      defaultValue: "first time only",
                    })}
                    )
                  </div>
                  <div className="tw:text-right tw:font-semibold tw:text-gray-900">
                    <Amount value={snapshot?.setupFeeBase || 0} />
                  </div>
                  {(snapshot?.setupFeeTaxPercentage || 0) > 0 &&
                    !snapshot?.setupFeeIsInclusiveTax && (
                      <>
                        <div className="tw:text-gray-500">
                          {t("setupFee", { defaultValue: "Setup Fee" })}
                        </div>
                        <div className="tw:text-right tw:font-semibold tw:text-gray-900">
                          <Amount value={snapshot?.setupFeeTax || 0} />
                        </div>
                      </>
                    )}
                </>
              )}

              <div className="tw:text-gray-700 tw:font-bold tw:pt-1 tw:border-t tw:border-dashed tw:border-gray-200">
                {t("totalDeducted")}
              </div>
              <div className="tw:text-right tw:font-bold tw:text-blue-600 tw:pt-1 tw:border-t tw:border-dashed tw:border-gray-200">
                <Amount value={snapshot?.total || 0} />
              </div>

              <div className="tw:col-span-2 tw:flex tw:justify-between tw:items-center tw:pt-2 tw:mt-1 tw:border-t tw:border-gray-100">
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <Wallet className="tw:w-3.5 tw:h-3.5 tw:text-gray-400" />
                  <span className="tw:text-gray-600 text-[10px]">
                    {t("balanceLabel", { userName: snapshot?.userName || "" })}
                  </span>
                </div>
                <span className="tw:font-bold tw:text-gray-900">
                  <Amount value={snapshot?.balanceAfter || 0} />
                </span>
              </div>
            </div>
          </div>

          {/* Expiry Note */}
          {planEndAt && (
            <div className="tw:bg-blue-50/50 tw:rounded-lg tw:p-2 tw:flex tw:items-center tw:justify-between tw:border tw:border-blue-100/50">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Clock className="tw:w-3.5 tw:h-3.5 tw:text-blue-600" />
                <span className="tw:text-[10px] tw:font-semibold tw:text-blue-800">
                  {t("planValidUntil")}
                </span>
              </div>
              <span className="tw:text-[10px] tw:font-bold tw:text-blue-900">
                <DateFormat value={planEndAt} formatStr="dd MMM yyyy" />
              </span>
            </div>
          )}

          <div className="tw:flex tw:flex-col tw:gap-2">
            <AppButton
              className="tw:w-full"
              fill="solid"
              color="primary"
              size="default"
              onClick={onClose}
            >
              {t("done")}
            </AppButton>
            <AppButton
              className="tw:w-full"
              fill="clear"
              color="secondary"
              size="default"
              onClick={handleDownloadInvoice}
              disabled={downloading}
            >
              {downloading ? (
                <div className="tw:animate-spin tw:rounded-full tw:h-3 tw:w-3 tw:border-b-2 tw:border-gray-500"></div>
              ) : (
                <Receipt className="tw:w-3.5 tw:h-3.5" />
              )}
              {t("viewInvoiceReceipt")}
            </AppButton>
            {hasSetupFee && (
              <AppButton
                className="tw:w-full"
                fill="clear"
                color="secondary"
                size="default"
                onClick={downloadSetupFeeInvoice}
                disabled={downloadingSetupFee}
              >
                {downloadingSetupFee ? (
                  <div className="tw:animate-spin tw:rounded-full tw:h-3 tw:w-3 tw:border-b-2 tw:border-gray-500"></div>
                ) : (
                  <FileText className="tw:w-3.5 tw:h-3.5" />
                )}
                Setup Fee Invoice
              </AppButton>
            )}
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default SuccessModal;
