import { Package2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import Rbac from "~/components/core/rbac/Rbac";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PageAccessService from "~/services/PageAccessService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import AddStockSuccessModal from "../../modals/AddStockSuccessModal";
import SubscriptionSuccessModal from "../../modals/SubscriptionSuccessModal";
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
  alpha: "",
};

const SubscribePendingProductsList = () => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const { show: showToast } = useAppToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSubscriptionSuccessModal, setShowSubscriptionSuccessModal] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addedStockData, setAddedStockData] = useState<any>(null);
  const [subscribedProductData, setSubscribedProductData] = useState<any>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [subscribingProductId, setSubscribingProductId] = useState<
    string | null
  >(null);

  const [bulkAlert, setBulkAlert] = useState<{ show: boolean; count: number }>({
    show: false,
    count: 0,
  });

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "updatedAt",
    value: "desc",
  });

  useEffect(() => {
    applyFilter();
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

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  const handleSubscribeDeal = useCallback(
    async (product: any) => {
      if (isSubscribing) return;

      setIsSubscribing(true);
      setSubscribingProductId(product._id);

      try {
        const params = {
          productList: [
            {
              importId: product._id,
            },
          ],
        };

        const response =
          await InventorySubscribeService.subscribePendingProducts(params);

        if (response.statusCode === 200) {
          // Store the subscribed product data for the success modal
          setSubscribedProductData({
            productName: product.dealName || product.productName,
            productId: product.dealId,
            dealRefId: product.dealRefId,
            importId: product._id,
            mrp: product.mrp,
            qty: product.qty,
            purchasePrice: product.price,
          });

          // Show the subscription success modal
          setShowSubscriptionSuccessModal(true);

          // Update the product status in the list
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p._id === product._id
                ? {
                    ...p,
                    isSubscribed: true,
                    status: "Subscribed",
                    statusLabel: "Subscribed",
                    statusColor: "success",
                  }
                : p
            )
          );

          // Refresh the data to get updated status
          applyFilter();
        } else {
          showToast({
            msg: response.data?.message || t("subscriptionFailed"),
            color: "error",
          });
        }
      } catch (error: any) {
        console.error("Error subscribing to deal:", error);
        showToast({
          msg: error.message || t("subscriptionFailed"),
          color: "error",
        });
      } finally {
        setIsSubscribing(false);
        setSubscribingProductId(null);
      }
    },
    [isSubscribing, showToast, t, applyFilter]
  );

  const handleItemClick = useCallback(
    ({ action, data }: any) => {
      if (action === "view") {
        appNav.to(
          `/dashboard/inventory/subscribe/approval-history/products/view/${data._id}`
        );
      } else if (action === "addStock") {
        setSelectedProduct(data);
        setShowAddStockModal(true);
      } else if (action === "subscribe") {
        handleSubscribeDeal(data);
      }
    },
    [appNav, handleSubscribeDeal]
  );

  const openBulkConfirm = useCallback(() => {
    const unsubscribedCount = products.filter((p) => !p.isSubscribed).length;
    if (unsubscribedCount === 0) {
      showToast({
        msg: t("noDealsToSubscribe") || "No deals available to subscribe.",
        color: "error",
      });
      return;
    }
    setBulkAlert({ show: true, count: Math.min(unsubscribedCount, 50) });
  }, [products]);

  const closeBulkConfirm = useCallback(() => {
    setBulkAlert({ show: false, count: 0 });
  }, []);

  // Bulk subscribe handler
  const handleBulkSubscribe = useCallback(async () => {
    if (isSubscribing) return;

    setBulkAlert({ show: false, count: 0 });
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Collect up to 50 not-yet-subscribed products from current list
    const toSubscribe = products.filter((p) => !p.isSubscribed).slice(0, 50);

    if (!toSubscribe || toSubscribe.length === 0) {
      showToast({
        msg: t("noDealsToSubscribe"),
        color: "error",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const params = {
        productList: toSubscribe.map((p) => ({ importId: p._id })),
      };

      const response = await InventorySubscribeService.subscribePendingProducts(
        params
      );

      if (response.statusCode === 200) {
        showToast({
          msg: t("bulkSubscribeSuccess", { count: toSubscribe.length }),
          color: "success",
        });

        // Optimistically update local list status
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            toSubscribe.some((s) => s._id === p._id)
              ? {
                  ...p,
                  isSubscribed: true,
                  status: "Subscribed",
                  statusLabel: "Subscribed",
                  statusColor: "success",
                }
              : p
          )
        );

        // Refresh data to reflect server-side changes
        await applyFilter();
      } else {
        showToast({
          msg: response.data?.message || t("subscriptionFailed"),
          color: "error",
        });
      }
    } catch (error: any) {
      console.error("Error bulk subscribing deals:", error);
      showToast({
        msg: error?.message || t("subscriptionFailed"),
        color: "error",
      });
    } finally {
      setIsSubscribing(false);
      setBulkAlert({ show: false, count: 0 });
    }
  }, [isSubscribing, products, showToast, t, applyFilter]);

  const confirmBulkSubscribe = useCallback(() => {
    void handleBulkSubscribe();
  }, [handleBulkSubscribe]);

  const handleSort = useCallback(
    ({ key, value }: any) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  const handleAddStockModalCallback = useCallback(
    ({ action, data }: any) => {
      if (action === "close") {
        setShowAddStockModal(false);
        setSelectedProduct(null);
      } else if (action === "submit") {
        // Store the added stock data for success modal
        setAddedStockData({
          productName: selectedProduct?.productName,
          quantity: data?.quantity,
          productId: selectedProduct?.dealId,
        });
        setShowAddStockModal(false);
        setShowSuccessModal(true);
        setSelectedProduct(null);
        // Update the status of the product in the list
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === selectedProduct._id
              ? {
                  ...product,
                  status: "Stock Added",
                  statusLabel: "Stock Added",
                }
              : product
          )
        );
        // Refresh the data
        applyFilter();
      }
    },
    [selectedProduct, applyFilter]
  );

  const handleSuccessModalCallback = useCallback(
    ({ action }: any) => {
      setShowSuccessModal(false);
      setAddedStockData(null);

      if (action === "view-inventory") {
        appNav.to(
          `/dashboard/inventory/products/view/${addedStockData?.productId}`
        );
      }
    },
    [appNav, addedStockData]
  );

  const handleSubscriptionSuccessModalCallback = useCallback(
    ({ action, data }: any) => {
      if (action === "close") {
        setShowSubscriptionSuccessModal(false);
        setSubscribedProductData(null);
      } else if (action === "add-stock-now") {
        // Close the subscription success modal
        setShowSubscriptionSuccessModal(false);

        // Set the selected product data for the add stock modal
        setSelectedProduct({
          dealId: data.productId,
          productName: data.dealName || data.productName,
          dealRefId: data.dealRefId,
          _id: data.importId,
          mrp: data.mrp,
          qty: data.qty,
          price: data.purchasePrice,
        });

        // Show the add stock modal
        setShowAddStockModal(true);

        // Clear the subscribed product data
        setSubscribedProductData(null);
      } else if (action === "add-stock-later") {
        setShowSubscriptionSuccessModal(false);
        setSubscribedProductData(null);
      }
    },
    []
  );

  return (
    <>
      <div>
        <div className="tw:text-gray-500 tw:text-sm tw:mb-4">
          {t("productsApprovedByAdminYouCanSubscribeToTheProduct")}
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
          <div className="tw:flex tw:gap-2 tw:items-center">
            <ViewToggle viewType={view} callback={setView} />

            {products.length > 0 && (
              <Rbac
                roles={rbacRoles.subscribe}
                forceDisplay={AuthService.isMasterLogin()}
              >
                <AppButton
                  size="small"
                  color="primary"
                  onClick={openBulkConfirm}
                >
                  <Package2 size={16} />
                  <span>{t("bulkSubscribe")}</span>
                </AppButton>
              </Rbac>
            )}
          </div>
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
      </div>

      {/* Add Stock Modal */}
      <InventoryAddStockModal
        show={showAddStockModal}
        callback={handleAddStockModalCallback}
        productId={selectedProduct?.dealId}
        productName={selectedProduct?.productName}
        dealRefId={selectedProduct?.dealRefId}
        mrp={selectedProduct?.mrp}
        qty={selectedProduct?.qty}
        purchasePrice={selectedProduct?.price}
      />

      {/* Success Modal */}
      <AddStockSuccessModal
        show={showSuccessModal}
        callback={handleSuccessModalCallback}
        productName={addedStockData?.productName}
        quantity={addedStockData?.quantity}
      />

      {/* Subscription Success Modal */}
      <SubscriptionSuccessModal
        show={showSubscriptionSuccessModal}
        callback={handleSubscriptionSuccessModalCallback}
        productName={subscribedProductData?.productName}
        productId={subscribedProductData?.productId}
        dealRefId={subscribedProductData?.dealRefId}
        importId={subscribedProductData?.importId}
        mrp={subscribedProductData?.mrp}
        qty={subscribedProductData?.qty}
        purchasePrice={subscribedProductData?.purchasePrice}
      />

      {/* Bulk Subscribe Confirmation */}
      <AppAlertDialog
        show={bulkAlert.show}
        title={t("pleaseConfirm")}
        description={t("bulkSubscribeConfirmation", {
          count: bulkAlert.count,
        })}
        onConfirm={confirmBulkSubscribe}
        onCancel={closeBulkConfirm}
        okText={t("confirm")}
        cancelText={t("cancel")}
        type="confirm"
      />

      {/* Busy Loader for Subscription */}
      <BusyLoader show={isSubscribing} message={t("subscribingToProduct")} />
    </>
  );
};

export default SubscribePendingProductsList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Subscribe Pending Items List"
      ),
    },
  ];
}
