import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
// AppHeader is provided by parent layout; remove local import
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.SUBSCRIBE"], {
    allowNoSubscribe: true,
  });
}

const rbacRoles = {
  subscribe: ["CATALOG.SUBSCRIBE"],
  addProduct: ["CATALOG.ADD-PRODUCT"],
};

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
  alpha: "",
  category: null,
  brand: null,
  isConsumerOffer: false,
};

const SubscribeApprovalHistoryProductsList = () => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common", "inventorySubscribe"]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [breadcrumbs] = useState([
    { label: t("dashboard"), redirect: { path: "/dashboard" } },
    {
      label: t("inventorySubscribe:breadcrumbs.subscription"),
      redirect: { path: "/dashboard/inventory/subscribe/main" },
    },
    { label: t("subscribeApprovalHistory") },
  ]);
  const [title] = useState(t("subscribeApprovalHistoryProducts"));
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "createdAt",
    value: "desc",
  });

  // Helper function to prepare search params from form data
  const prepareSearchParamsFromFormData = useCallback((formData: any) => {
    const params: Record<string, any> = {};

    const categoryId = formData.category?.value?.id;
    const categoryName = formData.category?.label;
    const brandId = formData.brand?.value?.id;
    const brandName = formData.brand?.label;
    const search = formData.search;
    const status = formData.status;
    const alpha = formData.alpha;
    const isConsumerOffer = formData.isConsumerOffer;
    const dateRange = formData.dateRange;

    if (categoryId) {
      params.categoryId = categoryId;
      params.categoryName = categoryName;
    }

    if (brandId) {
      params.brandId = brandId;
      params.brandName = brandName;
    }

    if (search) {
      params.search = search;
    }

    if (status) {
      params.status = status;
    }

    if (alpha) {
      params.alpha = alpha;
    }

    if (isConsumerOffer) {
      params.isConsumerOffer = isConsumerOffer.toString();
    }

    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      params.startDate = dateRange[0].toISOString();
      params.endDate = dateRange[1].toISOString();
    }

    return params;
  }, []);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Read from URL params and set filterRef
  useEffect(() => {
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const alpha = searchParams.get("alpha");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const brandId = searchParams.get("brandId");
    const brandName = searchParams.get("brandName");
    const isConsumerOffer = searchParams.get("isConsumerOffer");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const newFilter: any = { ...defaultFilter };

    if (search) {
      newFilter.search = search;
    }

    if (status) {
      newFilter.status = status;
    }

    if (alpha) {
      newFilter.alpha = alpha;
    }

    if (categoryId && categoryName) {
      newFilter.category = {
        value: { id: categoryId },
        label: categoryName,
      };
    }

    if (brandId && brandName) {
      newFilter.brand = {
        value: { id: brandId },
        label: brandName,
      };
    }

    if (isConsumerOffer === "true") {
      newFilter.isConsumerOffer = true;
    }

    if (startDate && endDate) {
      newFilter.dateRange = [new Date(startDate), new Date(endDate)];
    }

    filterRef.current = newFilter;
    applyFilter();
  }, [searchParams, applyFilter]);

  // Load more data for load more button
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const productsData = await getData(params);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      const params = prepareSearchParamsFromFormData(formData);
      // Preserve existing search params like tab
      const existingParams = Object.fromEntries(searchParams.entries());
      const newParams = {
        ...existingParams,
        ...params,
      };
      // Explicitly remove filter params from URL if they're empty/null
      if (!formData.alpha) {
        delete newParams.alpha;
      }
      if (!formData.search || !formData.search.trim()) {
        delete newParams.search;
      }
      if (!formData.status) {
        delete newParams.status;
      }
      if (!formData.category?.value?.id) {
        delete newParams.categoryId;
        delete newParams.categoryName;
      }
      if (!formData.brand?.value?.id) {
        delete newParams.brandId;
        delete newParams.brandName;
      }
      if (!formData.isConsumerOffer) {
        delete newParams.isConsumerOffer;
      }
      if (
        !formData.dateRange ||
        !Array.isArray(formData.dateRange) ||
        formData.dateRange.length !== 2
      ) {
        delete newParams.startDate;
        delete newParams.endDate;
      }
      setSearchParams(newParams);
      // applyFilter will be called by the useEffect that watches searchParams
    },
    [prepareSearchParamsFromFormData, setSearchParams, searchParams],
  );

  const handleItemClick = useCallback(({ action, data }: any) => {
    if (action === "view") {
      appNav.to(
        `/dashboard/inventory/subscribe/approval-history/products/view/${data._id}`,
      );
    } else if (action === "subscribe") {
      appNav.to(`/dashboard/inventory/subscribe/search?tab=search`);
    }
  }, []);

  const handleSort = useCallback(
    ({ key, value }: any) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter],
  );

  return (
    <>
      <div className="tw:text-gray-500 tw:text-xs tw:mb-4">
        {t("reviewAndManageProductSubscription")}
      </div>

      <Filter callback={handleFilterChange} className="tw:mb-4" />

      <div className="tw:flex tw:justify-between tw:items-end tw:mb-4">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={products.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>

      {isMobile || view === "card" ? (
        <>
          <MobileView
            data={products}
            loading={loading}
            callback={handleItemClick}
          />
          {hasMoreData && !loading && (
            <div className="tw:flex tw:justify-center tw:mt-6">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={products.length}
              />
            </div>
          )}
        </>
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={products}
            loading={loading}
            callback={handleItemClick}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
            showLoadMore={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
          />
        </AppCard>
      )}
    </>
  );
};

export default SubscribeApprovalHistoryProductsList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Catalog Approval History Products List",
      ),
    },
  ];
}
