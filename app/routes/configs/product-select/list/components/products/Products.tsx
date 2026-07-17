import { produce } from "immer";
import { ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import BulkCatalogCartService from "~/services/BulkCatalogCartService";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  mapCartDeals,
  prepareParams,
  type ProductItemType,
} from "../../helper";
import DesktopView from "./DesktopView";
import ProductItem from "./MobileView";
import SortBy from "~/shared/inventory/components/sort-by/SortBy";
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import NoData from "~/components/core/no-data/NoData";

const MAX_SELECTION = 100;

const Products = () => {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const formMethods = useFormContext();

  const [searchParams, setSearchParams] = useSearchParams();

  const feature = searchParams.get("feature");
  const source = searchParams.get("source") || "";
  const showCheckbox = searchParams.get("showCheckbox") !== "0";
  const notConfiguredOnly = searchParams.get("notConfiguredOnly") === "1";

  const [busyLoader, setBusyLoader] = useState<{ show: boolean }>({
    show: false,
  });

  const [cartCount, setCartCount] = useState(0);

  const [data, setData] = useState<ProductItemType[]>([]);
  const [selectedMap, setSelectedMap] = useState<
    Record<string, ProductItemType>
  >({});
  const [selectAllDisplayed, setSelectAllDisplayed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const [configDealId, setConfigDealId] = useState<string | null>(null);
  const [showPriceConfig, setShowPriceConfig] = useState(false);

  const cartDealRef = useRef<any[]>([]);
  const cartIdRef = useRef<string>("");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const selectedCount = Object.keys(selectedMap).length;

  const toggleSelectItem = (checked: boolean, item: ProductItemType) => {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (checked) {
        if (Object.keys(copy).length >= MAX_SELECTION) return copy;
        copy[item._id] = item;
      } else {
        delete copy[item._id];
      }
      return copy;
    });
  };

  const toggleSelectAllDisplayed = (checked: boolean) => {
    setSelectAllDisplayed(checked);
    if (checked) {
      setSelectedMap((prev) => {
        const copy = { ...prev };
        for (const d of data) {
          if (!d.isB2bMarginConfigured && feature === "PriceUpdate") continue;
          if (Object.keys(copy).length >= MAX_SELECTION) break;
          if (d.isInCart) continue;
          copy[d._id] = d;
        }
        return copy;
      });
    } else {
      // remove currently displayed items from selection
      setSelectedMap((prev) => {
        const copy = { ...prev };
        for (const d of data) {
          if (copy[d._id]) delete copy[d._id];
        }
        return copy;
      });
    }
  };

  const applyFilter = async () => {
    setLoading(true);
    setData([]);

    const cart = await fetchCartCount();

    cartDealRef.current = cart?.data || [];
    cartIdRef.current = cart?._id;

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const formVals = { ...(formMethods?.getValues?.() || {}) };
      if (feature) formVals.feature = feature;
      formVals.notConfiguredOnly = notConfiguredOnly;

      const search = searchParams.get("search");
      const brandId = searchParams.get("brandId");
      const brandName = searchParams.get("brandName");
      const categoryId = searchParams.get("categoryId");
      const categoryName = searchParams.get("categoryName");

      formVals.search = search || "";

      if (brandId) {
        formVals.brand = [
          {
            label: brandName || "",
            value: { id: brandId },
          },
        ];
      }
      if (categoryId) {
        formVals.category = [
          {
            label: categoryName || "",
            value: { id: categoryId },
          },
        ];
      }

      formMethods.reset({ ...formVals });

      const params = prepareParams(formVals, paginationRef.current);
      const result = await getData(params);
      const mapped = mapCartDeals(cartDealRef.current, result);

      setData([...mapped]);

      if (selectAllDisplayed) {
        setSelectedMap((prev) => {
          const copy = { ...prev };
          for (const d of mapped) {
            if (!d.isB2bMarginConfigured && feature === "PriceUpdate") continue;
            if (Object.keys(copy).length >= MAX_SELECTION) break;
            if (d.isInCart) continue;
            copy[d._id] = d;
          }
          return copy;
        });
      }
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;

      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
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

      const formVals = { ...(formMethods?.getValues?.() || {}) };
      if (feature) formVals.feature = feature;
      formVals.notConfiguredOnly = notConfiguredOnly;

      const brandId = searchParams.get("brandId");
      const brandName = searchParams.get("brandName");
      const categoryId = searchParams.get("categoryId");
      const categoryName = searchParams.get("categoryName");

      if (brandId) {
        formVals.brand = [
          {
            label: brandName || "",
            value: { id: brandId },
          },
        ];
      }
      if (categoryId) {
        formVals.category = [
          {
            label: categoryName || "",
            value: { id: categoryId },
          },
        ];
      }

      const params = prepareParams(formVals, paginationRef.current);
      const result = await getData(params);
      const mapped = mapCartDeals(cartDealRef.current, result);
      setData((prev) => [...prev, ...mapped]);
      if (selectAllDisplayed) {
        setSelectedMap((prev) => {
          const copy = { ...prev };
          for (const d of mapped) {
            if (!d.isB2bMarginConfigured && feature === "PriceUpdate") continue;
            if (Object.keys(copy).length >= MAX_SELECTION) break;
            if (d.isInCart) continue;
            copy[d._id] = d;
          }
          return copy;
        });
      }
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [
    formMethods,
    loadingMore,
    hasMoreData,
    feature,
    selectAllDisplayed,
    searchParams?.toString(),
  ]);

  const handleFilterChange = (formData: any) => {
    const alpha = formData.alpha || "";

    const feature = searchParams.get("feature");

    const params =
      InventoryDealFilterService.prepareInventoryFilterQueryParams(formData);

    params.set("feature", feature || "");

    if (formData.search) {
      params.set("search", formData.search);
    }

    if (alpha) {
      params.set("alpha", alpha);
    }

    setSearchParams(params, { replace: true });
  };

  const fetchCartCount = async () => {
    const response = await BulkCatalogCartService.getCart({
      franchiseId: AuthService.getLoggedInUserId(),
      cartType: feature,
    });

    setCartCount(response.data?.data?.[0]?.cartSummary?.totalItems || 0);

    const cart = response.data?.data?.[0];
    return cart;
  };

  useEffect(() => {
    let search = searchParams.get("search");

    if (!feature) {
      setLoading(false);
      setData([]);
      return;
    }

    const formData = InventoryDealFilterService.prepareInventoryParamToFormData(
      Object.fromEntries(searchParams?.entries() || {}),
    );

    const alpha = searchParams.get("alpha");

    let params: Record<string, any> = {
      ...formData,
      alpha: alpha || "",
    };

    if (search) {
      params.search = search;
    }

    formMethods.reset({ ...params });

    applyFilter();
  }, [searchParams?.toString()]);

  const handleAddToCart = async (deal: ProductItemType) => {
    const networkSellingPrice = deal?._raw?.networkSellingPrice || {};

    let payload: Record<string, any> = {};

    if (feature === "PackUpdate") {
      const existingPackConfig = deal?._raw?.packConfig || [];
      payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        cartType: "PackUpdate",
        items: [
          {
            dealId: deal._id,
            sellerId: AuthService.getLoggedInUserId(),
            packConfig: existingPackConfig,
          },
        ],
      };
    }

    if (feature === "ReserveConfig") {
      payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        cartType: "ReserveConfig",
        items: [
          {
            dealId: deal._id,
            sellerId: AuthService.getLoggedInUserId(),
            configType: "Deal",
            isActive: true,
          },
        ],
      };
    }

    if (feature === "PromotionDealUpdate") {
      payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        cartType: "PromotionDealUpdate",
        items: [
          {
            dealId: deal._id,
            sellerId: AuthService.getLoggedInUserId(),
            isPromotionalDeal: deal.isPromotionalDeal,
          },
        ],
      };
    }

    if (feature === "PriceUpdate") {
      payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        cartType: feature || "PriceUpdate",
        items: [
          {
            dealId: deal._id,
            discount: networkSellingPrice?.discount || 0,
            applicableFor: "Network",
            configOnType: "Deal",
            isFixedPrice: networkSellingPrice.discountType === "Fixed",
            fixedPrice: networkSellingPrice.price || 0,
          },
        ],
      };
    }

    setData(
      produce(data, (draft) => {
        const item = draft.find((item) => item._id === deal._id);
        if (item) {
          item.isLoading = true;
        }
      }),
    );

    const response = await BulkCatalogCartService.createCart(payload);

    setData(
      produce(data, (draft) => {
        const item = draft.find((item) => item._id === deal._id);
        if (item) {
          item.isLoading = false;
          if (response.statusCode === 200) {
            item.isInCart = true;
            item.itemId = response.data?.data?.cart?.data?.find(
              (cartItem: any) => cartItem.dealId === deal._id,
            )?._id;
          }
        }
      }),
    );

    fetchCartCount();

    if (response.statusCode === 200) {
      appToast.show({
        msg: response.data?.message || "Product added to cart successfully",
        color: "success",
      });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to add product to cart",
        color: "danger",
      });
    }
  };

  const handleRemoveFromCart = async (deal: ProductItemType) => {
    if (!deal.itemId) {
      appToast.show({
        msg: "Item ID not found",
        color: "danger",
      });
      return;
    }

    setData(
      produce(data, (draft) => {
        const item = draft.find((item) => item._id === deal._id);
        if (item) {
          item.isLoading = true;
        }
      }),
    );
    const response = await BulkCatalogCartService.removeFromCart(
      cartIdRef.current,
      deal.itemId || "",
    );
    setData(
      produce(data, (draft) => {
        const item = draft.find((item) => item._id === deal._id);

        if (item) {
          item.isLoading = false;
        }

        if (item && response.statusCode === 200) {
          item.isInCart = false;
          item.itemId = undefined;
        }
      }),
    );

    if (response.statusCode === 200) {
      await fetchCartCount();
      appToast.show({
        msg: response.data?.message || "Product removed from cart successfully",
        color: "success",
      });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to remove product from cart",
        color: "danger",
      });
    }
  };

  const itemCallback = async (args: {
    action: string;
    data: ProductItemType;
  }) => {
    if (args.action === "add-to-cart") {
      handleAddToCart(args.data);
    } else if (args.action === "remove-from-cart") {
      handleRemoveFromCart(args.data);
    } else if (args.action === "config-b2b") {
      setConfigDealId(args.data._id);
      setShowPriceConfig(true);
    }
  };

  const handleBulkAddToCart = async () => {
    if (selectedCount === 0) return;
    setBusyLoader({ show: true });
    const itemsArr: any[] = [];
    const values = Object.values(selectedMap).slice(0, MAX_SELECTION);

    for (const deal of values) {
      const networkSellingPrice = deal?._raw?.networkSellingPrice || {};
      if (feature === "PackUpdate") {
        itemsArr.push({
          dealId: deal._id,
          sellerId: AuthService.getLoggedInUserId(),
          packConfig: deal?._raw?.packConfig || [],
        });
      } else if (feature === "ReserveConfig") {
        itemsArr.push({
          dealId: deal._id,
          sellerId: AuthService.getLoggedInUserId(),
          configType: "Deal",
          isActive: true,
        });
      } else if (feature === "PromotionDealUpdate") {
        itemsArr.push({
          dealId: deal._id,
          sellerId: AuthService.getLoggedInUserId(),
          isPromotionalDeal: deal.isPromotionalDeal,
        });
      } else {
        itemsArr.push({
          dealId: deal._id,
          discount: networkSellingPrice?.discount || 0,
          applicableFor: "Network",
          configOnType: "Deal",
          isFixedPrice: networkSellingPrice.discountType === "Fixed",
          fixedPrice: networkSellingPrice.price || 0,
        });
      }
    }

    const payload: Record<string, any> = {
      franchiseId: AuthService.getLoggedInUserId(),
      cartType: feature || "PriceUpdate",
      items: itemsArr,
    };

    try {
      const response = await BulkCatalogCartService.createCart(payload);
      if (response.statusCode === 200) {
        appToast.show({
          msg: response.data?.message || "Added successfully",
          color: "success",
        });
        // mark items as in-cart and clear them from selection
        const addedDealIds = values.map((d) => d._id);
        setData((prev) =>
          produce(prev, (draft) => {
            for (const it of draft) {
              if (addedDealIds.includes(it._id)) {
                it.isInCart = true;
              }
            }
          }),
        );

        setSelectedMap((prev) => {
          const copy = { ...prev };
          for (const id of addedDealIds) delete copy[id];
          return copy;
        });
        setSelectAllDisplayed(false);
        await fetchCartCount();
        // Redirect to view cart after success
        viewCart();
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to add",
          color: "danger",
        });
      }
    } catch (err) {
      appToast.show({ msg: "Failed to add items", color: "danger" });
    } finally {
      setBusyLoader({ show: false });
    }
  };

  const viewCart = () => {
    const sourceQuery = source ? `?source=${source}` : "";
    if (feature === "PriceUpdate") {
      appNav.to(`/configs/product-select/cart/scheme${sourceQuery}`);
    } else if (feature === "PackUpdate") {
      appNav.to(`/configs/product-select/cart/case${sourceQuery}`);
    } else if (feature === "ReserveConfig") {
      appNav.to(`/configs/product-select/cart/reserve${sourceQuery}`);
    } else if (feature === "PromotionDealUpdate") {
      appNav.to(`/configs/product-select/cart/promotional-deal${sourceQuery}`);
    }
  };

  const handleRemoveBrand = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("brandId");
    next.delete("brandName");
    setSearchParams(next);
  };

  const handleRemoveCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("categoryId");
    next.delete("categoryName");
    setSearchParams(next);
  };

  return (
    <>
      <>
        <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loadingTotalRecords}
              loadedCount={data.length}
              fwSize="sm"
            />
            {!loading && data.length > 0 ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                <input
                  type="checkbox"
                  checked={selectAllDisplayed}
                  onChange={(e) => toggleSelectAllDisplayed(e.target.checked)}
                  className="tw:w-4 tw:h-4"
                />
                <label className="tw:text-xs tw:text-gray-500">
                  Select all displayed products
                </label>
              </div>
            ) : null}
          </div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
            <ViewToggle viewType={view} callback={setView} />
            <div>
              <SortBy
                globalSortValue={
                  (formMethods?.getValues?.("globalSort") as string) || ""
                }
                open={sortPopoverOpen}
                onOpenChange={setSortPopoverOpen}
                onSelect={(value) => {
                  const params = new URLSearchParams(searchParams);
                  params.set("globalSort", value);
                  setSearchParams(params, { replace: true });
                  setSortPopoverOpen(false);
                }}
              />
            </div>
          </div>
        </div>

        <div>
          {isMobile || view === "card" ? (
            <>
              {!loading && data.length === 0 ? (
                <AppCard>
                  <NoData />
                </AppCard>
              ) : null}

              <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-4">
                {data.map((item, index) => (
                  <ProductItem
                    key={index}
                    data={item}
                    callback={itemCallback}
                    feature={feature || ""}
                    showCheckbox={showCheckbox ?? true}
                    checked={!!selectedMap[item._id]}
                    disabled={
                      (selectedCount >= MAX_SELECTION &&
                        !selectedMap[item._id]) ||
                      !!item.isInCart
                    }
                    onToggle={(checked) => toggleSelectItem(checked, item)}
                  />
                ))}
              </div>
              {hasMoreData && !loading && data.length > 0 && (
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
              )}
            </>
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                callback={itemCallback}
                sortKey={""}
                sortValue={""}
                onSort={() => {}}
                feature={feature || ""}
                loadedCount={data.length}
                showLoadMore={hasMoreData}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                showCheckbox={showCheckbox}
                selectedIds={Object.keys(selectedMap)}
                disabled={selectedCount >= MAX_SELECTION}
                onToggle={(checked, item) => toggleSelectItem(checked, item)}
              />
            </AppCard>
          )}
        </div>
      </>

      {/* Fab */}
      <div>
        <button
          className="tw:fixed tw:bottom-4 tw:right-4 tw:rounded-full tw:w-14 tw:h-14 tw:p-4 tw:flex tw:items-center tw:justify-center tw:bg-yellow-500 tw:text-white tw:cursor-pointer tw:z-40"
          onClick={viewCart}
        >
          <span className="tw:absolute tw:top-0 tw:right-0 tw:bg-red-500 tw:text-white tw:rounded-md tw:text-xs tw:px-1.5 tw:py-0.5 tw:flex tw:items-center tw:justify-center tw:min-w-[18px] tw:h-[18px]">
            {cartCount}
          </span>
          <ShoppingCart size={40} className="tw:text-white" />
        </button>
      </div>
      {/* Sticky Submit Selected Button */}
      {selectedCount > 0 && (
        <>
          <div className="tw:h-20"></div> {/* Spacer to prevent overlap */}
          <div className="tw:fixed tw:bottom-16 tw:md:bottom-4 tw:left-1/2 tw:transform tw:-translate-x-1/2 tw:z-50">
            <AppButton
              onClick={handleBulkAddToCart}
              isLoading={busyLoader.show}
              className="tw:shadow-lg tw:rounded-full tw:px-6 tw:py-3"
              color="primary"
            >
              <span>Add all selected ({selectedCount})</span>
            </AppButton>
          </div>
        </>
      )}

      <BusyLoader show={busyLoader.show} />
      <PriceConfigModal
        show={showPriceConfig}
        type="network"
        dealId={configDealId || undefined}
        callback={async (res) => {
          if (res.action === "close") {
            setShowPriceConfig(false);
            setConfigDealId(null);
          } else if (res.action === "update") {
            setShowPriceConfig(false);
            setConfigDealId(null);

            if (res.data && res.data.dealId) {
              setBusyLoader({ show: true });

              // Delay of 2 seconds
              await new Promise((resolve) => setTimeout(resolve, 2000));

              try {
                const response = await SellerCatalogService.getProducts({
                  filter: {
                    dealId: res.data.dealId,
                  },
                });
                const arr = response.data?.data;

                const formatted = SellerCatalogService.formatProductResponse(
                  arr,
                  {
                    includeRawResponse: true,
                  },
                );

                if (formatted.length > 0) {
                  const updatedDeal = formatted[0];

                  // Keep cart status if any exists locally
                  setData(
                    produce(data, (draft) => {
                      const idx = draft.findIndex(
                        (d) => d._id === res.data.dealId,
                      );
                      if (idx > -1) {
                        const localItem = draft[idx];
                        const updatedItem = updatedDeal as ProductItemType;
                        updatedItem.isInCart = localItem.isInCart;
                        updatedItem.isLoading = localItem.isLoading;
                        updatedItem.itemId = localItem.itemId;

                        draft[idx] = updatedItem;
                      }
                    }),
                  );
                }
              } catch (error) {
                appToast.show({
                  msg: "Failed to fetch updated deal details.",
                  color: "danger",
                });
              } finally {
                setBusyLoader({ show: false });
              }
            }
          }
        }}
      />
    </>
  );
};

export default Products;
