import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppTab from "~/components/core/tab/AppTab";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type {
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import SortPopover, {
  buildSortOptions,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import Filter from "./components/Filter";
import DesktopView, { headers } from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import Summary from "./components/Summary";
import { getData, getSummary, prepareParams } from "./helper";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import DirectoryBanner from "~/shared/network/components/directory-banner/DirectoryBanner";
import DirectorySidePane from "~/shared/network/components/directory-side-pane/DirectorySidePane";
import {
  DIRECTORY_SEGMENT_LABELS,
  type DirectoryChipKey,
} from "~/shared/network/components/directory-side-pane/DirectoryPaneChips";
import { AuthService } from "~/services/AuthService";
import MiscService from "~/services/MiscService";
import { usePageHeaderTitle } from "~/hooks/usePageHeaderTitle";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const B2b = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();
  const appToast = useAppToast();

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [view, setView] = useState<ViewToggleType>("list");
  const [segment, setSegment] = useState<DirectoryChipKey>("all");

  // Sort is shared by the desktop column headers and the mobile popover — the
  // options come straight off the table's column config.
  const sortOptions = useMemo(() => buildSortOptions(headers), []);
  const [sort, setSort] = useState<SortValue>({
    key: "lastOrderDate",
    value: -1,
  });
  // The list calls read the sort through a ref so they stay closure-free, the
  // state only drives the header arrows and the popover's active row.
  const sortRef = useRef<SortValue>(sort);

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    categories?: string[];
    templateFor?: string[];
    ignoreCategories?: string[];
  }>({
    show: false,
    data: undefined,
    users: [],
    categories: undefined,
    templateFor: undefined,
    ignoreCategories: undefined,
  });

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    endSlNo: 10,
    rowsPerPage: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      // rows and the total come from the same call
      const { data: rows, pagination } = await getData(params);
      setData(rows);
      paginationRef.current.totalRecords = pagination.total;
      setHasMoreData(pagination.page < pagination.pages);

      // fetch summary based on current filters
      const summaryData = await getSummary(filterRef.current || {});
      setSummary(summaryData || {});
    } catch (e) {
      setData([]);
      setHasMoreData(false);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
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
      const { data: rows, pagination } = await getData(params);
      setData((prev) => [...prev, ...rows]);
      paginationRef.current.totalRecords = pagination.total;
      setHasMoreData(pagination.page < pagination.pages);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, []);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  // One segment drives both the summary tiles and the pane chips — the list
  // call carries it as `filter.segment` and the endpoint resolves the rows.
  const handleSegmentChange = useCallback(
    (key: DirectoryChipKey) => {
      setSegment(key);
      filterRef.current = { ...filterRef.current, segment: key };
      applyFilter();
    },
    [applyFilter],
  );

  // Same handler for both entry points — the table headers and the mobile
  // popover — so a column tap and a popover pick land on one sort state.
  const handleSort = useCallback(
    (value: SortValue) => {
      sortRef.current = value;
      setSort(value);
      applyFilter();
    },
    [applyFilter],
  );

  const handleAction = useCallback((arg: { action: string; data?: any }) => {
    if (arg.action === "openWhatsapp") {
      const user = arg.data;
      setWhatsappModal({
        show: true,
        data: {
          dynamicData: {
            customerName: user?.name,
            orderId: "-",
            franchiseName: AuthService.getLoggedInUser()?.name || "",
            franchiseId: AuthService.getLoggedInUserId(),
            customerId: user._id,
          },
        },
        users: [{ name: user.name, mobile: user.mobile }],
        categories: [],
        ignoreCategories: ["Invite", "payLater"],
        templateFor: ["B2B"],
      });
    }
  }, []);

  const handleWhatsappCallback = useCallback(
    (a: { action: string; data?: any }) => {
      if (a.action === "close") {
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        return;
      }

      if (a.action === "send") {
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        appToast.show({ msg: "WhatsApp message sent", color: "success" });
      }

      if (a.action === "send_error") {
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        appToast.show({ msg: "Failed to send WhatsApp", color: "danger" });
      }
    },
    [appToast],
  );

  // Mobile has no side pane, so the pane's segment chips ride as a pill tab
  // strip instead — same segments, same counts, same handler.
  const segmentTabs = useMemo<TabItem[]>(() => {
    const cards = summary?.cards || {};
    const items: { key: DirectoryChipKey; name: string; count: number }[] = [
      { key: "all", name: "All", count: Number(summary?.total) || 0 },
      { key: "loyal", name: "Loyal", count: Number(cards.loyal?.count) || 0 },
      {
        key: "silent",
        name: "Silent",
        count: Number(cards.silent?.count) || 0,
      },
      {
        key: "paylater",
        name: "Paylater",
        count: Number(cards.paylaterActive?.count) || 0,
      },
    ];

    return items.map((item) => ({
      ...item,
      countColor: item.key === segment ? "tw:bg-white/25" : "tw:bg-red-500",
    }));
  }, [summary, segment]);

  // Page title — names the book and, when the list is narrowed to a segment,
  // spells that segment out too ("B2B Retailer - Loyal").
  const scopeLabel = useMemo(
    () =>
      segment && segment !== "all"
        ? `B2B Retailer - ${DIRECTORY_SEGMENT_LABELS[segment]}`
        : "B2B Retailer",
    [segment],
  );

  // The layout owns the app header — hand it the same title the banner shows.
  usePageHeaderTitle(scopeLabel);

  // Banner mix line — same `loyaltySummary` cards the tiles below run on.
  const bannerMix = useMemo(() => {
    const cards = summary?.cards || {};
    const count = (value: any) => (Number(value) || 0).toLocaleString("en-IN");
    return [
      `${count(cards.loyal?.count)} loyal`,
      `${count(cards.paylaterActive?.count)} paylater`,
      `${count(cards.silent?.count)} silent`,
      `${count(cards.newThisWeek?.count)} new this week`,
    ].join(" · ");
  }, [summary]);

  return (
    <>
      <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
        {/* Main column — spans the full grid; in theme-2 desktop the CSS lifts
            the side pane out of the grid into the fixed list pane. */}
        <AppPaneMain className="tw:lg:col-span-12">
          {/* `app-bleed-x` — mobile only: the hero runs edge to edge instead of
              floating in the page gutter, so it drops its corner radius too. */}
          <DirectoryBanner
            scopeLabel={scopeLabel}
            total={summary?.total}
            entityLabel="retailers"
            ltv={`${CommonService.formatCompact(
              Number(summary?.totalLtv) || 0,
              {
                style: "short",
                prefix: "₹",
              },
            )} LTV`}
            description={bannerMix}
            loading={loading}
            className="app-bleed-x"
          />

          {isMobile && (
            <div className="app-bleed-x tw:bg-white tw:-mt-4 tw:py-2">
              <AppTab
                tabs={segmentTabs}
                activeTab={segment}
                onTabChange={(tab) =>
                  handleSegmentChange(tab.key as DirectoryChipKey)
                }
                variant="pills"
                slideOffset={MiscService.isMobile() ? 16 : 0}
              />
            </div>
          )}

          <Summary
            summary={summary}
            activeSegment={segment}
            onSegmentSelect={handleSegmentChange}
          />

          <Filter callback={onFilterChange} showFilters />

          {isMobile || view === "card" ? (
            <>
              {/* Card/mobile toolbar — same card surface and controls as the
                  desktop table toolbar: summary left, view toggle right.
                  On mobile the view toggle is hidden anyway, so the count reads
                  as a plain caption on the page-bg with no card around it. */}
              {isMobile ? (
                // Mobile has no column headers to tap, so the sort rides beside
                // the count as a popover trigger on the same line — bare on the
                // page background, no card around it.
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-1 tw:mb-1">
                  <div className="tw:min-w-0">
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={data.length}
                      fwSize="sm"
                    />
                  </div>
                  <div className="tw:shrink-0">
                    <SortPopover
                      options={sortOptions}
                      sortValue={sort}
                      onSort={handleSort}
                    />
                  </div>
                </div>
              ) : (
                <AppCard noPadding>
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
                    <div className="tw:min-w-0 tw:flex-1">
                      <PaginationSummary
                        paginationConfig={paginationRef.current}
                        loadingTotalRecords={loading}
                        loadedCount={data.length}
                        fwSize="sm"
                      />
                    </div>
                    <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
                      <ViewToggle viewType={view} callback={setView} />
                    </div>
                  </div>
                </AppCard>
              )}

              <MobileView
                data={data}
                loading={loading}
                onView={(item: any) =>
                  to(`/dashboard/network/view/b2b/${item._id}`)
                }
                callback={handleAction}
              />
              {hasMoreData && !loading && (
                <div className="tw:text-center tw:mt-4">
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={data.length}
                  />
                </div>
              )}
            </>
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                hasMoreData={hasMoreData}
                onAction={handleAction}
                paginationConfig={paginationRef.current}
                view={view}
                onViewChange={setView}
                sortValue={sort}
                onSort={handleSort}
              />
            </AppCard>
          )}
        </AppPaneMain>

        {/* Side column — only rendered inside the theme-2 split layout. */}
        <AppPaneSide className="app-pane-only">
          <DirectorySidePane
            title="B2B Retailer"
            network="b2b"
            scopeLabel={summary?.total ? `${summary.total} in book` : undefined}
            activeChipKey={segment}
            chipCounts={{
              loyal: summary?.cards?.loyal?.count || 0,
              silent: summary?.cards?.silent?.count || 0,
              paylater: summary?.cards?.paylaterActive?.count || 0,
              new: summary?.cards?.newThisWeek?.count || 0,
            }}
            onChipSelect={handleSegmentChange}
            showQuickAdd={false}
          />
        </AppPaneSide>
      </div>

      <WhatsappTemplateModal
        show={!!whatsappModal.show}
        data={whatsappModal.data}
        users={whatsappModal.users}
        categories={whatsappModal.categories}
        templateFor={whatsappModal.templateFor}
        callback={handleWhatsappCallback}
        ignoreCategories={whatsappModal.ignoreCategories}
      />
    </>
  );
};

export default B2b;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("B2B Retailer Directory"),
    },
  ];
}
