import { produce } from "immer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import SellerCatalogService from "~/services/SellerCatalogService";
import PricingChannelCards from "~/shared/configs/components/pricing-channel-cards/PricingChannelCards";
import PricingSidePane from "~/shared/inventory/components/pricing-side-pane/PricingSidePane";
import type { PricingFilterKey } from "~/shared/inventory/components/pricing-side-pane/helper";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import Filter from "../list/components/Filter";
import RspAppliedFilter from "../list/components/RspAppliedFilter";
import type { FilterFormFields } from "../list/helper";
import DesktopView from "./components/DesktopView";
import type { InlinePriceResult } from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import MatchAllBanner from "./components/MatchAllBanner";
import MatchChips from "./components/MatchChips";
import MobileView from "./components/MobileView";
import SummaryCards from "./components/SummaryCards";
import type {
  ElectronicsChip,
  ElectronicsRow,
  ElectronicsSummary,
} from "./helper";
import {
  buildElectronicsRow,
  defaultBreadcrumbs,
  defaultPagination,
  getChipCounts,
  getCount,
  getData,
  getSummary,
  prepareFilters,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.PRICING"]);
}

// Column header -> the Sort By popover's `globalSort` value, so clicking a
// header sorts exactly the way the price sheet does (same mapping as the list).
const HEADER_SORT_TO_GLOBAL: Record<string, { asc: string; desc: string }> = {
  dealName: { asc: "name-asc", desc: "name-desc" },
  price: { asc: "price-asc", desc: "price-desc" },
};

// Reverse of the above — which header reads as sorted for the current value.
const GLOBAL_TO_HEADER_SORT: Record<
  string,
  { key: string; value: "asc" | "desc" }
> = {
  "name-asc": { key: "dealName", value: "asc" },
  "name-desc": { key: "dealName", value: "desc" },
  "price-asc": { key: "price", value: "asc" },
  "price-desc": { key: "price", value: "desc" },
};

/**
 * Electronics · CLUB match.
 *
 * A pricing channel of its own on Manage Price: the SKUs that carry an online
 * listing, with the CLUB price editable in place against what Amazon, Flipkart
 * and the other marketplaces are charging. Everything is B2C — the comparison
 * is against what a customer sees on those marketplaces.
 */
const Electronics = () => {
  const { isMobile } = useScreenView();

  const [searchParams, setSearchParams] = useSearchParams();

  // Same filter form as the price sheet, so the shared Filter block (search,
  // alpha row, inventory filter modal) works here unchanged. B2C only.
  const formMethods = useForm<FilterFormFields>({
    defaultValues: {
      dateRange: [],
      status: "",
      search: "",
      alpha: "",
      menu: [] as any[],
      category: [] as any[],
      brand: [] as any[],
      priceMode: "all",
      type: "customer",
      velocity: "All",
      stockStatus: "All",
      withoutStock: false,
      onlyOffers: false,
      keys: [] as string[],
      isFixedPrice: false,
      isPriceSlab: false,
      globalSort: "name",
      match: "all",
      pricingFilter: "all",
    },
  });

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [data, setData] = useState<ElectronicsRow[]>([]);
  const [summary, setSummary] = useState<ElectronicsSummary | null>(null);

  // Match chip — served by the API's root `type` filter
  // (aboveOnlinePrice / belowOnlinePrice), so it narrows the whole result set
  // and pages like any other filter. Lives in the URL alongside them.
  const [chip, setChip] = useState<ElectronicsChip>("all");

  // Totals per chip for the badges — fetched for all three regardless of which
  // one is active, so switching chips shows what is behind each.
  const [chipCounts, setChipCounts] = useState({
    all: 0,
    above: 0,
    winning: 0,
  });

  // Which pricing gap the theme-2 side pane is narrowing the list to.
  const [paneFilter, setPaneFilter] = useState<PricingFilterKey>("all");

  // Prices pushed into the inline editors by the match actions. Each entry
  // carries its own token so re-matching the same price still triggers a save.
  const [forced, setForced] = useState<
    Record<string, { price: number; token: number }>
  >({});

  // Full price config (margin mode, history, competitors) — opened from the
  // pencil inside the inline price field. B2C only, like the rest of the sheet.
  const [priceConfigModal, setPriceConfigModal] = useState<{
    show: boolean;
    dealId: string | null;
  }>({ show: false, dealId: null });

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const sortRef = useRef<SortProps | undefined>(undefined);

  // The sheet block — "Match all" scrolls here after narrowing to the losing
  // SKUs, so the rows it is talking about are the first thing on screen.
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Everything in the URL — the list refetches whenever a filter changes.
  const filterParamsKey = useMemo(
    () => new URLSearchParams(searchParams).toString(),
    [searchParams],
  );

  const buildParams = useCallback(
    () =>
      prepareFilters(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      ),
    [formMethods],
  );

  const applyFilter = useCallback(
    async (
      activeChip: ElectronicsChip = "all",
      gap: PricingFilterKey = "all",
    ) => {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: 1,
        startSlNo: 1,
        endSlNo: paginationRef.current.rowsPerPage,
      };

      setLoading(true);
      setData([]);

      try {
        const params = buildParams();
        const rows = await getData(params);
        setData(rows);
        setHasMoreData(rows.length >= paginationRef.current.rowsPerPage);

        // The stat strip reports on the same slice — a failure there must not
        // take the sheet down with it.
        getSummary(params)
          .then(setSummary)
          .catch((error) => {
            console.error("Error loading electronics summary:", error);
            setSummary(null);
          });

        // The match-chip badges and the cards above them report the online
        // slice as a whole, so they are counted without the gap. With a gap on,
        // the sheet's own total is the gap's count instead of a chip's.
        const { type: _gapType, ...baseParams } = params;
        const [counts, gapCount] = await Promise.all([
          getChipCounts(baseParams),
          gap === "all" ? Promise.resolve(0) : getCount(params, "all"),
        ]);
        setChipCounts(counts);
        paginationRef.current.totalRecords =
          gap === "all" ? counts[activeChip] : gapCount;
      } catch (error) {
        console.error("Error loading electronics prices:", error);
        setData([]);
        setHasMoreData(false);
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  // Pull the filter form back out of the URL, then fetch — the URL is the one
  // source of truth for what the sheet is showing.
  useEffect(() => {
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const brandId = searchParams.get("brandId");
    const brandName = searchParams.get("brandName");
    const menuId = searchParams.get("menuId");
    const menuName = searchParams.get("menuName");
    const companyName = searchParams.get("companyName");
    const status = searchParams.get("status");
    const velocity = searchParams.get("velocity");
    const stockStatus = searchParams.get("stockStatus");
    const alpha = searchParams.get("alpha");
    const withoutStock = searchParams.get("withoutStock");
    const onlyOffers = searchParams.get("onlyOffers");
    const isFixedPrice = searchParams.get("isFixedPrice");
    const globalSort = searchParams.get("globalSort");

    formMethods.setValue("search", search || "");

    if (globalSort) {
      formMethods.setValue("globalSort", globalSort);
    } else {
      formMethods.setValue(
        "globalSort",
        SellerCatalogService.getGlobalSortOptions()[0].value,
      );
    }

    if (categoryId && categoryName) {
      formMethods.setValue("category", [
        { label: categoryName, value: { id: categoryId, name: categoryName } },
      ]);
    } else {
      formMethods.setValue("category", []);
    }

    if (brandId && brandName) {
      formMethods.setValue("brand", [
        { label: brandName, value: { id: brandId, name: brandName } },
      ]);
    } else {
      formMethods.setValue("brand", []);
    }

    if (menuId && menuName) {
      formMethods.setValue("menu", [
        { label: menuName, value: { id: menuId, name: menuName } },
      ]);
    } else {
      formMethods.setValue("menu", []);
    }

    if (companyName) {
      formMethods.setValue("companyName", [
        { label: companyName, value: { id: companyName, name: companyName } },
      ]);
    } else {
      formMethods.setValue("companyName", []);
    }

    formMethods.setValue("status", status || "");
    formMethods.setValue("velocity", velocity || "All");
    formMethods.setValue("stockStatus", stockStatus || "All");
    formMethods.setValue("alpha", alpha || "");
    formMethods.setValue("withoutStock", withoutStock === "true");
    formMethods.setValue("onlyOffers", onlyOffers === "true");
    formMethods.setValue("isFixedPrice", isFixedPrice === "true");
    formMethods.setValue("type", "customer");

    // Pricing gap from the side pane — `unpriced` becomes the endpoint's root
    // `type=defaultToMrp`, `low-margin` becomes `type=lowMargin`, both on top
    // of this screen's `onlinePriceExist=true`. The root `type` holds one
    // filter, so a gap takes the match chips' slot and they stand down.
    const gapParam = searchParams.get("pricingFilter");
    const gap: PricingFilterKey =
      gapParam === "unpriced" || gapParam === "low-margin" ? gapParam : "all";
    setPaneFilter(gap);
    formMethods.setValue("pricingFilter", gap);

    // The chip is a server filter like any other, so it rides in the URL and
    // is read back here rather than kept only in component state.
    const nextChip = (
      gap === "all" ? searchParams.get("match") || "all" : "all"
    ) as ElectronicsChip;
    setChip(nextChip);
    // The chip is a filter-form field like any other — `prepareFilters` turns
    // it into the endpoint's root `type`.
    formMethods.setValue("match", nextChip);

    applyFilter(nextChip, gap);
  }, [filterParamsKey, formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const rows = await getData(buildParams());
      setData((prev) => [...prev, ...rows]);
      setHasMoreData(rows.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more electronics prices:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, chip, hasMoreData, loadingMore]);

  // Chip -> URL. The effect above turns the new URL back into a fetch, so the
  // chip resets pagination and refetches exactly like the filter block does.
  const handleChipSelect = useCallback(
    (next: ElectronicsChip) => {
      const params = new URLSearchParams(searchParams);
      if (next === "all") {
        params.delete("match");
      } else {
        params.set("match", next);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Filter block -> URL. The effect above turns the new URL back into a fetch.
  const handleFilterChange = useCallback(
    ({ formData }: { formData: any }) => {
      const params: any = {};
      if (formData.search) params.search = formData.search;
      if (formData.status && formData.status !== "")
        params.status = formData.status;
      if (formData.velocity && formData.velocity !== "All")
        params.velocity = formData.velocity;
      if (formData.stockStatus && formData.stockStatus !== "All")
        params.stockStatus = formData.stockStatus;
      if (formData.alpha) params.alpha = formData.alpha;
      if (formData.withoutStock) params.withoutStock = "true";
      if (formData.onlyOffers) params.onlyOffers = "true";
      if (formData.isFixedPrice) params.isFixedPrice = "true";

      if (formData.category && formData.category.length > 0) {
        params.categoryId = formData.category[0].value.id;
        params.categoryName = formData.category[0].label;
      }

      if (formData.brand && formData.brand.length > 0) {
        params.brandId = formData.brand[0].value.id;
        params.brandName = formData.brand[0].label;
      }

      if (formData.menu && formData.menu.length > 0) {
        params.menuId = formData.menu[0].value.id;
        params.menuName = formData.menu[0].label;
      }

      if (formData.companyName && formData.companyName.length > 0) {
        params.companyName = formData.companyName[0].label;
      }

      if (formData.globalSort) params.globalSort = formData.globalSort;

      // The chip is not part of the filter form, so carry it across rather
      // than letting a filter change silently reset it.
      const match = searchParams.get("match");
      if (match) params.match = match;

      // Same for the side pane's gap — a filter change must not clear it.
      const gap = searchParams.get("pricingFilter");
      if (gap) params.pricingFilter = gap;

      // Replace the current history entry instead of pushing a new one
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Column-header sort: translate the clicked column + direction into the
  // sheet's `globalSort` value so both sort mechanisms share one source.
  const handleSort = (sort: SortProps) => {
    const mapping = HEADER_SORT_TO_GLOBAL[sort.key];
    if (!mapping) return;

    const value = sort.value === "desc" ? mapping.desc : mapping.asc;
    formMethods.setValue("globalSort", value);
    sortRef.current = undefined;

    const next = new URLSearchParams(searchParams);
    next.set("globalSort", value);
    setSearchParams(next, { replace: true });
  };

  const activeHeaderSort =
    GLOBAL_TO_HEADER_SORT[searchParams.get("globalSort") || ""];

  /**
   * Re-derives one row from its new price. The comparison fields (winning /
   * above / labels) all hang off the price, so the row is rebuilt rather than
   * patched — the same path the list response takes.
   */
  const applyRowPrice = (dealId: string, price: number) =>
    setData(
      produce((draft) => {
        const index = draft.findIndex((row) => row._id === dealId);
        if (index === -1) return;
        draft[index] = buildElectronicsRow({
          ...draft[index],
          b2cPrice: price,
        });
      }),
    );

  // The editor owns the write and its own error toast; the screen only keeps
  // the row in sync once a price actually landed.
  const handlePriceResult = useCallback((result: InlinePriceResult) => {
    if (result.action !== "saved") return;
    applyRowPrice(result.dealId, result.price);
  }, []);

  const handleEdit = (row: ElectronicsRow) =>
    setPriceConfigModal({ show: true, dealId: row._id });

  // The modal owns the write; the sheet only re-derives the row it touched.
  const handlePriceConfigCallback = (action: {
    action: string;
    data?: any;
  }) => {
    setPriceConfigModal({ show: false, dealId: null });
    if (action.action === "update" && action.data?.dealId) {
      applyRowPrice(action.data.dealId, action.data.price || 0);
    }
    if (action.action === "create") {
      applyFilter(chip, paneFilter);
    }
  };

  const handleMatch = (row: ElectronicsRow) => {
    if (!row._lowestOnline) return;
    setForced((prev) => ({
      ...prev,
      [row._id]: {
        price: row._lowestOnline,
        token: (prev[row._id]?.token || 0) + 1,
      },
    }));
  };

  // ——— Derived ————————————————————————————————————————————————————

  /**
   * Takes the banner's count to the rows behind it: selects the "Above online"
   * chip and scrolls the sheet into view, so matching happens row by row on a
   * list that holds only the losing SKUs.
   */
  const handleMatchAll = () => {
    if (chip !== "above") handleChipSelect("above");

    // Next frame, so the chip's URL change has re-rendered before we scroll.
    requestAnimationFrame(() =>
      sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <>
      <AppHeader
        title="Electronics Price Match"
        showAudioNote={true}
        audioNoteTitle="Electronics Price Match"
        audioFeature="managePrice"
        sectionKey="catalog"
        activeTab="pricing"
        mobileLead="menu"
      />

      <div className="app-page tw:p-4 page-bg">
        <div className="section-layout">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="pricing"
                title="Manage Catalog"
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              <AppPaneMain className="tw:lg:col-span-12">
                <div className="hide-in-theme-2">
                  <AppBreadcrumbs data={defaultBreadcrumbs} />
                </div>

                {/* Same command bar as the price sheet — one edge-to-edge white
                    block holding the channel cards over the underline tab row,
                    with the filters folded in on mobile. */}
                <div className="pricing-command-bar tw:-mt-6 tw:md:mt-0">
                  {/* The tab row used to close the block off on desktop, so
                      the cards carry their own bottom padding now. */}
                  <div className="tw:px-4 tw:py-2 tw:md:py-3">
                    <PricingChannelCards
                      activeKey="electronics"
                      // Compact tab row on mobile; full cards from md up.
                      variant={isMobile ? "tab" : "card"}
                      // The underline tab row below is desktop-only, so on
                      // mobile the cards carry Trend watch as one more pill —
                      // without it, picking Electronics loses the view tabs
                      // entirely.
                      viewTab="sheet"
                    />
                  </div>

                  {isMobile && (
                    <div className="tw:border-t tw:border-gray-200 tw:px-4 tw:py-2">
                      <FormProvider {...formMethods}>
                        <Filter callback={handleFilterChange} />
                      </FormProvider>

                      {/* The gap and the match chips share the endpoint's
                          root `type`, so the chips stand down while a gap is
                          on rather than lying about what the sheet lists. */}
                      {paneFilter === "all" && (
                        <MatchChips
                          active={chip}
                          counts={chipCounts}
                          onSelect={handleChipSelect}
                          className="tw:mt-2"
                        />
                      )}
                    </div>
                  )}

                  {/* No tab row here — the channel cards above are the whole
                      switcher on the electronics sheet. */}
                </div>

                <div className="tw:hidden tw:md:block">
                  <SummaryCards
                    summary={summary}
                    winningCount={chipCounts.winning}
                    onlineCount={chipCounts.all}
                  />
                </div>

                {/* Desktop only — mobile leads with the price alert card. */}
                {/* "Match all" jumps to the above-online chip, which cannot
                    coexist with a gap on the root `type`. */}
                {paneFilter === "all" && (
                  <div className="tw:hidden tw:md:block">
                    <MatchAllBanner
                      count={chipCounts.above}
                      avgDropPct={0}
                      onMatchAll={handleMatchAll}
                    />
                  </div>
                )}

                {/* Filter block — its own compact card, separate from the sheet
                    below so the table reads as one uninterrupted surface. On
                    mobile it lives inside the command bar above. */}
                {!isMobile && (
                  <AppCard noPadding className="tw:mb-2">
                    <div className="tw:p-2">
                      <FormProvider {...formMethods}>
                        <Filter callback={handleFilterChange} />

                        {/* All / Above online / Winning — server-side filters.
                            Hidden while a side-pane gap owns the root `type`. */}
                        {paneFilter === "all" && (
                          <MatchChips
                            active={chip}
                            counts={chipCounts}
                            onSelect={handleChipSelect}
                            className="tw:mt-2"
                          />
                        )}

                        <RspAppliedFilter onFilterChange={handleFilterChange} />
                      </FormProvider>
                    </div>
                  </AppCard>
                )}

                {/* Count line sits between the filter card and the sheet, so
                    the filter block stays purely about filtering. Scroll target
                    for "Match all" — the margin clears the sticky header. */}
                <div ref={sheetRef} className="tw:mb-2 tw:scroll-mt-24">
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={data.length}
                    fwSize="sm"
                  />
                </div>

                {isMobile ? (
                  <MobileView
                    data={data}
                    loading={loading}
                    aboveCount={chipCounts.above}
                    forced={forced}
                    onPriceResult={handlePriceResult}
                    onMatch={handleMatch}
                    onEdit={handleEdit}
                    showLoadMore={hasMoreData}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={data.length}
                  />
                ) : (
                  // The table keeps its own sticky header and scroll
                  // container, so the card contributes no padding.
                  <AppCard noPadding className="tw:mb-0">
                    <DesktopView
                      data={data}
                      loading={loading}
                      forced={forced}
                      onPriceResult={handlePriceResult}
                      onMatch={handleMatch}
                      onEdit={handleEdit}
                      onSort={handleSort}
                      sortKey={activeHeaderSort?.key || ""}
                      sortValue={activeHeaderSort?.value || "asc"}
                      showLoadMore={hasMoreData && !loading}
                      loadingMore={loadingMore}
                      loadMore={loadMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                    />
                  </AppCard>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed list pane
                  beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <PricingSidePane
                  title="Electronics"
                  // The sheet is B2C over the online-listed SKUs, so the chip
                  // counts are taken over exactly that slice.
                  priceType="b2c"
                  onlinePriceExist
                  filter={paneFilter}
                  onFilterChange={setPaneFilter}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>

        <PriceConfigModal
          show={priceConfigModal.show}
          type="customer"
          dealId={priceConfigModal.dealId || undefined}
          callback={handlePriceConfigCallback}
        />
      </div>
    </>
  );
};

export default Electronics;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Electronics Price Match"),
    },
  ];
}
