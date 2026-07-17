import { CheckCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";
import UomPriceService from "~/services/UomPriceService";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";
import PlatformFeeRequiredBlock from "~/shared/accounts/platform-fee/components/PlatformFeeRequiredBlock";
import type { CartItem } from "../helper";

interface SaveToInventoryModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  products: CartItem[];
  cartId: string;
}

interface SummaryData {
  totalProducts: number;
  totalUnits: number;
  unitsByUom: Record<string, number>;
  totalValue: number;
  commissionAmount: number;
  commissionPercentage: number;
  planName?: string;
  planType?: string;
  typeOfPlan?: string;
  availableAmount?: number;
  hasSufficientBalance?: boolean;
}

const SaveToInventoryModal: React.FC<SaveToInventoryModalProps> = ({
  show,
  callback,
  products,
  cartId,
}) => {
  const { t } = useTranslation("common");
  const appNav = useAppNav();

  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalProducts: 0,
    totalUnits: 0,
    unitsByUom: {},
    totalValue: 0,
    commissionAmount: 0,
    commissionPercentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [calculatingCommission, setCalculatingCommission] = useState(false);
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchPlan();
      if (products.length > 0) {
        calculateSummary();
      }
    }
  }, [show, products]);

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
      // Calculate basic summary
      const totalProducts = products.length;
      const totalUnits = products.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const unitsByUom = products.reduce<Record<string, number>>(
        (acc, item) => {
          const qty = item.quantity || 0;
          if (qty <= 0) return acc;
          // quantity is stored in display units (kg/ltr) for small UOMs,
          // so label it with the display UOM to match what the user entered
          const uom = UomPriceService.getDisplayUom(item.unitType) || "unit";
          acc[uom] = (acc[uom] || 0) + qty;
          return acc;
        },
        {}
      );
      const totalValue = products.reduce(
        (sum, item) => sum + (item.totalPrice || 0),
        0
      );

      // Prepare deals for commission calculation
      const dealsForCalc = products.filter(
        (item) => item.dealId && !item.isCloned
      );

      let commissionAmount = 0;
      let commissionPercentage = 0;
      let planName = "";
      let planType = "";
      let typeOfPlan = "";
      let availableAmount = 0;
      let hasSufficientBalance: boolean | undefined;

      if (dealsForCalc.length > 0) {
        try {
          // Build payload expected by the new endpoint.
          // mrp/price are already stored in API/base units (per-gm/ml for small
          // UOMs) — the cart inputs convert on edit — so they are sent as-is here,
          // matching the actual save flow. Only quantity is held in display units
          // (kg/ltr), so it is converted to gm/ml for the API.
          const payload = {
            deals: dealsForCalc.map((item) => ({
              dealId: item.dealId || "",
              quantity: UomPriceService.toApiQuantity(
                item.quantity || 0,
                item.unitType
              ),
              mrp: Number(item.mrp || 0),
              purchasePrice: Number(item.price || 0),
            })),
          };

          const resp = await FranchiseService.getChargeByDeal(payload);

          setCalculatingCommission(false);
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
        unitsByUom,
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
      return; // Do not proceed if balance is insufficient
    }
    callback({ action: "confirm", data: { cartId, products } });
  };

  const handleCancel = () => {
    callback({ action: "cancel", data: {} });
  };

  const handleBuyPlan = () => {
    handleCancel();
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  return (
    <AppModal show={show} callback={callback} backdropDismiss={false}>
      <AppModal.Title onClose={handleCancel}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <CheckCircle className="tw:w-5 tw:h-5 tw:text-green-600" />
          <span className="tw:text-lg tw:font-semibold">
            Save All to Inventory
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:bg-gray-50">
        <div className="tw:space-y-6">
          {/* Summary Section */}
          <div className="tw:rounded-lg tw:p-4">
            <h3 className="tw:text-md tw:font-semibold tw:mb-4 tw:flex tw:items-center tw:gap-2">
              <Package className="tw:w-4 tw:h-4" />
              Summary
            </h3>

            {loading ? (
              <div className="tw:flex tw:justify-center tw:py-4">
                <AppSpinner />
              </div>
            ) : (
              <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-4">
                <div className="tw:bg-white tw:rounded-md tw:p-3 tw:border tw:flex tw:items-center tw:justify-between">
                  <div className="tw:text-sm tw:text-gray-600">
                    Total Products
                  </div>
                  <div className="tw:text-xl tw:font-bold tw:text-blue-600">
                    {summaryData.totalProducts}
                  </div>
                </div>

                <div className="tw:bg-white tw:rounded-md tw:p-3 tw:border">
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                    <div className="tw:text-sm tw:text-gray-600">
                      Total Units
                    </div>
                    <div className="tw:text-xs tw:text-gray-400">by UOM</div>
                  </div>
                  {Object.keys(summaryData.unitsByUom).length === 0 ? (
                    <div className="tw:text-xl tw:font-bold tw:text-green-600">
                      0
                    </div>
                  ) : (
                    <div className="tw:flex tw:flex-wrap tw:gap-2">
                      {Object.entries(summaryData.unitsByUom).map(
                        ([uom, qty]) => (
                          <div
                            key={uom}
                            className="tw:flex tw:items-baseline tw:gap-1 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded tw:px-2 tw:py-1"
                          >
                            <span className="tw:text-lg tw:font-bold tw:text-green-700">
                              {qty.toLocaleString()}
                            </span>
                            <span className="tw:text-xs tw:font-medium tw:text-green-700">
                              {uom.toUpperCase()}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="tw:bg-white tw:rounded-md tw:p-3 tw:border tw:flex tw:items-center tw:justify-between">
                  <div className="tw:text-sm tw:text-gray-600">Total Value</div>
                  <div className="tw:text-xl tw:font-bold tw:text-purple-600">
                    <Amount value={summaryData.totalValue} />
                  </div>
                </div>

                {(summaryData.commissionAmount > 0 ||
                  (calculatingCommission && hasPlan)) && (
                  <div className="tw:col-span-1 md:tw:col-span-2 tw:mt-1">
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

          {/* Buy Plan Block */}
          {hasPlan === false && summaryData.totalValue > 0 && (
            <PlatformFeeRequiredBlock onSubscribe={handleBuyPlan} />
          )}
        </div>
      </AppModal.Content>

      {(hasPlan || !summaryData.totalValue) && (
        <AppModal.Footer className="tw:justify-end">
          <div className="tw:flex tw:gap-3 tw:justify-end">
            <AppButton
              fill="outline"
              color="secondary"
              onClick={handleCancel}
              disabled={loading || planLoading}
            >
              Cancel
            </AppButton>
            {(hasPlan || !summaryData.totalValue) && (
              <AppButton
                color="success"
                onClick={handleConfirm}
                disabled={loading || summaryData.hasSufficientBalance === false}
              >
                {loading ? "Processing..." : "Proceed"}
              </AppButton>
            )}
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default SaveToInventoryModal;
