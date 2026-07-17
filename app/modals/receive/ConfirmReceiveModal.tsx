import React, { useEffect, useState } from "react";
import {
  Package,
  DollarSign,
  Hash,
  CheckCircle2,
  Info,
  IndianRupee,
} from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";
import FranchiseService from "~/services/FranchiseService";
import useAppNav from "~/hooks/useAppNav";

interface ConfirmReceiveModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  products: any[];
  totalValue: number;
}

interface CommissionData {
  commissionAmount: number;
  commissionPercentage: number;
  planName?: string;
  planType?: string;
  typeOfPlan?: string;
  availableAmount?: number;
  hasSufficientBalance?: boolean;
}

const ConfirmReceiveModal: React.FC<ConfirmReceiveModalProps> = ({
  show,
  onClose,
  onConfirm,
  products,
  totalValue,
}) => {
  const appNav = useAppNav();
  const [commissionData, setCommissionData] = useState<CommissionData>({
    commissionAmount: 0,
    commissionPercentage: 0,
  });
  const [calculating, setCalculating] = useState(false);

  // Calculate items count and units count
  const itemsCount = products.length;
  const unitsCount = products.reduce((sum, product) => {
    const receivedQty = parseFloat(product.formData?.receivedQty) || 0;
    const variations = product.formData?.variations || [];
    const variationQty = variations.reduce((vSum: number, variation: any) => {
      return vSum + (parseFloat(variation.formData?.qty) || 0);
    }, 0);
    return sum + receivedQty + variationQty;
  }, 0);

  const handleBuyPlan = () => {
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  useEffect(() => {
    if (show && products.length > 0) {
      calculateCommission();
    }
  }, [show, products]);

  const calculateCommission = async () => {
    setCalculating(true);

    try {
      // Prepare deals for commission calculation
      const dealsForCalc = products.filter(
        (item) => item.dealId && !item.isCloned
      );

      if (dealsForCalc.length > 0) {
        // Build payload expected by the endpoint
        const dealsPayload: any[] = [];

        dealsForCalc.forEach((item) => {
          // Add main product
          dealsPayload.push({
            dealId: item.dealId || "",
            quantity: item.formData.receivedQty || 0,
            mrp: item.formData.mrp || 0,
            purchasePrice: item.formData.purchasePrice || 0,
          });

          // Add variations if any
          const variations = item.formData.variations || [];
          variations.forEach((variation: any) => {
            dealsPayload.push({
              dealId: item.dealId || "",
              quantity: variation.formData?.qty || 0,
              mrp: variation.formData?.mrp || item.formData?.mrp || 0,
              purchasePrice:
                variation.formData?.purchasePrice ||
                item.formData?.purchasePrice ||
                0,
            });
          });
        });

        const payload = {
          deals: dealsPayload,
        };

        const resp = await FranchiseService.getChargeByDeal(payload);

        setCommissionData({
          commissionAmount: resp.commissionAmount,
          commissionPercentage: resp.commissionPercentage,
          planName: resp.planName,
          planType: resp.planType,
          typeOfPlan: resp.typeOfPlan,
          availableAmount: resp.availableAmount,
          hasSufficientBalance: resp.hasSufficientBalance,
        });
      }
    } catch (error) {
      console.error("Error calculating commission:", error);
      setCommissionData({
        commissionAmount: 0,
        commissionPercentage: 0,
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AppModal show={show} callback={() => onClose()} className="tw:max-w-md">
      <AppModal.Title onClose={onClose}>Confirm Purchase Order</AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-3">
          {/* Receipt Summary Header */}
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500 tw:mb-2">
            <Info size={14} />
            <span>Review the details below before confirming</span>
          </div>

          {/* Compact Summary Cards */}
          <div className="tw:grid tw:grid-cols-3 tw:gap-2">
            <div className="tw:bg-blue-50 tw:rounded-md tw:p-2.5">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1">
                <Package className="tw:text-blue-600" size={16} />
                <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
                  Items
                </span>
              </div>
              <p className="tw:text-lg tw:font-bold tw:text-blue-700">
                {itemsCount}
              </p>
              <p className="tw:text-[10px] tw:text-gray-500">Product types</p>
            </div>

            <div className="tw:bg-green-50 tw:rounded-md tw:p-2.5">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1">
                <Hash className="tw:text-green-600" size={16} />
                <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
                  Units
                </span>
              </div>
              <p className="tw:text-lg tw:font-bold tw:text-green-700">
                {unitsCount}
              </p>
              <p className="tw:text-[10px] tw:text-gray-500">Total quantity</p>
            </div>

            <div className="tw:bg-purple-50 tw:rounded-md tw:p-2.5">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1">
                <IndianRupee className="tw:text-purple-600" size={16} />
                <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
                  Value
                </span>
              </div>
              <Amount
                value={totalValue}
                className="tw:text-lg tw:font-bold tw:text-purple-700"
              />
              <p className="tw:text-[10px] tw:text-gray-500">Purchase cost</p>
            </div>
          </div>

          {/* Platform Fee Info */}
          <div className="tw:pt-2">
            <PlatformFeeInfo
              commissionAmount={commissionData.commissionAmount}
              commissionPercentage={commissionData.commissionPercentage}
              planName={commissionData.planName}
              planType={commissionData.planType}
              typeOfPlan={commissionData.typeOfPlan}
              availableAmount={commissionData.availableAmount}
              hasSufficientBalance={commissionData.hasSufficientBalance}
              calculating={calculating}
              onBuyPlan={handleBuyPlan}
            />
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            onClick={onClose}
            className="tw:min-w-[100px]"
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleConfirm}
            disabled={
              calculating || commissionData.hasSufficientBalance === false
            }
            className="tw:min-w-[140px] tw:gap-1.5"
          >
            <CheckCircle2 size={16} />
            {calculating ? "Calculating..." : "Confirm"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ConfirmReceiveModal;
