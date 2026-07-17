import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import { getData, prepareParams } from "./helper";
import MasterEmpService from "~/services/MasterEmpService";
import StorageService from "~/services/StorageService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import BusyLoader from "~/components/core/busyloader/Busyloader";

interface FilterFormData {
  search: string;
  dateRange?: Date[];
  franchiseId?: string;
  state?: string;
  district?: string;
  town?: string;
  pincode?: string;
}

const defaultFilter: FilterFormData = {
  search: "",
  dateRange: undefined,
  franchiseId: undefined,
  state: undefined,
  district: undefined,
  town: undefined,
  pincode: undefined,
};

const Retailers = () => {
  const [searchParams] = useSearchParams();
  const appNav = useAppNav();
  const appToast = useAppToast();

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [busyLoading, setBusyLoading] = useState<{
    show: boolean;
    msg?: string;
  }>({ show: false, msg: "" });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "franchiseName",
    value: "asc",
  });

  // Tracks the in-flight request so a newer filter/sort/pagination call can
  // abort a stale one and avoid out-of-order responses overwriting state.
  const abortRef = useRef<AbortController | null>(null);

  const applyFilter = useCallback(async () => {
    // Cancel any previous in-flight request before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current
      );

      const result = await getData(params, controller.signal);
      if (controller.signal.aborted) return;
      setData(result.data || []);
      paginationRef.current.totalRecords = result.count || 0;

      setHasMoreData(result.data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      if (controller.signal.aborted) return;
      setData([]);
      setHasMoreData(false);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    // Cancel any previous in-flight request before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params, controller.signal);
      if (controller.signal.aborted) return;
      setData((prev) => [...prev, ...(result.data || [])]);
      setHasMoreData(
        (result.data || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Abort any in-flight request when the component unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const franchiseId = searchParams.get("franchiseId");
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const town = searchParams.get("town");
    const pincode = searchParams.get("pincode");
    const networkType = searchParams.get("networkType") || undefined;
    // Default to "no" only when not drilling into a specific franchise;
    // selecting a franchise filters by that franchise alone.
    const planPurchased =
      searchParams.get("planPurchased") || (franchiseId ? undefined : "no");

    let params: Record<string, any> = {};

    params.search = search;

    if (dateFrom && dateTo) {
      params.dateRange = [new Date(dateFrom), new Date(dateTo)];
    }

    if (franchiseId) {
      params.franchiseId = franchiseId;
    }

    if (state) {
      params.state = state;
    }

    if (district) {
      params.district = district;
    }

    if (town) {
      params.town = town;
    }

    if (pincode) {
      params.pincode = pincode;
    }

    if (networkType) {
      params.networkType = networkType;
    }

    if (planPurchased) {
      params.planPurchased = planPurchased;
    }

    formMethods.reset(params);

    applyFilter();
  }, [searchParams]);

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: SortValue }) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  const handleAccessStore = useCallback(
    async (franchiseId: string) => {
      setBusyLoading({ show: true, msg: "Accessing franchise..." });
      try {
        const resp = await MasterEmpService.accessFranchise(franchiseId);

        if (resp?.statusCode === 200) {
          // server may return token in multiple shapes
          const r: any = resp.data?.data || {};
          const token = r.token || "";

          InventorySubscribeService.clearLocalCart();

          if (token) {
            StorageService.set("_f", r?.franchise?.details);
            StorageService.set("_t", token);
          }

          appNav.replace("/auth/init");
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to access franchise",
            color: "danger",
          });
        }
      } catch (e: any) {
        appToast.show({
          msg: e?.message || "Failed to access franchise",
          color: "danger",
        });
      } finally {
        setBusyLoading({ show: false, msg: "" });
      }
    },
    [appNav, appToast]
  );

  const handleCallback = useCallback(
    (action: { action: string; data: any }) => {
      if (action.action === "accessStore") {
        appNav.openInNewTab(
          `/auth/master/stores?fid=${action.data.newFranchiseId}`
        );
      }
    },
    [handleAccessStore]
  );

  return (
    <div>
      <AppCard noContentPadding={true} title="All Retailers">
        <div className="tw:flex tw:items-center tw:px-6 tw:mb-4">
          <div className="tw:flex-1">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data?.length || 0}
              fwSize="sm"
            />
          </div>
        </div>
        <DesktopView
          data={data}
          loading={loading}
          sortKey={sortRef.current?.key}
          sortValue={sortRef.current?.value}
          onSort={handleSort}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
          callback={handleCallback}
        />
      </AppCard>
      <BusyLoader show={busyLoading.show} message={busyLoading.msg} />
    </div>
  );
};

export default Retailers;
