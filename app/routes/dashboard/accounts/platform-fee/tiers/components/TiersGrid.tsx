import React from "react";
import useScreenView from "~/hooks/useScreenView";
import { Skeleton } from "~/components/ui/skeleton";
import PlanCardMobile from "~/shared/accounts/platform-fee/plan-card/PlanCardMobile";
import type { TierCardData } from "./helper";
import TierCard from "./TierCard";

interface TiersGridProps {
  tiers: TierCardData[];
  loading?: boolean;
  onPickTier?: (tier: TierCardData) => void;
}

/** Placeholder count while the tiers of the selected shape load. */
const SKELETON_COUNT = 3;

const TiersGrid: React.FC<TiersGridProps> = ({
  tiers,
  loading,
  onPickTier,
}) => {
  const { isMobile } = useScreenView();

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton
              key={index}
              className={
                isMobile
                  ? "tw:h-[24rem] tw:rounded-2xl"
                  : "tw:h-[30rem] tw:rounded-3xl"
              }
            />
          ))
        : tiers.map((tier) =>
            isMobile ? (
              <PlanCardMobile
                key={tier.id}
                data={tier}
                buttonLabel={tier.buttonLabel}
                onPick={() => onPickTier?.(tier)}
              />
            ) : (
              <TierCard key={tier.id} tier={tier} onPickTier={onPickTier} />
            ),
          )}
    </div>
  );
};

export default TiersGrid;
