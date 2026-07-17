import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import ManagePriceTabs from "../../components/ManagePriceTabs";
import Filter from "./components/Filter";
import type { SchemeFilterForm } from "./helper";
import { getSummary } from "./helper";
import Summary from "./components/products/Summary";
import Products from "./components/products/Products";
import Brands from "./components/brands/Brands";
import Exclude from "./components/exclude/Exclude";

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
      <AppHeader title="B2B Schemes" />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} />
              <PageDescription description="b2bSchemes" className="tw:mb-4" />
            </div>
            {!isMobile && renderActionButton()}
          </div>

          <ManagePriceTabs activeTab="b2bScheme" className="tw:mb-4" />

          <Summary summary={summary} />

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterChange} activeTab={activeTab} />
          </FormProvider>

          <AppTab
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="tabs"
            className="tw:mb-4"
          />

          {activeTab === "products" ? (
            <Products />
          ) : activeTab === "brands" ? (
            <Brands />
          ) : activeTab === "exclude" ? (
            <Exclude />
          ) : null}
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
