import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import type { FastMovingProduct } from "../../helper";
import useScreenView from "~/hooks/useScreenView";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import Filter from "./components/Filter";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppliedFilters from "./components/AppliedFilters";
import { getData, getCount, prepareParams } from "./helper";

const TopFastMovingProducts = () => {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<Record<string, any>>({
    defaultValues: {
      search: "",
    },
  });

  const [viewType, setViewType] = useState<ViewToggleType>("list");
  const [data, setData] = useState<FastMovingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = async () => {
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
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error fetching fast moving products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Error loading more fast moving products:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const updateSearchParams = (updates: Record<string, string | undefined>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        return next;
      },
      { preventScrollReset: true },
    );
  };

  const handleFilterChange = (args?: { action: string; data?: any }) => {
    if (
      args?.action === "brand" ||
      args?.action === "category" ||
      args?.action === "menu"
    ) {
      const { id, name } = args.data || {};
      updateSearchParams({
        [`${args.action}Id`]: id,
        [`${args.action}Name`]: name,
      });
      return;
    }

    if (args?.action === "alpha") {
      updateSearchParams({
        alpha: args.data?.alpha || undefined,
        search: args.data?.alpha
          ? undefined
          : args.data?.search?.trim() || undefined,
      });
      return;
    }

    // Set filter modal values into form before syncing
    if (args?.action === "filter" && args.data) {
      formMethods.setValue("menu", args.data.menu);
      formMethods.setValue("category", args.data.category);
      formMethods.setValue("brand", args.data.brand);
    }

    // Sync current form values to search params
    const values = formMethods.getValues();
    updateSearchParams({
      search: values.search?.trim() || undefined,
      alpha: values.alpha || undefined,
      menuId: values.menu?.value?.id || undefined,
      menuName: values.menu?.value?.name || undefined,
      categoryId: values.category?.value?.id || undefined,
      categoryName: values.category?.value?.name || undefined,
      brandId: values.brand?.value?.id || undefined,
      brandName: values.brand?.value?.name || undefined,
    });
  };

  const handleViewCallback = (args: { action: string; data?: any }) => {
    handleFilterChange(args);
  };

  const handleFilterRemove = useCallback(
    (key: string) => {
      formMethods.setValue(key, key === "search" ? "" : undefined);
      const paramKeys: Record<string, string[]> = {
        search: ["search"],
        menu: ["menuId", "menuName"],
        category: ["categoryId", "categoryName"],
        brand: ["brandId", "brandName"],
      };
      const keysToRemove = paramKeys[key] || [];
      const updates: Record<string, undefined> = {};
      keysToRemove.forEach((k) => (updates[k] = undefined));
      updateSearchParams(updates);
    },
    [formMethods],
  );

  // Restore filters from search params on mount
  useEffect(() => {
    const search = searchParams.get("search") || "";
    const alpha = searchParams.get("alpha") || "";
    const menuId = searchParams.get("menuId");
    const menuName = searchParams.get("menuName");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const brandId = searchParams.get("brandId");
    const brandName = searchParams.get("brandName");

    formMethods.setValue("search", search);
    formMethods.setValue("alpha", alpha);

    if (menuId) {
      formMethods.setValue("menu", {
        label: menuName || "",
        value: { id: menuId, name: menuName || "" },
      } as any);
    } else {
      formMethods.setValue("menu", undefined);
    }
    if (categoryId) {
      formMethods.setValue("category", {
        label: categoryName || "",
        value: { id: categoryId, name: categoryName || "" },
      } as any);
    } else {
      formMethods.setValue("category", undefined);
    }
    if (brandId) {
      formMethods.setValue("brand", {
        label: brandName || "",
        value: { id: brandId, name: brandName || "" },
      } as any);
    } else {
      formMethods.setValue("brand", undefined);
    }

    applyFilter();
  }, [searchParams]);

  return (
    <>
      <FormProvider {...formMethods}>
        <Filter callback={handleFilterChange} />
        <AppliedFilters onRemove={handleFilterRemove} />
      </FormProvider>

      <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            fwSize="sm"
            loadedCount={data.length}
          />
        </div>
        <ViewToggle viewType={viewType} callback={setViewType} />
      </div>

      {isMobile || viewType === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          showLoadMore={hasMoreData}
          callback={handleViewCallback}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            showLoadMore={hasMoreData}
            callback={handleViewCallback}
          />
        </AppCard>
      )}
    </>
  );
};

export default TopFastMovingProducts;
