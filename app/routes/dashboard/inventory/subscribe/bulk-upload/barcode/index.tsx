import { produce } from "immer";
import { ChevronRight, ShoppingCart, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SuccessModal from "../../modals/SuccessModal";
import BulkUploadMainTab from "../components/BulkUploadMainTab";
import BarcodeFileUpload from "./components/BarcodeFileUpload";
import BarcodeTextArea from "./components/BarcodeTextArea";
import Preview from "./components/Preview";
import Steps from "./components/Steps";
import {
  getBatchStatus,
  handleProductSubscribe,
  subscribeAll,
  type BarcodeDealType,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.BULK-IMPORT-PRODUCTS"], {
    allowNoSubscribe: true,
  });
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/search?tab=search" },
  },
  {
    label: "Bulk Upload",
    redirect: { path: "/dashboard/inventory/subscribe/bulk-upload" },
  },
];

const BulkUploadBarcode = () => {
  const { t } = useTranslation();
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [display, setDisplay] = useState<"upload" | "preview">("upload");

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });

  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const [products, setProducts] = useState<BarcodeDealType[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [summary, setSummary] = useState<{
    total: number;
    invalid: number;
    valid: number;
    pendingSubscribe: number;
  }>({
    total: 0,
    invalid: 0,
    valid: 0,
    pendingSubscribe: 0,
  });

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
    type?: "alert" | "confirm";
    okText?: string;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
    type: "confirm",
    okText: "Continue",
  });

  const [isSubscribingAll, setIsSubscribingAll] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const count = products.filter((item: any) => item.isInCart).length;
    setCartCount(count);

    const invalid = products.filter(
      (item: BarcodeDealType) => item.status === "INVALID",
    ).length;
    const valid = products.filter(
      (item: BarcodeDealType) => item.status === "VALID",
    ).length;

    const pendingSubscribe = products.filter(
      (item: BarcodeDealType) =>
        !item.isInCart && item.status === "VALID" && !item.isSubscribed,
    ).length;

    setSummary({
      total: products.length,
      invalid,
      valid,
      pendingSubscribe,
    });
  }, [products]);

  // Handle remove product by index
  const handleRemoveProduct = (index: number) => {
    setProducts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // If no products remain after removal, go back to upload view and
      // clear the uploaded file so the user can upload again.
      if (next.length === 0) {
        setDisplay("upload");
        setUploadedFile(null);
      }
      return next;
    });
  };

  // Handle subscribe product by index (from Preview/DesktopView/MobileView)
  const handleSubscribeProduct = async (index: number) => {
    setBusyLoader({
      show: true,
      message: "Subscribing product...",
    });

    const response = await handleProductSubscribe(products[index]);

    if (response.status === "success") {
      setProducts(
        produce((draft) => {
          draft[index].isInCart = true;
        }),
      );

      appToast.show({
        msg: response.message,
        color: "success",
      });
    } else {
      appToast.show({
        msg: response.message,
        color: "danger",
      });
    }

    setBusyLoader({
      show: false,
      message: "",
    });
  };

  const handleSubscribeAll = async () => {
    setAppAlertDialog({
      show: true,
      title: "Subscribe All",
      description:
        "This will subscribe all valid products. Do you want to continue?",
      successCb: async () => {
        // close confirmation dialog
        setAppAlertDialog((prev) => ({ ...prev, show: false }));

        // small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsSubscribingAll(true);
        setBusyLoader({
          show: true,
          message: "Subscribing all products...",
        });

        const filteredProducts = products.filter(
          (item: BarcodeDealType) =>
            item.status === "VALID" && !item.isSubscribed,
        );

        const response = await subscribeAll(filteredProducts);

        setBusyLoader({
          show: false,
          message: "",
        });
        setIsSubscribingAll(false);

        const failedDeals: string[] = response?.failedDeals || [];
        const failedCount = failedDeals.length;
        const successCount = Math.max(0, filteredProducts.length - failedCount);

        // Update products state to reflect cart and errors
        setProducts(
          produce((draft) => {
            draft.forEach((item) => {
              const isFailed = failedDeals.includes(item.dealId);

              if (item.status === "VALID" && !item.isSubscribed && !isFailed) {
                item.isInCart = true;
              }

              if (isFailed) {
                item.subscribeError = "Failed to subscribe";
              }
            });
          }),
        );

        // Show summarised result to the user in an alert dialog. On OK redirect to cart.
        const description =
          response.status === "success"
            ? `${successCount} product(s) subscribed successfully. ${failedCount} failed to subscribe.`
            : response.message ||
              `Failed to subscribe products. ${failedCount} failed.`;

        await new Promise((resolve) => setTimeout(resolve, 800));

        setAppAlertDialog({
          show: true,
          title: "Subscribe Results",
          description,
          // use alert type (single button) and custom OK text
          type: "alert",
          okText: "View Cart",
          successCb: async () => {
            setAppAlertDialog((prev) => ({ ...prev, show: false }));
            await new Promise((resolve) => setTimeout(resolve, 800));
            appNav.to("/dashboard/inventory/subscribe/cart", {
              from: "bulk-upload",
            });
          },
          cancelCb: () => {
            setAppAlertDialog((prev) => ({ ...prev, show: false }));
          },
        });
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleFileUpload = async (response: any) => {
    setUploadedFile(response);

    const batchId = response?.uploadInfo?.batchId || "";

    if (!batchId) {
      appToast.show({
        msg: "Batch ID missing",
        color: "danger",
      });
      return;
    }

    const deals = await getBatchStatus(batchId);

    const combined = prepareProducts(deals);

    setProducts(combined);
    setDisplay("preview");
  };

  const handleTextAreaUpload = (deals: BarcodeDealType[]) => {
    const combined = prepareProducts(deals);
    setProducts(combined);
    setDisplay("preview");
  };

  // Shared helper to prepare products array from deals list
  const prepareProducts = (deals: BarcodeDealType[]): BarcodeDealType[] => {
    const successfulArr: BarcodeDealType[] = deals.filter(
      (item: BarcodeDealType) => item.status === "VALID" && !item.isSubscribed,
    );

    const failedArr: BarcodeDealType[] = deals.filter(
      (item: BarcodeDealType) => item.status === "INVALID",
    );

    const alreadySubscribedArr: BarcodeDealType[] = deals.filter(
      (item: BarcodeDealType) => item.isSubscribed,
    );

    // Preserve existing ordering: successes, then failed, then already subscribed
    const processedSuccess: BarcodeDealType[] = successfulArr;
    const processedFailed: BarcodeDealType[] = failedArr;

    return [...processedSuccess, ...processedFailed, ...alreadySubscribedArr];
  };

  const handleDownloadTemplate = () => {
    const url =
      location.origin + "/assets/samples/product-upload-barcode-sample.xlsx";
    CommonService.windowOpenHandler(url, () => {});
  };

  const handleBackToUpload = async () => {
    setAppAlertDialog({
      show: true,
      title: "Are you sure?",
      description:
        "Going back will discard the uploaded file and any changes. Do you want to continue?",
      successCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        setDisplay("upload");
        setUploadedFile(null);
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // Confirm navigation to Invalid Barcodes because current data will be lost
  const handleInvalidBarcodesNavigate = () => {
    setAppAlertDialog({
      show: true,
      title: "Are you sure?",
      description:
        "If you go to 'Invalid Barcodes', the barcodes you just uploaded will be cleared and your changes will be lost. Do you want to continue?",
      successCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        // clear current state before navigation
        setProducts([]);
        setDisplay("upload");
        setUploadedFile(null);
        appNav.to(
          "/dashboard/inventory/subscribe/bulk-upload/invalid-barcodes",
        );
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleSuccessModal = (data: { action: string; data?: any }) => {
    setShowSuccessModal(false);
    if (data.action === "view-requests") {
      appNav.to("/dashboard/inventory/subscribe/approval-history/bulk-upload", {
        hideTab: true,
      });
    }
  };

  return (
    <>
      <AppHeader title="Catalog Bulk Upload Barcode" />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} />
            <div>
              <AppButton
                onClick={() =>
                  appNav.to(
                    "/dashboard/inventory/subscribe/approval-history/products",
                  )
                }
                color="light"
                size="small"
                fill="outline"
              >
                Subscription History
                <ChevronRight />
              </AppButton>
            </div>
          </div>

          <BulkUploadMainTab activeTab="barcode" className="tw:mb-4" />

          {/* <BulkUploadSubTab activeTab="barcode" className="tw:mb-4" /> */}

          {/* Conditional content blocks */}
          <div className="tw:space-y-6">
            {display === "preview" ? (
              <>
                <Steps activeKey="preview" />

                {summary.invalid > 0 && (
                  <div>
                    <p className="tw:text-xs tw:text-gray-600 tw:mb-2 tw:-mt-1">
                      Some barcodes (
                      <span className="tw:font-semibold">
                        {summary.invalid}
                      </span>
                      ) were not found. Create products for them on the{" "}
                      <button
                        className="tw:text-blue-800 tw:font-semibold tw:underline"
                        onClick={handleInvalidBarcodesNavigate}
                      >
                        Invalid Barcodes
                      </button>
                      .
                    </p>
                  </div>
                )}

                <Preview
                  products={products}
                  fileName={uploadedFile?.fileName || ""}
                  onRemoveProduct={handleRemoveProduct}
                  onSubscribeProduct={handleSubscribeProduct}
                />
              </>
            ) : (
              <>
                <Steps activeKey="upload" />

                <BarcodeTextArea callback={handleTextAreaUpload} />

                {/* Card 1: Bulk Barcode List Upload Information */}

                {/* Card 2: Upload Barcode List File */}
                <div className="tw:space-y-4">
                  <BarcodeFileUpload
                    onFileUpload={handleFileUpload}
                    uploadedFile={uploadedFile}
                    handleDownloadTemplate={handleDownloadTemplate}
                  />
                </div>
              </>
            )}
          </div>

          {/* Sticky bottom action block: Subscribe All + View Cart */}
          {display === "preview" &&
            products.length > 0 &&
            summary.valid > 0 && (
              <>
                <div className="tw:h-24"></div>
                <div className="tw:sticky tw:bottom-0 tw:left-0 tw:right-0 tw:z-50 tw:p-4 tw:bg-white tw:rounded-lg tw:shadow-md">
                  <div className="tw:flex tw:flex-row tw:justify-between tw:items-center">
                    <div className="tw:text-xs tw:text-blue-800 tw:font-semibold">
                      {!summary.pendingSubscribe
                        ? "To complete the subscription, please click on the 'View' button."
                        : null}
                    </div>

                    <div className="tw:flex tw:flex-row tw:gap-x-4">
                      {summary.pendingSubscribe > 0 && (
                        <AppButton
                          onClick={handleSubscribeAll}
                          isLoading={isSubscribingAll}
                          color="primary"
                          className="tw:rounded-full tw:px-6 tw:py-3 tw:mr-2"
                        >
                          Subscribe all ({summary.pendingSubscribe})
                        </AppButton>
                      )}

                      {cartCount > 0 && (
                        <AppButton
                          onClick={() =>
                            appNav.to("/dashboard/inventory/subscribe/cart", {
                              from: "bulk-upload",
                            })
                          }
                          color="success"
                          className="tw:rounded-full tw:px-4 tw:py-3 animate__animated animate__pulse animate__infinite"
                        >
                          <ShoppingCart size={16} />
                          View ({cartCount})
                        </AppButton>
                      )}

                      <AppButton
                        onClick={handleBackToUpload}
                        color="danger"
                        fill="outline"
                        className="tw:rounded-full tw:px-4 tw:py-3"
                      >
                        <XCircle size={16} />
                        Cancel
                      </AppButton>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        type={appAlertDialog.type}
        okText={appAlertDialog.okText}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <SuccessModal show={showSuccessModal} callback={handleSuccessModal} />

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default BulkUploadBarcode;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Catalog Bulk Upload Barcode",
      ),
    },
  ];
}
