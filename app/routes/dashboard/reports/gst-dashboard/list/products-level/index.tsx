import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import AppButton from "~/components/core/button/AppButton";
import { Download } from "lucide-react";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import Filter from "./components/Filter";
import AppliedFilters from "./components/AppliedFilters";
import { getCount, getData, prepareParams } from "./helper";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";

import type { ViewToggleType } from "~/types/CommonTypes";
import { useSearchParams } from "react-router";
import { format } from "date-fns";
import ReportDownloadOption from "~/shared/others/components/ReportDownloadOption";

type CatalogItem = {
  label: string;
  value: {
    id: string;
    name: string;
  };
};

type FormData = {
  search: string;
  menu: Array<CatalogItem>;
  category: Array<CatalogItem>;
  brand: Array<CatalogItem>;
  gst: string;
  dateFrom?: Date;
  dateTo?: Date;
};

const ProductsLevel = () => {
  const { isMobile } = useScreenView();

  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm<FormData>({
    defaultValues: {
      search: "",
      menu: [],
      category: [],
      brand: [],
      gst: "all",
    },
  });

  const { getValues, reset } = formMethods;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [hasMoreData, setHasMoreData] = useState(true);
  const [showLoadMore, setShowLoadMore] = useState(false);

  // filter values are stored in react-hook-form; filterRef removed
  const paginationRef = useRef<any>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const [view, setView] = useState<ViewToggleType>("list");

  const sortRef = useRef<{ key: string; value: "asc" | "desc" } | undefined>(
    undefined,
  );

  const applyFilter = useCallback(async () => {
    // reset pagination
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(
        getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const result = await getData(params);
      setData(result);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
      setShowLoadMore(
        result.length > 0 && paginationRef.current.totalRecords > result.length,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  // On mount / when query params change: parse URL params into form values and apply filter
  useEffect(() => {
    const urlParams = Object.fromEntries(searchParams.entries());

    const search = urlParams.search || "";
    const menuId = urlParams.menuId || "";
    const menuName = urlParams.menuName || "";
    const categoryId = urlParams.categoryId || "";
    const categoryName = urlParams.categoryName || "";
    const brandId = urlParams.brandId || "";
    const brandName = urlParams.brandName || "";
    const gst = urlParams.gst || "";
    const dateFrom = urlParams.dateFrom || "";
    const dateTo = urlParams.dateTo || "";

    let menu: Array<CatalogItem> = [];
    let category: Array<CatalogItem> = [];
    let brand: Array<CatalogItem> = [];

    if (menuId && menuName) {
      menu = [
        {
          label: menuName,
          value: { id: menuId, name: menuName },
        },
      ];
    }

    if (categoryId && categoryName) {
      category = [
        {
          label: categoryName,
          value: { id: categoryId, name: categoryName },
        },
      ];
    }

    if (brandId && brandName) {
      brand = [
        {
          label: brandName,
          value: { id: brandId, name: brandName },
        },
      ];
    }

    reset({
      search,
      menu,
      category,
      brand,
      gst: gst || "all",
      dateFrom: new Date(dateFrom as string),
      dateTo: new Date(dateTo as string),
    });

    void applyFilter();
  }, [searchParams, reset, applyFilter]);

  // callback from Filter component
  const handleFilterChange = useCallback(() => {
    const formData = getValues();

    let params: Record<string, any> = {
      dateFrom: formData.dateFrom
        ? format(new Date(formData.dateFrom), "yyyy-MM-dd")
        : undefined,
      dateTo: formData.dateTo
        ? format(new Date(formData.dateTo), "yyyy-MM-dd")
        : undefined,
    };

    const menuId = formData?.menu?.[0]?.value?.id || "";
    const menuName = formData?.menu?.[0]?.value?.name || "";
    const categoryId = formData?.category?.[0]?.value?.id || "";
    const categoryName = formData?.category?.[0]?.value?.name || "";
    const brandId = formData?.brand?.[0]?.value?.id || "";
    const brandName = formData?.brand?.[0]?.value?.name || "";

    if (menuId && menuName) {
      params.menuId = menuId;
      params.menuName = menuName;
    }

    if (categoryId && categoryName) {
      params.categoryId = categoryId;
      params.categoryName = categoryName;
    }

    if (brandId && brandName) {
      params.brandId = brandId;
      params.brandName = brandName;
    }

    const search = formData?.search || "";
    if (search) {
      params.search = search;
    }

    const gst = formData?.gst || "all";
    if (gst) {
      params.gst = gst;
    }

    setSearchParams(params, {
      replace: true,
    });
  }, [applyFilter]);

  // Handle callbacks from DesktopView/MobileView when user taps menu/brand/category
  const handleViewCallback = useCallback(
    ({
      action,
      data,
    }: {
      action: string;
      data: { id?: string; name?: string };
    }) => {
      // Build new params by reading existing params and updating only relevant keys
      const prev = Object.fromEntries(searchParams.entries());

      const newParams: Record<string, any> = { ...prev };

      if (!data) return;

      const id = data.id || "";
      const name = data.name || "";

      if (action === "menu") {
        if (id) newParams.menuId = id;
        if (name) newParams.menuName = name;

        // clear category/brand when changing menu
        delete newParams.categoryId;
        delete newParams.categoryName;
        delete newParams.brandId;
        delete newParams.brandName;
      } else if (action === "category") {
        if (id) newParams.categoryId = id;
        if (name) newParams.categoryName = name;

        // keep menu as-is; changing category may clear brand
        delete newParams.brandId;
        delete newParams.brandName;
      } else if (action === "brand") {
        if (id) newParams.brandId = id;
        if (name) newParams.brandName = name;
      }

      // Update the search params in URL (replace history)
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: any }) => {
      sortRef.current = { key, value };
      // fire-and-forget the async filter
      void applyFilter();
    },
    [applyFilter],
  );

  const handleDownload = useCallback(() => {
    const fid = AuthService.getLoggedInUserId();
    const params = prepareParams(getValues(), {}, sortRef.current);

    ReportService.getGstDashboardProductLevelDownload(fid, params);
  }, [getValues]);

  return (
    <>
      <div className="tw:mb-3">
        <FormProvider {...formMethods}>
          <Filter callback={handleFilterChange} />
          <AppliedFilters callback={handleFilterChange} />
        </FormProvider>

        {data.length > 0 && (
          <div className="tw:min-w-0 tw:my-4">
            <div className="tw:text-xs tw:font-semibold tw:mb-2">
              Download Report as
            </div>
            <ReportDownloadOption
              view="swiper"
              callback={() => {
                handleDownload();
              }}
            />
          </div>
        )}

        <div className="tw:flex tw:justify-between tw:items-center tw:my-2">
          <div className="tw:flex-1">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>

          <div className="tw:flex tw:items-center tw:gap-2">
            <ViewToggle viewType={view} callback={setView} />
          </div>
        </div>
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          loadingMore={loadingMore}
          showLoadMore={showLoadMore}
          loadMore={loadMore}
          loadedCount={data.length}
          totalCount={paginationRef.current.totalRecords}
          callback={handleViewCallback}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            loadingMore={loadingMore}
            showLoadMore={showLoadMore}
            loadMore={loadMore}
            sortKey={sortRef.current?.key || ""}
            sortValue={sortRef.current?.value}
            onSort={handleSort}
            loadedCount={data.length}
            totalCount={paginationRef.current.totalRecords}
            callback={handleViewCallback}
          />
        </AppCard>
      )}
    </>
  );
};

export default ProductsLevel;
