import { Rocket } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";

type Props = {
  className?: string;
};

/**
 * Onboarding strip for a first-time franchise — shown only while
 * `analytics.totalSubscribedDeals` is 0, i.e. nothing has ever been subscribed.
 * The subscribe flows bump that counter locally and fire `subscribe-success`,
 * so the banner disappears as soon as the first deal lands.
 */
const FirstDealBanner: React.FC<Props> = ({ className = "" }) => {
  const appNav = useAppNav();
  const [subscribedDeals, setSubscribedDeals] = useState<number>(() =>
    AuthService.getTotalSubscribedDeals(),
  );

  useEffect(() => {
    const refresh = () => setSubscribedDeals(AuthService.getTotalSubscribedDeals());

    document.addEventListener("subscribe-success", refresh);
    return () => document.removeEventListener("subscribe-success", refresh);
  }, []);

  if (subscribedDeals > 0) {
    return null;
  }

  return (
    <InfoBlock bordered size="sm" className={`tw:mb-4 ${className}`}>
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:gap-3">
        <div className="tw:flex tw:flex-1 tw:items-start tw:gap-2">
          <Rocket size={20} className="tw:mt-0.5 tw:text-blue-600" />
          <div className="tw:flex-1">
            <div className="tw:font-semibold">
              Your catalog is empty — subscribe your first deal
            </div>
            <div className="tw:text-xs tw:text-slate-500">
              Pick the products you want to sell and subscribe to them. Billing,
              stock and orders unlock once your first deal is in.
            </div>
          </div>
        </div>
        <div>
          <AppButton
            size="small"
            className="tw:w-full tw:sm:w-auto"
            onClick={() =>
              appNav.to("/dashboard/inventory/subscribe/search?tab=search")
            }
          >
            Browse deals
          </AppButton>
        </div>
      </div>
    </InfoBlock>
  );
};

export default FirstDealBanner;
