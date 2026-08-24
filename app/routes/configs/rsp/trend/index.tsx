import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import PriceTabs from "~/shared/configs/components/price-tabs/PriceTabs";
import PricingChannelCards from "~/shared/configs/components/pricing-channel-cards/PricingChannelCards";
import PriceEvents from "~/shared/inventory/components/price-events/PriceEvents";
import PricingSidePane from "~/shared/inventory/components/pricing-side-pane/PricingSidePane";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import PricingSummaryCards from "../list/components/PricingSummaryCards";
import { getSummary, type PriceSummary } from "../list/helper";
import { computePricingStats } from "../list/insights";
import DealList from "./components/deal-list/DealList";
import Filter from "./components/Filter";
import InAndAround from "./components/in-and-around/InAndAround";
import type { TrendDeal } from "./components/deal-list/helper";
import { defaultBreadcrumbs } from "./helper";
import TrendDetailModal from "./modals/trend-detail/TrendDetailModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.PRICING"]);
}

/**
 * Trend Watch — the price-trend view of Manage Price.
 *
 * The screen is a picker beside a detail panel: {@link DealList} owns the
 * middle column (its own filters, fetching and selection), and the right
 * column charts whichever SKU is picked. The channel cards and the tab bar are
 * the same ones the price sheet carries, so switching views keeps its place.
 */
const PriceTrend = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") as "network" | "customer";
  const effectiveType = type || "customer";

  const [summary, setSummary] = useState<PriceSummary | null>(null);
  const [selected, setSelected] = useState<TrendDeal | null>(null);

  // Mobile search lives up here in the command bar, so the term is the page's
  // and the picker fetches on it. Desktop keeps its own box inside the picker
  // and never reads this.
  const formMethods = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });
  const [search, setSearch] = useState("");

  const handleFilterChange = useCallback(
    ({ formData }: { formData: any }) => setSearch(formData?.search || ""),
    [],
  );

  // Mobile has no room for the detail column, so the picked SKU's trend is
  // raised in a sheet instead. Desktop never opens it.
  const [showDetail, setShowDetail] = useState(false);

  // Stat strip reports on the whole catalogue here — the trend screen carries
  // no list-wide filter of its own.
  useEffect(() => {
    let cancelled = false;

    getSummary({ page: 1, limit: 1, filter: {} }, effectiveType)
      .then((response) => {
        if (!cancelled) setSummary(response);
      })
      .catch((error) => {
        console.error("Error loading price summary:", error);
        if (!cancelled) setSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveType]);

  // A B2C selection has nothing to say about the B2B trend.
  useEffect(() => {
    setSelected(null);
    setShowDetail(false);
  }, [effectiveType]);

  const stats = useMemo(
    () => computePricingStats([], 0, effectiveType),
    [effectiveType],
  );

  const handleDealListCallback = useCallback(
    ({ action, data }: { action: "select" | "loaded"; data?: TrendDeal }) => {
      if (!data) return;
      setSelected(data);

      // Only a tap raises the sheet — the first page auto-selects a row, and
      // that must not throw a sheet over a screen the user just opened.
      if (isMobile && action === "select") setShowDetail(true);
    },
    [isMobile],
  );


  return (
    <>
      <AppHeader
        title="Price Trend"
        showAudioNote={true}
        audioNoteTitle="Price Trend"
        audioFeature="managePrice"
      />
      <div className="app-page tw:p-4 page-bg">
        {/* Section tabs — mobile-only strip, hidden for now.
        <SectionTabs sectionKey="catalog" activeTab="pricing" noShadow sticky /> */}

        <div className="section-layout">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="pricing"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              <AppPaneMain className="tw:lg:col-span-12">
                <div className="hide-in-theme-2">
                  <AppBreadcrumbs data={defaultBreadcrumbs} />
                </div>

                {/* Pricing command bar — channel cards above the tab row, the
                    same block the price sheet renders. */}
                <div className="pricing-command-bar">
                  <div className="tw:px-4 tw:md:pt-3 tw:py-2 tw:md:py-0">
                    <PricingChannelCards
                      activeKey={effectiveType}
                      // Compact tab row on mobile; full cards from md up —
                      // the same switch the price sheet makes.
                      variant={isMobile ? "tab" : "card"}
                      // Mobile has no underline tab row, so the cards carry
                      // Trend watch as one more pill — and light it, standing
                      // the channel pills down so the strip has one selection.
                      viewTab="trend"
                    />
                  </div>

                  {/* Mobile keeps the SKU search in the command bar — the same
                      spot the price sheet and the electronics screen use — so
                      it stays pinned under the header while the list scrolls.
                      Desktop leaves it in the picker's own header. */}
                  {isMobile && (
                    <div className="tw:border-t tw:border-gray-200 tw:px-4 tw:py-2">
                      <FormProvider {...formMethods}>
                        <Filter callback={handleFilterChange} />
                      </FormProvider>
                    </div>
                  )}

                  {/* Desktop only — on mobile the channel pills above are the
                      whole switcher, same as the price sheet. */}
                  <PriceTabs
                    type={effectiveType}
                    activeTab="trend"
                    className="tw:mt-1 tw:px-4 tw:hidden tw:md:block"
                  />
                </div>

                <div className="tw:hidden tw:md:block">
                  <PricingSummaryCards
                    stats={stats}
                    summary={summary}
                    type={effectiveType}
                  />
                </div>

                {/* Picker + detail. The picker keeps its own height and scrolls
                    internally, so the trend panel beside it stays in view. */}
                <div className="tw:mt-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:lg:grid-cols-12">
                  <AppCard
                    noPadding
                    className="tw:mb-0 tw:lg:col-span-5 tw:xl:col-span-4"
                  >
                    <DealList
                      type={effectiveType}
                      selectedId={selected?._id}
                      callback={handleDealListCallback}
                      showFilter={!isMobile}
                      search={search}
                      className="tw:lg:max-h-[calc(100vh-13rem)]"
                    />
                  </AppCard>

                  {/* Right column — the trend detail for the picked SKU.
                      Hidden below md: on phones the same detail is raised in
                      {@link TrendDetailModal} by tapping a row instead.
                      Scrolls inside its own height, the same cap the picker
                      beside it keeps, so the wheel moves this column alone and
                      the command bar and stat strip stay put. */}
                  <div className="tw:hidden tw:md:block tw:lg:col-span-7 tw:xl:col-span-8 tw:lg:max-h-[calc(100vh-13rem)] tw:lg:overflow-y-auto thin-scrollbar">
                    {selected ? (
                      <div className="tw:flex tw:flex-col tw:gap-3">
                        <AppCard className="tw:mb-0">
                          <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
                            {selected.name}
                          </h3>
                          <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                            {selected.subLabel} · price trend
                          </p>
                        </AppCard>

                        {/* Keyed on the SKU so a fresh pick starts from an
                            empty chart instead of the previous SKU's dots. */}
                        <InAndAround
                          key={selected._id}
                          dealId={selected._id}
                          sellerDealObjId={selected.raw?.sellerDealObjId}
                          pricingType={
                            effectiveType === "network" ? "b2b" : "b2c"
                          }
                        />

                        {/* Same feed the product-view trend carries, keyed on
                            the SKU so a fresh pick refetches. The radius
                            matches the chart above, so the peer moves listed
                            are the peers plotted. */}
                        <PriceEvents
                          key={`events-${selected._id}`}
                          dealId={selected._id}
                          sellerDealObjId={selected.raw?.sellerDealObjId}
                          distance="1000km"
                        />
                      </div>
                    ) : (
                      <AppCard className="tw:mb-0">
                        <p className="tw:text-sm tw:text-slate-500">
                          Pick a SKU on the left to see how its price moved.
                        </p>
                      </AppCard>
                    )}
                  </div>
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+). */}
              <AppPaneSide className="app-pane-only">
                <PricingSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only detail sheet. Its content lives inside the drawer, which
          only mounts while open, so the panels fetch on the tap that raised
          them rather than behind the list. */}
      {isMobile && (
        <TrendDetailModal
          show={showDetail}
          deal={selected}
          type={effectiveType}
          callback={() => setShowDetail(false)}
        />
      )}
    </>
  );
};

export default PriceTrend;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Price Trend"),
    },
  ];
}
