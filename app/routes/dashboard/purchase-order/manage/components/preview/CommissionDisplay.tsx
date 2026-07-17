import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";

interface CommissionDisplayProps {
  deals: Array<any>;
  callback?: (data: { action: string; data: any }) => void;
}

const CommissionDisplay = ({ deals, callback }: CommissionDisplayProps) => {
  const appNav = useAppNav();
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(0);
  const [planName, setPlanName] = useState<string>("");
  const [planType, setPlanType] = useState<string>("");
  const [typeOfPlan, setTypeOfPlan] = useState<string>("");
  const [availableAmount, setAvailableAmount] = useState<number>(0);
  const [hasSufficientBalance, setHasSufficientBalance] =
    useState<boolean>(true);
  const [calculating, setCalculating] = useState(false);

  const handleBuyPlan = () => {
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  useEffect(() => {
    const calculateCommission = async () => {
      if (!deals || deals.length === 0) {
        setCommissionAmount(0);
        setCommissionPercentage(0);
        setPlanName("");
        setPlanType("");
        setTypeOfPlan("");
        setAvailableAmount(0);
        setHasSufficientBalance(true);
        return;
      }

      setCalculating(true);

      try {
        // Build payload expected by the endpoint
        const dealsPayload: any[] = [];

        deals.forEach((deal) => {
          // Add main product
          dealsPayload.push({
            dealId: deal._id,
            quantity: deal.quantity,
            mrp: deal.mrp,
            purchasePrice: deal.purchasePrice,
          });

          // Add variations if any
          const variations = deal.formData?.variations || [];
          variations.forEach((variation: any) => {
            dealsPayload.push({
              dealId: deal._id,
              quantity: variation.formData?.qty || 0,
              mrp: variation.formData?.mrp || deal.mrp || 0,
              purchasePrice:
                variation.formData?.purchasePrice || deal.purchasePrice || 0,
            });
          });
        });

        const payload = {
          deals: dealsPayload,
        };

        const result = await FranchiseService.getChargeByDeal(payload);
        setCommissionAmount(result.commissionAmount);
        setCommissionPercentage(result.commissionPercentage);
        setPlanName(result.planName);
        setPlanType(result.planType);
        setTypeOfPlan(result.typeOfPlan);
        setAvailableAmount(result.availableAmount);
        setHasSufficientBalance(result.hasSufficientBalance);

        // Trigger callback with balance sufficiency
        if (callback) {
          callback({
            action: "balance_check",
            data: { hasSufficientBalance: result.hasSufficientBalance },
          });
        }
      } catch (err) {
        console.error("Error calculating commission:", err);
        setCommissionAmount(0);
        setCommissionPercentage(0);
        setPlanName("");
        setPlanType("");
        setTypeOfPlan("");
        setAvailableAmount(0);
        setHasSufficientBalance(false);

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

    calculateCommission();
  }, [deals, callback]);

  if (!commissionAmount && !calculating) {
    return null; // Don't show anything if no commission charges to apply
  }

  return (
    <PlatformFeeInfo
      commissionAmount={commissionAmount}
      commissionPercentage={commissionPercentage}
      planName={planName}
      planType={planType}
      typeOfPlan={typeOfPlan}
      availableAmount={availableAmount}
      hasSufficientBalance={hasSufficientBalance}
      calculating={calculating}
      onBuyPlan={handleBuyPlan}
    />
  );
};

export default CommissionDisplay;
