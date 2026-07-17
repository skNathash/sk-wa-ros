import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import FilterBlock from "~/shared/others/components/FilterBlock";
import { getCount, getData, movementTypeTitles, prepareParams } from "./helper";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { useTranslation } from "react-i18next";

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
};

const Products = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  // Get 'type' from search params
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const movementTypeInfo = type ? movementTypeTitles[type] : null;
  const title = movementTypeInfo
    ? movementTypeInfo.label.toLowerCase().includes("stock")
      ? movementTypeInfo.label
      : movementTypeInfo.label + " Stock"
    : "Products Stock";
  const description =
    movementTypeInfo?.description ||
    "Monitor stock levels, track movement patterns, and manage alerts";

  // Prepare breadcrumbs based on type
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    {
      label: "Inventory",
      redirect: {
        path: "/dashboard/inventory/products/list",
      },
    },
    {
      label: title,
    },
  ];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "name",
    value: "asc",
  });

  useEffect(() => {
    filterRef.current = { ...defaultFilter, type };
    applyFilter();
  }, [type]);

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
        sortRef.current
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
        sortRef.current
      );
      const productsData = await getData(params);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterChange = useCallback(({ formData }: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...formData,
    };
    applyFilter();
  }, []);

  const handleItemClick = useCallback(({ action, data }: any) => {
    if (action === "view") {
      appNav.to(`/dashboard/inventory/products/view/${data._id}`);
    } else if (action === "add-stock") {
      setAddStockModal({ show: true, data });
    }
  }, []);

  const handleAddStockModal = useCallback(
    ({ action, data }: any) => {
      if (action === "close") {
        setAddStockModal({ show: false, data: null });
      } else if (action === "submit") {
        if (addStockModal.data && typeof data?.quantity === "number") {
          const addedQty = Number(data.quantity) || 0;
          setProducts((prev) =>
            prev.map((item) => {
              if (item._id !== addStockModal.data._id) return item;

              const purchasePrice =
                typeof data.purchasePrice === "number"
                  ? data.purchasePrice
                  : item.purchasePrice || 0;

              const addedValue = purchasePrice * addedQty;

              return {
                ...item,
                maxQty: (item.maxQty || 0) + addedQty,
                inventoryValue: (item.inventoryValue || 0) + addedValue,
                purchasePrice: data.purchasePrice ?? item.purchasePrice,
                mrp: data.mrp ?? item.mrp,
              };
            })
          );
        }

        setAddStockModal({ show: false, data: null });
      }
    },
    [addStockModal.data]
  );

  const handleSort = useCallback(({ key, value }: any) => {
    sortRef.current = { key, value };
    applyFilter();
  }, []);

  return (
    <>
      <AppHeader title={title} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            {description}
          </div>

          <FilterBlock>
            <Filter callback={handleFilterChange} />
          </FilterBlock>

          <AppCard noContentPadding={!isMobile}>
            <div className="tw:md:px-4">
              <div className="tw:mb-4 tw:flex tw:justify-between tw:items-center">
                <div>
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={products.length}
                    fwSize="sm"
                  />
                </div>
                <ViewToggle viewType={viewType} callback={setViewType} />
              </div>
            </div>

            {isMobile || viewType === "card" ? (
              <MobileView
                data={products}
                callback={handleItemClick}
                loading={loading}
                showLoadMore={hasMoreData}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={products.length}
              />
            ) : (
              <DesktopView
                data={products}
                loading={loading}
                callback={handleItemClick}
                sortKey={sortRef.current.key}
                sortValue={sortRef.current.value}
                onSort={handleSort}
              />
            )}
            {hasMoreData && !loading && (
              <div className="tw:flex tw:justify-center tw:mt-6">
                <AppButton
                  fill="outline"
                  color="light"
                  size="small"
                  onClick={loadMore}
                  isLoading={loadingMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </AppButton>
              </div>
            )}
          </AppCard>
        </div>
      </div>

      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        callback={handleAddStockModal}
      />
    </>
  );
};

export default Products;
