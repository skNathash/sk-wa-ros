import { debounce } from "lodash";
import { MapPin, Search } from "lucide-react";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import { Input } from "~/components/ui/input";
import useAppNav from "~/hooks/useAppNav";
import DistanceChooser from "./DistanceChooser";

/**
 * Unified search band for the catalog list pages (reorder, feature data
 * points) — one rounded surface holding the search field, voice input, the
 * area chooser and the sellers shortcut, matching the browse-network hero
 * search. On mobile the band sticks under the section tabs with a primary
 * fill; on desktop it sits in normal page flow.
 *
 * Must be rendered inside a `FormProvider` holding a `search` field. Typing
 * writes `search` into the query params (the pages re-fetch off them), while
 * the params the page navigated in with — `key`, `distance`, `from` — are preserved.
 */
const CatalogSearchBar = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [searchParams, setSearchParams] = useSearchParams();

  const { register, getValues, setValue } = useFormContext();

  const handleFilterChange = () => {
    const params: Record<string, string> = {};

    // Data-point key — only present on the feature list page.
    const key = searchParams.get("key");
    if (key) params.key = key;

    const search = String(getValues().search || "").trim();
    if (search) params.search = search;

    const distance = searchParams.get("distance");
    if (distance) params.distance = distance;

    // Preserve Compare-tab origin so the section tab stays highlighted.
    const from = searchParams.get("from");
    if (from) params.from = from;

    setSearchParams(params);
  };

  const debounceSearch = useCallback(
    debounce(() => {
      handleFilterChange();
    }, 500),
    [handleFilterChange],
  );

  // `register` owns the change handler; keep it and run the debounced fetch
  // after it so the form value is written before the params are rebuilt.
  const { onChange: registerOnChange, ...searchField } = register("search");

  const handleVoiceSearchCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if ((action !== "close" && action !== "scan") || !data) return;

    let searchValue = "";
    if (Array.isArray(data.keywords)) {
      searchValue = data.keywords.filter(Boolean)[0] || "";
    } else if (typeof data.search === "string") {
      searchValue = data.search;
    }

    if (searchValue) {
      setValue("search", searchValue);
      handleFilterChange();
    }
  };

  const handleDiscoverSellers = () => {
    const distance = searchParams.get("distance");
    appNav.to(
      "/products/buy-from-other-retailer/retailers",
      distance ? { distance } : {},
    );
  };

  return (
    // Sticky + primary fill on mobile only — pins under the section tabs
    // while scrolling; desktop stays in normal flow (matches browse main).
    <div className="search-sticky search-sticky-primary tw:mb-3 tw:sticky tw:top-29 tw:z-10 tw:bg-primary tw:px-4 tw:py-3.5 tw:md:static tw:md:bg-transparent tw:md:m-0 tw:md:p-0">
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-1.5 tw:shadow-[0_1px_2px_rgba(16,24,40,0.04)] tw:sm:gap-2 tw:sm:p-2">
        <div className="tw:group tw:relative tw:min-w-0 tw:flex-1">
          <div className="tw:absolute tw:left-2 tw:top-1/2 tw:z-10 tw:-translate-y-1/2 tw:pointer-events-none tw:text-gray-400 tw:group-focus-within:text-primary tw:transition-colors tw:sm:left-2.5">
            <Search size={16} />
          </div>
          <Input
            {...searchField}
            type="text"
            autoComplete="off"
            placeholder={t("searchProducts", {
              defaultValue: "Search products across the network",
            })}
            onChange={(e) => {
              registerOnChange(e);
              debounceSearch();
            }}
            className="tw:h-9 tw:border-0 tw:bg-transparent tw:shadow-none tw:rounded-xl tw:pl-8 tw:pr-10 tw:text-[14px] tw:placeholder:text-gray-400 tw:focus-visible:ring-0 tw:sm:pl-9"
          />
          <div className="tw:absolute tw:right-0.5 tw:top-1/2 tw:z-10 tw:-translate-y-1/2">
            <VoiceMic
              callback={handleVoiceSearchCallback}
              className="tw:h-8 tw:w-8 tw:rounded-lg tw:bg-transparent tw:text-gray-500 tw:hover:bg-gray-100 tw:hover:scale-100"
              size={16}
            />
          </div>
        </div>

        <span
          aria-hidden
          className="tw:hidden tw:sm:block tw:h-7 tw:w-px tw:shrink-0 tw:bg-gray-200"
        />

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:pr-0.5 tw:sm:gap-2">
          <DistanceChooser variant="inline" />
          <button
            type="button"
            onClick={handleDiscoverSellers}
            title="Sellers near you"
            className="tw:h-9 tw:w-9 tw:sm:w-auto tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5 tw:px-0 tw:sm:px-3.5 tw:rounded-full tw:sm:rounded-xl tw:bg-primary tw:text-primary-foreground tw:text-sm tw:font-medium tw:hover:bg-primary/90 tw:transition-colors tw:whitespace-nowrap tw:shrink-0"
          >
            <MapPin className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
            <span className="tw:hidden tw:md:inline">Sellers near you</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogSearchBar;
