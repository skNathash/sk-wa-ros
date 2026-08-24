import type { AiSuggestedProduct, ScanPhase } from "../helper";
import AiSearching from "./AiSearching";
import type { MatchedDealData } from "./matched-deal/MatchedDeal";
import MatchedDealSkeleton from "./matched-deal/MatchedDealSkeleton";
import NoMatch from "./matched-deal/NoMatch";
import ScanResultsTable from "./results/ScanResultsTable";

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
 * Phase-driven results area. Once a scan resolves, every source — exact SK
 * Library matches, near matches and AI extractions — lands in a single table
 * that the source chips filter.
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
  if (phase === "idle") return null;

  if (phase === "skSearching") return <MatchedDealSkeleton />;

  if (phase === "aiSearching")
    return <AiSearching barcode={lookedUpBarcode || ""} />;

  if (phase === "notFound")
    return (
      <NoMatch
        barcode={lookedUpBarcode || ""}
        onCreate={onCreateManual}
        onScanNext={onScanNext}
      />
    );

  // phase === "matched" | "suggestions"
  return (
    <ScanResultsTable
      matchedDeals={matchedDeals}
      skSuggested={skSuggested}
      aiSuggested={aiSuggested}
      onAdded={onAdded}
      onScanNext={onScanNext}
      onCreateFromAi={onCreateFromAi}
      onImagePreview={onImagePreview}
    />
  );
};

export default ScanResults;
