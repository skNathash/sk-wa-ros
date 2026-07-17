import { ArrowRight, FileText, Package } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";
import PlatformFeeRequiredBlock from "~/shared/accounts/platform-fee/components/PlatformFeeRequiredBlock";
import type { InvoiceItem } from "../types";

interface ConfirmModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  items: InvoiceItem[];
}

interface SummaryData {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  commissionAmount: number;
  commissionPercentage: number;
  planName?: string;
  planType?: string;
  typeOfPlan?: string;
  availableAmount?: number;
  hasSufficientBalance?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  callback,
  items,
}) => {
  const appNav = useAppNav();

  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalProducts: 0,
    totalUnits: 0,
    totalValue: 0,
    commissionAmount: 0,
    commissionPercentage: 0,
  });
  const [calculatingCommission, setCalculatingCommission] = useState(false);
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchPlan();
      if (items.length > 0) {
        calculateSummary();
      }
    }
  }, [show, items]);

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const activePlan = await FranchiseService.getActivePlan();
      setHasPlan(activePlan?.isPlanActive || false);
    } catch (error) {
      console.error("Error fetching plan:", error);
      setHasPlan(false);
    } finally {
      setPlanLoading(false);
    }
  };

  const calculateSummary = async () => {
    setCalculatingCommission(true);

    try {
      const totalProducts = items.length;
      const totalUnits = items.reduce(
        (sum, item) => sum + (item.selected?.qty ?? item.qty ?? 0),
        0,
      );
      const totalValue = items.reduce(
        (sum, item) => sum + (item.totalAmount ?? 0),
        0,
      );

      // Prepare deals for commission calculation
      const dealsForCalc = items.filter((item) => item.selected?.dealId);

      let commissionAmount = 0;
      let commissionPercentage = 0;
      let planName = "";
      let planType = "";
      let typeOfPlan = "";
      let availableAmount = 0;
      let hasSufficientBalance: boolean | undefined;

      if (dealsForCalc.length > 0) {
        try {
          const payload = {
            deals: dealsForCalc.map((item) => ({
              dealId: item.selected?.dealId || "",
              quantity: item.selected?.qty ?? item.qty ?? 0,
              mrp: item.selected?.mrp ?? item.mrp ?? 0,
              purchasePrice: item.selected?.price ?? item.price ?? 0,
            })),
          };

          const resp = await FranchiseService.getChargeByDeal(payload);

          commissionAmount = resp.commissionAmount;
          commissionPercentage = resp.commissionPercentage;
          planName = resp.planName;
          planType = resp.planType;
          typeOfPlan = resp.typeOfPlan;
          availableAmount = resp.availableAmount;
          hasSufficientBalance = resp.hasSufficientBalance;
        } catch (error) {
          console.error("Error calculating commission:", error);
          commissionAmount = 0;
        }
      }

      setSummaryData({
        totalProducts,
        totalUnits,
        totalValue,
        commissionAmount,
        commissionPercentage,
        planName,
        planType,
        typeOfPlan,
        availableAmount,
        hasSufficientBalance,
      });
    } catch (error) {
      console.error("Error calculating summary:", error);
    } finally {
      setCalculatingCommission(false);
    }
  };

  const handleConfirm = () => {
    if (summaryData.hasSufficientBalance === false) {
      return;
    }
    callback({ action: "confirm", data: { items } });
  };

  const handleCancel = () => {
    callback({ action: "cancel" });
  };

  const handleBuyPlan = () => {
    handleCancel();
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  return (
    <AppModal
      show={show}
      callback={handleCancel}
      backdropDismiss={false}
      className="tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleCancel}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <FileText className="tw:w-5 tw:h-5 tw:text-blue-600" />
          <span className="tw:text-lg tw:font-semibold">
            Confirm Purchase Order Creation
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:bg-gray-50 tw:h-[90vh]">
        <div className="tw:space-y-6">
          <div className="tw:rounded-lg tw:bg-blue-50 tw:border tw:border-blue-200 tw:p-4">
            <div className="tw:text-sm tw:font-semibold tw:text-blue-900 tw:mb-2">
              You're about to create a Purchase Order from this scanned invoice.
            </div>
            <div className="tw:text-xs tw:text-blue-800 tw:mb-3">
              Here's what will happen next:
            </div>
            <ol className="tw:space-y-2 tw:text-xs tw:text-gray-700">
              <li className="tw:flex tw:items-start tw:gap-2">
                <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:text-blue-600 tw:mt-0.5 tw:shrink-0" />
                <span>
                  A new Purchase Order will be generated using the vendor and
                  items extracted from your invoice.
                </span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:text-blue-600 tw:mt-0.5 tw:shrink-0" />
                <span>
                  You'll be redirected to the PO processing page to review,
                  adjust quantities, and verify pricing before approval.
                </span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:text-blue-600 tw:mt-0.5 tw:shrink-0" />
                <span>
                  Once approved on that page, stock will be added to your
                  inventory and the platform fee (if any) will be deducted.
                </span>
              </li>
            </ol>
          </div>

          <div className="tw:rounded-lg">
            <h3 className="tw:text-md tw:font-semibold tw:mb-4 tw:flex tw:items-center tw:gap-2">
              <Package className="tw:w-4 tw:h-4" />
              Summary
            </h3>

            {planLoading ? (
              <div className="tw:flex tw:justify-center tw:py-4">
                <AppSpinner />
              </div>
            ) : (
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-4">
                <div className="tw:bg-white tw:rounded-md tw:p-3 tw:border tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:text-sm tw:text-gray-600">
                    Total Products
                  </div>
                  <div className="tw:text-xl tw:font-bold tw:text-blue-600">
                    {summaryData.totalProducts}
                  </div>
                </div>

                <div className="tw:bg-white tw:rounded-md tw:p-3 tw:border tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:text-sm tw:text-gray-600">Total Units</div>
                  <div className="tw:text-xl tw:font-bold tw:text-green-600">
                    {summaryData.totalUnits.toLocaleString()}
                  </div>
                </div>

                <div className="tw:bg-white tw:rounded-md tw:p-3 tw:border tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:text-sm tw:text-gray-600">Total Value</div>
                  <div className="tw:text-xl tw:font-bold tw:text-purple-600">
                    <Amount value={summaryData.totalValue} />
                  </div>
                </div>

                {(summaryData.commissionAmount > 0 ||
                  (calculatingCommission && hasPlan)) && (
                  <div className="tw:col-span-1 tw:sm:col-span-3 tw:mt-1">
                    <PlatformFeeInfo
                      commissionAmount={summaryData.commissionAmount}
                      commissionPercentage={summaryData.commissionPercentage}
                      planName={summaryData.planName}
                      planType={summaryData.planType}
                      typeOfPlan={summaryData.typeOfPlan}
                      availableAmount={summaryData.availableAmount}
                      hasSufficientBalance={summaryData.hasSufficientBalance}
                      calculating={calculatingCommission}
                      onBuyPlan={handleBuyPlan}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* {hasPlan === false && summaryData.totalValue > 0 && (
            <PlatformFeeRequiredBlock onSubscribe={handleBuyPlan} />
          )} */}
        </div>
      </AppModal.Content>

      {(hasPlan || !summaryData.totalValue) && (
        <AppModal.Footer className="tw:justify-end">
          <div className="tw:flex tw:gap-3 tw:justify-end">
            <AppButton
              fill="outline"
              color="secondary"
              onClick={handleCancel}
              disabled={planLoading}
            >
              Cancel
            </AppButton>
            {(hasPlan || !summaryData.totalValue) && (
              <AppButton
                color="success"
                onClick={handleConfirm}
                disabled={
                  planLoading ||
                  calculatingCommission ||
                  summaryData.hasSufficientBalance === false
                }
              >
                Create Purchase Order
              </AppButton>
            )}
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default ConfirmModal;
