import { produce } from "immer";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import {
  RACK_BIN_LOCATION_NON_SELLABLE,
  RACK_BIN_LOCATION_SELLABLE,
} from "~/constants";
import useAppNav from "~/hooks/useAppNav";

import { useSearchParams } from "react-router";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BinItem from "./components/BinItem";
import {
  buildFilledBinList,
  emptyBinStatusCounts,
  getBinFillClass,
  getBinFillStatus,
  type FilledBinListItem,
} from "./helper";
import BinSummary, { type BinSummaryStats } from "./components/BinSummary";
import BinProducts from "./components/bin-products/BinProducts";
import FilledBinList from "./components/filled-bin-list/FilledBinList";
import RackBinTab from "./components/tab/RackBinTab";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import { useTranslation } from "react-i18next";
import PageDescription from "~/components/core/page-description/PageDescription";
import NoData from "~/components/core/no-data/NoData";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-LOCATIONS"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "All Items",
    langKey: "allItems",
    redirect: {
      path: "/dashboard/inventory/products/list",
    },
  },
  {
    label: "Godown",
    langKey: "godown",
  },
];

/**
 * Capacity/status chip the grid falls back to — "allocated", i.e. only bins
 * with stock in them. Empty bins are noise on first load, so the "Filled"
 * chip starts selected and the user opts into "All" explicitly.
 */
const DEFAULT_CAPACITY_FILTER = "allocated";

const RackBin = () => {
  const { t } = useTranslation();

  // Get location type from URL query param
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  let initialLocation = RACK_BIN_LOCATION_SELLABLE;
  if (type === "non-sellable") {
    initialLocation = RACK_BIN_LOCATION_NON_SELLABLE;
  } else if (type === "sellable") {
    initialLocation = RACK_BIN_LOCATION_SELLABLE;
  }

  const appNav = useAppNav();

  const { getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      menuSearch: [],
      categorySearch: [],
      brandSearch: [],
      selectedLocation: initialLocation,
    },
  });

  const [data, setData] = useState<any[]>([]);

  // Snapshot of filled bins captured on first load per location scope.
  // This is passed to the side pane list and must not change when the user
  // applies capacity/status filters within the same scope.
  const [initialFilledBinList, setInitialFilledBinList] = useState<
    FilledBinListItem[]
  >([]);
  const initialFilledBinListTypeRef = useRef<string | null>(null);
  const needsInitialFilledBinListRef = useRef(true);

  const [display, setDisplay] = useState("loading");

  const rackContainerRef = useRef<HTMLDivElement>(null);

  const origDataRef = useRef<any[]>([]);

  const filterDataRef = useRef({
    storeId: "",
    selectedLocation: initialLocation,
    menuSearch: [],
    categorySearch: [],
    brandSearch: [],
    search: "",
    status: DEFAULT_CAPACITY_FILTER,
  });

  // New state for damaged totals (units and deals)
  const [totalDamagedUnits, setTotalDamagedUnits] = useState<number>(0);
  const [totalDamagedDeals, setTotalDamagedDeals] = useState<number>(0);

  const [capacityFilter, setCapacityFilter] = useState<string>(
    DEFAULT_CAPACITY_FILTER,
  );
  const [binStats, setBinStats] = useState<BinSummaryStats>({
    totalBins: 0,
    filledBins: 0,
    totalItems: 0,
    statusCounts: {},
  });

  const init = async () => {
    setDisplay("loading");
    // pass current capacity filter when initializing
    const currentCapacity =
      filterDataRef.current.status || DEFAULT_CAPACITY_FILTER;
    await loadData(initialLocation, currentCapacity);
  };

  const loadData = async (locationId: string, capacity?: string) => {
    setDisplay("loading");

    // Reset the side-pane filled-bin snapshot whenever the location scope
    // changes so the list reflects the new rack/bin data. Within the same
    // scope, keep the snapshot stable across capacity/status filters.
    if (initialFilledBinListTypeRef.current !== locationId) {
      initialFilledBinListTypeRef.current = locationId;
      needsInitialFilledBinListRef.current = true;
      setInitialFilledBinList([]);
    }

    const r = await RackBinService.getRackBinConfig(
      AuthService.getLoggedInUserId() || "",
      locationId,
      {},
    );

    origDataRef.current = r.data?.data?.racks || [];

    filterDataRef.current = {
      ...filterDataRef.current,
    };

    const r2 = await RackBinService.getBinSummary(
      AuthService.getLoggedInUserId() || "",
      locationId,
      {},
    );

    const binSummary = r2?.data?.data || [];

    const cap = (capacity || "all").toLowerCase();

    // Build a map of binId -> summary for quick lookup
    const binMap = new Map<string, any>();
    binSummary.forEach((b: any) => {
      if (b && b.binId != null) binMap.set(String(b.binId), b);
    });

    // Summary stats over the full bin set (before capacity filtering), so the
    // status counts stay stable while the grid below filters.
    const stats: BinSummaryStats = {
      totalBins: 0,
      filledBins: 0,
      totalItems: 0,
      statusCounts: emptyBinStatusCounts(),
    };
    (origDataRef.current || []).forEach((rack: any) => {
      (rack.bins || []).forEach((bin: any) => {
        const t = binMap.get(String(bin.binId));
        if (!t) return;
        const filled = t?.percentageFilled ?? 0;
        stats.totalBins++;
        if (filled > 0) stats.filledBins++;
        stats.totalItems += (t?.items || []).length;
        stats.statusCounts[getBinFillStatus(filled)]++;
      });
    });
    setBinStats(stats);

    // Enrich every bin with summary data (no capacity filtering yet).
    const enrichedRacks = origDataRef.current
      .map((rack: any) => {
        const bins = (rack.bins || [])
          .map((e: any) => {
            const t = binMap.get(String(e.binId));
            if (!t) return null;

            // Determine filled percentage using new key
            const filled = t?.percentageFilled ?? 0;

            // Add/update keys for BinItem using bin summary
            e._cssClass = getBinFillClass(filled);
            e.binName = t?.name || e.name || "";
            e.items = (t?.items || []).map((p: any) => ({
              name: p.dealName,
              sku: p.dealRefId,
              id: p.dealId,
              quantity: p.qty,
            }));
            e.capacity = t?.binCapacity || e.qtyLimit || 0;
            e.used =
              t?.items?.reduce(
                (sum: number, p: any) => sum + (p.qty || 0),
                0,
              ) ||
              e._stock ||
              0;
            e.status = (t?.status || "empty").toLowerCase();
            e.percentageFilled = filled;
            e.itemLimit = t?.itemLimit;
            e.dealLimit = t?.dealLimit;

            return e;
          })
          .filter(Boolean);

        return {
          ...rack,
          bins,
        };
      })
      .filter((r: any) => (r.bins || []).length > 0);

    // Build the side-pane filled-bin snapshot once per location scope from the
    // full, unfiltered rack/bin data so it stays stable while the grid filters.
    if (needsInitialFilledBinListRef.current) {
      setInitialFilledBinList(buildFilledBinList(enrichedRacks, binSummary));
      needsInitialFilledBinListRef.current = false;
    }

    // Grid data — capacity/status filter applied on top of the enriched set.
    const filteredRacks = enrichedRacks
      .map((rack: any) => {
        const bins = (rack.bins || []).filter((e: any) => {
          if (!cap || cap === "all") return true;
          if (cap === "allocated") {
            return Number(e.percentageFilled || 0) > 0;
          }
          // normal status based filtering
          return (e.status || "").toString().toLowerCase() === cap;
        });

        return {
          ...rack,
          bins,
        };
      })
      .filter((r: any) => (r.bins || []).length > 0);

    origDataRef.current = filteredRacks;

    // Compute damaged totals across the included bins only
    let damagedUnitsSum = 0;
    const damagedDealsSet = new Set<string>();
    origDataRef.current.forEach((r: any) => {
      (r.bins || []).forEach((b: any) => {
        // find summary for this bin
        const t = binMap.get(String(b.binId));
        (t?.items || []).forEach((it: any) => {
          const dq = Number(it.damagedQty || 0) || 0;
          damagedUnitsSum += dq;
          const dealId = it.dealId;
          if (dealId && dq > 0) damagedDealsSet.add(String(dealId));
        });
      });
    });

    setTotalDamagedUnits(damagedUnitsSum);
    setTotalDamagedDeals(damagedDealsSet.size);

    setData(origDataRef.current);

    setDisplay("data");
  };

  useEffect(() => {
    init();
    // Re-run init whenever 'type' changes
  }, [type]);

  // const handleDownload = async () => {
  //   const params = prepareParams(
  //     filterDataRef.current,
  //     paginationRef.current,
  //     true
  //   );

  //   const isUsable =
  //     getValues("selectedLocation") === RACK_BIN_LOCATION_SELLABLE;
  //   params.filter.isUsable = isUsable;

  //   delete params.page;
  //   delete params.count;

  //   setBusyLoader({ show: true });

  //   const r = await PosService.downloadRackBin(
  //     AuthService.getLoggedInSellerId(),
  //     params
  //   );

  //   setBusyLoader({ show: false });
  //   if (r.data.downloadLink) {
  //     CommonService.assetDownload(r.data.downloadLink);
  //     appToast.show({
  //       msg: "Downloaded successfully",
  //       color: "success",
  //     });
  //   } else {
  //     appToast.show({
  //       msg: "Failed to download data",
  //       color: "danger",
  //     });
  //   }
  // };

  // Helper functions extracted outside the callback
  const findMatchingRack = (racks: any[], rackName: string) => {
    return racks.find((rack: any) => rack.rackName === rackName);
  };

  const findMatchingBin = (bins: any[], binName: string) => {
    return bins.find((bin: any) => bin.binName === binName);
  };

  const updateBinAnimation = (
    rackName: string,
    binName: string,
    binId: string | number | undefined,
    animate: boolean,
  ) => {
    setData(
      produce((draft) => {
        const rackIndex = draft.findIndex(
          (rack: any) => rack.rackName === rackName,
        );
        if (rackIndex !== -1) {
          const binIndex = draft[rackIndex].bins.findIndex((bin: any) => {
            if (binId != null && bin.binId != null) {
              return String(bin.binId) === String(binId);
            }
            return bin.binName === binName;
          });
          if (binIndex !== -1) {
            draft[rackIndex].bins[binIndex].animate = animate;
          }
        }
      }),
    );
  };

  const scrollToBin = (rackName: string, binName: string) => {
    const binId = `${rackName}-${binName}`;
    const element = rackContainerRef.current?.querySelector(`#${binId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    }
    return false;
  };

  const handleBinProductsCallback = async (r: any) => {
    let capacityValue = "";
    if (r.action === "capacity-change") {
      capacityValue = r.data;
    } else {
      capacityValue = DEFAULT_CAPACITY_FILTER;
    }

    setCapacityFilter((capacityValue || DEFAULT_CAPACITY_FILTER).toLowerCase());

    await loadData(filterDataRef.current.selectedLocation, capacityValue);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (r.action !== "select-product") return;

    const item = r.data;
    const matchingRack = findMatchingRack(data, item.rackName);

    if (!matchingRack) {
      return;
    }

    const targetBin = findMatchingBin(matchingRack.bins, item.binName);

    if (!targetBin) {
      return;
    }

    // Scroll to the bin using the same visible identifier the grid uses.
    const binIdentifier = item.binCode || item.binName;
    const scrollSuccess = scrollToBin(item.rackName, binIdentifier);

    if (scrollSuccess) {
      // Start animation
      updateBinAnimation(item.rackName, item.binName, targetBin.binId, true);

      // Remove animation after 5 seconds
      setTimeout(() => {
        updateBinAnimation(item.rackName, item.binName, targetBin.binId, false);
      }, 5000);
    }
  };

  const handleSummaryCallback = async (r: { action: string; data: string }) => {
    if (r.action !== "status-change") return;
    setCapacityFilter(r.data);
    await loadData(filterDataRef.current.selectedLocation, r.data);
  };

  const handleFilledBinSelect = async (bin: {
    rackName: string;
    binName: string;
    binCode?: string;
    binId: string | number;
  }) => {
    // The side list always shows every filled bin, so a status filter on the
    // grid can hide the bin the user just picked. Reset to the default
    // ("filled") filter first and let the grid re-render before scrolling.
    if (capacityFilter !== DEFAULT_CAPACITY_FILTER) {
      setCapacityFilter(DEFAULT_CAPACITY_FILTER);
      await loadData(
        filterDataRef.current.selectedLocation,
        DEFAULT_CAPACITY_FILTER,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const binIdentifier = bin.binCode || bin.binName;
    const scrollSuccess = scrollToBin(bin.rackName, binIdentifier);
    if (scrollSuccess) {
      updateBinAnimation(bin.rackName, bin.binName, bin.binId, true);
      setTimeout(() => {
        updateBinAnimation(bin.rackName, bin.binName, bin.binId, false);
      }, 5000);
    }
  };

  const handleBinCallback = (bin: any) => {
    if (bin.action === "view-bin") {
      const binId = bin.data.binId;
      appNav.to(`/dashboard/inventory/rack-bin/bin/view/${binId}`);
    }
  };

  return (
    <>
      <AppHeader
        title={t("godown")}
        sectionKey="catalog"
        activeTab="godown"
        mobileLead="menu"
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — hidden here so the sellable / non-sellable pill strip
            is the one bar pinned under the app header. */}
        {/* <SectionTabs
          sectionKey="catalog"
          activeTab="godown"
          noShadow
          sticky
        /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="godown"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              <AppPaneMain className="tw:lg:col-span-12">
                <AppBreadcrumbs data={breadcrumbs} />
                <PageDescription
                  description="manageLocation"
                  className="tw:mb-4"
                />

                <RackBinTab
                  activeTab={type || "sellable"}
                  className="tw:mb-4"
                />

                <BinSummary
                  stats={binStats}
                  activeStatus={capacityFilter}
                  callback={handleSummaryCallback}
                  className="tw:mb-4"
                />

                {/* Damaged totals block */}
                <div className="tw:mb-3 tw:p-3 tw:bg-red-50 tw:border tw:border-red-100 tw:rounded tw:hidden">
                  <div className="tw:text-sm tw:text-red-600 tw:font-semibold">
                    {t("damagedInventory")}
                  </div>
                  <div className="tw:flex tw:gap-4 tw:mt-2 tw:text-sm tw:text-gray-700">
                    <div>
                      {t("deals")}:{" "}
                      <span className="tw:font-bold">{totalDamagedDeals}</span>
                    </div>
                    <div>
                      {t("units")}:{" "}
                      <span className="tw:font-bold">{totalDamagedUnits}</span>
                    </div>
                  </div>
                </div>

                {/* Product search — shown in the main column everywhere except
                    theme-2 desktop, where it lives in the side pane. */}
                <div className="app-pane-hide">
                  <BinProducts
                    callback={handleBinProductsCallback}
                    location={type || "sellable"}
                  />
                </div>

                {display === "loading" ? (
                  <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
                    <AppSpinner className="tw:w-12 tw:h-12" />
                  </div>
                ) : display === "data" ? (
                  <>
                    <div className="rack-bin-table">
                      {data.length === 0 ? (
                        <div className="tw:flex tw:justify-center tw:items-center tw:h-40">
                          <NoData />
                        </div>
                      ) : (
                        <>
                          <div className="rack-container-scroll tw:rounded-sm">
                            <div
                              className="rack-container"
                              ref={rackContainerRef}
                            >
                              {data?.map((rack: any, index: number) => (
                                <div key={index} className="rack-column">
                                  {/* Each rack is its own card: name + bin
                                      count in the header, its bins stacked
                                      inside. */}
                                  <div className="rack-card tw:w-full tw:text-sm">
                                    <div className="cell rack-lbl tw:flex tw:items-baseline tw:justify-between tw:gap-3">
                                      <span className="tw:text-base tw:font-bold tw:text-slate-900">
                                        {rack.rackName}
                                      </span>
                                      <span className="tw:text-xs tw:text-slate-400 tw:tabular-nums">
                                        {rack.bins.length}{" "}
                                        {rack.bins.length === 1
                                          ? t("bin")
                                          : t("bins", {
                                              defaultValue: "bins",
                                            })}
                                      </span>
                                    </div>
                                    {rack.bins.map(
                                      (bin: any, binIndex: number) => {
                                        return (
                                          <div
                                            key={binIndex}
                                            className={`cell ${
                                              bin._hide ? "tw:hidden" : ""
                                            }`}
                                            title={`Rack - ${rack.rackName} | Bin - ${
                                              bin.binCode || bin.binName
                                            }`}
                                            id={`${rack.rackName}-${
                                              bin.binCode || bin.binName
                                            }`}
                                          >
                                            <BinItem
                                              binName={
                                                bin.binCode || bin.binName
                                              }
                                              binId={bin.binId}
                                              items={bin.items}
                                              capacity={bin.capacity}
                                              used={bin.used}
                                              status={bin.status}
                                              className={bin._cssClass}
                                              animate={bin.animate}
                                              callback={handleBinCallback}
                                            />
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed godown
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                {/* Pane header — section title + scope label. */}
                <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1 tw:mb-3">
                  <PaneTitle title={t("godown")} />
                  <span className="tw:text-sm tw:text-slate-400">
                    {t("catalog", { defaultValue: "Catalog" })}
                  </span>
                </div>

                {/* Product search lives here in the pane layout — the main
                    column copy above is hidden (`app-pane-hide`). */}
                <BinProducts
                  callback={handleBinProductsCallback}
                  location={type || "sellable"}
                />

                <FilledBinList
                  bins={initialFilledBinList}
                  callback={handleFilledBinSelect}
                  loading={
                    initialFilledBinList.length === 0 && display === "loading"
                  }
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RackBin;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Rack Bin"),
    },
  ];
}
