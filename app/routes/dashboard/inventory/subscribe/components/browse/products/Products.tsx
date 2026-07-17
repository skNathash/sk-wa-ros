import { produce } from "immer";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import Item from "./Item";
import AuthService from "~/services/AuthService";
import SortDropdown from "../../sort-dropdown/SortDropdown";
import { SUBSCRIBE_MAX_PRODUCTS_COUNT } from "~/constants";

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 50,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 50,
};

const BrowseProducts = ({
  callback,
  selectedBrand,
  selectedCategory,
  selectedParentCategory,
  selectedMenu,
  restrictOn,
  type = "byCategory",
  sortKey,
}: {
  callback: (params: { action: string; data?: any }) => void;
  selectedBrand: any;
  selectedCategory: any;
  selectedParentCategory?: any;
  selectedMenu?: any;
  restrictOn: string[];
  type?: "byBrand" | "byCategory";
  sortKey: string;
}) => {
  const MAX_SUBSCRIPTIONS = SUBSCRIBE_MAX_PRODUCTS_COUNT;

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("");
  const [busyLoader, setBusyLoader] = useState(false);
  const [subscribeAllChecked, setSubscribeAllChecked] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [isSubscribingSelected, setIsSubscribingSelected] = useState(false);
  const [sortType, setSortType] = useState(sortKey || "popular");
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { t } = useTranslation(["inventorySubscribe"]);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });

  const getAlreadyInCartCount = () => {
    return InventorySubscribeService.getLocalCart()?.length || 0;
  };

  const getRemainingSlots = () => {
    return Math.max(0, MAX_SUBSCRIPTIONS - getAlreadyInCartCount());
  };

  const applyFilter = async () => {
    setIsLoading(true);
    setItems([]);
    setSelectedProducts(new Set());
    setSubscribeAllChecked(false);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const count = await getCount(params);
    paginationRef.current = {
      ...paginationRef.current,
      totalRecords: count,
    };
    const result = await getData(params);
    setItems(result.data);
    setHasMore(result.data.length < count);
    setIsLoading(false);
  };

  // Load more data for infinite scroll
  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);
    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    filterRef.current = {
      brand: selectedBrand,
      category: selectedCategory,
      menu: selectedMenu,
    };

    // Parent category selection takes precedence
    if (selectedParentCategory?._id || selectedParentCategory?.id) {
      filterRef.current = {
        ...filterRef.current,
        parentCategoryId:
          selectedParentCategory._id || selectedParentCategory.id,
      };
    } else if (selectedCategory?.parentCategoryId) {
      filterRef.current = {
        ...filterRef.current,
        parentCategoryId: selectedCategory.parentCategoryId,
      };
    }

    // Reset alpha selection when brand or category changes
    setSelectedAlpha("");
    filterRef.current = {
      ...filterRef.current,
      alpha: "",
      sortType: sortKey || "popular",
    };
    setSortType(sortKey || "popular");

    // Only clear items if we don't have any valid filter criteria
    const hasValidBrand = selectedBrand?._id;
    const hasValidCategory = selectedCategory?._id;
    const requiresBrand = restrictOn.includes("brand");
    const requiresCategory = restrictOn.includes("category");

    // Clear items only if we have restrictions but no valid data for those restrictions
    if (requiresBrand && !hasValidBrand && !hasValidCategory) {
      setSearch("");
      setItems([]);
    }

    if (requiresCategory && !hasValidCategory && !hasValidBrand) {
      setSearch("");
      setItems([]);
    }

    applyFilter();
  }, [
    selectedBrand,
    selectedCategory,
    selectedParentCategory,
    selectedMenu,
    restrictOn,
    sortKey,
  ]);

  useEffect(() => {
    const handleItemAdded = (event: CustomEvent) => {
      const dealId = event.detail.dealId;
      if (dealId) {
        setItems(
          produce((draft) => {
            const index = draft.findIndex((item) => item.dealId === dealId);
            if (index !== -1) {
              draft[index].isInCart = true;
            }
          }),
        );
      }
    };

    const handleItemRemoved = (event: CustomEvent) => {
      const itemId = event.detail.itemId;
      if (itemId) {
        setItems(
          produce((draft) => {
            const index = draft.findIndex((item) => item.itemId === itemId);
            if (index !== -1) {
              draft[index].isInCart = false;
            }
          }),
        );
      }
    };

    window.addEventListener(
      "subscribe-item-added",
      handleItemAdded as EventListener,
    );
    window.addEventListener(
      "subscribe-item-removed",
      handleItemRemoved as EventListener,
    );

    return () => {
      window.removeEventListener(
        "subscribe-item-added",
        handleItemAdded as EventListener,
      );
      window.removeEventListener(
        "subscribe-item-removed",
        handleItemRemoved as EventListener,
      );
    };
  }, []);

  const debouncedSearch = useCallback(debounce(applyFilter, 500), []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    filterRef.current = { ...filterRef.current, search: searchValue };

    // Clear alpha selection when search is performed
    if (searchValue && selectedAlpha) {
      setSelectedAlpha("");
      filterRef.current = { ...filterRef.current, alpha: "" };
    }

    debouncedSearch();
  };

  const handleAlphaSelect = (alpha: string) => {
    setSelectedAlpha(alpha);
    filterRef.current = { ...filterRef.current, alpha };

    // Clear search input when alpha is selected
    if (alpha && search) {
      setSearch("");
      filterRef.current = { ...filterRef.current, search: "" };
    }

    applyFilter();
  };

  const handleSortChange = (value: string) => {
    setSortType(value);
    filterRef.current = { ...filterRef.current, sortType: value };
    applyFilter();
  };

  const handleSubscribe = async (index: number) => {
    // Server-first check counting unique dealIds and ensuring this deal isn't already in cart
    const dealId = items[index]?._id;
    let uniqueCount = 0;
    let hasDealInCart = false;
    try {
      const cartResp = await InventorySubscribeService.getCart();
      if (cartResp?.statusCode === 200) {
        const serverProducts = cartResp.data?.data?.products || [];
        const dealIds = serverProducts
          .map((p: any) => p.dealId || p._id)
          .filter(Boolean);
        hasDealInCart = dealIds.includes(dealId);
        uniqueCount = new Set(dealIds).size;
      }
    } catch (err) {
      const local = InventorySubscribeService.getLocalCart() || [];
      const dealIds = local.map((p: any) => p.dealId).filter(Boolean);
      hasDealInCart = dealIds.includes(dealId);
      uniqueCount = new Set(dealIds).size;
    }

    if (!hasDealInCart && uniqueCount >= MAX_SUBSCRIPTIONS) {
      appToast.show({
        msg: t("search.toast.maxLimitReached", {
          defaultValue: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products at a time. Please review your cart to subscribe`,
        }),
        color: "warning",
      });
      return;
    }

    setBusyLoader(true);
    const response = await InventorySubscribeService.createRequest({
      dealId: items[index]._id,
      quantity: 0,
      price: items[index].mrp,
    });

    if (response.statusCode === 200) {
      const product = response.data?.data || {};

      InventorySubscribeService.saveInLocalCart({
        dealId: items[index]._id,
        dealName: items[index].name,
        quantity: 0,
        price: items[index].mrp,
        images: items[index].images,
        itemId: product.itemId,
      });

      InventorySubscribeService.triggerItemAddedEvent({
        dealId: items[index]._id,
        dealName: items[index].name,
      });

      setItems(
        produce((draft) => {
          draft[index].isInCart = true;
          draft[index].itemId = product.itemId;
        }),
      );

      appToast.show({
        msg: "Item subscribed successfully",
        color: "success",
      });
    } else {
      appToast.show({
        msg: response?.data?.message || "Failed to subscribe item",
        color: "danger",
      });
    }
    setBusyLoader(false);
  };

  const handleRemove = async (index: number) => {
    setBusyLoader(true);

    const response = await InventorySubscribeService.removeRequestItem(
      items[index].itemId,
    );

    if (response.statusCode === 200) {
      InventorySubscribeService.removeLocalCartItem(items[index].itemId);

      InventorySubscribeService.triggerItemRemovedEvent({
        itemId: items[index].itemId,
      });

      setItems(
        produce((draft) => {
          draft[index].isInCart = false;
        }),
      );
      appToast.show({
        msg: "Item removed from cart",
        color: "success",
      });
    } else {
      appToast.show({
        msg: "Failed to remove item from cart",
        color: "danger",
      });
    }
    setBusyLoader(false);
  };

  const handleSubscribeAllDisplayed = () => {
    const remaining = getRemainingSlots();
    if (remaining <= 0) {
      appToast.show({
        msg: t("search.toast.maxLimitReached", {
          defaultValue: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products at a time. Please review your cart to subscribe`,
        }),
        color: "warning",
      });
      return;
    }

    const newChecked = !subscribeAllChecked;
    setSubscribeAllChecked(newChecked);

    if (newChecked) {
      // Select all displayed products that are not already in cart (up to remaining slots)
      const availableProductIds = items
        .filter((item) => !item.isInCart && !item.isSelected)
        .map((item) => item._id)
        .slice(0, remaining);
      setSelectedProducts(new Set(availableProductIds));
    } else {
      // Deselect all products
      setSelectedProducts(new Set());
    }
  };

  const handleSubscribeSelected = async () => {
    if (selectedProducts.size === 0) return;

    const remaining = getRemainingSlots();
    if (selectedProducts.size > remaining) {
      appToast.show({
        msg: t("search.toast.selectionExceedsLimit", {
          defaultValue: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products. Please reduce your selection.`,
        }),
        color: "warning",
      });
      return;
    }

    setIsSubscribingSelected(true);
    const selectedItems = items.filter((item) =>
      selectedProducts.has(item._id),
    );
    const selectedCount = selectedProducts.size;

    try {
      // Prepare products data for bulk subscription
      const products = selectedItems.map((item) => {
        const product: any = {
          dealId: item._id,
          dealRefId: item.dealId,
          name: item.name,
          quantity: 0,
          mrp: item.mrp,
          price: item.mrp,
          images: item.images || [],
          barcodes: item.barcodes || [],
        };
        if (item.hsn) product.hsnNumber = item.hsn;
        const gstVal = item.gst ?? item.tax;
        if (gstVal !== undefined && gstVal !== "")
          product.gst = Number(gstVal);
        return product;
      });

      const response =
        await InventorySubscribeService.bulkSubscription(products);

      if (response.statusCode === 200) {
        // Prepare data for localStorage storage
        const subscribedProducts = response.data?.data?.cart?.products || [];
        const localCartData = subscribedProducts
          .map((product: any) => {
            // Find the corresponding selected item by dealId instead of relying on index
            const selectedItem = selectedItems.find(
              (item) => item._id === product.dealId,
            );

            // Skip if we can't find the corresponding selected item
            if (!selectedItem) {
              console.warn(
                `Could not find selected item for dealId: ${product.dealId}`,
              );
              return null;
            }

            return {
              dealId: selectedItem._id,
              dealName: selectedItem.name,
              quantity: 0,
              price: selectedItem.mrp,
              images: selectedItem.images || [],
              itemId: product.itemId || product._id,
            };
          })
          .filter(Boolean); // Remove any null entries

        // Save to localStorage
        if (localCartData.length > 0) {
          InventorySubscribeService.saveBulkInLocalCart(localCartData);
        }

        // Update items to reflect subscription status
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            isInCart: selectedProducts.has(item._id) ? true : item.isInCart,
            isSelected: false,
            itemId: selectedProducts.has(item._id)
              ? localCartData.find(
                  (cartItem: any) => cartItem.dealId === item._id,
                )?.itemId || item.itemId
              : item.itemId,
          })),
        );

        // Clear selected products and checkbox
        setSelectedProducts(new Set());
        setSubscribeAllChecked(false);

        // Trigger single event for bulk subscription
        InventorySubscribeService.triggerItemAddedEvent({
          bulk: true,
          count: selectedCount,
          dealIds: selectedItems.map((item) => item._id),
        });

        appToast.show({
          msg: t("search.toast.productsSubscribed", {
            count: selectedCount,
            defaultValue: `${selectedCount} products subscribed successfully`,
          }),
          color: "success",
        });

        // Trigger cart popover to open
        InventorySubscribeService.triggerOpenCartPopoverEvent();
      } else {
        appToast.show({
          msg: response?.data?.message || t("search.toast.failedToSubscribe"),
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: t("search.toast.failedToSubscribe"),
        color: "danger",
      });
    } finally {
      setIsSubscribingSelected(false);
    }
  };

  const handleProductSelection = (productId: string, selected: boolean) => {
    const remaining = getRemainingSlots();
    if (remaining <= 0 && selected) {
      appToast.show({
        msg: t("search.toast.maxLimitReached", {
          defaultValue: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products at a time. Please review your cart to subscribe`,
        }),
        color: "warning",
      });
      return;
    }

    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        if (newSet.size >= remaining) {
          // prevent adding more than remaining slots
          appToast.show({
            msg: t("search.toast.selectionExceedsLimit", {
              defaultValue: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products. Please reduce your selection.`,
            }),
            color: "warning",
          });
          return newSet;
        }
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }

      // Update subscribe all checkbox state
      const availableProducts = items
        .filter((item) => !item.isInCart)
        .slice(0, MAX_SUBSCRIPTIONS);
      const allSelected =
        availableProducts.length > 0 &&
        availableProducts.every((item) => newSet.has(item._id));
      setSubscribeAllChecked(allSelected);

      return newSet;
    });
  };

  // // Recompute subscribeAllChecked whenever items or selectedProducts change
  // useEffect(() => {
  //   const availableProducts = items
  //     .filter((item) => !item.isInCart)
  //     .slice(0, MAX_SUBSCRIPTIONS);
  //   const allSelected =
  //     availableProducts.length > 0 &&
  //     availableProducts.every((item) => selectedProducts.has(item._id));
  //   setSubscribeAllChecked(allSelected && selectedProducts.size > 0);
  // }, [items, selectedProducts]);

  const handleItemCallback = (params: { action: string; data?: any }) => {
    if (params.action === "subscribe" && params.data) {
      handleSubscribe(params.data.index);
    }
    if (params.action === "remove" && params.data) {
      handleRemove(params.data.index);
    }
    if (params.action === "view") {
      if (params.data?._id) {
        appNav.to(
          `/dashboard/inventory/subscribe/product-detail/${params.data._id}`,
        );
        return;
      }
      callback({ action: "view", data: params.data });
    }
  };

  // Only show restriction messages if we don't have any valid filter criteria
  const hasValidBrand = selectedBrand?._id;
  const hasValidCategory = selectedCategory?._id;
  const requiresBrand = restrictOn.includes("brand");
  const requiresCategory = restrictOn.includes("category");

  if (requiresBrand && !hasValidBrand && !hasValidCategory) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center tw:p-4">
          Please select a brand to view products.
        </div>
      </div>
    );
  }

  if (requiresCategory && !hasValidCategory && !hasValidBrand) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center tw:p-4">
          Please select a category to view products.
        </div>
      </div>
    );
  }

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-md tw:md:flex-1">
      <div className="tw:bg-gray-50 tw:px-4 tw:py-2">
        <div className="tw:flex tw:items-center">
          <div>
            <div className="tw:font-semibold tw:mb-1">
              {type === "byBrand"
                ? selectedCategory?.name && selectedBrand?.name
                  ? `${selectedCategory.name} > ${selectedBrand.name}`
                  : selectedCategory?.name
                    ? selectedCategory.name
                    : selectedBrand?.name
                      ? selectedBrand.name
                      : "Products"
                : selectedBrand?.name && selectedCategory?.name
                  ? `${selectedBrand.name} > ${selectedCategory.name}`
                  : selectedBrand?.name
                    ? `${selectedBrand.name} Products`
                    : selectedCategory?.name
                      ? `${selectedCategory.name} Products`
                      : "Products"}
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              {!isLoading && (
                <div className="tw:text-xs tw:text-gray-500 tw:hidden tw:md:block">
                  {paginationRef.current.totalRecords} products
                </div>
              )}
              {!isLoading && paginationRef.current.totalRecords > 0 && (
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500 tw:bg-blue-50 tw:px-2 tw:py-1 tw:rounded-md tw:border tw:border-blue-200">
                  <input
                    type="checkbox"
                    className="tw:w-4 tw:h-4 tw:rounded-md tw:border tw:border-blue-400 tw:accent-blue-600"
                    checked={subscribeAllChecked}
                    onChange={handleSubscribeAllDisplayed}
                    disabled={isLoading}
                  />
                  <span className="tw:font-medium tw:text-blue-700">
                    {t(
                      "search.subscribeAllDisplayed",
                      "Subscribe all displayed",
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedProducts.size > 0 && (
        <div className="tw:mx-4 tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:bg-blue-50 tw:p-2 tw:rounded-md tw:border tw:border-blue-200 tw:mb-2">
          <span className="tw:text-xs tw:text-blue-700">
            {t(
              "search.subscribeSelected",
              "Subscribe {{count}} selected products",
              { count: selectedProducts.size },
            )}
          </span>
          <AppButton
            color="primary"
            size="small"
            onClick={handleSubscribeSelected}
            isLoading={isSubscribingSelected}
            disabled={isSubscribingSelected}
            className="tw:text-xs"
          >
            Subscribe Selected
          </AppButton>
        </div>
      )}
      <div className="tw:flex tw:gap-2 tw:bg-white tw:py-2">
        <div className=" tw:px-1">
          <Alpha
            selected={selectedAlpha}
            callback={handleAlphaSelect}
            className="tw:h-[calc(100vh-150px)] tw:mb-2"
            orientation="vertical"
          />
        </div>
        <div className="tw:flex-1">
          <AppScrollArea className="tw:h-[calc(100vh-150px)] no-table tw:pe-2">
            <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:w-full tw:md:flex-row tw:flex-col">
              <input
                type="text"
                className="tw:w-full tw:px-2 tw:border tw:border-gray-200 tw:rounded-md tw:h-8 tw:bg-gray-50 tw:outline-none tw:text-xs"
                placeholder="Search items"
                value={search}
                onChange={handleSearch}
              />
              <SortDropdown
                value={sortType}
                onChange={handleSortChange}
                inputClassName="tw:!h-8 tw:text-xs tw:w-full"
                className="tw:w-full tw:md:w-auto"
              />
            </div>

            {isLoading ? (
              <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                <AppSpinner />
              </div>
            ) : null}

            {!isLoading && !items.length && <NoData />}

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
              {items.map((item, index) => (
                <Item
                  key={item._id || index}
                  data={item}
                  index={index}
                  callback={handleItemCallback}
                  isSelected={selectedProducts.has(item._id)}
                  onSelectionChange={handleProductSelection}
                />
              ))}
            </div>

            {hasMore && !isLoading && (
              <div className="tw:flex tw:justify-center tw:items-center tw:mt-4">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={isLoadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              </div>
            )}
          </AppScrollArea>
        </div>
      </div>

      <BusyLoader show={busyLoader} />
    </div>
  );
};

export default BrowseProducts;
