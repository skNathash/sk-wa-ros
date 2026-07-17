import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import AppliedFilters from "./components/AppliedFilters";
import { defaultFormFilter, getBreadcrumbItems, getTitle } from "./helper";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";
import Products from "./components/products/Products";
import Brands from "./components/brands/Brands";
import Category from "./components/category/Category";
import { Box, Layers, Tag } from "lucide-react";

const tabItems: TabItem[] = [
  { key: "products", name: "My Products", icon: <Box size={18} /> },
  { key: "brands", name: "Brands", icon: <Tag size={18} /> },
  { key: "categories", name: "Categories", icon: <Layers size={18} /> },
];

const ProductSelect = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const feature = searchParams.get("feature");
  const activeTab = searchParams.get("tab") || "products";
  const source = searchParams.get("source") || "";

  const formMethods = useForm({
    defaultValues: { ...defaultFormFilter },
  });

  const breadcrumbs: BreadcrumbItem[] = getBreadcrumbItems(
    feature ?? "",
    source,
  );

  const handleFilterChange = (formDataOrResult: any) => {
    // If called by AppliedFilters with a remove action, clear specific query params
    if (formDataOrResult?.action === "remove" && formDataOrResult.data) {
      const { key } = formDataOrResult.data;
      const next = new URLSearchParams(searchParams.toString());

      // remove params per key
      if (key === "brand") {
        next.delete("brandId");
        next.delete("brandName");
      } else if (key === "category") {
        next.delete("categoryId");
        next.delete("categoryName");
      } else if (key === "menu" || key === "menus") {
        next.delete("menuId");
        next.delete("menuName");
      } else if (key === "companyName") {
        next.delete("companyId");
        next.delete("companyName");
      } else if (key === "alpha") {
        next.delete("alpha");
      } else if (key === "search") {
        next.delete("search");
      } else if (key === "withoutStock") {
        next.delete("withoutStock");
      } else if (key === "status") {
        next.delete("status");
      } else if (key === "velocity") {
        next.delete("velocity");
      } else if (key === "stockStatus") {
        next.delete("stockStatus");
      } else if (key === "keys") {
        next.delete("keys");
      }

      // ensure feature/tab persist or are removed correctly
      const currentFeature = searchParams.get("feature");
      const tab = searchParams.get("tab");
      if (currentFeature) next.set("feature", currentFeature);
      if (tab) next.set("tab", tab);

      setSearchParams(next, { replace: true });
      return;
    }

    // Otherwise, assume a full form data object and rebuild params
    const formData = formDataOrResult || {};
    const currentFeature = searchParams.get("feature");
    const tab = searchParams.get("tab");

    const params =
      InventoryDealFilterService.prepareInventoryFilterQueryParams(formData);

    if (currentFeature) params.set("feature", currentFeature);
    if (tab) params.set("tab", tab);

    if (formData.search) params.set("search", formData.search);

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    let search = searchParams.get("search");
    if (!feature) return;

    const formData = InventoryDealFilterService.prepareInventoryParamToFormData(
      Object.fromEntries(searchParams?.entries() || {}),
    );

    const alpha = searchParams.get("alpha");

    let params: Record<string, any> = {
      ...formData,
      alpha: alpha || "",
    };

    if (search) params.search = search;

    formMethods.reset({ ...params });
  }, [searchParams, formMethods, feature]);

  const handleTabChange = (tab: TabItem) => {
    const sort = searchParams.get("globalSort");
    const currentFeature = searchParams.get("feature");
    const showCheckbox = searchParams.get("showCheckbox");
    const next = new URLSearchParams();
    if (currentFeature) next.set("feature", currentFeature);
    if (showCheckbox) next.set("showCheckbox", showCheckbox);
    if (sort) next.set("globalSort", sort);
    next.set("tab", tab.key);
    formMethods.reset({ ...defaultFormFilter });
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <AppHeader title={getTitle(feature ?? "")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          <div className="tw:mb-4">
            <InfoBlock size="sm" variant="info" bordered>
              {feature === "PriceUpdate" ? (
                <>
                  Add products to update B2B scheme. Finalize and apply changes
                  from the cart. <br />
                  <span className="tw:text-xs tw:font-medium">
                    Note: This is applicable only for B2B customers.
                  </span>
                </>
              ) : feature === "PackUpdate" ? (
                <>Select products to configure case and inner-case packaging.</>
              ) : feature === "ReserveConfig" ? (
                <>
                  Select products to manage and update stock reservation rules.
                </>
              ) : feature === "PromotionDealUpdate" ? (
                <>Select products to configure and manage promotional deals.</>
              ) : (
                <>Select products to add to cart or perform related actions.</>
              )}
            </InfoBlock>
          </div>

          <AppTab
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="tabs"
            className="tw:mb-4"
          />

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterChange} />

            {(feature === "PackUpdate" || feature === "PriceUpdate") && (
              <label
                className={`tw:flex tw:items-center tw:gap-2.5 tw:mb-3 tw:px-3.5 tw:py-2.5 tw:rounded-xl tw:border-2 tw:cursor-pointer tw:select-none tw:transition-all tw:text-sm tw:font-semibold ${
                  searchParams.get("notConfiguredOnly") === "1"
                    ? "tw:bg-amber-50 tw:border-amber-400 tw:text-amber-900 tw:shadow-sm"
                    : "tw:bg-white tw:border-dashed tw:border-gray-300 tw:text-gray-500 tw:hover:border-amber-300 tw:hover:bg-amber-50/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={searchParams.get("notConfiguredOnly") === "1"}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    if (e.target.checked) {
                      next.set("notConfiguredOnly", "1");
                    } else {
                      next.delete("notConfiguredOnly");
                    }
                    setSearchParams(next, { replace: true });
                  }}
                  className="tw:w-4 tw:h-4 tw:accent-amber-600 tw:rounded"
                />
                {feature === "PackUpdate"
                  ? "Show only not configured Sell In"
                  : "Show only not configured B2B Scheme"}
              </label>
            )}

            <AppliedFilters callback={handleFilterChange} />

            {activeTab === "products" && <Products />}
            {activeTab === "brands" && <Brands />}
            {activeTab === "categories" && <Category />}
          </FormProvider>
        </div>
      </div>
    </>
  );
};

export default ProductSelect;
