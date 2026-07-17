import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

import { produce } from "immer";
import { debounce } from "lodash";
import AppPopover from "~/components/core/popover/AppPopover";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
import BrowseContainer from "~/shared/catalog/components/browse/container/BrowseContainer";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import ProductMobileItem from "~/shared/inventory/components/mobile-item/ProductMobileItem";
import { getCount, getData, prepareParams } from "./helper";
import Item from "./Item";
import { ArrowUpDown } from "lucide-react";

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
  withoutStock: false,
};

interface BrowseProductsProps {
  categoryId?: string | null;
  brandId?: string | null;
  categoryName?: string | null;
  brandName?: string | null;
}

const options = [
  ...SellerCatalogService.getGlobalSortOptions()
    .filter((option) => option.value !== "all")
    .map((option) => ({
      label: option.label,
      value:
        option.value === "name-asc"
          ? "sort-az"
          : option.value === "name-desc"
          ? "sort-za"
          : option.value,
      langKey: option.langKey,
    })),
];

const BrowseProducts: React.FC<BrowseProductsProps> = ({
  categoryId,
  brandId,
  categoryName,
  brandName,
}) => {
  const { t } = useTranslation(["common"]);
  const { show: showToast } = useAppToast();
  const appNav = useAppNav();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [search, setSearch] = useState<string>("");
  const [alpha, setAlpha] = useState<string>("");

  const [sortType, setSortType] = useState<string>("sort-az");

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    filterRef.current = { ...defaultFilter };
    // reset local UI state for search and alphabet filter when browse selection changes
    setSearch("");
    setAlpha("");
    // initialize filters from props (browse selections)
    if (categoryId) {
      filterRef.current = {
        ...filterRef.current,
        categoryId,
      };
    }
    if (brandId) {
      filterRef.current = {
        ...filterRef.current,
        brandId,
      };
    }

    setSortType("sort-az");
    filterRef.current = { ...filterRef.current, sortType: "sort-az" };

    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, categoryId]);

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
      const params = prepareParams(filterRef.current, paginationRef.current);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setProducts(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  const debounceSearch = React.useCallback(
    debounce((val: string) => {
      applyFilter();
    }, 500),
    [applyFilter]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const data = await getData(params);
      setProducts((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const handleAddStockModal = useCallback(({ action, data, product }: any) => {
    setAddStockModal({ show: false, data: null });

    if (action === "submit") {
      setProducts((prev) =>
        prev.map((item) => {
          if (item._id !== product._id) return item;
          return {
            ...item,
            maxQty: product.maxQty || 0,
            inventoryValue: product.inventoryValue || 0,
            purchasePrice: product.purchasePrice || 0,
            mrp: product.mrp || 0,
            _animate: true,
          };
        })
      );

      setTimeout(() => {
        setProducts((prev) =>
          prev.map((it) =>
            it._id === product._id ? { ...it, _animate: false } : it
          )
        );
      }, 1000);
    }
  }, []);

  const handleItemAction = useCallback(
    async (ev: { action: string; data?: any }) => {
      // Block certain actions when logged in as master without full access
      const blockedForMaster = ["add-stock", "status-updated", "view"];
      if (
        AuthService.isMasterLogin() &&
        !AuthService.isMasterLoginWithFullAccess()
      ) {
        if (blockedForMaster.includes(ev.action)) {
          showToast({
            msg: t("youAreNotAuthorizedToDoThisAction"),
            color: "danger",
          });
          return;
        }
      }

      if (ev.action === "view") {
        const id = ev.data?._id || ev.data?._raw?._id;
        if (id) {
          appNav.to(`/dashboard/inventory/products/view/${id}`);
        }
        return;
      }

      if (ev.action === "add-stock") {
        setAddStockModal({ show: true, data: ev.data });
        return;
      }

      if (ev.action === "status-updated") {
        // animate the product in the list
        setProducts(
          produce((draft) => {
            const index = draft.findIndex((item) => item._id === ev.data._id);
            if (index !== -1) {
              draft[index] = {
                ...draft[index],
                _animate: true,
                status: ev.data.status,
              };
            }
          })
        );

        // stop the animation after 1 second
        setTimeout(() => {
          setProducts((prev) =>
            prev.map((it) =>
              it._id === ev.data._id ? { ...it, _animate: false } : it
            )
          );
        }, 1000);
        return;
      }
    },
    [showToast, t, appNav]
  );

  // BrowseContainer callbacks (search, alpha)
  const handleBrowseCallback = useCallback(
    (p: { action: string; data?: any }) => {
      if (p.action === "search") {
        setSearch(p.data || "");
        filterRef.current = { ...filterRef.current, search: p.data };
        debounceSearch(p.data || "");
        return;
      }

      if (p.action === "alpha") {
        setAlpha(p.data || "");
        filterRef.current = { ...filterRef.current, alpha: p.data };
        applyFilter();
        return;
      }
    },
    [applyFilter, debounceSearch]
  );

  const handleSortChange = (value: string) => {
    setSortType(value);
    filterRef.current = { ...filterRef.current, sortType: value };
    applyFilter();
  };

  // If neither category nor brand is selected, prompt the user to choose one.
  if (!categoryId && !brandId) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center">
          {t("pleaseSelectBrandOrCategory")}
        </div>
      </div>
    );
  }

  return (
    <>
      <BrowseContainer
        callback={handleBrowseCallback}
        isLoading={loading}
        search={search}
        alpha={alpha}
        title={categoryName || brandName}
        subtitle={`${paginationRef.current.totalRecords} ${t("products")}`}
        filterElement={
          <div className="tw:w-full tw:md:w-auto tw:flex-shrink-1">
            <AppPopover
              side="bottom"
              align="start"
              triggerContent={
                <ArrowUpDown size={16} className="tw:text-gray-600" />
              }
            >
              <div className="tw:min-w-[160px]">
                {options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={`tw:px-3 tw:py-2 tw:text-sm tw:cursor-pointer tw:block hover:tw:bg-gray-50 ${
                      sortType === opt.value
                        ? "tw:font-semibold tw:bg-gray-100"
                        : "tw:font-normal"
                    }`}
                  >
                    {opt.langKey ? t(opt.langKey) : opt.label}
                  </div>
                ))}
              </div>
            </AppPopover>
          </div>
        }
      >
        {!loading && products.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="tw:border tw:rounded-sm tw:mb-4 tw:border-gray-100"
                >
                  <ProductMobileItem
                    data={product}
                    callback={handleItemAction}
                    imgheightClass="tw:h-28 tw:w-28 tw:object-contain"
                  />
                </div>
              ))}
            </div>

            {hasMoreData && products.length > 0 && (
              <div className="tw:mt-4">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={products.length}
                />
              </div>
            )}
          </>
        )}
      </BrowseContainer>
      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        barcodes={addStockModal.data?.barcodes}
        callback={handleAddStockModal}
      />
    </>
  );
};

export default BrowseProducts;
