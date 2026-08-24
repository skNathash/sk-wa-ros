import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { SearchIcon } from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import { AppInput, AppSelect } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import FulfillmentSidePane from "~/shared/fulfillment/components/fulfillment-side-pane/FulfillmentSidePane";
import {
  FULFILLMENT_STAGES,
  FULFILLMENT_STATUS_MAP,
  type FulfillmentTypeKey,
} from "~/shared/fulfillment/components/fulfillment-side-pane/helper";
import FulfillmentBoard from "./components/FulfillmentBoard";
import { getCountsForStatusMap } from "./helper";
import RoutesSlider from "~/shared/logistics/components/RoutesSlider";
import OrderTopBar from "~/shared/orders/order-top-bar/OrderTopBar";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const breadcrumbs = [
  { label: "Dashboard", url: "/dashboard", langKey: "dashboard" },
  { label: "Fulfillment List", langKey: "fulfillmentList" },
];

const typeOptions = [
  { value: "all", label: "All Orders" },
  { value: "B2C", label: "B2C Orders" },
  { value: "B2B", label: "B2B Orders" },
];

const FulfillmentList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || FULFILLMENT_STAGES[0].key;

  const { control, register, getValues, setValue, watch } = useForm({
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

  // Debounce applying filter changes so typing doesn't rewrite the URL on every
  // keystroke. `useDebouncedCallback` keeps the latest callback internally, so
  // the fire always uses the current `handleFilterChange` — a
  // `useCallback(debounce(...))` would freeze the first render's closure (and
  // with it a stale `searchParams`).
  const handleSearch = useDebouncedCallback(() => {
    handleFilterChange();
  }, 500);

  // Per-stage counts, shared between the board lanes and the side-pane list.
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [stageCountsLoading, setStageCountsLoading] = useState(true);

  const fetchCounts = useCallback(async (formData: Record<string, any>) => {
    try {
      const counts = await getCountsForStatusMap(
        FULFILLMENT_STATUS_MAP,
        formData,
      );
      if (counts) setStageCounts(counts);
      return counts;
    } catch (e) {
      // ignore
      return null;
    } finally {
      setStageCountsLoading(false);
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

      // If the user has applied a search or filter, park the board on the first
      // lane that has a non-zero count so results are visible immediately.
      const hasFilter =
        (formData.search && String(formData.search).trim() !== "") ||
        (formData.type && formData.type !== "all") ||
        (formData.status && formData.status.length > 0);

      // If user has applied filters and we have counts, auto-switch to first
      // non-empty lane only when the URL doesn't already include a `forceTab`
      // marker (meaning the lane was explicitly picked by the user).
      if (hasFilter && counts) {
        if (searchParams.has("forceTab")) {
          return;
        }
        const firstWithCount = Object.keys(counts).find(
          (k) => (counts as Record<string, number>)[k] > 0,
        );

        if (firstWithCount) {
          const currentTab =
            searchParams.get("tab") || FULFILLMENT_STAGES[0].key;
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

  // When the URL search params change, sync the select filters back into the
  // form. The search field is left alone: it is an uncontrolled AppInput wired
  // through `register`, seeded from the URL in defaultValues — pushing URL
  // values back into it mid-typing would clobber in-flight keystrokes.
  useEffect(() => {
    const t = searchParams.get("type") || "all";
    const r = searchParams.get("routeId") || "all";

    // Only set if different to avoid extra re-renders
    if (getValues("type") !== t) setValue("type", t);
    if (getValues("routeId") !== r) setValue("routeId", r);
  }, [searchParams, setValue, getValues]);

  const handleTypeChange = (value: string) => {
    setValue("type", value);
    handleFilterChange();
  };

  // What every board lane filters by — the lane adds its own stage on top.
  const boardFilters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      type: searchParams.get("type") || "all",
      routeId: searchParams.get("routeId") || "all",
    }),
    [
      searchParams.get("search"),
      searchParams.get("type"),
      searchParams.get("routeId"),
    ],
  );

  const handleTabChange = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", key);
    // mark that the tab was explicitly set by the user so auto-switching
    // logic (which runs when filters change) does not override user choice
    next.set("forceTab", "1");
    setSearchParams(next);
  };


  return (
    <>
      <AppHeader
        sectionKey="bill"
        activeTab="orders"
        mobileLead="menu"
        title="Fulfillment List"
        showAudioNote={true}
        audioNoteTitle="Fulfillment List"
        audioFeature="manageFulfillment"
      />
      {/* `tw:p-4` instead of `page-padding` (same as the subscribe layout):
          theme-2 desktop zeroes `.page-padding` and re-adds a 1rem left/right
          gutter on `.section-content`; `tw:p-4` keeps the content flush. */}
      <div className="page-bg app-page tw:p-4">
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu sectionKey="bill" activeTab="orders" title="Bill" />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Board / Directory / Analytics + the board search on one
                    white strip under the header. Every lane filters on that one
                    search field, so a search re-queries the whole pipeline at
                    once. */}
                <OrderTopBar
                  activeView="board"
                  searchInput={
                    /* Uncontrolled, register-wired AppInput — the same pattern
                        as the orders list filter. Typing updates the form
                        directly and the debounced handler applies it to the
                        URL, which every board lane filters on. */
                    <AppInput
                      name="search"
                      register={register}
                      onChange={() => handleSearch()}
                      placeholder="Search order #, customer, product…"
                      className="tw:flex-1"
                      leftIcon={
                        <SearchIcon size={16} className="tw:text-gray-500" />
                      }
                      inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
                    />
                  }
                  actions={
                    /* The order-type filter lives in the side pane in theme-2. */
                    <div className="hide-in-theme-2">
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
                  }
                />

                {/* Breadcrumb / description — dropped in theme-2, where the
                    header and the side pane already name the page. */}
                <div className="hide-in-theme-2">
                  <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                  <PageDescription
                    description="manageFulfillment"
                    className="tw:mb-4"
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

                {/* The pipeline as a swipeable board — one lane per stage,
                    each paging its own orders. */}
                <FulfillmentBoard
                  filters={boardFilters}
                  stageCounts={stageCounts}
                  stageCountsLoading={stageCountsLoading}
                  activeStage={activeTab}
                  onStageChange={handleTabChange}
                />
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                {/* No search here — the top bar's field is visible on this
                    breakpoint too, and both write the same URL param. */}
                <FulfillmentSidePane
                  type={type as FulfillmentTypeKey}
                  onTypeChange={handleTypeChange}
                  activeStage={activeTab}
                  stageCounts={stageCounts}
                  stageCountsLoading={stageCountsLoading}
                  onStageChange={handleTabChange}
                />
              </AppPaneSide>
            </div>
          </div>
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
