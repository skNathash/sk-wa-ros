import { useState } from "react";

import AppCard from "~/components/core/card/AppCard";
import useScreenView from "~/hooks/useScreenView";
import type { AiSuggestedProduct, ScanPhase } from "../helper";
import AiSearching from "./AiSearching";
import DealFilters, {
  matchesDealFilter,
  type DealFilterValue,
} from "./matched-deal/DealFilters";
import DesktopView from "./matched-deal/DesktopView";
import MatchedDeal, { type MatchedDealData } from "./matched-deal/MatchedDeal";
import MatchedDealSkeleton from "./matched-deal/MatchedDealSkeleton";
import NoMatch from "./matched-deal/NoMatch";
import AiSuggestedDeals from "./suggestions/AiSuggestedDeals";
import SkSuggestedDeals from "./suggestions/SkSuggestedDeals";

export interface ScanResultsProps {
  phase: ScanPhase;
  lookedUpBarcode: string | null;
  matchedDeals: MatchedDealData[];
  skSuggested: any[];
  aiSuggested: AiSuggestedProduct[];
  onAdded: () => void;
  onScanNext: () => void;
  onCreateFromAi: (product: AiSuggestedProduct) => void;
  onCreateManual: () => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * Phase-driven results area shared by MobileView and DesktopView.
 * idle is rendered by the views themselves (each has its own empty state).
 */
const ScanResults: React.FC<ScanResultsProps> = ({
  phase,
  lookedUpBarcode,
  matchedDeals,
  skSuggested,
  aiSuggested,
  onAdded,
  onScanNext,
  onCreateFromAi,
  onCreateManual,
  onImagePreview,
}) => {
  const { isMobile } = useScreenView();
  const [dealFilter, setDealFilter] = useState<DealFilterValue>({
    brand: null,
    category: null,
  });

  if (phase === "idle") return null;

  if (phase === "skSearching") return <MatchedDealSkeleton />;

  if (phase === "aiSearching")
    return <AiSearching barcode={lookedUpBarcode || ""} />;

  if (phase === "matched") {
    if (!isMobile && matchedDeals.length > 1)
      return (
        <DesktopView
          deals={matchedDeals}
          onAdded={onAdded}
          onScanNext={onScanNext}
          onImagePreview={onImagePreview}
        />
      );

    const visibleDeals = matchedDeals.filter((deal) =>
      matchesDealFilter(deal, dealFilter),
    );

    return (
      <div className="tw:flex tw:flex-col tw:gap-3">
        {matchedDeals.length > 1 && (
          <AppCard noPadding className="tw:overflow-hidden">
            <DealFilters
              deals={matchedDeals}
              value={dealFilter}
              onChange={setDealFilter}
            />
          </AppCard>
        )}

        {visibleDeals.length === 0 ? (
          <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-gray-200 tw:bg-white tw:px-4 tw:py-6 tw:text-center tw:text-xs tw:text-gray-400">
            No products match the selected filters
          </div>
        ) : (
          visibleDeals.map((deal) => (
            <MatchedDeal
              key={deal._id}
              deal={deal}
              onAdded={onAdded}
              onScanNext={onScanNext}
              onImagePreview={onImagePreview}
            />
          ))
        )}
      </div>
    );
  }

  if (phase === "notFound")
    return (
      <NoMatch
        barcode={lookedUpBarcode || ""}
        onCreate={onCreateManual}
        onScanNext={onScanNext}
      />
    );

  // phase === "suggestions"
  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <AiSuggestedDeals
        items={aiSuggested}
        onCreate={onCreateFromAi}
        onImagePreview={onImagePreview}
      />
      <SkSuggestedDeals
        items={skSuggested}
        onScanNext={onScanNext}
        onImagePreview={onImagePreview}
      />
    </div>
  );
};

export default ScanResults;
