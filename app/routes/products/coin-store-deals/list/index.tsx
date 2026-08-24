import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import PageDescription from "~/components/core/page-description/PageDescription";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Skeleton } from "~/components/ui/skeleton";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import type { BreadcrumbItem, ViewToggleType } from "~/types/CommonTypes";
import CoinStoreBanner from "./components/CoinStoreBanner";
import CoinStoreBannerTheme2 from "./components/CoinStoreBannerTheme2";
import CoinsTab from "~/shared/coins/components/CoinsTab";
import CoinStorePane from "~/shared/coins/components/coin-store-pane/CoinStorePane";
import type { CoinRewardChipKey } from "~/shared/coins/components/coin-store-pane/helper";
import { rewardTierOf } from "~/shared/coins/components/coin-store-pane/helper";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import Item from "./components/Item";
import DealSection from "./components/deal-section/DealSection";
import { DEAL_SECTION_TYPES } from "./components/deal-section/helper";
import { getCount, getData, prepareParams } from "./helper";

const CoinStoreDealsList = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Products",
      redirect: { path: "/products/sk" },
    },
    {
      label: "Coin Store",
      langKey: "kingCoinStore",
    },
  ];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");

  // The theme-2 side pane owns the reward search and the tier chips; the page
  // narrows the loaded deals with them.
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<CoinRewardChipKey>("all");

  const visibleData = useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.filter((deal) => {
      if (tier !== "all" && rewardTierOf(deal) !== tier) return false;
      if (!term) return true;
      const name = deal.name || deal.dealName || "";
      return name.toLowerCase().includes(term);
    });
  }, [data, search, tier]);

  // Refs for filter and pagination
  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 20,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 20,
  });

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setLoadingTotalRecords(true);
    setData([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const items = await getData(params);
      setData(items);
      setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
      setHasMoreData(false);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  }, []);

  const handleFilterChange = useCallback(
    (filters: { formData: any }) => {
      filterRef.current = filters.formData;
      applyFilter();
    },
    [applyFilter],
  );

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(
    async (_event?: any) => {
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
        const items = await getData(params);
        setData((prev) => [...prev, ...items]);
        setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
      } catch (error) {
        // ignore
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMoreData],
  );

  const handleShare = () => {
    // Open the invite modal in the side menu via a global event
    try {
      MiscService.createEvent("showInviteModal", null);
    } catch (e) {
      // fallback to share/copy if event fails
      const url = window.location.href;
      if (navigator.share) {
        navigator
          .share({
            title: "Check out these amazing Coin Store Deals!",
            text: "Redeem exclusive products using KingCoins at StoreKing Coin Store!",
            url,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          alert("Link copied to clipboard!");
        });
      }
    }
  };

  return (
    <>
      <AppHeader
        title={t("kingCoinStore")}
        // theme-2 mobile: the header carries the business section switcher
        // (eyebrow + tappable title) with the account-menu hamburger leading
        // it — the same treatment the customer detail layout uses. The page's
        // own sub-nav lives in the sticky CoinsTab below. Desktop is
        // unaffected.
        sectionKey="business"
        activeTab="loyalty"
        mobileLead="menu"
        // Only the switcher shows a subtitle line; elsewhere it would repeat
        // the title.
        subtitle={isTheme2 && isMobile ? t("kingCoinStore") : undefined}
      />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          {/* Theme-2 phone: the coins sub-nav takes over the sticky section-tab
              bar at the top of the screen (the same treatment the customer
              detail layout uses), instead of the business section strip —
              stacking both read as double nav. Hidden outside theme-2 mobile. */}
          <CoinsTab activeTab="products" sticky />

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
                {/* Main column — spans the full grid (the side pane only exists in
                theme-2 desktop, where the CSS lifts it out of the grid into
                the fixed list pane; see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* theme-2 hides both the breadcrumbs and the page description;
                  drop the band there rather than leave an empty row paying its
                  bottom margin. */}
                  <div className="tw:mb-4 theme-2-hide">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                    <PageDescription description="coinStore" />
                  </div>

                  {/* The coins sub-nav — hidden in theme-2 desktop, where the pane
                  carries the section's own navigation. */}
                  <CoinsTab
                    activeTab="products"
                    className="tw:mb-4 app-pane-hide theme-2-mobile-hide"
                  />

                  {/* <CoinStoreBanner /> */}

                  {/* theme-2 replaces the illustrated banner with a masthead
                  that states what the shelf is worth right now. */}
                  {isTheme2 && <CoinStoreBannerTheme2 onInvite={handleShare} />}

                  {/* Curated rails — one per recommendation slice the
                  kcstore-deals endpoint serves. They sit above the full
                  catalogue so the shelf leads with what actually moves. */}
                  <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-4">
                    {DEAL_SECTION_TYPES.map((sectionType) => (
                      <DealSection key={sectionType} type={sectionType} />
                    ))}
                  </div>

                  <div className="tw:flex tw:justify-between tw:items-center tw:mb-4 tw:mt-4">
                    <div>
                      <PaginationSummary
                        paginationConfig={paginationRef.current}
                        loadingTotalRecords={loadingTotalRecords}
                        loadedCount={data.length}
                        fwSize="sm"
                      />
                    </div>
                    {/* theme-2 carries the invite in the masthead above, so the
                    row would only repeat it. */}
                    <div className="theme-2-hide">
                      <AppButton
                        onClick={handleShare}
                        size="small"
                        fill="outline"
                        color="success"
                      >
                        <ImgRender
                          src="whatsapp-logo.png"
                          alt="WhatsApp"
                          className="tw:w-5 tw:h-5 tw:object-contain"
                        />
                        <span>Invite Customers</span>
                      </AppButton>
                    </div>
                  </div>
                  {/* The split layout hands the feed a narrower column, so the
                  card grid steps up with the breakpoints and tops out at six
                  across. */}
                  <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-6 tw:gap-3">
                    {loading
                      ? Array.from({
                          length: paginationRef.current.rowsPerPage,
                        }).map((_, idx) => (
                          <div key={`skeleton-${idx}`} className="tw-p-2">
                            <Skeleton className="tw:h-36 tw:w-full tw:mb-2" />
                            <Skeleton className="tw:h-3 tw:w-3/4 tw:mb-1" />
                            <Skeleton className="tw:h-3 tw:w-1/2" />
                          </div>
                        ))
                      : visibleData.map((d, idx) => (
                          <Item key={d.id || idx} item={d} />
                        ))}
                  </div>
                  {hasMoreData && !loading && (
                    <div className="tw:flex tw:justify-center tw:my-4">
                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                        loadedCount={data.length}
                      />
                    </div>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout is
                active (lg+), where the CSS re-homes it as the fixed list pane
                beside the section icon rail. */}
                <AppPaneSide className="app-pane-only">
                  {/* The catalogue page reads as the store itself, so the pane
                  carries what each tier is for and who redeemed lately, plus
                  the quick actions to the rest of the coins section — the
                  circulation alerts belong to the economy pane. */}
                  <CoinStorePane
                    activeChipKey={tier}
                    onChipSelect={(key) => setTier(key as CoinRewardChipKey)}
                    onSearch={setSearch}
                    showAlerts={false}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoinStoreDealsList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Coin Store Deals"),
    },
  ];
}
