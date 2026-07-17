import { Plus, SquarePen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AddStockSuccessModal from "../../modals/AddStockSuccessModal";
import SubscriptionSuccessModal from "../../modals/SubscriptionSuccessModal";
import DiffItem from "./components/DiffItem";
import LinkedDealDiff from "./components/LinkedDealDiff";
import ProductDetails from "./components/ProductDetails";
import SubmissionReject from "./components/SubmissionReject";
import Summary from "./components/Summary";
import type { Item } from "./helper";
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
  const { t } = useTranslation(["common"]);
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
          response.data?.data || []
        )?.[0] || {};

      if (d._id) {
        const status = InventorySubscribeService.getStatuses().find((s) =>
          s.statuses.includes(d.status)
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
    [isSubscribing, showToast, t]
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
    []
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
    []
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

  return (
    <>
      <AppHeader title="Approval Detail" />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div
            className="tw:flex tw:gap-4 tw:mb-4 
              tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center
            "
          >
            <AppBreadcrumbs data={breadcrumbs} />
            {data?._id && data?.status === "Synced" && !data?.isSubscribed && (
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
                    title="Item Info"
                    icon={<SquarePen />}
                    iconClassName="tw:text-blue-500"
                  >
                    {/* Show SubmissionReject component for rejected submissions */}
                    {data?.status === "Rejected" ? (
                      <SubmissionReject
                        requested={originalData}
                        remarks={data?.remarks || ""}
                      />
                    ) : data?.status === "Created" ||
                      data?.status === "NotFound" ? (
                      <ProductDetails
                        onImageClick={handleImageClick}
                        data={{
                          productName: originalData.productName,
                          brandName: originalData.brandName,
                          categoryName: originalData.categoryName,
                          mrp: originalData.mrp,
                          price: originalData.price,
                          weight: originalData.weight,
                          unitType: originalData.unitType,
                          barcode: originalData.barcode,
                          hsn: originalData.hsn,
                          gst: originalData.gst,
                          description: originalData.description,
                          images: originalData.images,
                          isConsumerOffer: originalData.isConsumerOffer,
                          consumerOfferData:
                            data?.orgData?.consumerOfferData || undefined,
                          consumerOfferPrice:
                            data?.orgData?.consumerOfferPrice || undefined,
                        }}
                      />
                    ) : (
                      <>
                        <div className="tw:border tw:border-gray-200 tw:rounded-md tw:p-4 tw:flex tw:gap-2 tw:mb-4">
                          <SquarePen size={16} />
                          <div className="tw:text-xs">
                            The following changes were made during the approval
                            process:
                          </div>
                        </div>

                        {data?.isLinkedExisting ? (
                          <LinkedDealDiff
                            requested={originalData}
                            dealName={data?.dealName || ""}
                            dealRefId={data?.dealRefId || ""}
                          />
                        ) : null}

                        {data?.isLinkedNew ? (
                          <>
                            <DiffItem
                              label="Item Name"
                              originalData={originalData.productName || "--"}
                              updatedData={updatedData.productName || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="OFFER"
                              originalData={
                                originalData.isConsumerOffer ? "Yes" : "No"
                              }
                              updatedData={
                                updatedData.isConsumerOffer ? "Yes" : "No"
                              }
                              type="text"
                            />

                            <DiffItem
                              label="Brand"
                              originalData={originalData.brandName || "--"}
                              updatedData={updatedData.brandName || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="Category"
                              originalData={originalData.categoryName || "--"}
                              updatedData={updatedData.categoryName || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="MRP"
                              originalData={originalData.mrp || "--"}
                              updatedData={updatedData.mrp || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="Price"
                              originalData={originalData.price || "--"}
                              updatedData={updatedData.price || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="Weight"
                              originalData={
                                originalData.weight !== undefined &&
                                originalData.weight !== null
                                  ? `${originalData.weight} ${originalData.unitType || ""}`
                                  : "--"
                              }
                              updatedData={
                                updatedData.weight !== undefined &&
                                updatedData.weight !== null
                                  ? `${updatedData.weight} ${updatedData.unitType || ""}`
                                  : "--"
                              }
                              type="text"
                            />

                            <DiffItem
                              label="Unit Type"
                              originalData={originalData.unitType || "--"}
                              updatedData={updatedData.unitType || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="Barcode"
                              originalData={originalData.barcode || "--"}
                              updatedData={updatedData.barcode || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="HSN"
                              originalData={originalData.hsn || "--"}
                              updatedData={updatedData.hsn || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="GST %"
                              originalData={
                                typeof originalData.gst === "number"
                                  ? `${originalData.gst}%`
                                  : originalData.gst || "--"
                              }
                              updatedData={
                                typeof updatedData.gst === "number"
                                  ? `${updatedData.gst}%`
                                  : updatedData.gst || "--"
                              }
                              type="text"
                            />

                            <DiffItem
                              label="Description"
                              originalData={originalData.description || "--"}
                              updatedData={updatedData.description || "--"}
                              type="text"
                            />

                            <DiffItem
                              label="Image"
                              originalData={originalData.images || "--"}
                              updatedData={updatedData.images || "--"}
                              type="image"
                              onImageClick={handleImageClick}
                            />
                          </>
                        ) : null}
                      </>
                    )}
                  </AppCard>
                </div>
              </div>
            </>
          ) : null}
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
