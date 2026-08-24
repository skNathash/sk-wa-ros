import { debounce } from "lodash";
import { Search, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import { useCatalogOverviewCounts } from "~/shared/catalog/components/supply-catalog-pane/CatalogOverview";
import SupplyCatalogPane from "~/shared/catalog/components/supply-catalog-pane/SupplyCatalogPane";
import SupplyCatalogSectionTabs from "~/shared/catalog/components/supply-catalog-section-tabs/SupplyCatalogSectionTabs";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import CommonService from "~/services/CommonService";
import { ASSET, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import DistanceChooser from "../components/DistanceChooser";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import TopSellers from "../components/top-sellers/TopSellers";
import TrySearches from "../components/TrySearches";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import { getCount, getData, prepareParams } from "./helper";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import FacetFilter from "~/shared/catalog/components/facet-filter/FacetFilter";
import type { FacetSelection } from "~/shared/catalog/components/facet-filter/modals/facet-filter/FacetFilterModal";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/main" } },
  { label: "Search" },
];

// Static filter chips — real filtering wired up later.
// Discovery chips — shown only while the search box is empty; once a term is
// typed the facet filters take over this row.
const FILTER_CHIPS: { key: string; label: string; icon?: React.ReactNode }[] = [
  { key: "trending", label: "Trending" },
  { key: "best-price", label: "Best price" },
  {
    key: "new-launches",
    label: "New launches",
    icon: <Sparkles size={14} className="tw:text-amber-500" />,
  },
];

const ProductCardSkeleton = () => (
  <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:space-y-4">
    <Skeleton className="tw:h-32 tw:w-full" />
    <Skeleton className="tw:h-4 tw:w-3/4" />
    <Skeleton className="tw:h-4 tw:w-1/2" />
    <Skeleton className="tw:h-4 tw:w-1/4" />
    <Skeleton className="tw:h-8 tw:w-full" />
  </div>
);

const BuyFromOtherRetailerProductsSearchPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDistanceParam = searchParams.get("distance");
  const modalDistance: any =
    rawDistanceParam == null
      ? DEFAULT_BROWSE_DISTANCE
      : rawDistanceParam === "all"
        ? "all"
        : Number(rawDistanceParam);
  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: searchParams.get("search") || "",
    },
  });

  const [activeChip, setActiveChip] = useState<string>(
    searchParams.get("chip") || "",
  );
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({
    dealId: "",
    show: false,
  });

  // Counts for the theme-2 side-pane categories list.
  const { counts, countsLoading } = useCatalogOverviewCounts(modalDistance);

  const [showAiModal, setShowAiModal] = useState(false);
  const [searchedViaAI, setSearchedViaAI] = useState(false);
  const [lastAiPayload, setLastAiPayload] = useState<{
    results: any[];
    images: Array<{ id: string }>;
  }>({ results: [], images: [] });

  const handleBuyNow = useCallback((data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }
  }, []);

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      } else if (data.action === "select") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    [],
  );

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<{
    search?: string;
    menuId?: string;
    categoryId?: string;
    brandId?: string;
    chip?: string;
  }>({ search: "" });

  // Tracks the menu/category/brand ids applied via the (search-driven) facet
  // filter. Clearing the search removes only these.
  const facetSelectedRef = useRef<{
    menus: string[];
    categories: string[];
    brands: string[];
  }>({ menus: [], categories: [], brands: [] });

  useEffect(() => {
    const search = searchParams.get("search") || "";
    filterRef.current = {
      search,
      menuId: searchParams.get("menuId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      brandId: searchParams.get("brandId") || undefined,
      chip: searchParams.get("chip") || undefined,
    };
    const chip = searchParams.get("chip") || "";
    setActiveChip(chip);
    setValue("search", search);
    // A discovery chip browses the network on its own, so it drives the fetch
    // just like a typed search term does.
    if (search || chip) {
      applyFilter();
    } else {
      setProducts([]);
      setLoading(false);
      setHasMoreData(false);
    }
  }, [searchParams]);

  // If redirected with AI image ids and optional search keyword, process them
  useEffect(() => {
    const aiImageIds = searchParams.get("ai_image_ids") || "";
    const aiSearch =
      searchParams.get("ai_search") || searchParams.get("search") || "";
    if (!aiImageIds) return;

    const ids = aiImageIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    const fetchAiInfo = async () => {
      setLoading(true);
      try {
        const urls = ids.map((id) => `${ASSET}/${id}?size=400`);
        const results = await CommonService.getAiImgInfo(urls);
        const data = results.data?.data || results.data;
        const normalizedData = Array.isArray(data) ? data : [data];

        setLastAiPayload({
          results: normalizedData,
          images: ids.map((id) => ({ id })),
        });

        if (aiSearch) {
          setValue("search", aiSearch);
          setSearchedViaAI(true);
          try {
            applyFilter();
          } catch (e) {
            // applyFilter is also triggered by searchParams change
          }
        }
      } catch (err) {
        console.error("AI image processing failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAiInfo();
  }, [searchParams]);

  const debounceSearch = useCallback(
    debounce(() => {
      // Clear AI-search indicator when user types manually
      setSearchedViaAI(false);
      const term = (getValues("search") || "").trim();
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev.toString());
          if (term) {
            newParams.set("search", term);
          } else {
            newParams.delete("search");
            // Clearing the search also drops the facet filters and active chip
            // so stale selections don't narrow an empty query.
            newParams.delete("menuId");
            newParams.delete("menuName");
            newParams.delete("categoryId");
            newParams.delete("categoryName");
            newParams.delete("brandId");
            newParams.delete("brandName");
            newParams.delete("chip");
            facetSelectedRef.current = {
              menus: [],
              categories: [],
              brands: [],
            };
          }
          return newParams;
        },
        { replace: true },
      );
    }, 500),
    [setSearchParams],
  );

  const handleVoiceCallback = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if ((action === "close" || action === "scan") && data) {
        let searchValue = "";
        if (data.keywords && Array.isArray(data.keywords)) {
          const arr = data.keywords.filter(Boolean);
          if (arr.length > 0) searchValue = arr[0];
        } else if (data.search && typeof data.search === "string") {
          searchValue = data.search;
        }

        if (searchValue) {
          setValue("search", searchValue);
          setSearchParams(
            (prev) => {
              const newParams = new URLSearchParams(prev.toString());
              newParams.set("search", searchValue);
              return newParams;
            },
            { replace: true },
          );
        }
      }
    },
    [setValue, setSearchParams],
  );

  // Apply menu/category/brand selections from the facet filter (inline chips and
  // the "More" modal) by writing them onto the URL query params. The read-effect
  // on [searchParams] rehydrates the filter ref and re-runs the fetch.
  const handleFacetApply = useCallback(
    (payload: { action: string; data?: FacetSelection }) => {
      if (payload.action !== "apply" || !payload.data) return;

      const { menus, categories, brands } = payload.data;
      const next: Record<string, string> = {
        ...Object.fromEntries(searchParams.entries()),
      };

      const setMulti = (
        idKey: string,
        nameKey: string,
        items: { id: string; name: string }[],
      ) => {
        if (items.length) {
          next[idKey] = items.map((i) => i.id).join(",");
          next[nameKey] = items.map((i) => i.name).join(",");
        } else {
          delete next[idKey];
          delete next[nameKey];
        }
      };

      setMulti("menuId", "menuName", menus);
      setMulti("categoryId", "categoryName", categories);
      setMulti("brandId", "brandName", brands);

      facetSelectedRef.current = {
        menus: menus.map((m) => m.id),
        categories: categories.map((c) => c.id),
        brands: brands.map((b) => b.id),
      };

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const facetSelection = useMemo<FacetSelection>(() => {
    const toSel = (ids: string | null, names: string | null) => {
      if (!ids) return [];
      const idList = ids.split(",");
      const nameList = (names || "").split(",");
      return idList.map((id, i) => ({ id, name: nameList[i] || "" }));
    };
    return {
      menus: toSel(searchParams.get("menuId"), searchParams.get("menuName")),
      categories: toSel(
        searchParams.get("categoryId"),
        searchParams.get("categoryName"),
      ),
      brands: toSel(searchParams.get("brandId"), searchParams.get("brandName")),
    };
  }, [searchParams]);

  const handleRemoveFacet = useCallback(
    (group: keyof FacetSelection, item: { id: string; name: string }) => {
      const prefixMap = {
        menus: "menu",
        categories: "category",
        brands: "brand",
      };
      const prefix = prefixMap[group];
      const nextParams = new URLSearchParams(searchParams.toString());
      const ids = (nextParams.get(`${prefix}Id`) || "")
        .split(",")
        .filter(Boolean);
      const names = (nextParams.get(`${prefix}Name`) || "").split(",");
      const idx = ids.indexOf(item.id);
      if (idx !== -1) {
        ids.splice(idx, 1);
        names.splice(idx, 1);
      }
      if (ids.length) {
        nextParams.set(`${prefix}Id`, ids.join(","));
        nextParams.set(`${prefix}Name`, names.join(","));
      } else {
        nextParams.delete(`${prefix}Id`);
        nextParams.delete(`${prefix}Name`);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const appliedChips = useMemo(
    () => [
      ...facetSelection.menus.map((item) => ({
        group: "menus" as const,
        ...item,
      })),
      ...facetSelection.categories.map((item) => ({
        group: "categories" as const,
        ...item,
      })),
      ...facetSelection.brands.map((item) => ({
        group: "brands" as const,
        ...item,
      })),
    ],
    [facetSelection],
  );

  // Results (and the fetch above) are driven by either a typed term or an
  // active discovery chip; with neither we stay on the discovery content.
  const hasQuery = Boolean(
    searchParams.get("search") || searchParams.get("chip"),
  );

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const distance = searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
      const totalRecords = await getCount(params, distance);
      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params, distance);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const distance = searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
      const productsData = await getData(params, distance);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleAiModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "close") {
        setShowAiModal(false);
        return;
      }

      if (data.action === "proceed" && data.data && data.data.length > 0) {
        setLastAiPayload({
          results: data.data || [],
          images:
            (data as any).images && Array.isArray((data as any).images)
              ? (data as any).images
              : [],
        });

        const productData = data.data[0];
        const basicInfo = productData?.product_basic_info || {};
        const searchTerm = (basicInfo.product_name || "").toString().trim();

        if (searchTerm) {
          setValue("search", searchTerm);
          setSearchParams(
            (prev) => {
              const newParams = new URLSearchParams(prev.toString());
              newParams.set("search", searchTerm);
              return newParams;
            },
            { replace: true },
          );
          setSearchedViaAI(true);
          try {
            applyFilter();
          } catch (e) {
            // applyFilter is also triggered by searchParams change
          }
        }

        setShowAiModal(false);
      }
    },
    [setSearchParams, setValue, applyFilter],
  );

  return (
    <>
      <AppHeader title="Search" showRecordPayment={false} />
      <div className="page-bg app-page tw:p-4">
        <SupplyCatalogSectionTabs />

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="browse"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            {/* <BuyFromNetworkTab activeTab="products" className="tw:mb-4" /> */}

            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0!">
                {/* Sticky search + filters block — white background so it stays
              legible over scrolling product content. */}
                {/* The `-mt-4` cancels the page's 1rem top gutter so the bar
                    sits flush under the header. It must be `!` — the column's
                    `space-y-0!` sets `margin-block-start: 0 !important` on
                    every child, which would otherwise win and leave a
                    page-bg band between the header and the bar. */}
                <div className="tw:sticky tw:top-0 tw:z-20 tw:-mx-4 tw:md:-mt-4! tw:px-4 tw:py-3 tw:bg-white tw:shadow-sm">
                  <div className="tw:flex tw:items-center tw:gap-3">
                    {/* Search field — the hero of this row. Taller, softly filled and
                rounded so it reads as the primary target; the inline voice / AI
                triggers stay visually quiet beside it. */}
                    <div className="tw:group tw:relative tw:flex-1 tw:min-w-0">
                      <div className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:pointer-events-none tw:text-gray-400 tw:group-focus-within:text-primary tw:transition-colors">
                        <Search size={16} />
                      </div>
                      <Input
                        type="text"
                        placeholder="Search products across the network"
                        autoComplete="off"
                        autoFocus
                        className="app-search-field tw:h-9 tw:rounded-xl tw:bg-gray-50 tw:pl-10 tw:pr-[5.5rem] tw:text-[14px] tw:placeholder:text-gray-400 tw:transition-colors tw:hover:bg-white tw:focus:bg-white"
                        {...register("search")}
                        onChange={(e) => {
                          register("search").onChange(e);
                          debounceSearch();
                        }}
                      />
                      <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:flex tw:items-center tw:gap-1">
                        <VoiceMic
                          callback={handleVoiceCallback}
                          className="tw:h-7 tw:w-7"
                          size={14}
                        />
                        <span
                          aria-hidden
                          className="tw:h-4 tw:w-px tw:bg-gray-200"
                        />
                        {/* AI search */}
                        <button
                          onClick={() => setShowAiModal(true)}
                          className="tw:inline-flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:hover:bg-primary/10 tw:transition-colors tw:cursor-pointer"
                          aria-label="AI search"
                          title="Search with AI"
                        >
                          <ImgRender
                            src="ai/sk-ai.png"
                            alt="AI"
                            className="tw:h-5 tw:w-5"
                          />
                        </button>
                      </div>
                    </div>
                    {/* Distance filter */}
                    <div className="tw:flex tw:items-center tw:shrink-0">
                      <DistanceChooser
                        selectedDistance={
                          searchParams.get("distance") || undefined
                        }
                      />
                    </div>
                  </div>
                  {/* Filter chips — reusable FilterChipGroup with smaller FilterChip size. */}
                  {!searchParams.get("search") && (
                    <FilterChipGroup className="tw:mt-3 tw:-mx-4 tw:px-4">
                      {FILTER_CHIPS.map((chip) => (
                        <FilterChip
                          key={chip.key}
                          active={activeChip === chip.key}
                          size="sm"
                          leadingIcon={chip.icon}
                          onClick={() => {
                            const isActive = activeChip === chip.key;
                            setActiveChip(isActive ? "" : chip.key);
                            setSearchParams(
                              (prev) => {
                                const newParams = new URLSearchParams(
                                  prev.toString(),
                                );
                                if (isActive) {
                                  newParams.delete("chip");
                                } else {
                                  newParams.set("chip", chip.key);
                                }
                                return newParams;
                              },
                              { replace: true },
                            );
                          }}
                        >
                          {chip.label}
                        </FilterChip>
                      ))}
                    </FilterChipGroup>
                  )}
                  {!searchParams.get("search") && (
                    <TrySearches className="tw:mt-3" />
                  )}
                </div>

                {/* Facet filters derived from the current search term */}
                {searchParams.get("search") && (
                  <>
                    <FacetFilter
                      key={
                        searchParams.get("search")
                          ? "facet-active"
                          : "facet-empty"
                      }
                      search={searchParams.get("search") || ""}
                      source="network"
                      distance={modalDistance}
                      selected={facetSelection}
                      callback={handleFacetApply}
                    />
                    {appliedChips.length > 0 && (
                      <FilterChipGroup className="tw:mt-2">
                        {appliedChips.map((chip) => (
                          <FilterChip
                            key={`${chip.group}-${chip.id}`}
                            active
                            size="sm"
                            trailingIcon={<X size={14} />}
                            onClick={() => handleRemoveFacet(chip.group, chip)}
                          >
                            {chip.name}
                          </FilterChip>
                        ))}
                      </FilterChipGroup>
                    )}
                  </>
                )}

                {hasQuery ? (
                  <>
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={products.length}
                      fwSize="sm"
                      className="tw:mt-2"
                    />
                    {loading ? (
                      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:mt-4 tw:gap-4">
                        {Array.from({ length: 14 }).map((_, idx) => (
                          <ProductCardSkeleton key={idx} />
                        ))}
                      </div>
                    ) : products.length > 0 ? (
                      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:mt-4 tw:gap-4">
                        {products.map((product) => (
                          <ProductCard
                            key={product._id}
                            data={product}
                            callback={handleBuyNow}
                          />
                        ))}
                      </div>
                    ) : (
                      <NoData />
                    )}
                    {hasMoreData && !loading && (
                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                        loadedCount={products.length}
                      />
                    )}
                  </>
                ) : (
                  /* No search yet — discovery content under the try-search chips. */
                  <div className="tw:mt-4">
                    <TopSellers distance={modalDistance} />
                  </div>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <div className="tw:flex tw:flex-col tw:gap-4">
                  <SupplyCatalogPane
                    title="Marketplace"
                    subtitle="Network"
                    distance={modalDistance}
                    showPurchaseCart
                    showCatalogOverview
                    catalogOverviewCounts={counts}
                    catalogOverviewCountsLoading={countsLoading}
                  />
                </div>
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={modalDistance}
      />

      {/* AI search modal */}
      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handleAiModalCallback}
      />
    </>
  );
};

export default BuyFromOtherRetailerProductsSearchPage;
