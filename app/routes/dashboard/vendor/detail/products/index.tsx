import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import useScreenView from "~/hooks/useScreenView";
import useAppNav from "~/hooks/useAppNav";
import type {
  PaginationState,
  SortProps,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import {
  DEFAULT_FILTER,
  getCount,
  getData,
  prepareParams,
  type FilterFormData,
} from "./helper";

import { FormProvider, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { Circle, CircleIcon } from "lucide-react";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import Brands from "./components/brands/Brands";
import Browse from "./components/browse/Browse";
import Filter from "./components/filter/Filter";
import ProductAppliedFilter from "./components/AppliedFilter";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import CommonService from "~/services/CommonService";

const Products = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const formMethods = useForm<FilterFormData>({
    defaultValues: DEFAULT_FILTER,
  });

  const { id } = useParams();
  const vendorId = id || "";
  const appNav = useAppNav();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("products");

  const [tabs, setTabs] = useState(() => [
    { key: "products", name: t("products") },
    { key: "brands", name: t("brands") },
  ]);

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});
  const sortRef = useRef<SortProps>({
    key: "name",
    value: "asc",
  });

  // Apply filter (initial load or filter change)
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const sortParam =
        sortRef.current && sortRef.current.value
          ? { key: sortRef.current.key, value: sortRef.current.value }
          : null;
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortParam
      );
      const result = await getData(filterRef.current.vendorId, params);
      setData(result || []);
      const totalRecords = await getCount(filterRef.current.vendorId, params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const sortParam =
        sortRef.current && sortRef.current.value
          ? { key: sortRef.current.key, value: sortRef.current.value }
          : null;
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortParam
      );
      const result = await getData(filterRef.current.vendorId, params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      vendorId,
    };
    applyFilter();
  }, [vendorId]);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };

    applyFilter();
  }, []);

  const onSort = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data,
    };
    applyFilter();
  }, []);

  // Unified callback to handle actions from Desktop/Mobile views
  const itemCallbackUnified = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (!data) return;

      if (action === "brand") {
        const value = [
          {
            label: data.name,
            value: { id: data.id, name: data.name },
          },
        ];
        formMethods.setValue("brand", value);
        filterRef.current = {
          ...filterRef.current,
          brand: formMethods.getValues("brand"),
        };
        applyFilter();
        setActiveTab(tabs[0].key);
      } else if (action === "view-brands") {
        // Apply brand filter and switch to products tab (same as 'brand' action)
        const value = [
          {
            label: data.brandName,
            value: {
              id: data.brandId,
              name: data.brandName,
            },
          },
        ];
        formMethods.setValue("brand", value);
        filterRef.current = {
          ...filterRef.current,
          brand: formMethods.getValues("brand"),
        };
        applyFilter();
        setActiveTab(tabs[0].key);
      } else if (action === "category") {
        const value = [
          {
            label: data.name,
            value: { id: data.id, name: data.name },
          },
        ];
        formMethods.setValue("category", value);
        filterRef.current = {
          ...filterRef.current,
          category: formMethods.getValues("category"),
        };
        applyFilter();
        setActiveTab(tabs[0].key);
      }
    },
    [applyFilter, formMethods, tabs]
  );

  const onTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    filterRef.current = {
      ...filterRef.current,
      activeTab: tab.key,
    };
    applyFilter();
  };

  const appliedFilterCb = (filters: { formData: any }) => {
    // update form values from applied filter component and trigger
    const vals = filters.formData || {};
    Object.keys(vals).forEach((k) => {
      formMethods.setValue(k as any, vals[k]);
    });
    filterRef.current = {
      ...filterRef.current,
      ...formMethods.getValues(),
    };
    applyFilter();
  };

  return (
    <>
      {/* Tabs: products, brands, browse */}
      <div className="tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`tw:inline-flex tw:items-center tw:gap-2 tw:rounded-md tw:transition-all tw:duration-150 tw:text-sm ${
                  isActive
                    ? "tw:text-gray-900 tw:font-semibold"
                    : "tw:text-gray-600"
                }`}
              >
                <span className="tw:w-4 tw:h-4 tw:flex tw:items-center tw:justify-center">
                  {isActive ? (
                    <CircleIcon
                      size={16}
                      className="tw:fill-primary tw:text-primary"
                    />
                  ) : (
                    <Circle size={16} className="tw:text-gray-400" />
                  )}
                </span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render content based on active tab */}
      {activeTab === "products" && (
        <>
          <FormProvider {...formMethods}>
            <Filter callback={onFilterChange} vendorId={vendorId} />
            <ProductAppliedFilter onFilterChange={appliedFilterCb} />
          </FormProvider>

          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
            <div>
              <PaginationSummary
                loadingTotalRecords={loading}
                paginationConfig={paginationRef.current}
                fwSize="sm"
                className="tw:mb-0"
                loadedCount={data.length}
              />
            </div>
            <div>
              <ViewToggle viewType={viewType} callback={setViewType} />
            </div>
          </div>

          {isMobile || viewType === "card" ? (
            <MobileView
              data={data}
              loading={loading}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              hasMoreData={hasMoreData}
              callback={itemCallbackUnified}
            />
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                callback={itemCallbackUnified}
                onSort={onSort}
                sortKey={sortRef.current.key}
                sortValue={sortRef.current.value}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                hasMoreData={hasMoreData}
              />
            </AppCard>
          )}
        </>
      )}

      {activeTab === "brands" && (
        <Brands vendorId={vendorId} callback={itemCallbackUnified} />
      )}

      {activeTab === "browse" && <Browse vendorId={vendorId} />}
    </>
  );
};

export default Products;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Products"),
    },
  ];
}
