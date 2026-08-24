import { useMemo, useState } from "react";
import { ScanLine } from "lucide-react";

import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";

import type { AiSuggestedProduct } from "../../helper";
import type { MatchedDealData } from "../matched-deal/MatchedDeal";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import ResultFacetChips from "./ResultFacetChips";
import ResultFilterChips from "./ResultFilterChips";
import {
  buildResultRows,
  EMPTY_FACETS,
  getResultChips,
  getResultFacets,
  matchesResultFacets,
  matchesResultFilter,
  type ResultFacetValue,
  type ResultFilter,
} from "./helper";

interface Props {
  matchedDeals: MatchedDealData[];
  skSuggested: MatchedDealData[];
  aiSuggested: AiSuggestedProduct[];
  onAdded?: () => void;
  onScanNext?: () => void;
  onCreateFromAi?: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * Every result of a scan in one place — SK AI suggestions, exact SK Library
 * matches, near matches and the seller's own items — with the source chips
 * deciding what is shown. Phones get cards, desktops the sortable table.
 */
const ScanResultsTable: React.FC<Props> = ({
  matchedDeals,
  skSuggested,
  aiSuggested,
  onAdded,
  onScanNext,
  onCreateFromAi,
  onImagePreview,
}) => {
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [facets, setFacets] = useState<ResultFacetValue>(EMPTY_FACETS);
  const { isMobile } = useScreenView();
  // theme-2 keeps the scanner input in reach, so the strip drops "Scan next".
  const isTheme2 = useTheme() === "theme-2";

  const rows = useMemo(
    () => buildResultRows({ matchedDeals, skSuggested, aiSuggested }),
    [matchedDeals, skSuggested, aiSuggested],
  );
  const chips = useMemo(() => getResultChips(rows), [rows]);

  // Brand/category options describe the current source bucket, so switching
  // sources rebuilds them — and drops a selection that no longer applies.
  const sourceRows = useMemo(
    () => rows.filter((row) => matchesResultFilter(row, filter)),
    [rows, filter],
  );
  const { brands, categories } = useMemo(
    () => getResultFacets(sourceRows),
    [sourceRows],
  );

  const onFilterChange = (next: ResultFilter) => {
    setFilter(next);
    setFacets(EMPTY_FACETS);
  };

  const visibleRows = useMemo(
    () => sourceRows.filter((row) => matchesResultFacets(row, facets)),
    [sourceRows, facets],
  );

  const body = (
    <>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-gray-100 tw:bg-gray-50">
        <ResultFilterChips
          chips={chips}
          value={filter}
          onChange={onFilterChange}
          className="tw:min-w-0 tw:flex-1"
        />
        {onScanNext && !isTheme2 && (
          <div className="tw:px-3 tw:py-2">
            <AppButton
              size="small"
              fill="outline"
              color="primary"
              onClick={onScanNext}
              className="tw:font-semibold"
            >
              <ScanLine className="tw:w-4 tw:h-4 tw:mr-1" />
              Scan next
            </AppButton>
          </div>
        )}
      </div>

      <ResultFacetChips
        brands={brands}
        categories={categories}
        value={facets}
        onChange={setFacets}
      />

      {isMobile ? (
        <MobileView
          rows={visibleRows}
          onAdded={onAdded}
          onCreateFromAi={onCreateFromAi}
          onImagePreview={onImagePreview}
        />
      ) : (
        <DesktopView
          rows={visibleRows}
          onAdded={onAdded}
          onCreateFromAi={onCreateFromAi}
          onImagePreview={onImagePreview}
        />
      )}
    </>
  );

  // Phones drop the card shell: the chip strip and the result rows run out of
  // the page gutter (`app-bleed-x`) so everything sits flush with the screen.
  if (isMobile)
    return (
      <div className="app-bleed-x tw:border-y tw:border-gray-100 tw:bg-white">
        {body}
      </div>
    );

  return (
    <AppCard noPadding className="tw:overflow-hidden">
      {body}
    </AppCard>
  );
};

export default ScanResultsTable;
