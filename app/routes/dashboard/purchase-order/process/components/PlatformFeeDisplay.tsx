import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";

interface PlatformFeeDisplayProps {
  products: any[];
  callback?: (data: { action: string; data: any }) => void;
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

const PlatformFeeDisplay: React.FC<PlatformFeeDisplayProps> = ({
  products,
  callback,
}) => {
  const appNav = useAppNav();
  const [commissionData, setCommissionData] = useState<CommissionData>({
    commissionAmount: 0,
    commissionPercentage: 0,
  });
  const [calculating, setCalculating] = useState(false);

  const handleBuyPlan = () => {
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  useEffect(() => {
    if (products.length > 0) {
      calculateCommission();
    }
  }, [products]);

  const calculateCommission = async () => {
    setCalculating(true);

    try {
      // Prepare deals for commission calculation
      const dealsForCalc = products.filter(
        (item) => item.dealId && !item.isCloned,
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

        // Trigger callback with balance sufficiency
        if (callback) {
          callback({
            action: "balance_check",
            data: { hasSufficientBalance: resp.hasSufficientBalance },
          });
        }
      }
    } catch (error) {
      console.error("Error calculating commission:", error);
      setCommissionData({
        commissionAmount: 0,
        commissionPercentage: 0,
      });

      // Trigger callback with insufficient balance on error
      if (callback) {
        callback({
          action: "balance_check",
          data: { hasSufficientBalance: false },
        });
      }
    } finally {
      setCalculating(false);
    }
  };

  if (commissionData.commissionAmount === 0 && !calculating) {
    return null;
  }

  return (
    <div className="tw:mt-4">
      <PlatformFeeInfo
        commissionAmount={commissionData.commissionAmount}
        commissionPercentage={commissionData.commissionPercentage}
        planName={commissionData.planName}
        planType={commissionData.planType}
        typeOfPlan={commissionData.typeOfPlan}
        availableAmount={commissionData.availableAmount}
        hasSufficientBalance={commissionData.hasSufficientBalance}
        calculating={calculating}
        className="tw:mb-4"
        onBuyPlan={handleBuyPlan}
      />
    </div>
  );
};

export default PlatformFeeDisplay;
