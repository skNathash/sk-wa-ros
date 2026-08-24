import { FormProvider, useForm } from "react-hook-form";
import { Map as MapIcon, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AlphaRail from "~/components/core/alpha/AlphaRail";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import PromoteCoinStore from "~/shared/catalog/components/promote-coin-store/PromoteCoinStore";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import Sellers from "~/shared/network/components/sellers/Sellers";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type {
  BreadcrumbItem,
  PaginationState,
  SectionTab,
  ViewToggleType,
} from "~/types/CommonTypes";
import ConnectedSellerBlock from "./components/ConnectedSellerBlock";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import FilterChips, {
  type RetailersFilterParam,
} from "./components/FilterChips";
import MapView from "./components/MapView";
import MobileView from "./components/MobileView";
import Summary, { type SummaryData } from "./components/Summary";
import Theme2DesktopView from "./components/Theme2DesktopView";
import { getCount, getData, getSummary, prepareParams } from "./helper";

const DEFAULT_COUNT = 20;

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: DEFAULT_COUNT,
  startSlNo: 1,
  endSlNo: DEFAULT_COUNT,
  totalRecords: 0,
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Home",
    redirect: { path: "/products/main" },
    langKey: "home",
  },
  { label: "Discover Sellers" },
];

const browseSectionTabs: SectionTab[] = [
  {
    key: "network",
    label: "Network",
    redirect: { url: "/products/buy-from-other-retailer/retailers" },
  },
  {
    key: "purchases",
    label: "Purchases",
    redirect: { url: "/dashboard/orders/list?tab=my-orders" },
  },
];

export default function RetailersPage() {
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [summary, setSummary] = useState<SummaryData>({
    youOwe: 0,
    paylaterAvail: 0,
    connectedCount: 0,
    newThisMonthCount: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [showMap, setShowMap] = useState<boolean>(false);
  // Snapshot of filterRef the map can react to — the ref itself never triggers
  // a re-render, so the map would otherwise miss chip/search changes.
  const [mapFilter, setMapFilter] = useState<Record<string, any>>({});
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sort, setSort] = useState<{
    key: string;
    value: "asc" | "desc";
  } | null>(null);
  // --- FilterChip UI ---
  const [activeSort, setActiveSort] = useState<string>("az");

  const [storeImagesModal, setStoreImagesModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: { images: [] },
  });

  const [connectSeller, setConnectSeller] = useState<any>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  const filterRef = useRef<Record<string, any>>({
    alpha: "",
    search: "",
  });
  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" } | null>(null);
  const prevDistanceRef = useRef<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Boolean chip filters driven by query params so the chips, the Summary
  // card and deep links all stay in sync via the searchParams effect below.
  const skSellerActive = searchParams.get("skSeller") === "true";
  const skRetailerActive = searchParams.get("skRetailer") === "true";
  const hasPaylaterActive = searchParams.get("hasPaylater") === "true";
  const connectedActive = searchParams.get("connected") === "true";

  const toggleParamFilter = (key: RetailersFilterParam) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get(key) === "true") {
          next.delete(key);
        } else {
          next.set(key, "true");
        }
        return next;
      },
      { replace: true },
    );
  };

  const methods = useForm({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  useEffect(() => {
    // Read `distance` from URL search params and store in filterRef
    const distanceParam = searchParams?.get?.("distance");
    if (distanceParam) {
      const parsed = Number(distanceParam);
      filterRef.current = {
        ...filterRef.current,
        distance: Number.isNaN(parsed) ? distanceParam : parsed,
      };
    } else {
      // when no distance is provided in URL, default to showing all sellers
      filterRef.current = {
        ...filterRef.current,
        distance: DEFAULT_BROWSE_DISTANCE,
      };
    }

    // Honour a sort preset passed via URL (e.g. from the "Top Sellers" rail).
    const sortParam = searchParams?.get?.("sort");
    filterRef.current = {
      ...filterRef.current,
      sortPreset: sortParam || undefined,
    };

    if (sortParam === "topSellers") {
      setActiveSort("topSellers");
    }

    // Boolean chip filters toggled via query params (chips / Summary card).
    filterRef.current = {
      ...filterRef.current,
      hasPaylater: searchParams?.get?.("hasPaylater") === "true",
      skSeller: searchParams?.get?.("skSeller") === "true",
      skRetailer: searchParams?.get?.("skRetailer") === "true",
      connected: searchParams?.get?.("connected") === "true",
    };

    // When the user changes the location (distance), reset any selected sort
    // so results come back in the default order for the new radius.
    const distanceKey = distanceParam || "";
    if (
      prevDistanceRef.current !== null &&
      prevDistanceRef.current !== distanceKey
    ) {
      setSort(null);
      sortRef.current = null;
      filterRef.current.sort = null;
      filterRef.current.sortPreset = undefined;
      setActiveSort("az");
    }
    prevDistanceRef.current = distanceKey;

    applyFilter();
  }, [searchParams]);

  // Distance driving the side-pane catalog data points (same resolution the
  // catalog pages use — a raw "all" stays a string, anything else is numeric).
  const rawDistance = searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
  const paneDistance: any =
    rawDistance === "all" ? "all" : Number(rawDistance) || rawDistance;

  const handleCreateRetailer = () => {
    appNav.to("/dashboard/network/management/b2b-retailers/manage");
  };

  const handleSortSelect = (key: string, value: "asc" | "desc") => {
    // "Nearest" is the API's default ordering — send no sort key at all.
    const newSort = key === "nearest" ? null : { key, value };
    setSort(newSort);
    sortRef.current = newSort;
    filterRef.current.sort = newSort;
    filterRef.current.sortPreset = undefined;
    setActiveSort("az");

    // A lingering `sort=topSellers` deep link would be re-applied by the
    // searchParams effect and fight this selection — drop it, and let that
    // effect drive the refetch so we don't fire two in parallel.
    if (searchParams.get("sort")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("sort");
          return next;
        },
        { replace: true },
      );
      return;
    }

    applyFilter();
  };

  const handleTopSellersSelect = () => {
    // Toggle: clicking the active chip drops back to the default ordering.
    const isActive = activeSort === "topSellers";

    // The preset and the Sort dropdown are mutually exclusive — picking Top
    // seller clears whatever the dropdown had applied.
    setSort(null);
    sortRef.current = null;
    filterRef.current.sort = null;
    filterRef.current.sortPreset = isActive ? undefined : "topSellers";
    setActiveSort(isActive ? "az" : "topSellers");

    // Deselecting has to drop the `sort=topSellers` deep link too, otherwise
    // the searchParams effect re-applies the preset on the next param change.
    if (isActive && searchParams.get("sort")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("sort");
          return next;
        },
        { replace: true },
      );
      return;
    }

    applyFilter();
  };

  // Summary counts follow the same filters as the list. Fired alongside it so
  // the tiles never hold up the rows.
  const applySummary = async () => {
    setSummaryLoading(true);
    try {
      setSummary(await getSummary(filterRef.current));
    } finally {
      setSummaryLoading(false);
    }
  };

  const applyFilter = async () => {
    setLoading(true);
    setItems([]);
    setMapFilter({ ...filterRef.current });

    paginationRef.current = {
      ...defaultPagination,
    };

    applySummary();

    const params = prepareParams(filterRef.current, paginationRef.current);

    try {
      const data = await getData(params);
      const total = await getCount(params);

      setItems(data || []);

      paginationRef.current.totalRecords = total || 0;
      setCount(total || 0);
      // Determine if there is more data to load based on fetched rows
      const rowsPerPage = paginationRef.current.rowsPerPage || DEFAULT_COUNT;
      setHasMoreData((data || []).length >= rowsPerPage);
    } catch (err) {
      console.error("Error loading retailers", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        prepareParams(filterRef.current, paginationRef.current),
      );
      setItems((s) => [...s, ...(data || [])]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const itemCallback = (action: { action: string; data: any }) => {
    if (action.action === "viewImages") {
      const images = action.data.approvedShopPhotos?.map((photo: any) => ({
        id: photo.fileUrl,
      }));

      if (images.length > 0) {
        setStoreImagesModal({ show: true, data: { images } });
      } else {
        appToast.show({
          msg: t("noImagesFound"),
          color: "danger",
        });
      }
    }
  };

  const storeImagesModalCallback = () => {
    setStoreImagesModal({ show: false, data: { images: [] } });
  };

  const handleBrowseConnectedSellerCatalog = (sellerId: string) => {
    appNav.to(`/products/buy-from-other-retailer/retailer/${sellerId}`);
  };

  const handleConnectRequest = (seller: any) => {
    setConnectSeller(seller);
  };

  const handleCancelConnect = () => {
    setConnectSeller(null);
  };

  const handleConfirmConnect = async () => {
    if (!connectSeller) return;

    setConnectLoading(true);
    try {
      await FranchiseService.linkFranchises(connectSeller._id);
      appToast.show({
        msg: "Seller connected successfully",
        color: "success",
      });
      setConnectSeller(null);
      applyFilter();
    } catch (err: any) {
      appToast.show({
        msg:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to connect seller",
        color: "danger",
      });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleFilterChange = (a: { action: string; formData: any }) => {
    // Merge incoming formData into filterRef and apply
    filterRef.current = { ...filterRef.current, ...a.formData };
    applyFilter();
  };

  const handleAlphaChange = (value: string) => {
    filterRef.current = {
      ...filterRef.current,
      ...methods.getValues(),
      alpha: value,
    };
    applyFilter();
  };

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="sellers"
        title={"Sellers near you"}
        showRecordPayment={false}
        showCart
        mobileLead="menu"
      />
      <div className="page-bg app-page tw:p-4">
        {/* <SectionTabs
          sectionKey="supply"
          activeTab="network"
          noShadow
          sticky
          tabs={browseSectionTabs}
        /> */}

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="sellers"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <Summary
                  data={summary}
                  loading={summaryLoading}
                  sellerCount={count}
                  distance={paneDistance}
                  onCreateRetailer={handleCreateRetailer}
                  mapActive={showMap}
                  onToggleMap={() => setShowMap((s) => !s)}
                />

                <PromoteCoinStore />

                {/* <div className="tw:mb-4">
            <BuyFromNetworkTab activeTab="products" />
          </div> */}

                {AuthService.isSkBuyer() && (
                  <ConnectedSellerBlock
                    onBrowseCatalog={handleBrowseConnectedSellerCatalog}
                  />
                )}

                <div className="tw:flex tw:justify-between tw:items-center tw:mb-4 hide-in-theme-2">
                  <div className="tw:text-xs tw:text-gray-600">
                    Discover and purchase products from nearby retailers in your
                    network.
                  </div>
                  <AppButton
                    onClick={handleCreateRetailer}
                    size="small"
                    color="primary"
                    fill="outline"
                  >
                    <Plus className="tw:w-4 tw:h-4" />
                    {t("createB2bRetailer")}
                  </AppButton>
                </div>

                <FormProvider {...methods}>
                  <div className="tw:mb-4">
                    <Filter callback={handleFilterChange} />
                  </div>

                  <FilterChips
                    className="tw:mb-4"
                    activeSort={activeSort}
                    sort={sort}
                    filters={{
                      skSeller: skSellerActive,
                      skRetailer: skRetailerActive,
                      hasPaylater: hasPaylaterActive,
                      connected: connectedActive,
                    }}
                    onSortSelect={handleSortSelect}
                    onTopSellersSelect={handleTopSellersSelect}
                    onActiveSortChange={setActiveSort}
                    onToggleFilter={toggleParamFilter}
                  />

                  <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
                    <div>
                      {!showMap && (
                        <PaginationSummary
                          paginationConfig={paginationRef.current}
                          loadingTotalRecords={loading}
                          loadedCount={items.length}
                          fwSize="sm"
                        />
                      )}
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      {/* Theme-2 desktop already carries the Map view action in
                          the Summary header — only the other layouts need one. */}
                      {!(isTheme2 && !isMobile) && (
                        <AppButton
                          size="small"
                          color={showMap ? "primary" : "medium"}
                          fill={showMap ? "solid" : "outline"}
                          onClick={() => setShowMap((s) => !s)}
                        >
                          <MapIcon className="tw:w-4 tw:h-4" />
                          {showMap ? "List" : "Map"}
                        </AppButton>
                      )}
                      {!isTheme2 && !showMap && (
                        <ViewToggle viewType={view} callback={setView} />
                      )}
                    </div>
                  </div>

                  <div>
                    {showMap ? (
                      <MapView
                        filter={mapFilter}
                        onSelectSeller={(seller) =>
                          handleBrowseConnectedSellerCatalog(seller._id)
                        }
                        height={
                          isMobile ? "tw:h-[420px]" : "tw:h-[calc(100vh-22rem)]"
                        }
                      />
                    ) : isMobile ? (
                      <div className="tw:flex tw:gap-2">
                        <div className="tw:flex-1 tw:min-w-0">
                          <MobileView
                            data={items}
                            loading={loading}
                            callback={itemCallback}
                            showLoadMore={
                              items.length < paginationRef.current.totalRecords
                            }
                            loadedCount={items.length}
                            loadingMore={loadingMore}
                            loadMore={loadMore}
                            totalCount={paginationRef.current.totalRecords}
                          />
                        </div>
                        <AlphaRail
                          callback={handleAlphaChange}
                          className="tw:h-[calc(100vh-20rem)]"
                        />
                      </div>
                    ) : isTheme2 ? (
                      <Theme2DesktopView
                        data={items}
                        loading={loading}
                        callback={itemCallback}
                        showLoadMore={
                          items.length < paginationRef.current.totalRecords
                        }
                        loadedCount={items.length}
                        loadingMore={loadingMore}
                        loadMore={loadMore}
                        totalCount={paginationRef.current.totalRecords}
                        connectedOnly={connectedActive}
                        onConnect={handleConnectRequest}
                      />
                    ) : view === "card" ? (
                      <MobileView
                        data={items}
                        loading={loading}
                        callback={itemCallback}
                        showLoadMore={
                          items.length < paginationRef.current.totalRecords
                        }
                        loadedCount={items.length}
                        loadingMore={loadingMore}
                        loadMore={loadMore}
                        totalCount={paginationRef.current.totalRecords}
                      />
                    ) : (
                      <DesktopView
                        data={items}
                        loading={loading}
                        callback={itemCallback}
                        showLoadMore={
                          items.length < paginationRef.current.totalRecords
                        }
                        loadedCount={items.length}
                        loadingMore={loadingMore}
                        loadMore={loadMore}
                        totalCount={paginationRef.current.totalRecords}
                      />
                    )}
                  </div>
                </FormProvider>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed list pane
                  beside the icon rail. */}
              {/* Same pane the retailer detail page carries, so moving between
                  the list and a single retailer doesn't swap what sits beside
                  the content — no retailer is open here, so no row is active. */}
              <AppPaneSide className="app-pane-only">
                <Sellers distance={searchParams.get("distance") || undefined} />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Create-retailer FAB (mobile only). Pinned above the bottom tab bar and
          offset left of the sticky AlphaRail so the two never overlap. */}
      <div
        className="tw:fixed tw:right-8 tw:z-50 tw:flex tw:md:hidden"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={handleCreateRetailer}
          aria-label={t("createB2bRetailer")}
          className="tw:bg-primary tw:text-primary-foreground tw:h-11 tw:px-4 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold tw:transition-transform tw:duration-200 tw:cursor-pointer tw:active:scale-95"
        >
          <Plus className="tw:w-5 tw:h-5" />
          Create
        </button>
      </div>

      <ImgPreviewModal
        show={storeImagesModal.show}
        callback={storeImagesModalCallback}
        images={storeImagesModal.data.images}
      />

      <AppAlertDialog
        show={!!connectSeller}
        title="Connect seller"
        description={`Are you sure you want to connect with ${
          connectSeller?.name || "this seller"
        }?`}
        type="confirm"
        okText="Connect"
        cancelText="Cancel"
        onConfirm={handleConfirmConnect}
        onCancel={handleCancelConnect}
      />

      <BusyLoader show={connectLoading} message="Connecting seller..." />
    </>
  );
}
