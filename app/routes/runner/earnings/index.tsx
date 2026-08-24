import { Info } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import RunnerHeader from "~/shared/runner/header/RunnerHeader";
import BonusStrip from "./components/bonus-strip/BonusStrip";
import DailyEarnings from "./components/daily-earnings/DailyEarnings";
import EarnMore from "./components/earn-more/EarnMore";
import EarningsBreakdown from "./components/earnings-breakdown/EarningsBreakdown";
import EarningsHero from "./components/earnings-hero/EarningsHero";
import PastPayouts from "./components/past-payouts/PastPayouts";
import TrustBond from "./components/trust-bond/TrustBond";
import { EARNINGS_HEADER } from "./helper";

/**
 * Runner earnings, inside the runner shell ({@link RunnerLayout}). The screen
 * runs from the least settled money to the most: the week in progress, then how
 * it was arrived at, then the weeks already in the bank, and finally what the
 * runner could still add.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerEarnings = () => {
  return (
    <>
      <RunnerHeader
        eyebrow={EARNINGS_HEADER.eyebrow}
        statusLbl={EARNINGS_HEADER.statusLbl}
        title={EARNINGS_HEADER.title}
        subtitle={EARNINGS_HEADER.subtitle}
      >
        <AppButton fill="clear" size="icon" className="runner-hero-icon-btn">
          <Info size={18} />
        </AppButton>
      </RunnerHeader>

      <EarningsHero />
      <DailyEarnings />
      <BonusStrip />
      <EarningsBreakdown />
      <PastPayouts />
      <TrustBond />
      <EarnMore />
    </>
  );
};

export default RunnerEarnings;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner earnings"),
    },
  ];
}
