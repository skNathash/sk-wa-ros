import {
  ChevronRight,
  FileText,
  Hash,
  PackagePlus,
  Plus,
  ShoppingCart,
  Upload,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Rbac from "~/components/core/rbac/Rbac";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import AppHeader from "~/components/core/header/AppHeader";
import { API, SUBSCRIBE_MAX_PRODUCTS_COUNT } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import SubscribeSidePane from "~/shared/inventory/components/subscribe-side-pane/SubscribeSidePane";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SuccessModal from "../../modals/SuccessModal";
import BulkUploadMainTab from "../components/BulkUploadMainTab";
import Preview from "./components/Preview";
import Steps from "./components/Steps";
import { type UploadMode } from "./components/UploadModeSelector";
import {
  fetchDealsByIds,
  getDealBatchStatus,
  getStatusBadgeVariant,
  parseDealIds,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.BULK-IMPORT-PRODUCTS"], {
    blockForMasterLogin: false,
    allowNoSubscribe: true,
  });
}

interface BulkUploadProduct {
  name: string;
  brand: string;
  category: string;
  mrp: number;
  price: number;
  unit: string;
  barcode: string;
  qty: number;
  status?: string;
  statusVariant?: "success" | "warning" | "danger" | "primary" | "default";
  importId?: string;
  dealId?: string;
  dealRef?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/main" },
  },
  { label: "Bulk Upload" },
];

const BulkUpload = () => {
  const { t } = useTranslation(["inventorySubscribe"]);
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const [display, setDisplay] = useState<"upload" | "preview">("upload");
  const [uploadMode, setUploadMode] = useState<UploadMode>("detailed");
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [, setLoading] = useState(false);
  const [dealIdInput, setDealIdInput] = useState("");
  const [dealIdSubmitting, setDealIdSubmitting] = useState(false);
  const [products, setProducts] = useState<BulkUploadProduct[]>([]);
  const [previewMode, setPreviewMode] = useState<UploadMode>("detailed");
  const [activeTab, setActiveTab] = useState("bulk");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalConfig, setSuccessModalConfig] = useState<{
    showViewRequestButton: boolean;
    title: string;
    description: ReactNode;
    primaryActionLabel: string;
    primaryAction: string;
    secondaryActionLabel: string;
  }>({
    showViewRequestButton: true,
    title: "Request Submitted!",
    description:
      "Your request has been submitted successfully. Our team will review your request and get back to you shortly.",
    primaryActionLabel: "View Requests",
    primaryAction: "view-requests",
    secondaryActionLabel: "Close",
  });
  const [commission, setCommission] = useState<number>(0);
  // AppAlertDialog state
  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
  });

  const appNav = useAppNav();

  const finishWithProducts = async (
    processed: BulkUploadProduct[],
    mode: UploadMode,
  ) => {
    setProducts(processed);
    setPreviewMode(mode);
    if (mode === "dealId") {
      setCommission(0);
    } else {
      await calculateCommission(processed);
    }
    setDisplay("preview");
    CommonService.scrollToView(document.body);
  };

  const handleDealIdFileUpload = async (response: any) => {
    setUploadedFile(response);
    const batchId = response?.uploadInfo?.batchId || response?.data?.batchId;
    if (!batchId) {
      appToast.show({ msg: "Batch ID missing in response", color: "danger" });
      return;
    }
    setLoading(true);
    try {
      const processed = (await getDealBatchStatus(
        batchId,
      )) as BulkUploadProduct[];
      if (processed.length > SUBSCRIBE_MAX_PRODUCTS_COUNT) {
        appToast.show({
          msg: `You can only upload up to ${SUBSCRIBE_MAX_PRODUCTS_COUNT} items at a time.`,
          color: "danger",
        });
        return;
      }
      await finishWithProducts(processed, "dealId");
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to fetch batch status",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDealIdSubmit = async () => {
    const ids = parseDealIds(dealIdInput);
    if (ids.length === 0) {
      appToast.show({ msg: "Enter at least one deal ID", color: "danger" });
      return;
    }
    if (ids.length > SUBSCRIBE_MAX_PRODUCTS_COUNT) {
      appToast.show({
        msg: `You can only submit up to ${SUBSCRIBE_MAX_PRODUCTS_COUNT} items at a time.`,
        color: "danger",
      });
      return;
    }
    setDealIdSubmitting(true);
    try {
      const processed = (await fetchDealsByIds(ids)) as BulkUploadProduct[];
      const invalidCount = processed.filter(
        (p) => (p.status || "").toUpperCase() === "INVALID",
      ).length;
      if (invalidCount > 0) {
        appToast.show({
          msg: `${invalidCount} deal ID(s) not found and marked invalid`,
          color: "warning",
        });
      }
      await finishWithProducts(processed, "dealId");
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to fetch deals",
        color: "danger",
      });
    } finally {
      setDealIdSubmitting(false);
    }
  };

  const handleFileUpload = async (response: any) => {
    setUploadedFile(response);
    // Map processedProducts from API response to BulkUploadProduct[]
    const processed = Array.isArray(response?.data?.successful)
      ? response.data.successful.map((item: any) => ({
          name: item.name || "",
          brand: item.brand || "",
          category: item.category || "",
          price: item.purchasePrice || 0,
          mrp: item.mrp || 0,
          unit: item.uom || "",
          barcode: item.barcode || "",
          qty: item.qty || 0,
          status: item.status || "",
          statusVariant: getStatusBadgeVariant(item.status),
          importId: item._id || "",
          dealId: item.dealId || "",
        }))
      : [];
    setProducts(processed);
    setPreviewMode("detailed");
    await calculateCommission(processed);

    setDisplay("preview");
    CommonService.scrollToView(document.body);
  };

  const calculateCommission = async (products: BulkUploadProduct[]) => {
    try {
      const deals = products
        .filter((item) => item.dealId)
        .map((item) => ({
          id: item.dealId!,
          qty: item.qty || 0,
          price: item.price || 0,
        }));

      let commissionValue = 0;

      if (deals.length > 0) {
        try {
          const commissionResult =
            await PurchaseOrderService.calculateCommissionValue(deals);
          commissionValue = commissionResult.commissionValue || 0;
        } catch (error) {
          console.error("Error calculating commission:", error);
          commissionValue = 0;
        }
      }

      setCommission(commissionValue);
    } catch (error) {
      console.error("Error calculating commission:", error);
      setCommission(0);
    }
  };

  const handleDownloadTemplate = (mode: UploadMode = uploadMode) => {
    const fileName =
      mode === "dealId"
        ? "deal-id-upload-sample.xlsx"
        : "product-upload-sample.xlsx";
    const url = `${location.origin}/assets/samples/${fileName}`;
    CommonService.windowOpenHandler(url, () => {});
  };

  // Note: handleSubmitProducts is not used as the actual submission is handled in Preview component
  // This function can be removed if not needed elsewhere

  const handleSubmissionCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "back") {
      handleBackToUpload();
    } else if (action === "submitted") {
      if (data?.mode === "dealId") {
        const count = Number(data?.count || 0);
        setDealIdInput("");
        setSuccessModalConfig({
          showViewRequestButton: false,
          title: "Deals added to your subscription cart",
          description: (
            <div className="tw:space-y-3">
              <p>
                {count > 0
                  ? `${count} deal${count === 1 ? "" : "s"} have been added to your subscription cart.`
                  : "The selected deals have been added to your subscription cart."}
              </p>
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2 tw:text-left">
                <div className="tw:rounded-xl tw:bg-emerald-50 tw:border tw:border-emerald-100 tw:px-3 tw:py-2">
                  <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-emerald-600 tw:font-semibold">
                    Next step
                  </div>
                  <div className="tw:text-sm tw:font-medium tw:text-emerald-900">
                    Review the cart and confirm quantities
                  </div>
                </div>
                <div className="tw:rounded-xl tw:bg-sky-50 tw:border tw:border-sky-100 tw:px-3 tw:py-2">
                  <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-sky-600 tw:font-semibold">
                    Status
                  </div>
                  <div className="tw:text-sm tw:font-medium tw:text-sky-900">
                    Ready for checkout from the cart page
                  </div>
                </div>
              </div>
            </div>
          ),
          primaryActionLabel: "View Cart",
          primaryAction: "view-cart",
          secondaryActionLabel: "",
        });
        setShowSuccessModal(true);
        return;
      }

      setSuccessModalConfig({
        showViewRequestButton: true,
        title: "Request Submitted!",
        description:
          "Your request has been submitted successfully. Our team will review your request and get back to you shortly.",
        primaryActionLabel: "View Requests",
        primaryAction: "view-requests",
        secondaryActionLabel: "Close",
      });
      setShowSuccessModal(true);
    }
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

  const handleSuccessModal = (data: { action: string; data?: any }) => {
    setShowSuccessModal(false);
    setDisplay("upload");
    setUploadedFile(null);
    setProducts([]);
    if (data.action === "view-requests") {
      appNav.to("/dashboard/inventory/subscribe/approval-history/bulk-upload", {
        hideTab: true,
      });
    } else if (
      data.action === "view-cart" ||
      (data.action === "close" &&
        successModalConfig.primaryAction === "view-cart")
    ) {
      appNav.to("/dashboard/inventory/subscribe/cart", {
        from: "bulk-upload-products",
      });
    }
  };

  const isPreview = display === "preview";

  return (
    <>
      <AppHeader
        // Matches the "Bulk Upload" chip that leads here from the catalog side
        // pane / nav strip; the preview step titles itself for what it shows.
        title={isPreview ? "Bulk Upload Preview" : "Bulk Upload"}
        renderActions={
          isTheme2 && !isMobile ? (
            <Rbac
              roles={["CATALOG.ADD-PRODUCTS"]}
              forceDisplay={AuthService.isMasterLogin()}
            >
              <AppButton
                onClick={() =>
                  appNav.to("/dashboard/inventory/subscribe/add-product")
                }
                color="primary"
                size="small"
                className="tw:flex tw:items-center tw:gap-1"
              >
                <Plus />
                {t("inventorySubscribe:actions.addProduct")}
              </AppButton>
            </Rbac>
          ) : undefined
        }
      />
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
                title="Manage Catalog"
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {isPreview ? (
                  <>
                    <AppBreadcrumbs
                      data={breadcrumbs}
                      className="tw:mb-4 hide-in-theme-2"
                    />
                    <BulkUploadMainTab
                      activeTab={activeTab}
                      className="tw:mb-4"
                    />
                    <div className="tw:space-y-6">
                      <Steps activeKey="preview" mode={previewMode} />
                      <Preview
                        products={products}
                        fileName={uploadedFile?.fileName || ""}
                        callback={handleSubmissionCallback}
                        commission={
                          previewMode === "dealId" ? undefined : commission
                        }
                        mode={previewMode}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Whole row is hidden in theme-2 (breadcrumbs are off and
                        the side pane owns the secondary navigation) — otherwise
                        its bottom margin leaves a page-bg strip above the
                        sticky tab band. */}
                    <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4 hide-in-theme-2">
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
                    <BulkUploadMainTab
                      activeTab={activeTab}
                      className="tw:mb-4"
                    />
                    {/* <BulkUploadSubTab activeTab="product" className="tw:mb-4" /> */}
                    <Steps activeKey="upload" mode={uploadMode} />

                    <div className="tw:space-y-6">
                      {/* ── Flow 1: Subscribe to existing catalog products via Deal IDs ── */}
                      <div className="tw:rounded-xl tw:border tw:border-emerald-200 tw:bg-emerald-50/40 tw:overflow-hidden">
                        <div className="tw:flex tw:items-start tw:gap-3 tw:p-4 tw:border-b tw:border-emerald-100 tw:bg-emerald-50">
                          <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:bg-emerald-100 tw:flex tw:items-center tw:justify-center">
                            <ShoppingCart className="tw:w-5 tw:h-5 tw:text-emerald-700" />
                          </div>
                          <div className="tw:flex-1">
                            <div className="tw:flex tw:items-center tw:gap-2">
                              <h3 className="tw:text-sm tw:font-bold tw:text-emerald-900">
                                Subscribe to existing products
                              </h3>
                              <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-emerald-200/70 tw:text-emerald-800 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
                                Deal IDs
                              </span>
                            </div>
                            <p className="tw:text-xs tw:text-emerald-800/80 tw:mt-1">
                              Already know the deal IDs of catalog products? Add
                              them to your subscription cart instantly — no
                              approval needed.
                            </p>
                          </div>
                        </div>

                        <div className="tw:p-4 tw:space-y-4 tw:bg-white">
                          {/* Option A: paste deal IDs */}
                          <div>
                            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                              <Hash className="tw:w-4 tw:h-4 tw:text-emerald-600" />
                              <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                                Paste Deal IDs
                              </span>
                              <span className="tw:text-[11px] tw:text-gray-500">
                                Comma or newline separated (max{" "}
                                {SUBSCRIBE_MAX_PRODUCTS_COUNT} items)
                              </span>
                            </div>
                            <textarea
                              value={dealIdInput}
                              onChange={(e) => setDealIdInput(e.target.value)}
                              rows={3}
                              placeholder="e.g. D1, D2, D3"
                              className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:p-3 tw:text-sm tw:font-mono focus:tw:border-emerald-400 focus:tw:outline-none"
                            />
                            <div className="tw:flex tw:justify-end tw:mt-2">
                              <AppButton
                                onClick={handleDealIdSubmit}
                                isLoading={dealIdSubmitting}
                                disabled={
                                  !dealIdInput.trim() || dealIdSubmitting
                                }
                                size="small"
                              >
                                Submit Deal IDs
                              </AppButton>
                            </div>
                          </div>

                          <div className="tw:flex tw:items-center tw:gap-3">
                            <div className="tw:flex-1 tw:h-px tw:bg-gray-200" />
                            <span className="tw:text-[11px] tw:font-medium tw:text-gray-400 tw:uppercase tw:tracking-wide">
                              or
                            </span>
                            <div className="tw:flex-1 tw:h-px tw:bg-gray-200" />
                          </div>

                          {/* Option B: deal-id file upload */}
                          <div>
                            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                              <FileText className="tw:w-4 tw:h-4 tw:text-emerald-600" />
                              <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                                Upload Deal ID file
                              </span>
                            </div>
                            <FileUpload
                              allowedExtensions={["xlsx", "xls", "csv"]}
                              accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                              dontUseNative={true}
                              maxSizeMB={20}
                              onFileUpload={handleDealIdFileUpload}
                              uploadUrl={`${API}purchase/inventory/excel/deal-upload`}
                            >
                              <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-between tw:gap-3 tw:w-full tw:border tw:border-dashed tw:border-emerald-300 tw:rounded-lg tw:p-4 tw:bg-emerald-50/30 hover:tw:bg-emerald-50">
                                <div className="tw:flex tw:items-center tw:gap-3">
                                  <FileText className="tw:w-6 tw:h-6 tw:text-emerald-600" />
                                  <div>
                                    <p className="tw:text-sm tw:font-medium tw:text-gray-800">
                                      Upload an Excel/CSV with deal IDs
                                    </p>
                                    <p className="tw:text-[11px] tw:text-gray-500">
                                      Supported: .xlsx, .xls, .csv (max 20MB, up
                                      to {SUBSCRIBE_MAX_PRODUCTS_COUNT} items)
                                    </p>
                                  </div>
                                </div>
                                <AppButton
                                  size="small"
                                  className="tw:flex tw:items-center tw:gap-1"
                                >
                                  <Upload className="tw:w-4 tw:h-4" />
                                  Choose File
                                </AppButton>
                              </div>
                            </FileUpload>
                            <div className="tw:mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadMode("dealId");
                                  handleDownloadTemplate("dealId");
                                }}
                                className="tw:text-xs tw:text-emerald-700 tw:underline tw:cursor-pointer"
                              >
                                Download deal-ID sample template
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Flow 2: Request new products (not in the catalog) ── */}
                      <div className="tw:rounded-xl tw:border tw:border-blue-200 tw:bg-blue-50/40 tw:overflow-hidden">
                        <div className="tw:flex tw:items-start tw:gap-3 tw:p-4 tw:border-b tw:border-blue-100 tw:bg-blue-50">
                          <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:bg-blue-100 tw:flex tw:items-center tw:justify-center">
                            <PackagePlus className="tw:w-5 tw:h-5 tw:text-blue-700" />
                          </div>
                          <div className="tw:flex-1">
                            <div className="tw:flex tw:items-center tw:gap-2">
                              <h3 className="tw:text-sm tw:font-bold tw:text-blue-900">
                                Request new products
                              </h3>
                              <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-blue-200/70 tw:text-blue-800 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
                                Needs approval
                              </span>
                            </div>
                            <p className="tw:text-xs tw:text-blue-800/80 tw:mt-1">
                              Product not in our catalog yet? Upload a detailed
                              file with name, brand, MRP, barcode etc. Our team
                              will review and add them.
                            </p>
                          </div>
                        </div>

                        <div className="tw:p-4 tw:bg-white">
                          <FileUpload
                            allowedExtensions={["xlsx", "xls", "csv"]}
                            accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            dontUseNative={true}
                            maxSizeMB={20}
                            onFileUpload={handleFileUpload}
                            uploadUrl={`${API}purchase/catalog-subscriptions/bulk-upload-seller-import-products`}
                          >
                            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:w-full tw:border-2 tw:border-dashed tw:border-blue-300 tw:rounded-lg tw:p-8 tw:bg-blue-50/30 hover:tw:bg-blue-50 tw:transition-colors">
                              <div className="tw:text-blue-400">
                                <FileText className="tw:w-12 tw:h-12" />
                              </div>
                              <div className="tw:text-center">
                                <h3 className="tw:text-base tw:font-semibold tw:text-gray-800 tw:mb-1">
                                  Upload product details file
                                </h3>
                                <p className="tw:text-sm tw:text-gray-500">
                                  Include: Product Name, Barcode, MRP, Purchase
                                  Price, Quantity, Unit, Description, Brand,
                                  Category.
                                </p>
                                <p className="tw:text-xs tw:text-gray-400 tw:mt-1">
                                  Supported: .xlsx, .xls, .csv
                                </p>
                              </div>
                              <AppButton className="tw:flex tw:items-center tw:gap-2">
                                <Upload className="tw:w-4 tw:h-4" />
                                Choose File
                              </AppButton>
                            </div>
                          </FileUpload>

                          <div className="tw:mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setUploadMode("detailed");
                                handleDownloadTemplate("detailed");
                              }}
                              className="tw:text-xs tw:text-blue-700 tw:underline tw:cursor-pointer"
                            >
                              Download detailed product sample template
                            </button>
                          </div>

                          {uploadedFile && uploadMode === "detailed" && (
                            <div className="tw:mt-4 tw:p-3 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-md">
                              <div className="tw:flex tw:items-center tw:gap-2 tw:text-green-700">
                                <FileText className="tw:w-4 tw:h-4" />
                                <span className="tw:text-sm tw:font-medium">
                                  File uploaded successfully
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <SubscribeSidePane scopeLabel="Bulk Upload" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <SuccessModal
        show={showSuccessModal}
        callback={handleSuccessModal}
        {...successModalConfig}
      />
    </>
  );
};

export default BulkUpload;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Catalog Bulk Upload"),
    },
  ];
}
