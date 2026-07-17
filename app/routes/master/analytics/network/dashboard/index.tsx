import { format, parseISO, isValid } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import CommonService from "~/services/CommonService";
import NetworkAnalyticsService from "~/services/NetworkAnalyticsService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AppliedFilters from "./components/AppliedFilters";
import Filter from "./components/Filter";
import Retailers from "./components/retailers/Retailers";
import Summary from "./components/Summary";
import defaultSummary, { formatNetworkSummary, prepareParams } from "./helper";
import PageAccessService from "~/services/PageAccessService";

// export async function clientLoader() {
//   return PageAccessService.canAccessPage([], { onlyMasterLogin: true });
// }

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "Stores",
    redirect: {
      path: "/auth/master/stores",
    },
  },
  { label: "Sales Dashboard" },
];

const NetworkDashboard = () => {
  const [summary, setSummary] = useState(defaultSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Tracks the in-flight summary request so a newer filter change can abort a
  // stale one and avoid out-of-order responses overwriting state.
  const summaryAbortRef = useRef<AbortController | null>(null);

  const methods = useForm({
    defaultValues: {
      dateRange: [] as Date[],
      franchise: null as any,
      state: "",
      district: "",
      town: "",
      networkType: "all" as string | undefined,
      planPurchased: "no" as string,
      pincode: "",
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilter = useCallback(
    (filters?: { formData: any }) => {
      const data = filters?.formData || methods.getValues();
      const params = new URLSearchParams();

      if (data.dateRange?.[0]) {
        params.set("dateFrom", format(data.dateRange[0], "yyyy-MM-dd"));
      }
      if (data.dateRange?.[1]) {
        params.set("dateTo", format(data.dateRange[1], "yyyy-MM-dd"));
      }
      // Only set franchise params if franchise is selected and has valid data
      if (data.franchise?.[0]?.value?.id) {
        params.set("franchiseId", data.franchise[0].value.id);
        params.set("franchise", data.franchise[0].value.name);
      }
      // If franchise is null, empty, or doesn't have valid data, don't set the params
      // This ensures the params are removed when the filter is cleared

      if (data.state && data.state !== "All") {
        params.set("state", data.state);
      }
      if (data.district && data.district !== "All") {
        params.set("district", data.district);
      }
      if (data.town && data.town !== "All") {
        params.set("town", data.town);
      }
      if (data.networkType && data.networkType !== "all") {
        params.set("networkType", data.networkType);
      }
      if (data.planPurchased) {
        params.set("planPurchased", data.planPurchased);
      }
      if (data.pincode) {
        params.set("pincode", data.pincode);
      }

      setSearchParams(params);
    },
    [setSearchParams, methods],
  );

  const loadSummary = async () => {
    // Cancel any previous in-flight request before starting a new one.
    summaryAbortRef.current?.abort();
    const controller = new AbortController();
    summaryAbortRef.current = controller;

    setSummaryLoading(true);
    try {
      const params = prepareParams(methods.getValues());
      const res = await NetworkAnalyticsService.getFranchiseNetworkOverview(
        params,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      // API returns an object with `data` property containing array of items
      const raw = res?.data?.data;
      const formatted = formatNetworkSummary(raw);
      setSummary(formatted);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.log("Error loading network summary", err);
      // keep default summary on error; optionally log
      // console.error('Failed to load network summary', err);
    } finally {
      if (!controller.signal.aborted) setSummaryLoading(false);
    }
  };

  // Initialize form with URL params on mount and when params change
  useEffect(() => {
    let dateFrom: string | null = searchParams.get("dateFrom");
    let dateTo: string | null = searchParams.get("dateTo");
    const franchiseId = searchParams.get("franchiseId");
    const franchise = searchParams.get("franchise") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const town = searchParams.get("town") || "";
    const networkType = searchParams.get("networkType") || "all";
    const planPurchased = searchParams.get("planPurchased") || "no";
    const pincode = searchParams.get("pincode") || "";

    if (franchiseId) {
      dateFrom = "";
      dateTo = "";
    }

    // Safely parse date strings from URL. fall back to `new Date()` if needed.
    const safeParse = (s: string | null) => {
      if (!s) return null;
      const p = parseISO(s);
      if (isValid(p)) return p;
      const n = new Date(s);
      return isValid(n) ? n : null;
    };

    const parsedFrom = safeParse(dateFrom);
    const parsedTo = safeParse(dateTo);

    methods.reset({
      dateRange: parsedFrom && parsedTo ? [parsedFrom, parsedTo] : [],
      franchise: franchiseId
        ? [{ label: franchise, value: { id: franchiseId, name: franchise } }]
        : null,
      state,
      district,
      town,
      networkType,
      planPurchased,
      pincode,
    });

    // Load summary with current filters
    loadSummary();
  }, [searchParams?.toString()]);

  // Abort any in-flight summary request when the component unmounts.
  useEffect(() => {
    return () => summaryAbortRef.current?.abort();
  }, []);

  return (
    <>
      <AppSimpleHeader title="Sales Dashboard - v1.1" />
      <div className="app-page tw:p-4">
        <div className="app-container ">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:mb-4">
            Track network performance, franchise sales, and store analytics
            across regions.
          </div>
          <FormProvider {...methods}>
            <Filter callback={handleFilter} className="tw:mb-4" />
            {/* <AppliedFilters
              onFilterChange={handleFilter}
              className="tw:mb-4 tw:mt-4"
            /> */}
          </FormProvider>

          <Summary summary={summary} loading={summaryLoading} />

          <Retailers />

          {/* Page content goes here */}
        </div>
      </div>
    </>
  );
};

export default NetworkDashboard;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Network Dashboard"),
    },
  ];
}
