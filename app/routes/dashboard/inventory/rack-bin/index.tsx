import { produce } from "immer";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
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
import PercentageInfo from "./PercentageInfo";
import BinItem from "./components/BinItem";
import BinProducts from "./components/bin-products/BinProducts";
import RackBinTab from "./components/tab/RackBinTab";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import { useTranslation } from "react-i18next";
import PageDescription from "~/components/core/page-description/PageDescription";
import NoData from "~/components/core/no-data/NoData";

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
    status: "Allocated",
  });

  // New state for damaged totals (units and deals)
  const [totalDamagedUnits, setTotalDamagedUnits] = useState<number>(0);
  const [totalDamagedDeals, setTotalDamagedDeals] = useState<number>(0);

  const init = async () => {
    setDisplay("loading");
    // pass current capacity filter when initializing
    const currentCapacity = filterDataRef.current.status || "all";
    await loadData(initialLocation, currentCapacity);
  };

  const loadData = async (locationId: string, capacity?: string) => {
    setDisplay("loading");

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

    const filteredRacks = origDataRef.current
      .map((rack: any) => {
        const bins = (rack.bins || [])
          .map((e: any) => {
            const t = binMap.get(String(e.binId));
            if (!t) return null;

            // Determine filled percentage using new key
            const filled = t?.percentageFilled ?? 0;
            let cssClass = "bin-empty";
            if (filled === 0) cssClass = "bin-empty";
            else if (filled > 0 && filled <= 50) cssClass = "bin-low";
            else if (filled > 50 && filled <= 80) cssClass = "bin-medium";
            else if (filled > 80 && filled <= 95) cssClass = "bin-high";
            else if (filled > 95) cssClass = "bin-full";

            // Add/update keys for BinItem using bin summary
            e._cssClass = cssClass;
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

            // Determine whether this bin should be included based on capacity filter
            if (!cap || cap === "all") return e;
            if (cap === "allocated") {
              return Number(e.percentageFilled || 0) > 0 ? e : null;
            }
            // normal status based filtering
            return (e.status || "").toString().toLowerCase() === cap ? e : null;
          })
          .filter(Boolean);

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
    animate: boolean,
  ) => {
    setData(
      produce((draft) => {
        const rackIndex = draft.findIndex(
          (rack: any) => rack.rackName === rackName,
        );
        if (rackIndex !== -1) {
          const binIndex = draft[rackIndex].bins.findIndex(
            (bin: any) => bin.binName === binName,
          );
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
      capacityValue = "all";
    }

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

    // Scroll to the bin
    const scrollSuccess = scrollToBin(item.rackName, item.binName);

    if (scrollSuccess) {
      // Start animation
      updateBinAnimation(item.rackName, item.binName, true);

      // Remove animation after 5 seconds
      setTimeout(() => {
        updateBinAnimation(item.rackName, item.binName, false);
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
      <AppHeader title={t("godown")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <PageDescription description="manageLocation" className="tw:mb-4" />
          <PercentageInfo />

          <RackBinTab activeTab={type || "sellable"} className="tw:mb-4" />

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
          <BinProducts
            callback={handleBinProductsCallback}
            location={type || "sellable"}
          />

          {display === "loading" ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
              <AppSpinner className="tw:w-12 tw:h-12" />
            </div>
          ) : display === "data" ? (
            <>
              <div className="rack-bin-table">
                <AppCard className="tw:p-2" bodyClassName="tw:px-0">
                  {data.length === 0 ? (
                    <div className="tw:flex tw:justify-center tw:items-center tw:h-40">
                      <NoData />
                    </div>
                  ) : (
                    <>
                      <div className="rack-container-scroll">
                        <div className="rack-container" ref={rackContainerRef}>
                          {data?.map((rack: any, index: number) => (
                            <div key={index} className="rack-column">
                              <div className="tw:w-full tw:mb-3 tw:text-sm">
                                <div className="cell rack-lbl tw:text-center tw:font-semibold tw:bg-gray-100">
                                  {rack.rackName}
                                </div>
                                {rack.bins.map((bin: any, binIndex: number) => {
                                  return (
                                    <div
                                      key={binIndex}
                                      className={`cell ${
                                        bin._hide ? "tw:hidden" : ""
                                      }`}
                                      title={`Rack - ${rack.rackName} | Bin - ${
                                        bin.binCode || bin.binName
                                      }`}
                                      id={`${rack.rackName}-${bin.binName}`}
                                    >
                                      <BinItem
                                        binName={bin.binCode || bin.binName}
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
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </AppCard>
              </div>
            </>
          ) : null}
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
