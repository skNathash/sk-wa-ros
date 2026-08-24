import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import type { CategoryValue } from "../../helper";
import useScreenView from "~/hooks/useScreenView";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import Filter from "./components/Filter";
import DesktopView, { headers } from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppliedFilters from "./components/AppliedFilters";
import SortPopover, {
  buildSortOptions,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import { Download } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import { getData, getCount, downloadExport, prepareParams } from "./helper";

const defaultSort: SortValue = {
  key: "categoryName",
  value: 1,
};

const sortOptions = buildSortOptions(headers);

const CategoryWiseProducts = () => {
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<Record<string, any>>({
    defaultValues: {
      search: "",
    },
  });

  const [viewType, setViewType] = useState<ViewToggleType>("list");
  const [sort, setSort] = useState<SortValue>(defaultSort);
  const [data, setData] = useState<CategoryValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
        sort,
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error fetching category wise products:", error);
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
        sort,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Error loading more category wise products:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, sort]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const params = prepareParams(formMethods.getValues(), undefined, sort);
      const result = await downloadExport(params);
      if (result?.fileName) {
        CommonService.downloadExportFile(result.service, result.fileName);
      } else {
        appToast.show({ color: "error", msg: "No data available to export" });
      }
    } catch (error) {
      console.error("Error downloading category wise products:", error);
      appToast.show({ color: "error", msg: "Failed to download export" });
    } finally {
      setDownloading(false);
    }
  };

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
    if (args?.action === "alpha") {
      updateSearchParams({
        alpha: args.data?.alpha || undefined,
        search: args.data?.alpha
          ? undefined
          : args.data?.search?.trim() || undefined,
      });
      return;
    }

    // Sync current form values to search params
    const values = formMethods.getValues();
    updateSearchParams({
      search: values.search?.trim() || undefined,
      alpha: values.alpha || undefined,
    });
  };

  const handleCountClick = (
    item: CategoryValue,
    tab: "fast_moving" | "slow_moving" | "non_moving",
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "products");
        next.set("view", tab);
        if (item.categoryRefId) {
          next.set("categoryId", item.categoryRefId);
          next.set("categoryName", item.categoryName || "");
        } else {
          next.delete("categoryId");
          next.delete("categoryName");
        }
        // Clear category-wise specific filters that don't apply to the
        // sku movement list, plus any lingering menu/brand filters from a
        // previous sku movement view.
        next.delete("search");
        next.delete("alpha");
        next.delete("menuId");
        next.delete("menuName");
        next.delete("brandId");
        next.delete("brandName");
        return next;
      },
      { preventScrollReset: true },
    );
  };

  const handleFilterRemove = useCallback(
    (key: string) => {
      formMethods.setValue(key, key === "search" ? "" : undefined);
      const paramKeys: Record<string, string[]> = {
        search: ["search"],
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

    formMethods.setValue("search", search);
    formMethods.setValue("alpha", alpha);

    applyFilter();
  }, [searchParams, sort]);

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
        <div className="tw:flex tw:items-center tw:gap-2">
          <AppButton
            size="small"
            fill="outline"
            color="secondary"
            isLoading={downloading}
            onClick={handleDownload}
          >
            <Download size={16} className="tw:mr-1" />
            Download
          </AppButton>
          <div className="tw:md:hidden">
            <SortPopover
              options={sortOptions}
              sortValue={sort}
              onSort={setSort}
            />
          </div>
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
          showLoadMore={hasMoreData}
          onCountClick={handleCountClick}
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
            sort={sort}
            onSort={setSort}
            onCountClick={handleCountClick}
          />
        </AppCard>
      )}
    </>
  );
};

export default CategoryWiseProducts;
