import { Search, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import FacetFilter from "~/shared/catalog/components/facet-filter/FacetFilter";
import type { FacetSelection } from "~/shared/catalog/components/facet-filter/modals/facet-filter/FacetFilterModal";
import { prepareLibraryParams } from "~/shared/catalog/components/catalog-signal-stats/helper";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import SearchModeSelector, {
  type SearchMode,
} from "~/shared/catalog/components/search-mode-selector/SearchModeSelector";

const SEARCH_PAGE = "/dashboard/inventory/subscribe/search";

// Facets are fetched off the typed term, so wait for a pause before asking.
const FACET_DEBOUNCE_MS = 400;

const EMPTY_SELECTION: FacetSelection = {
  menus: [],
  categories: [],
  brands: [],
};

/** Modes this page can open with. Barcode isn't one — it has a scanner page. */
const LAUNCHABLE_MODES: SearchMode[] = ["text", "image", "voice"];

const isLaunchableMode = (value: string | null): value is SearchMode =>
  !!value && LAUNCHABLE_MODES.includes(value as SearchMode);

/**
 * Entry point into catalog search from Discover. The mode picker doesn't search
 * in place — each mode captures a term (typed, photo, barcode, spoken) and
 * hands it to the search page, which owns the results.
 *
 * Text mode is the exception in one respect: the term is typed here, so the
 * brand/category facets for it are shown as chips below the input. Refining
 * before leaving the page means the results land already filtered.
 */
const SearchLauncher: React.FC = () => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const [searchParams] = useSearchParams();
  // The side pane launches Discover with the mode it was tapped with.
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<SearchMode>(
    isLaunchableMode(modeParam) ? modeParam : "text",
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [term, setTerm] = useState("");
  // Trails `term`; drives the facet fetch so every keystroke isn't a request.
  const [facetTerm, setFacetTerm] = useState("");
  const [selection, setSelection] = useState<FacetSelection>(EMPTY_SELECTION);
  const [librarySkus, setLibrarySkus] = useState(0);

  // Tapping a mode in the side pane while already on Discover only changes the
  // query param — the component stays mounted, so follow the param.
  useEffect(() => {
    if (isLaunchableMode(modeParam)) setMode(modeParam);
  }, [modeParam]);

  useEffect(() => {
    const id = setTimeout(() => setFacetTerm(term.trim()), FACET_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [term]);

  // Only for the placeholder — how many SKUs the typed term is searching over.
  useEffect(() => {
    let cancelled = false;

    InventorySubscribeService.getDealsCount(prepareLibraryParams())
      .then((response: any) => {
        if (cancelled) return;
        setLibrarySkus(response?.data?.data?.totalDeals || 0);
      })
      .catch(() => {
        // count is decorative; a failure just leaves the generic placeholder
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const goToSearch = (params: Record<string, any> = {}) =>
    appNav.to(SEARCH_PAGE, { tab: "search", ...params });

  const handleModeChange = (next: SearchMode) => {
    setMode(next);

    // Text keeps its input here; image and voice need a capture step, so they
    // stay too and show their action below. Barcode has a page of its own.
    if (next === "barcode") appNav.to("/dashboard/inventory/barcode-scan");
  };

  // The typed term plus whatever facet chips are picked, in the shape the
  // search page expects: ids/names comma-separated under menuId/menuName,
  // categoryId/categoryName and brandId/brandName (see its searchParams effect).
  const buildSearchParams = (search: string, facets: FacetSelection) => {
    const params: Record<string, string> = { search };

    const setMulti = (
      idKey: string,
      nameKey: string,
      items: { id: string; name: string }[],
    ) => {
      if (!items.length) return;
      params[idKey] = items.map((i) => i.id).join(",");
      params[nameKey] = items.map((i) => i.name).join(",");
    };

    setMulti("menuId", "menuName", facets.menus);
    setMulti("categoryId", "categoryName", facets.categories);
    setMulti("brandId", "brandName", facets.brands);

    return params;
  };

  const handleSearch = () => {
    const search = term.trim();
    if (!search) return;

    goToSearch(buildSearchParams(search, selection));
  };

  // A chip tap is a search of its own — hand the term and the picked
  // brand/category straight to the results page.
  const handleFacetApply = (a: { action: string; data?: FacetSelection }) => {
    if (a.action !== "apply" || !a.data) return;

    setSelection(a.data);

    const search = term.trim();
    if (!search) return;

    goToSearch(buildSearchParams(search, a.data));
  };

  const handleAiCallback = (data: { action: string; data?: any }) => {
    setShowAiModal(false);

    if (data.action !== "proceed" || !data.data?.length) return;

    const basicInfo = data.data[0]?.product_basic_info || {};
    const term = (
      basicInfo.product_name ||
      basicInfo.barcode ||
      data.data[0]?.barcode ||
      ""
    ).trim();

    if (term) goToSearch({ search: term });
  };

  const handleVoiceResult = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action !== "close" && action !== "scan") return;

    const keywords: string[] = Array.isArray(data?.keywords)
      ? data.keywords.filter(Boolean)
      : typeof data?.search === "string" && data.search
        ? [data.search]
        : [];

    if (keywords.length === 0) return;

    goToSearch({
      search: keywords[0],
      keys: keywords.join(","),
      via: "voice",
    });
  };

  const placeholder = librarySkus
    ? `Search ${librarySkus.toLocaleString("en-IN")} SK Library SKUs — try 'atta', 'amul butter', or 'colgate 200g'…`
    : "Search the SK Library — try 'atta', 'amul butter', or 'colgate 200g'…";

  // `app-bleed-x` makes the white block run edge to edge on theme-2 mobile;
  // on desktop it all reverts to the unboxed layout. `-mt-4` cancels the
  // chip strip's bottom margin and padding so the block sits flush under the tabs.
  return (
    <div className="app-bleed-x tw:-mt-4 tw:mb-5 tw:bg-white tw:md:mb-4 tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:md:mt-0 tw:md:bg-transparent tw:md:p-0 tw:md:shadow-none tw:md:ring-0">
      {/* Compact tiles on mobile, descriptive cards on larger screens. */}
      <SearchModeSelector
        value={mode}
        onChange={handleModeChange}
        template={isMobile ? 2 : 1}
        noColor
        primarySelected={isMobile}
      />

      {mode === "text" && (
        <>
          <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:focus-within:border-slate-300 tw:md:gap-3 tw:md:p-3">
            <Search
              size={20}
              className="tw:ml-1 tw:shrink-0 tw:text-slate-400 tw:md:ml-2"
            />

            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={placeholder}
              aria-label="Search the catalog"
              className="tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-transparent tw:text-sm tw:text-slate-800 tw:outline-none tw:placeholder:text-slate-400 tw:md:text-base"
            />

            {/* Photo-driven lookup, kept beside the input so the user doesn't
                have to switch modes to reach it. */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              title="Find a product from a photo"
              aria-label="Find a product from a photo"
              className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-lg tw:bg-violet-50 tw:text-violet-600 tw:transition-colors hover:tw:bg-violet-100"
            >
              <Sparkles size={18} />
            </button>

            <button
              type="button"
              onClick={handleSearch}
              disabled={!term.trim()}
              className="tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:bg-primary tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:transition-opacity disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
            >
              Search
            </button>
          </div>

          {/* Brand/category chips for the typed term. Renders nothing until
              there's a term and the facets come back. */}
          <FacetFilter
            search={facetTerm}
            selected={selection}
            callback={handleFacetApply}
          />
        </>
      )}

      {(mode === "image" || mode === "voice") && (
        <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:shadow-sm">
          <span className="tw:text-xs tw:text-slate-500">
            {mode === "image"
              ? "Upload a product photo and we'll pull out the name, MRP and barcode."
              : "Speak the product name in Kannada, Hindi or English."}
          </span>

          {mode === "image" ? (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="tw:cursor-pointer tw:rounded-md tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white"
            >
              Upload photo
            </button>
          ) : (
            <VoiceSearch callback={handleVoiceResult}>
              <span className="tw:inline-flex tw:items-center tw:rounded-md tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white">
                Start speaking
              </span>
            </VoiceSearch>
          )}
        </div>
      )}

      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handleAiCallback}
      />
    </div>
  );
};

export default SearchLauncher;
