// icons moved to shared CoinsTab
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import type { CoinSectionTabKey } from "~/services/LoyaltyPointService";
import PageAccessService from "~/services/PageAccessService";
import type {
  BreadcrumbItem,
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import CoinSystemInfo from "./components/CoinSystemInfo";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import CoinsTab from "~/shared/coins/components/CoinsTab";
import CoinStorePane from "~/shared/coins/components/coin-store-pane/CoinStorePane";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import {
  defaultFilter,
  getCount,
  getData,
  getSummary,
  prepareParams,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["LOYALTY-POINTS.VIEW-STATEMENT"]);
}

const defaultSort: SortProps = {
  key: "createdAt",
  value: "desc",
};

const PointsList = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  const [searchParams, setSearchParams] = useSearchParams();

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const activeTab = (searchParams.get("tab") as CoinSectionTabKey) || "config";

  const [summary, setSummary] = useState<any>({
    totalEarned: 0,
    totalRedeemed: 0,
  });

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    return [
      {
        label: "Dashboard",
        langKey: "dashboard",
        redirect: {
          path: "/dashboard",
        },
      },
      activeTab === "config"
        ? {
            label: "KingCoins Config",
            langKey: "kingcoinConfig",
          }
        : {
            label: "King Coins",
            langKey: "kingcoinTransactions",
          },
    ];
  }, [activeTab]);

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<SortProps>({
    ...defaultSort,
  });

  useEffect(() => {
    applyFilter();
  }, [activeTab]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setData([]);

    loadSummary();

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const items = await getData(params);

      setData(items);
      setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = async () => {
    const summary = await getSummary(filterRef.current);
    setSummary(summary);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const items = await getData(params);
      setData((prev) => [...prev, ...items]);
      setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterChange = useCallback(({ formData }: any) => {
    filterRef.current = { ...filterRef.current, ...formData };
    applyFilter();
  }, []);

  const handleItemClick = useCallback(({ action, data }: any) => {
    // Placeholder: view action could open a detail route/modal
    // Keep minimal behavior for now
    if (action === "view") {
      // no-op or navigate if appNav available
    }
  }, []);

  const handleSort = (sort: SortProps) => {
    sortRef.current = {
      ...sortRef.current,
      ...sort,
    };
    applyFilter();
  };

  return (
    <>
      <AppHeader
        title={
          activeTab === "config"
            ? t("kingcoinConfig")
            : t("kingcoinTransactions")
        }
        // theme-2 mobile: the header carries the business section switcher
        // (eyebrow + tappable title) with the account-menu hamburger leading
        // it — the same treatment the customer detail layout uses. The page's
        // own sub-nav lives in the sticky CoinsTab below, so the title line
        // stays free for the section. Desktop is unaffected.
        sectionKey="business"
        activeTab="loyalty"
        mobileLead="menu"
        // Only the switcher shows a subtitle line; elsewhere it would just
        // repeat the title.
        subtitle={
          isTheme2 && isMobile
            ? activeTab === "config"
              ? t("kingcoinConfig")
              : t("kingcoinTransactions")
            : undefined
        }
      />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          {/* Theme-2 phone: the coins sub-nav takes over the sticky section-tab
              bar at the top of the screen (the same treatment the customer
              detail layout uses), instead of the business section strip —
              stacking both read as double nav. Hidden outside theme-2 mobile. */}
          <CoinsTab activeTab={activeTab} sticky />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="loyalty"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* theme-2 hides both the breadcrumbs and the page
                      description; drop the band there rather than leave an
                      empty row paying its bottom margin. */}
                  <div className="tw:mb-4 theme-2-hide">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                    <PageDescription description="kingCoins" />
                  </div>

                  {/* The coins sub-nav — hidden in theme-2 desktop, where the
                      pane carries the section's own navigation. */}
                  <CoinsTab
                    activeTab={activeTab}
                    className="tw:mb-4 app-pane-hide theme-2-mobile-hide"
                  />

                  {activeTab === "config" ? (
                    <CoinSystemInfo />
                  ) : (
                    <>
                      <Summary summary={summary} />

                      <Filter
                        callback={handleFilterChange}
                        className="tw:mb-4"
                      />
                      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
                        <div>
                          <PaginationSummary
                            paginationConfig={paginationRef.current}
                            loadingTotalRecords={loading}
                            loadedCount={data.length}
                            fwSize="sm"
                          />
                        </div>
                        <div>
                          <ViewToggle
                            viewType={viewType}
                            callback={setViewType}
                            hideInMobile={false}
                            showOnlyIcon={isMobile}
                          />
                        </div>
                      </div>

                      {isMobile ? (
                        <>
                          <MobileView
                            data={data}
                            loading={loading}
                            callback={handleItemClick}
                          />
                          {hasMoreData && !loading && (
                            <div className="tw:flex tw:justify-center tw:mt-6">
                              <LoadMoreButton
                                loadMore={loadMore}
                                loading={loadingMore}
                                totalCount={paginationRef.current.totalRecords}
                                loadedCount={data.length}
                              />
                            </div>
                          )}
                        </>
                      ) : viewType === "list" ? (
                        <AppCard noPadding>
                          <DesktopView
                            data={data}
                            loading={loading}
                            callback={handleItemClick}
                            sortKey={sortRef.current.key}
                            sortValue={sortRef.current.value}
                            onSort={handleSort}
                            loadMore={loadMore}
                            loadingMore={loadingMore}
                            totalCount={paginationRef.current.totalRecords}
                            loadedCount={data.length}
                            hasMoreData={hasMoreData}
                          />
                        </AppCard>
                      ) : (
                        <>
                          <MobileView
                            data={data}
                            loading={loading}
                            callback={handleItemClick}
                          />
                          {hasMoreData && !loading && (
                            <div className="tw:flex tw:justify-center tw:mt-6">
                              <LoadMoreButton
                                loadMore={loadMore}
                                loading={loadingMore}
                                totalCount={paginationRef.current.totalRecords}
                                loadedCount={data.length}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    list pane beside the section icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <CoinStorePane showTierPhilosophy={false} />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PointsList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("King Coins Statement"),
    },
  ];
}
