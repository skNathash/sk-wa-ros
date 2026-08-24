import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import { AppInput } from "~/components/core/form/AppInput";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getBulkApprovalDetail } from "./helper";
import DateFormat from "~/components/core/date/DateFormat";
import PageAccessService from "~/services/PageAccessService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import AddStockSuccessModal from "../../modals/AddStockSuccessModal";
import SubscriptionSuccessModal from "../../modals/SubscriptionSuccessModal";
import type { BreadcrumbItem, ViewToggleType } from "~/types/CommonTypes";
import AuthService from "~/services/AuthService";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.SUBSCRIBE"], {
    allowNoSubscribe: true,
  });
}

const BulkApprovalDetailView = () => {
  const { t } = useTranslation(["common"]);
  const { id } = useParams();
  const appNav = useAppNav();
  const { show: showToast } = useAppToast();

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: t("dashboard"), redirect: { path: "/dashboard" } },
    {
      label: t("inventory"),
      redirect: {
        path: "/dashboard/inventory/products/list",
      },
    },
    {
      label: t("subscribeApprovalHistory"),
      redirect: {
        path: "/dashboard/inventory/subscribe/approval-history/bulk-upload",
        params: {
          hideTab: true,
        },
      },
    },
    { label: t("bulkUploadDetail") },
  ];

  const [breadcrumbs] = useState(defaultBreadcrumbs);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");
  const screenView = useScreenView();

  // Subscription flow state
  const [busyloader, setBusyloader] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionSuccessModal, setSubscriptionSuccessModal] = useState<{
    show: boolean;
    product: any;
  }>({
    show: false,
    product: null,
  });
  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    product: any;
  }>({
    show: false,
    product: null,
  });
  const [successData, setSuccessData] = useState<{
    productName?: string;
    quantity?: number;
  }>({});

  const { register, watch } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const searchValue = watch("search");

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!detail?.products || !searchValue) {
      return detail?.products || [];
    }

    return detail.products.filter((product: any) =>
      product.originalProduct?.name
        ?.toLowerCase()
        .includes(searchValue.toLowerCase()),
    );
  }, [detail?.products, searchValue]);

  const handleItemClick = useCallback(
    ({ action, data }: any) => {
      if (AuthService.isMasterLogin()) {
        showToast({
          msg: t("youAreNotAuthorizedToDoThisAction"),
          color: "error",
        });
        return;
      }

      if (action === "view") {
        appNav.to(
          `/dashboard/inventory/subscribe/approval-history/products/view/${data._id}`,
        );
      } else if (action === "subscribe") {
        handleSubscribeDeal(data);
      }
    },
    [appNav],
  );

  // Subscription handlers
  const handleSubscribeDeal = useCallback(
    async (product: any) => {
      if (busyloader) return;

      setBusyloader(true);

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
          const subscribedProduct = {
            productName: product.originalProduct?.name || product.productName,
            productId: product.dealId,
            dealRefId: product.dealRefId,
            importId: product._id,
            mrp: product.finalProduct?.mrp || product.mrp,
            qty: product.qty,
            purchasePrice: product.finalProduct?.price || product.price,
          };

          // Show the subscription success modal
          setSubscriptionSuccessModal({
            show: true,
            product: subscribedProduct,
          });

          // Update the product status in the detail data
          setDetail((prevDetail: any) => {
            if (!prevDetail?.products) return prevDetail;

            const updatedProducts = prevDetail.products.map((p: any) => {
              if (p._id === product._id) {
                return {
                  ...p,
                  isSubscribed: true,
                  status: "Subscribed",
                  statusLabel: "Subscribed",
                  statusColor: "success",
                };
              }
              return p;
            });

            return {
              ...prevDetail,
              products: updatedProducts,
            };
          });

          showToast({
            msg: "Subscription successful!",
            color: "success",
          });
        } else {
          showToast({
            msg:
              response.data?.message ||
              "Subscription failed. Please try again.",
            color: "error",
          });
        }
      } catch (error: any) {
        console.error("Error subscribing to deal:", error);
        showToast({
          msg: error.message || "Subscription failed. Please try again.",
          color: "error",
        });
      } finally {
        setBusyloader(false);
      }
    },
    [busyloader, showToast],
  );

  // Modal handlers
  const handleAddStockModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "close") {
      setAddStockModal({ show: false, product: null });
    } else if (params.action === "submit") {
      setAddStockModal({ show: false, product: null });
      setSuccessData({
        productName:
          addStockModal.product?.originalProduct?.name ||
          addStockModal.product?.productName,
        quantity: params.data?.quantity,
      });
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "close") {
      setShowSuccessModal(false);
    } else if (params.action === "view-inventory") {
      setShowSuccessModal(false);
      appNav.to(
        `/dashboard/inventory/products/view/${addStockModal.product?.productId}`,
      );
    }
  };

  const handleSubscriptionSuccessModalCallback = useCallback(
    ({ action, data }: any) => {
      if (action === "close") {
        setSubscriptionSuccessModal({ show: false, product: null });
      } else if (action === "add-stock-now") {
        // Close the subscription success modal
        setSubscriptionSuccessModal({ show: false, product: null });

        // Set the data for the add stock modal
        const productData = {
          dealId: data.productId,
          dealRefId: data.dealRefId,
          _id: data.importId,
          mrp: data.mrp,
          qty: data.qty,
          price: data.purchasePrice,
        };

        // Show the add stock modal
        setAddStockModal({ show: true, product: productData });
      } else if (action === "add-stock-later") {
        setSubscriptionSuccessModal({ show: false, product: null });
      }
    },
    [],
  );

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await getBulkApprovalDetail(id || "");
        setDetail(data);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <>
      <AppHeader title={t("Upload Detail")} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            {t("reviewDetailsForBulkUpload")}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-40">
              <span className="tw-animate-spin tw-mr-2 tw-h-5 tw-w-5 tw-border-4 tw-border-gray-300 tw-border-t-blue-500 tw-rounded-full"></span>
              <span className="tw-text-gray-500">{t("loading")}</span>
            </div>
          ) : !detail || !detail._id ? (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-40">
              <span className="tw-text-gray-400 tw-text-lg">
                {t("noDataFound")}
              </span>
            </div>
          ) : (
            <>
              {/* Basic Info Card */}
              <AppCard>
                <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-2">
                  {/* File Name */}
                  <div className="tw:col-span-1">
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("fileName")}
                    </div>
                    <div className="tw:font-semibold tw:break-all">
                      {detail.fileName}
                    </div>
                  </div>
                  {/* Upload Date */}
                  <div className="tw:col-span-1">
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("uploadDate")}
                    </div>
                    <div className="tw:font-semibold">
                      <DateFormat value={detail.createdAt || "-"} />
                    </div>
                  </div>
                  {/* Status */}
                  <div className="tw:col-span-1">
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("status")}
                    </div>
                    <div>
                      <span className="tw:inline-block tw:bg-yellow-100 tw:text-yellow-800 tw:px-2 tw:py-1 tw:rounded tw:text-xs">
                        {detail.finalStatus || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Processing Date */}
                  <div className="tw:col-span-1">
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("processingDate")}
                    </div>
                    {detail.updatedBy && detail.updatedAt ? (
                      <div className="tw:font-semibold">
                        <DateFormat
                          value={detail.updatedAt}
                          formatStr="dd MMM yyyy"
                        />
                      </div>
                    ) : (
                      "--"
                    )}
                  </div>
                  {/* Results */}
                  {/* <div className="tw:col-span-1 tw:flex tw:items-center tw:gap-2">
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("results")}
                    </div>
                    <div>
                      <span className="tw:inline-block tw:bg-green-100 tw:text-green-800 tw:px-2 tw:py-1 tw:rounded tw:text-xs">
                        {detail.statusImported || 0} {t("approved")}
                      </span>
                      <span className="tw:inline-block tw:bg-red-100 tw:text-red-800 tw:px-2 tw:py-1 tw:rounded tw:text-xs tw:ml-2">
                        {detail.statusRejected || 0} {t("rejected")}
                      </span>
                    </div>
                  </div> */}
                </div>
              </AppCard>

              {/* Approval Items Card */}
              <AppCard
                className="tw:mt-6"
                title={`${t("approvalItems")} (${filteredProducts.length})`}
                icon="file-text"
                noContentPadding={!screenView.isMobile}
              >
                <div className="tw:md:px-4">
                  {/* Search Input and View Toggle on same row */}
                  <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
                    <AppInput
                      register={register}
                      name="search"
                      placeholder={t("searchByName")}
                      className="tw:max-w-lg tw:min-w-80"
                    />
                    <ViewToggle viewType={view} callback={setView} />
                  </div>
                </div>

                {screenView.isMobile || view === "card" ? (
                  <MobileView
                    data={filteredProducts}
                    loading={loading}
                    callback={handleItemClick}
                  />
                ) : (
                  <DesktopView
                    data={filteredProducts}
                    loading={loading}
                    callback={handleItemClick}
                  />
                )}
              </AppCard>
            </>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      <InventoryAddStockModal
        show={addStockModal.show}
        callback={handleAddStockModalCallback}
        productId={addStockModal.product?._id}
        productName={
          addStockModal.product?.originalProduct?.name ||
          addStockModal.product?.productName
        }
        mrp={addStockModal.product?.mrp}
      />

      {/* Success Modal */}
      <AddStockSuccessModal
        show={showSuccessModal}
        callback={handleSuccessModalCallback}
        productName={successData.productName}
        quantity={successData.quantity}
      />

      {/* Subscription Success Modal */}
      <SubscriptionSuccessModal
        show={subscriptionSuccessModal.show}
        callback={handleSubscriptionSuccessModalCallback}
        productName={subscriptionSuccessModal.product?.productName}
        productId={subscriptionSuccessModal.product?.productId}
        dealRefId={subscriptionSuccessModal.product?.dealRefId}
        importId={subscriptionSuccessModal.product?.importId}
        mrp={subscriptionSuccessModal.product?.mrp}
        qty={subscriptionSuccessModal.product?.qty}
        purchasePrice={subscriptionSuccessModal.product?.purchasePrice}
      />

      {/* Busy Loader for Subscription */}
      <BusyLoader show={busyloader} message="Subscribing to product..." />
    </>
  );
};

export default BulkApprovalDetailView;
