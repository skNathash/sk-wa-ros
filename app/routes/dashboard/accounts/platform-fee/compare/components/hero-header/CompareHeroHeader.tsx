import React from "react";
import useScreenView from "~/hooks/useScreenView";
import type { BillingCycle } from "../helper";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";

interface CompareHeroHeaderProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

const CompareHeroHeader: React.FC<CompareHeroHeaderProps> = ({
  billingCycle,
  onBillingCycleChange,
}) => {
  const { isMobile } = useScreenView();

  return isMobile ? (
    <MobileView
      billingCycle={billingCycle}
      onBillingCycleChange={onBillingCycleChange}
    />
  ) : (
    <DesktopView
      billingCycle={billingCycle}
      onBillingCycleChange={onBillingCycleChange}
    />
  );
};

export default CompareHeroHeader;
