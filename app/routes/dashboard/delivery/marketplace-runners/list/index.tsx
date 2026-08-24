import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { PaginationState } from "~/types/CommonTypes";
import RunnerFilters from "./components/filters/RunnerFilters";
import RunnerCard from "./components/runner-card/RunnerCard";
import RunnerCardSkeleton from "./components/runner-card/RunnerCardSkeleton";
import MarketplaceRunnersSidePane from "./components/side-pane/MarketplaceRunnersSidePane";
import ViewRunnerModal from "~/shared/delivery/modals/view-runner/ViewRunnerModal";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import {
  DEFAULT_FILTER,
  SORT_OPTIONS,
  getCount,
  getData,
  getOrderInvoiceId,
  hireRunner,
  prepareParams,
  type MarketplaceRunner,
  type RunnerFilter,
  type RunnerSort,
} from "./helper";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import { useSearchParams } from "react-router";
import useTheme from "~/hooks/useTheme";
import useAppNav from "~/hooks/useAppNav";
import AppButton from "~/components/core/button/AppButton";
import { PlusIcon, SearchIcon } from "lucide-react";
import clsx from "clsx";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import DeliverySectionTabs from "~/shared/delivery/components/delivery-section-tabs/DeliverySectionTabs";
import useScreenView from "~/hooks/useScreenView";
import SegmentedControl from "~/components/core/segmented-control/SegmentedControl";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

const tabs: TabItem[] = [
  {
    name: "Now",
    key: "now",
  },
  {
    name: "Top Rated",
    key: "top-rated",
  },
  {
    name: "Cheapest",
    key: "cheapest",
  },
  {
    name: "Near Me",
    key: "near-me",
  },
];

const MarketplaceRunners = () => {
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const { register } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const [searchParams] = useSearchParams();

  const activeTab = tabs.some((t) => t.key === searchParams.get("tab"))
    ? searchParams.get("tab")
    : tabs[0].key;

  const theme2 = useTheme() === "theme-2";

  const [data, setData] = useState<MarketplaceRunner[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewRunnerId, setViewRunnerId] = useState<string | null>(null);
  /* Hiring is only offered when the desk arrived here from an order — the
     assign call needs that order's invoice, fetched once below. */
  const orderId = searchParams.get("orderId") || "";
  const [invoiceId, setInvoiceId] = useState("");
  const [hireRunnerData, setHireRunnerData] =
    useState<MarketplaceRunner | null>(null);
  const [hiring, setHiring] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });
  const filterRef = useRef<RunnerFilter>({ ...DEFAULT_FILTER });
  const sortRef = useRef<RunnerSort>(SORT_OPTIONS[0].sort);

  // Initial load / filter change — back to page one, count refreshed.
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
      setData(await getData(params));
      paginationRef.current.totalRecords = await getCount(params);
    } catch (e) {
      console.error("Marketplace runners fetch failed", e);
      setData([]);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const result = await getData(
        prepareParams(
          filterRef.current,
          paginationRef.current,
          sortRef.current,
        ),
      );
      setData((prev) => [...prev, ...result]);
    } catch (e) {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage - 1,
      };
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    applyFilter();
  }, [searchParams?.toString()]);

  useEffect(() => {
    if (!orderId) {
      setInvoiceId("");
      return;
    }

    let cancelled = false;
    getOrderInvoiceId(orderId)
      .then((id) => {
        if (!cancelled) setInvoiceId(id);
      })
      .catch(() => {
        if (!cancelled) setInvoiceId("");
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleFilterChange = useCallback(
    ({ filter, sort }: { filter: RunnerFilter; sort: RunnerSort }) => {
      filterRef.current = filter;
      sortRef.current = sort;
      applyFilter();
    },
    [applyFilter],
  );

  const handleCardAction = useCallback(
    ({ action, data: runner }: { action: string; data: MarketplaceRunner }) => {
      if (action === "view") {
        setViewRunnerId(runner._id);
        return;
      }

      setHireRunnerData(runner);
    },
    [],
  );

  /* The desk stays on the marketplace until the shipment is really assigned —
     an error leaves the list up so another runner can be picked. */
  const handleHireConfirm = useCallback(async () => {
    if (!hireRunnerData) return;

    setHiring(true);
    try {
      const response = await hireRunner({
        orderId,
        invoiceId,
        runnerId: hireRunnerData._id,
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({
          msg: `Hired ${hireRunnerData.name}`,
          color: "success",
        });
        setHireRunnerData(null);
        appNav.to("/dashboard/delivery/assign-runner", { orderId });
        return;
      }

      appToast.show({ msg: response.data?.message, color: "danger" });
    } catch (error: any) {
      appToast.show({ msg: error?.message, color: "danger" });
    } finally {
      setHiring(false);
    }
  }, [appNav, appToast, hireRunnerData, invoiceId, orderId]);

  const handleTabChange = (tab: TabItem) => {
    appNav.to(
      `/dashboard/delivery/marketplace-runners`,
      {
        tab: tab.key,
      },
      { replace: true },
    );
  };

  const debouncedSearch = useDebouncedCallback(() => {
    applyFilter();
  }, 500);

  return (
    <>
      <AppHeader
        title="Marketplace Runners"
        sectionKey="bill"
        activeTab="logistics"
        mobileLead="menu"
      />

      <div className="app-page page-bg page-padding">
        <DeliverySectionTabs activeTab="runner" />
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — bill section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="bill"
                activeTab="logistics"
                title="Bill"
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid; the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane (see AppPane). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Search + sort toolbar. Theme-2 desktop keeps the full-width
                    white band pinned under the header; theme-2 mobile borrows the
                    tracker's view-switch treatment — a full-bleed bordered white
                    segmented strip leading the toolbar, with the search beneath it. */}
                <div
                  className={clsx({
                    /* `-mx-4` with auto width (not a translate + fixed
                       width) so the band truly widens on both sides — a
                       shifted fixed-width box leaves a page-bg gap at the
                       right screen edge. */
                    "tw:bg-white tw:p-4 tw:-mx-4 tw:-mt-4 tw:sticky tw:top-14":
                      theme2 && !isMobile,
                    /* `app-bleed-x` pulls the toolbar out of the page gutter so
                       the segmented strip runs edge to edge of the screen, on the
                       page background. */
                    "app-bleed-x tw:mb-4 tw:flex tw:flex-col":
                      theme2 && isMobile,
                  })}
                >
                  {theme2 && isMobile ? (
                    <>
                      {/* Mobile segmented sort — same control as the tracker's
                          view switch: a faint brand-tinted track with the active
                          choice lifting onto a green-lettered white pill. Shares
                          the search row's `px-4` so both left edges land on the
                          card gutter. */}
                      <div className="tw:bg-white tw:px-4 tw:py-2">
                        <SegmentedControl
                          items={tabs}
                          value={activeTab}
                          onChange={(key) =>
                            handleTabChange({ name: key, key })
                          }
                        />
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-2 tw:bg-white tw:px-4 tw:py-3">
                        <div className="tw:flex-1">
                          <AppInput
                            name="search"
                            register={register}
                            placeholder="Search runners"
                            onChange={debouncedSearch}
                            leftIcon={
                              <SearchIcon className="tw:w-4 tw:h-4 tw:text-slate-400" />
                            }
                          />
                        </div>
                        <AppButton
                          color="primary"
                          size="small"
                          aria-label="Add Runner"
                          onClick={() =>
                            appNav.to(
                              "/dashboard/delivery/marketplace-runners/register",
                            )
                          }
                          className="tw:shrink-0"
                        >
                          <PlusIcon className="tw:w-5 tw:h-5" />
                        </AppButton>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tw:flex tw:justify-between tw:items-center">
                        <AppTab
                          tabs={tabs}
                          activeTab={activeTab}
                          onTabChange={handleTabChange}
                          variant={theme2 ? "pills" : undefined}
                          /* This row sits right under the delivery section pill
                             bar, so it wears the quiet sort-chip treatment (see
                             `.app-sort-chips` in theme-2.css) — outlined, smaller,
                             brand-tinted when active — instead of a second row of
                             solid green nav pills. */
                          className={theme2 ? "app-sort-chips" : undefined}
                        />
                        <div className="tw:hidden tw:lg:block">
                          <AppButton
                            color="primary"
                            size="small"
                            onClick={() =>
                              appNav.to(
                                "/dashboard/delivery/marketplace-runners/register",
                              )
                            }
                          >
                            <PlusIcon className="tw:w-4 tw:h-4" />
                            Add Runner
                          </AppButton>
                        </div>
                      </div>
                      <AppInput
                        name="search"
                        register={register}
                        placeholder="Search runners"
                        className="tw:mt-4"
                        onChange={debouncedSearch}
                        leftIcon={
                          <SearchIcon className="tw:w-4 tw:h-4 tw:text-slate-400" />
                        }
                      />
                    </>
                  )}
                </div>

                <div>
                  {loading ? (
                    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
                      <RunnerCardSkeleton />
                    </div>
                  ) : data.length === 0 ? (
                    <NoData
                      title="No runners nearby"
                      description="No marketplace runner is working around the store right now. Widen the radius or try again in a while."
                    />
                  ) : (
                    <>
                      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-3">
                        {data.map((runner) => (
                          <RunnerCard
                            key={runner._id}
                            runner={runner}
                            canHire={!!orderId}
                            callback={handleCardAction}
                          />
                        ))}
                      </div>

                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={loadingMore}
                        loadedCount={data.length}
                        totalCount={paginationRef.current.totalRecords}
                      />
                    </>
                  )}
                </div>
              </AppPaneMain>

              {/* Marketplace filter rail — theme-2 desktop split layout only. */}
              <AppPaneSide className="app-pane-only">
                <MarketplaceRunnersSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <ViewRunnerModal
        show={!!viewRunnerId}
        runnerId={viewRunnerId}
        canHire={!!orderId}
        orderId={orderId}
        invoiceId={invoiceId}
        callback={() => setViewRunnerId(null)}
      />

      <AppAlertDialog
        show={!!hireRunnerData}
        title="Hire this runner?"
        description={`${hireRunnerData?.name} will be assigned to this order at ${hireRunnerData?._baseChargeLbl} + ${hireRunnerData?._perKmLbl}.`}
        okText={hiring ? "Hiring..." : "Hire Now"}
        onConfirm={handleHireConfirm}
        onCancel={() => setHireRunnerData(null)}
      />
    </>
  );
};

export default MarketplaceRunners;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Marketplace Runners"),
    },
  ];
}
