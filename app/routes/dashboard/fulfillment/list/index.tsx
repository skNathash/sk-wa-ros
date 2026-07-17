import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { SwiperOptions } from "swiper/types";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import { AppInput, AppSelect } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { TabItem } from "~/types/CommonTypes";
import FulfillmentOrderCard from "./components/FulfillmentOrderCard";
import { getCountsForStatusMap } from "./helper";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const swiperConfig: SwiperOptions = {
  slidesPerView: 4,
  spaceBetween: 10,
  breakpoints: {
    320: { slidesPerView: 1.5 },
    768: { slidesPerView: 4.5 },
  },
};

const breadcrumbs = [
  { label: "Dashboard", url: "/dashboard", langKey: "dashboard" },
  { label: "Fulfillment List", langKey: "fulfillmentList" },
];

const typeOptions = [
  { value: "all", label: "All Orders" },
  { value: "B2C", label: "B2C Orders" },
  { value: "B2B", label: "B2B Orders" },
];

const statusMap = {
  "approval-pending": ["Created", "Pending"],
  picked: ["Picked", "Picking"],
  "packing-invoiced": ["Packing", "Packed"],
  "pending-shipment": ["Pending Shipment", "Invoiced"],
  shipped: "Shipped",
  delivered: "Delivered",
};

const initialTabs: TabItem[] = [
  { name: "New Orders", key: "approval-pending", countColor: "tw:bg-blue-500" },
  { name: "Picking Orders", key: "picked", countColor: "tw:bg-green-500" },
  {
    name: "Packing Orders",
    key: "packing-invoiced",
    countColor: "tw:bg-yellow-500",
  },
  {
    name: "Awaiting Shipment",
    key: "pending-shipment",
    countColor: "tw:bg-blue-500",
  },
  { name: "Shipped Orders", key: "shipped", countColor: "tw:bg-blue-500" },
  { name: "Delivered Orders", key: "delivered", countColor: "tw:bg-blue-500" },
];

const FulfillmentList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || initialTabs[0].key;

  const { register, control, getValues, setValue, watch } = useForm({
    defaultValues: {
      search: searchParams.get("search") || "",
      type: searchParams.get("type") || "all",
      routeId: searchParams.get("routeId") || "all",
    },
  });

  const type = watch("type");
  const routeId = watch("routeId");

  // prepare and apply search params to the URL
  const handleFilterChange = useCallback(() => {
    const vals = getValues();
    const next = new URLSearchParams(searchParams.toString());

    // If filters are being changed programmatically, remove any forceTab
    // marker so auto-switching logic can still run when appropriate.
    if (next.has("forceTab")) {
      next.delete("forceTab");
    }

    if (vals.search && vals.search.trim() !== "")
      next.set("search", vals.search);
    else next.delete("search");

    if (vals.type && vals.type !== "all") next.set("type", vals.type);
    else next.delete("type");

    if (vals.routeId && vals.routeId !== "all")
      next.set("routeId", vals.routeId);
    else next.delete("routeId");

    const nextStr = next.toString();
    if (nextStr !== searchParams.toString()) setSearchParams(next);
  }, [getValues, searchParams, setSearchParams]);

  // debounce applying filter changes to avoid too many URL updates while typing
  const handleSearch = useCallback(
    debounce(() => {
      handleFilterChange();
    }, 500),
    [handleFilterChange],
  );

  const [tabs, setTabs] = useState<TabItem[]>(initialTabs);

  const fetchCounts = useCallback(async (formData: Record<string, any>) => {
    try {
      const counts = await getCountsForStatusMap(statusMap, formData);
      if (counts) {
        setTabs((prev) =>
          prev.map((t) => ({
            ...t,
            count: counts[t.key] || 0,
          })),
        );
      }
      return counts;
    } catch (e) {
      // ignore
      return null;
    }
  }, []);

  useEffect(() => {
    fetchCounts({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const formData: Record<string, any> = {
      search: searchParams.get("search") || "",
      type: searchParams.get("type") || "all",
      routeId: searchParams.get("routeId") || "all",
      status: searchParams.getAll("status") || undefined,
    };

    async function updateCounts() {
      const counts = await fetchCounts(formData);

      // If the user has applied a search or filter, switch to the first tab that
      // has a non-zero count so results are visible immediately.
      const hasFilter =
        (formData.search && String(formData.search).trim() !== "") ||
        (formData.type && formData.type !== "all") ||
        (formData.status && formData.status.length > 0);

      // If user has applied filters and we have counts, auto-switch to first
      // non-empty tab only when the URL doesn't already include a `forceTab`
      // marker (meaning the tab was explicitly set by the user).
      if (hasFilter && counts) {
        if (searchParams.has("forceTab")) {
          return;
        }
        const firstWithCount = Object.keys(counts).find(
          (k) => (counts as Record<string, number>)[k] > 0,
        );

        if (firstWithCount) {
          const currentTab = searchParams.get("tab") || initialTabs[0].key;
          if (currentTab !== firstWithCount) {
            const next = new URLSearchParams(searchParams.toString());
            next.set("tab", firstWithCount);
            setSearchParams(next);
          }
        }
      }
    }

    updateCounts();
  }, [searchParams?.toString(), fetchCounts]);

  // when the URL search params change, sync them back into the form
  useEffect(() => {
    const s = searchParams.get("search") || "";
    const t = searchParams.get("type") || "all";
    const r = searchParams.get("routeId") || "all";

    // Only set if different to avoid extra re-renders
    if (getValues("search") !== s) setValue("search", s);
    if (getValues("type") !== t) setValue("type", t);
    if (getValues("routeId") !== r) setValue("routeId", r);
  }, [searchParams, setValue, getValues]);

  const handleTypeChange = (value: string) => {
    setValue("type", value);
    handleFilterChange();
  };

  return (
    <>
      <AppHeader
        title="Fulfillment List"
        showAudioNote={true}
        audioNoteTitle="Fulfillment List"
        audioFeature="manageFulfillment"
      />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
          <PageDescription
            description="manageFulfillment"
            className="tw:mb-4"
          />

          {/* <FulfillmentTab activeTab={"b2c-b2b"} /> */}

          <div className="tw:flex tw:gap-2 tw:mb-4">
            <AppInput
              register={register}
              name="search"
              className="tw:flex-1"
              placeholder="Search Order ID, Name, Product"
              size="sm"
              onChange={handleSearch}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={typeOptions}
                  value={field.value}
                  size="sm"
                  inputClassName="tw:w-full"
                  onChange={handleTypeChange}
                />
              )}
            />
          </div>

          {type === "B2B" && (
            <RoutesSlider
              selectedId={routeId}
              callback={({ action, data }) => {
                if (action === "select") {
                  setValue("routeId", data._id);
                  handleFilterChange();
                }
              }}
              className="tw:mb-4"
            />
          )}

          <AppTab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(t) => {
              const next = new URLSearchParams(searchParams.toString());
              next.set("tab", t.key);
              // mark that the tab was explicitly set by the user so auto-switching
              // logic (which runs when filters change) does not override user choice
              next.set("forceTab", "1");
              setSearchParams(next);
            }}
            variant="tabs"
            wrapWithCard={false}
            className="tw:mb-3"
          />

          {/* Render the card matching active tab */}
          {activeTab === "approval-pending" && (
            <FulfillmentOrderCard
              title="New Orders"
              status={statusMap["approval-pending"]}
              statusKey="approval-pending"
              color="blue-500"
            />
          )}
          {activeTab === "picked" && (
            <FulfillmentOrderCard
              title="Picking Orders"
              status={statusMap.picked}
              statusKey="picked"
              color="orange-500"
            />
          )}
          {activeTab === "packing-invoiced" && (
            <FulfillmentOrderCard
              title="Packing Orders"
              status={statusMap["packing-invoiced"]}
              statusKey="packing-invoiced"
              color="yellow-500"
            />
          )}
          {activeTab === "pending-shipment" && (
            <FulfillmentOrderCard
              title="Awaiting Shipment"
              status={statusMap["pending-shipment"]}
              statusKey="pending-shipment"
              color="blue-500"
            />
          )}
          {activeTab === "shipped" && (
            <FulfillmentOrderCard
              title="Shipped Orders"
              status={statusMap.shipped}
              statusKey="shipped"
              color="blue-500"
            />
          )}
          {activeTab === "delivered" && (
            <FulfillmentOrderCard
              title="Delivered Orders"
              status={statusMap.delivered}
              statusKey="delivered"
              color="green-500"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FulfillmentList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Fulfillment List"),
    },
  ];
}
