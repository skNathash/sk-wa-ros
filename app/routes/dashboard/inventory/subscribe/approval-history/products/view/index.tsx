import { Plus, SquarePen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import SubscribeSidePane from "~/shared/inventory/components/subscribe-side-pane/SubscribeSidePane";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AddStockSuccessModal from "../../modals/AddStockSuccessModal";
import SubscriptionSuccessModal from "../../modals/SubscriptionSuccessModal";
import CompareTable from "./components/CompareTable";
import CreatedItemBanner from "./components/CreatedItemBanner";
import LinkedDealBanner from "./components/LinkedDealBanner";
import ProductDetails from "./components/ProductDetails";
import SubmissionReject from "./components/SubmissionReject";
import Summary from "./components/Summary";
import { buildCompareFields, type Item } from "./helper";
import PageAccessService from "~/services/PageAccessService";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.SUBSCRIBE"], {
    allowNoSubscribe: true,
  });
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Subscribe Approval History",
    redirect: {
      path: "/dashboard/inventory/subscribe/approval-history/products",
      params: {
        tab: "history",
      },
    },
  },
  { label: "Approval Detail" },
];

const defaultItem: Item = {
  _id: "",
  productName: "",
  brandName: "",
  categoryName: "",
  mrp: 0,
  price: 0,
  unitType: "",
  barcode: "",
  description: "",
  images: [],
};

const SubscribeApprovalHistoryProductsView = () => {
  const { id } = useParams();
  const appNav = useAppNav();
  const { t } = useTranslation(["common", "menu"]);
  const { show: showToast } = useAppToast();

  const [data, setData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<Item>({
    ...defaultItem,
  });
  const [updatedData, setUpdatedData] = useState<Item>({
    ...defaultItem,
  });

  const [loading, setLoading] = useState(true);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSubscriptionSuccessModal, setShowSubscriptionSuccessModal] =
    useState(false);
  const [successData, setSuccessData] = useState<{
    productName?: string;
    quantity?: number;
  }>({});
  const [subscribedProductData, setSubscribedProductData] = useState<any>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    imgs: Array<{ id: string }>;
  }>({
    show: false,
    imgs: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await InventorySubscribeService.getSellerImportProducts({
        filter: { _id: id },
      });
      const d =
        InventorySubscribeService.formatSellerImportProducts(
          response.data?.data || [],
        )?.[0] || {};

      if (d._id) {
        const status = InventorySubscribeService.getStatuses().find((s) =>
          s.statuses.includes(d.status),
        );
        d._statusColor = status ? status.color : "light";
        d._statusLabel = status ? status.label : d.status;
      }

      // derive isLinkedExisting if not already present
      if (typeof d.isLinkedExisting === "undefined") {
        d.isLinkedExisting = d.productType == "Existing";
      }
      setData(d);
      setOriginalData({
        _id: d.orgData?._id,
        productName: d.orgData?.name || d.orgData?.productName,
        brandName: d.orgData?.newBrand || d.orgData?.brand?.name,
        categoryName: d.orgData?.category?.name,
        mrp: d.orgData?.mrp,
        price: d.orgData?.price,
        weight: d.orgData?.weight,
        unitType: d.orgData?.unitType || d.orgData?.uom,
        barcode: d.orgData?.barcode,
        hsn: d.orgData?.hsnNumber || d.orgData?.hsn,
        gst: d.orgData?.gst,
        description: d.orgData?.description,
        images: d.orgData?.images,
        isConsumerOffer: d.orgData?.isConsumerOffer,
        consumerOfferData: d.orgData?.consumerOfferData,
        consumerOfferPrice: d.orgData?.consumerOfferPrice,
      });
      setUpdatedData({
        _id: d._id,
        productName: d.status === "Synced" ? d.dealName : d.productName,
        brandName: d.orgData?.newBrand || d.brand?.name,
        categoryName: d.category?.name,
        mrp: d.mrp,
        price: d.price,
        weight: d.weight,
        unitType: d.unitType || d.uom,
        barcode: d.barcode,
        hsn: d.hsnNumber || d.hsn,
        gst: d.gst,
        description: d.description,
        images: d.images,
        isConsumerOffer: d.isConsumerOffer,
        consumerOfferData: d.consumerOfferData,
        consumerOfferPrice: d.consumerOfferPrice,
      });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Modal handlers
  const handleAddStockModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "close") {
      setShowAddStockModal(false);
    } else if (params.action === "submit") {
      setShowAddStockModal(false);
      setSuccessData({
        productName: data?.productName,
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
      appNav.to(`/dashboard/inventory/products/view/${data?.dealId}`);
    }
  };

  const handleAddStockClick = () => {
    setShowAddStockModal(true);
  };

  const handleSubscribeDeal = useCallback(
    async (product: any) => {
      if (isSubscribing) return;

      setIsSubscribing(true);

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

          // Update the data status
          setData((prevData: any) => ({
            ...prevData,
            isSubscribed: true,
            status: "Subscribed",
            _statusLabel: "Subscribed",
            _statusColor: "success",
          }));

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
        setIsSubscribing(false);
      }
    },
    [isSubscribing, showToast, t],
  );

  const handleSubscriptionSuccessModalCallback = useCallback(
    ({ action, data }: any) => {
      if (action === "close") {
        setShowSubscriptionSuccessModal(false);
        setSubscribedProductData(null);
      } else if (action === "add-stock-now") {
        // Close the subscription success modal
        setShowSubscriptionSuccessModal(false);

        // Set the data for the add stock modal
        setData((prevData: any) => ({
          ...prevData,
          dealId: data.productId,
          dealRefId: data.dealRefId,
          _id: data.importId,
          mrp: data.mrp,
          qty: data.qty,
          price: data.purchasePrice,
        }));

        // Show the add stock modal
        setShowAddStockModal(true);

        // Clear the subscribed product data
        setSubscribedProductData(null);
      } else if (action === "add-stock-later") {
        setShowSubscriptionSuccessModal(false);
        setSubscribedProductData(null);
      }
    },
    [],
  );

  const handleImgPreviewModalCallback = useCallback(
    ({ action }: { action: string }) => {
      if (action === "close") {
        setImgPreviewModal({
          show: false,
          imgs: [],
        });
      }
    },
    [],
  );

  const handleImageClick = useCallback((images: any[]) => {
    if (Array.isArray(images) && images.length > 0) {
      const formattedImages = images.map((img) => ({ id: img }));
      setImgPreviewModal({
        show: true,
        imgs: formattedImages,
      });
    } else {
      console.log("Images array is empty or invalid:", images);
    }
  }, []);

  const handleViewDeal = useCallback(() => {
    if (data?.dealId) {
      appNav.to(`/dashboard/inventory/products/view/${data.dealId}`);
    }
  }, [data?.dealId, appNav]);

  /** Still awaiting review — nothing to compare, only the submission exists. */
  const isPending =
    data?.status !== "Rejected" &&
    !data?.isLinkedExisting &&
    !data?.isLinkedNew;

  const compareFields = useMemo(
    () => buildCompareFields(originalData, updatedData),
    [originalData, updatedData]
  );

  return (
    <>
      <AppHeader title="Approval Detail" />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs sectionKey="catalog" activeTab="library" noShadow sticky />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="library"
                title={t("menu:manageCatalog")}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <div
                  className="tw:flex tw:gap-4 tw:mb-4
              tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center
            "
                >
                  <AppBreadcrumbs data={breadcrumbs} />
                  {data?._id &&
                    data?.status === "Synced" &&
                    !data?.isSubscribed && (
                      <AppButton
                        onClick={() => handleSubscribeDeal(data)}
                        color="success"
                        className="tw:flex-shrink-0"
                        disabled={isSubscribing}
                      >
                        <Plus size={16} />
                        Subscribe
                      </AppButton>
                    )}
                </div>

                {loading ? (
                  <div className="tw:p-4 tw:text-center tw:flex tw:justify-center tw:items-center tw:h-full">
                    <AppSpinner />
                  </div>
                ) : null}

                {!loading && !data?._id ? <NoData /> : null}

                {data?._id ? (
                  <>
                    <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-4">
                      <div className="tw:md:w-1/3 tw:md:sticky tw:md:top-20 tw:md:self-start">
                        <Summary data={data} />
                      </div>
                      <div className="tw:md:w-2/3">
                        <AppCard
                          title={isPending ? "Your Submission" : "Review Outcome"}
                          icon={<SquarePen />}
                          iconClassName="tw:text-blue-500"
                        >
                          {data?.status === "Rejected" ? (
                            <SubmissionReject
                              requested={originalData}
                              remarks={data?.remarks || ""}
                              onImageClick={handleImageClick}
                            />
                          ) : isPending ? (
                            <ProductDetails
                              data={originalData}
                              onImageClick={handleImageClick}
                              title="Details you submitted — awaiting StoreKing review"
                            />
                          ) : (
                            <>
                              {data?.isLinkedExisting ? (
                                <LinkedDealBanner
                                  submittedName={originalData.productName}
                                  submittedBrand={originalData.brandName}
                                  dealName={data?.dealName || ""}
                                  dealRefId={data?.dealRefId || ""}
                                  dealImage={updatedData.images?.[0]}
                                  onViewDeal={
                                    data?.dealId ? handleViewDeal : undefined
                                  }
                                />
                              ) : (
                                <CreatedItemBanner
                                  dealName={
                                    data?.dealName || updatedData.productName
                                  }
                                  dealRefId={data?.dealRefId || ""}
                                  onViewDeal={
                                    data?.dealId ? handleViewDeal : undefined
                                  }
                                />
                              )}

                              <CompareTable
                                fields={compareFields}
                                onImageClick={handleImageClick}
                                finalLabel={
                                  data?.isLinkedExisting
                                    ? "Linked catalog item"
                                    : "Updated by StoreKing"
                                }
                              />
                            </>
                          )}
                        </AppCard>
                      </div>
                    </div>
                  </>
                ) : null}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <SubscribeSidePane scopeLabel="Approval" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      <InventoryAddStockModal
        show={showAddStockModal}
        callback={handleAddStockModalCallback}
        productId={data?.dealId}
        productName={data?.dealName}
        mrp={data?.mrp}
        dealRefId={data?.dealRefId}
        qty={data?.qty}
        purchasePrice={data?.price}
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

      {/* Busy Loader for Subscription */}
      <BusyLoader show={isSubscribing} message="Subscribing to item..." />

      {/* Image Preview Modal */}
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={handleImgPreviewModalCallback}
        images={imgPreviewModal.imgs}
      />
    </>
  );
};

export default SubscribeApprovalHistoryProductsView;
