import { Plus } from "lucide-react";
import AppTab from "~/components/core/tab/AppTab";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PricingSidePane from "~/shared/inventory/components/pricing-side-pane/PricingSidePane";
import PriceTabs from "~/shared/configs/components/price-tabs/PriceTabs";
import Filter from "./components/Filter";
import type { SchemeFilterForm } from "./helper";
import { getSummary } from "./helper";
import Summary from "./components/products/Summary";
import Products from "./components/products/Products";
import Brands from "./components/brands/Brands";
import Exclude from "./components/exclude/Exclude";
import PricingChannelCards from "~/shared/configs/components/pricing-channel-cards/PricingChannelCards";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "B2B Schemes" },
];

const tabItems: TabItem[] = [
  { key: "products", name: "Products" },
  { key: "brands", name: "Brands" },
  { key: "exclude", name: "Excluded B2B Customers" },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.PRICE-SCHEME-VIEW"]);
}

const SchemesList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "products";
  const initialStatus = searchParams.get("status") || "running";

  const formMethods = useForm<SchemeFilterForm>({
    defaultValues: {
      search: "",
      dateRange: [],
      status: initialStatus,
      alpha: "",
    },
  });

  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const [summary, setSummary] = useState({
    totalCount: 0,
    runningCount: 0,
    upcomingCount: 0,
    expiredCount: 0,
  });

  const fetchSummary = async () => {
    const filters = formMethods.getValues();
    const brandId = searchParams.get("brandId") || "";
    const summaryData = await getSummary({ ...filters, brandId });
    setSummary(summaryData);
  };

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const status = searchParams.get("status") || "running";
    const alpha = searchParams.get("alpha") || "";

    formMethods.setValue("search", search);
    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [new Date(dateFrom), new Date(dateTo)]);
    } else {
      formMethods.setValue("dateRange", []);
    }
    formMethods.setValue("status", status);
    formMethods.setValue("alpha", alpha);

    fetchSummary();
  }, [searchParams]);

  const renderActionButton = () => {
    return (
      <Rbac roles={["CONFIGS.PRICE-SCHEME-CREATE"]}>
        <div className="tw:flex tw:gap-2 tw:justify-end">
          <AppButton
            color="primary"
            fill="solid"
            onClick={() => {
              appNav.to("/configs/product-select", {
                feature: "PriceUpdate",
                source: "schemes",
              });
            }}
          >
            <Plus className="tw:w-4 tw:h-4" />
            Create Scheme
          </AppButton>
        </div>
      </Rbac>
    );
  };

  const handleFilterChange = (args: { formData: any }) => {
    const { formData } = args;
    const { search, dateRange, status, alpha } = formData;

    const next = new URLSearchParams(searchParams);

    if (search) {
      next.set("search", search);
    } else {
      next.delete("search");
    }

    if (dateRange && dateRange.length > 0) {
      next.set("dateFrom", dateRange[0].toISOString());
      next.set("dateTo", dateRange[1].toISOString());
    } else {
      next.delete("dateFrom");
      next.delete("dateTo");
    }

    if (status) {
      next.set("status", status);
    }

    if (alpha) {
      next.set("alpha", alpha);
    } else {
      next.delete("alpha");
    }

    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (tab: TabItem) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab.key);
    // When switching tabs, we might want to preserve or reset some filters
    // Based on requirements, "the index.tsx need to send the tab in the query params"
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      {/* No `sectionKey` (drops the theme-2 section dropdown) and the default
          `back` lead (drops the hamburger) — this is a leaf of Manage Price,
          so the title stays plain and the way out is back. */}
      <AppHeader title="B2B Schemes" />
      <div className="page-bg app-page tw:p-4">
        <div className="section-layout">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="pricing"
                title="Manage Catalog"
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Dropped wholesale in theme-2 (both children are hidden there
                    anyway) so the empty wrapper stops contributing a stack gap
                    above the command bar. */}
                <div className="tw:flex-1 hide-in-theme-2">
                  <AppBreadcrumbs data={breadcrumbs} />
                  <PageDescription
                    description="b2bSchemes"
                    className="tw:mb-4"
                  />
                </div>

                {/* Pricing command bar — same block as Manage Price: the
                    channel cards (schemes are a B2B tool, so the row stays on
                    B2B and the other channels navigate away) above the
                    underline tab row. */}
                <div className="pricing-command-bar tw:-mt-6 tw:md:mt-0">
                  <div className="tw:px-4 tw:py-2 tw:md:pt-3 tw:md:py-0">
                    {/* Schemes only exist on B2B — the cards navigate back to
                        Manage Price for any other channel. */}
                    <PricingChannelCards
                      activeKey="network"
                      // Compact tab row on mobile; full cards from md up.
                      variant={isMobile ? "tab" : "card"}
                    />
                  </div>

                  <PriceTabs
                    type="network"
                    activeTab="b2bScheme"
                    className="tw:mt-1 tw:px-4 tw:hidden tw:md:block"
                  />
                </div>

                {/* Filter leads, the counts read below it. On mobile the block
                    is its own white band running edge to edge (`app-bleed-x`
                    cancels the page gutter); desktop keeps it inline. */}
                <div className="tw:mb-3 tw:bg-white tw:px-4 tw:py-2 app-bleed-x tw:md:mb-0 tw:md:bg-transparent tw:md:px-0 tw:md:py-0">
                  <FormProvider {...formMethods}>
                    <Filter
                      callback={handleFilterChange}
                      activeTab={activeTab}
                    />
                  </FormProvider>
                </div>

                <Summary summary={summary} />

                {/* Create sits beside the scope tabs, so the action follows the
                    selection it applies to instead of the page title. */}
                <div className="tw:mb-4 tw:flex tw:items-center tw:gap-3">
                  <AppTab
                    tabs={tabItems}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    variant="tabs"
                    className="tw:min-w-0 tw:flex-1"
                  />
                  {!isMobile && renderActionButton()}
                </div>

                {activeTab === "products" ? (
                  <Products />
                ) : activeTab === "brands" ? (
                  <Brands />
                ) : activeTab === "exclude" ? (
                  <Exclude />
                ) : null}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <PricingSidePane title="B2B Schemes" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="app-footer tw:p-4 tw:text-end">
          {renderActionButton()}
        </div>
      )}
    </>
  );
};

export default SchemesList;
