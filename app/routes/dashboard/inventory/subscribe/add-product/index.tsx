import {
  Camera,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Image,
  IndianRupee,
  Pencil,
  Plus,
  ScanLine,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import ImgRender from "~/components/core/img/ImgRender";
import { AppInput, AppSelect, AppSwitch } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import { ASSET } from "~/constants";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PageAccessService from "~/services/PageAccessService";
import ProductService from "~/services/ProductService";
import UomPriceService from "~/services/UomPriceService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BulkUploadMainTab from "../bulk-upload/components/BulkUploadMainTab";
import SuccessModal from "../modals/SuccessModal";
import AiExtractedDetailsModal from "~/shared/catalog/modals/AiExtractedDetailsModal";
import { validateProduct } from "./helper";
import SampleImagesModal from "./modals/SampleImagesModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.ADD-PRODUCTS"], {
    blockForMasterLogin: false,
    allowNoSubscribe: true,
  });
}

// Visual grouping wrapper for related form fields. Each section is a clean
// white card anchored by a small colored icon chip so the form reads as
// distinct, scannable steps rather than one flat grid of inputs.
const FormSection = ({
  icon,
  accent,
  title,
  description,
  extra,
  children,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  description?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="tw:rounded-xl tw:border tw:border-gray-200/80 tw:bg-white tw:shadow-sm tw:p-4">
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3 tw:pb-3 tw:border-b tw:border-gray-100">
      <div className="tw:flex tw:items-center tw:gap-2.5">
        <div
          className={`tw:shrink-0 tw:w-8 tw:h-8 tw:rounded-lg tw:flex tw:items-center tw:justify-center ${accent}`}
        >
          {icon}
        </div>
        <div>
          <h4 className="tw:text-sm tw:font-semibold tw:text-gray-900">
            {title}
          </h4>
          {description && (
            <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {extra && <div className="tw:shrink-0">{extra}</div>}
    </div>
    {children}
  </section>
);

// Cycling status lines shown while StoreKing AI works through an image. The
// copy walks the seller through what the AI is doing so the wait feels active
// rather than stalled.
const AI_PROCESSING_MESSAGES = [
  "Analyzing your images…",
  "Reading the product name and brand…",
  "Detecting MRP, barcode, and pack size…",
  "Pulling out highlights and description…",
  "Matching category and tax details…",
  "Almost there — putting it all together…",
];

// Rotates through AI_PROCESSING_MESSAGES every few seconds while the AI is
// extracting, holding on the last line so it doesn't loop back to the start.
const AiProcessingMessage = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => Math.min(i + 1, AI_PROCESSING_MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="tw:text-[10px] tw:text-indigo-600 tw:transition-opacity">
      {AI_PROCESSING_MESSAGES[index]}
    </p>
  );
};

const ManageProduct = () => {
  const { t } = useTranslation(["inventorySubscribe"]);
  const { register, handleSubmit, setValue, getValues, control, reset } =
    useForm<Record<string, any>>({
      defaultValues: {
        unitType: "piece",
      },
    });
  const { show } = useAppToast();
  const [loading, setLoading] = useState(false);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "single",
  );
  // Barcode forwarded from the scan page (already prefilled into the form). Its
  // presence means the seller landed here to create a specific scanned item, so
  // we surface a context banner that spells out the next step.
  const scannedBarcode = searchParams.get("barcode");
  // The bulk barcode-scan "Add Details" flow forwards the scanned item so the
  // created product can be linked back to it (`scanItemId`) and created through
  // the bulk import API (`bulk=1`) instead of the single-product endpoint.
  const scanItemId = searchParams.get("scanItemId");
  const useBulkApi = searchParams.get("bulk") === "1";

  const [addNewBrand, setAddNewBrand] = useState(false);
  const [approvalPendingCount, setApprovalPendingCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [showAiDetailsModal, setShowAiDetailsModal] = useState(false);
  const [aiProduct, setAiProduct] = useState<any | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  // Reveal the detail sections (Basic / Pricing / Additional) only after the
  // user commits to a path: AI has filled the form, or they opted to type it
  // manually. Keeps the initial view focused on uploading a photo.
  const [aiApplied, setAiApplied] = useState(false);
  const [manualFill, setManualFill] = useState(false);
  const showDetails = aiApplied || manualFill;

  // Fetch approval pending count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const resp = await InventorySubscribeService.getSellerImportProducts({
          outputType: "count",
          filter: { status: "Synced" },
        });
        setApprovalPendingCount(resp.data?.data?.totalProducts || 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
  }, []);

  // Auto-fill barcode from query params
  useEffect(() => {
    const barcode = searchParams.get("barcode");
    if (barcode) {
      setValue("barcode", barcode);
    }
  }, [searchParams, setValue]);

  // Prefill the form from the bulk barcode-scan "Add Details" handoff. AI-found
  // rows carry a name/MRP/images to confirm; not-found rows arrive blank. The
  // detail sections stay collapsed — the seller still starts on the photo/chooser
  // step and the prefilled values surface once they open the manual-fill path.
  useEffect(() => {
    const name = searchParams.get("name");
    const mrp = searchParams.get("mrp");
    const images = searchParams.get("images");
    if (name) setValue("name", name);
    if (mrp) setValue("mrp", mrp);
    if (images) {
      setValue(
        "images",
        images
          .split(",")
          .filter(Boolean)
          .map((id) => ({ id })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [uomOptions, setUomOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const fetchUomMasters = async () => {
      try {
        const response = await CommonService.getUomMasters({
          filter: {
            isPackType: false,
          },
        });
        const list = response?.data?.data || [];
        setUomOptions(
          list
            .filter((item: any) => {
              const name = String(item.name).toLowerCase();
              return name !== "kg" && name !== "liter";
            })
            .map((item: any) => ({ label: item.name, value: item.name })),
        );
      } catch (e) {
        // ignore
      }
    };
    fetchUomMasters();
  }, []);

  // When the seller arrived from another page, that page passes its return
  // path as `from` and a human label as `fromLabel`. Surface it as a dynamic
  // breadcrumb just before "Create Product" (second-to-last position), linking
  // back to `from` so the trail reflects where they came from.
  const fromPath = searchParams.get("from");
  const fromLabel = searchParams.get("fromLabel");

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("breadcrumbs.dashboard"), redirect: { path: "/dashboard" } },
    {
      label: t("breadcrumbs.subscription"),
      redirect: { path: "/dashboard/inventory/subscribe/main" },
    },
    ...(fromPath && fromLabel
      ? [{ label: fromLabel, redirect: { path: fromPath } }]
      : []),
    {
      label: t("breadcrumbs.createProduct"),
    },
  ];

  // Use useWatch for images array
  const images =
    useWatch<Record<string, any>>({ control, name: "images" }) || [];

  // Watch unitType so price/weight hints reflect the current unit
  const unitType =
    useWatch<Record<string, any>>({ control, name: "unitType" }) || "piece";

  // Watch isLocalDeal so the form can surface the "Local Deal" badge
  const isLocalDeal = useWatch<Record<string, any>>({
    control,
    name: "isLocalDeal",
  });
  const [uomOpen, setUomOpen] = useState(false);
  // Watch mrp to show the per-base-unit (per gm/ml) price hint for small uoms
  const mrpWatch = useWatch<Record<string, any>>({ control, name: "mrp" });
  // Display unit shown beside the weight input (kg/ltr for small uoms, else uom)
  const displayUom = UomPriceService.getDisplayUom(unitType);
  const isSmallUom = UomPriceService.isSmallUom(unitType);

  // Watch the selected category to decide if the model input applies (electronics)
  const category = useWatch<Record<string, any>>({ control, name: "category" });
  const showModelInput = CommonService.shouldShowModelInput(
    category?.value?.name,
  );

  // Extract details using StoreKing AI
  const extractDetailsWithAi = async (imgsToProcess = images) => {
    if (!imgsToProcess || imgsToProcess.length === 0) {
      show({
        msg: "Please upload at least one image to extract details.",
        color: "warning",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      // Use the same AI extractor endpoint as the barcode-scan page, passing
      // the uploaded images as an array of absolute URLs.
      const urls = imgsToProcess.map((img: any) =>
        /^https?:\/\//i.test(img.id) ? img.id : `${ASSET}/${img.id}?size=400`,
      );
      const results = await InventorySubscribeService.aiSearchByBarcodes(
        { images: urls },
        { searchInAi: true },
      );
      // Keep the raw AI deal (csaAttr, disclaimer, highlights, etc.) so the
      // review modal can render the full set of extracted details.
      const aiDeal = results?.data?.data?.aiSuggestedDeals?.[0];

      if (results.statusCode === 200 && aiDeal?.name) {
        setAiProduct(aiDeal);
        setShowAiDetailsModal(true);
      } else {
        show({
          msg: "Failed to extract product details. Please try again or enter manually.",
          color: "warning",
        });
      }
    } catch (err: any) {
      console.error("AI Extractor Error:", err);
      show({
        msg:
          err?.message ||
          "StoreKing AI processing failed. Please enter details manually.",
        color: "danger",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Side effects to run once a product create request succeeds — clear the form
  // and AI state, collapse the detail sections, and surface the success modal.
  const handleCreateSuccess = () => {
    reset();
    resetAiExtraction();
    setAiApplied(false);
    setManualFill(false);
    setShowSuccessModal(true);
  };

  // Review-modal callback. The modal owns the create request (api mode), so we
  // only react to its outcome: run the success side effects on "success" and
  // close on "close". Closing happens regardless so the modal doesn't linger.
  const handleAiDetailsModal = (data: { action: string; data?: any }) => {
    setShowAiDetailsModal(false);
    if (data.action === "success") {
      handleCreateSuccess();
    }
  };

  // A prior AI extraction belongs to a specific set of photos, so changing the
  // photos invalidates it — drop the cached result and close its review modal.
  const resetAiExtraction = () => {
    setAiProduct(null);
    setShowAiDetailsModal(false);
  };

  // Add uploaded image to images array
  const handleFileUpload = async (data: any) => {
    if (data && data._id) {
      const updatedImages = [...images, { id: data._id }];
      setValue("images", updatedImages, {
        shouldValidate: true,
      });
      resetAiExtraction();
    }
  };

  // Remove image by index
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_: any, i: number) => i !== index);
    setValue("images", newImages, { shouldValidate: true });
    resetAiExtraction();
  };

  // Handle image preview
  const handleImageClick = (imageId: string) => {
    setPreviewImageId(imageId);
    setShowImagePreviewModal(true);
  };

  const handleImagePreviewModal = (data: { action: string; data?: any }) => {
    setShowImagePreviewModal(false);
  };

  const onSubmit = async (data: any) => {
    const validation = validateProduct(data);
    if (validation.msg) {
      show({
        msg: validation.msg || t("messages.validationFailed"),
        color: "danger",
      });
      return;
    }

    setLoading(true);
    try {
      const invalidBarcodeId = searchParams.get("id");

      const payload: Record<string, any> = {
        productName: data.name?.trim(),
        qty: 0,
        // For small uoms (gm/ml) the user enters values in the display unit
        // (per-kg price, weight in kg/ltr); convert to the lower uom for the API.
        mrp: Number(UomPriceService.toApiPrice(data.mrp, data.unitType)),
        weight:
          data.weight !== undefined && data.weight !== ""
            ? Number(UomPriceService.toApiQuantity(data.weight, data.unitType))
            : undefined,
        barcode: data.barcode,
        uom: data.unitType,
        description: data.description,
        additionalInfo: data.additionalInfo,
        // Category selected via CategorySearchInput: normalize to { id, categoryId, name }
        category: {
          id: data.category?.value?.objId ?? "",
          categoryId: data.category?.value?.id ?? "",
          name: data.category?.value?.name ?? "",
        },
        images: (data.images || []).map((e: any) => e.id),
        ...(data.isLocalDeal ? { isLocalDeal: true } : {}),
        // GST/HSN come from the AI extraction; send GST as a bare number with
        // no "%" symbol. Omit when absent (e.g. manual entry).
        ...(data.gst !== undefined && data.gst !== null && data.gst !== ""
          ? { gst: Number(String(data.gst).replace(/%/g, "").trim()) }
          : {}),
        ...(data.hsnNumber ? { hsnNumber: data.hsnNumber } : {}),
        // Model only applies to electronics; include it when present
        ...(CommonService.shouldShowModelInput(data.category?.value?.name) &&
        data.model?.trim()
          ? { modelNo: data.model.trim() }
          : {}),
      };

      // Include invalid barcode id if present
      if (invalidBarcodeId) {
        payload.invalidBarcodeId = invalidBarcodeId;
      }

      // Link the created product back to the scanned item it was created for.
      if (scanItemId) {
        payload.scanItemId = scanItemId;
      }

      // Brand handling: if newBrand exists, attach generic brand and keep newBrand
      const selectedBrand = data.brand?.value;
      const newBrand = (data.newBrand || "").trim();
      if (newBrand) {
        try {
          const brandResponse = await ProductService.getBrands({
            filter: { name: "Generic_Brand" },
            page: 1,
            count: 1,
          });
          if (
            brandResponse?.statusCode === 200 &&
            brandResponse?.data?.data?.length > 0
          ) {
            const genericBrand = brandResponse.data.data[0];
            payload.brand = {
              id: genericBrand.id,
              name: genericBrand.name,
              brandId: genericBrand._id,
            };
            payload.newBrand = newBrand;
          } else {
            payload.newBrand = newBrand;
          }
        } catch (err) {
          // Fallback: carry only newBrand if generic lookup fails
          payload.newBrand = newBrand;
        }
      } else if (selectedBrand) {
        // Map selected brand to object shape
        payload.brand = {
          id: selectedBrand.objId,
          name: selectedBrand.name,
          brandId: selectedBrand.id,
        };
      }

      // Items coming from the bulk barcode-scan flow are created through the
      // bulk import endpoint (one product per call here) so they land in the
      // same catalog-team queue as the rest of that batch.
      const response = useBulkApi
        ? await InventorySubscribeService.bulkImportStoreProducts([payload])
        : await InventorySubscribeService.importStoreProduct(payload);
      const succeeded = useBulkApi
        ? response?.statusCode >= 200 && response?.statusCode < 300
        : response?.statusCode === 200;
      if (succeeded) {
        handleCreateSuccess();
      } else {
        show({
          msg: response?.data?.message || t("messages.failedToSubmit"),
          color: "danger",
        });
      }
    } catch (err: any) {
      show({
        msg: err?.message || t("messages.failedToSubmit"),
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Marking a scanned barcode as the seller's own product flags it as a local deal.
  // "useBarcode" = the barcode is linked to other deals but the seller chose to
  // use it anyway for their own product.
  const handleBarcodeCallback = (params: { action: string; data?: any }) => {
    if (params.action === "markAsLocal" || params.action === "useBarcode") {
      setValue("isLocalDeal", true);
    }
  };

  // Avoid inline functions for BrandSearchInput and CategorySearchInput
  const handleBrandChange = (item: any, action: string) => {
    if (action === "add") setValue("brand", item);
    if (action === "remove") setValue("brand", undefined);
  };

  const handleCategoryChange = (item: any, action: string) => {
    if (action === "add") setValue("category", item);
    if (action === "remove") setValue("category", undefined);
  };

  const handleNumberInput = (e: any) => {
    const name = e.target.name;
    const value = e.target.value;

    // allow clearing the field while typing
    if (value === "") {
      setValue(name, "");
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;

    // Special handling for weight: clamp to [0, 100000]
    if (name === "weight") {
      if (num < 0) {
        setValue(name, "");
        return;
      }
      if (num > 100000) {
        setValue(name, 100000);
        return;
      }
      setValue(name, num);
      return;
    }

    // clamp maximum for other numeric fields
    if (num > 1000000) {
      setValue(name, 1000000);
      return;
    }

    // for mrp and price, enforce minimum of 1
    if ((name === "mrp" || name === "price") && num < 1) {
      setValue(name, 1);
      return;
    }

    // previous behaviour: clear negative values
    if (num < 0) {
      setValue(name, "");
      return;
    }

    // set parsed numeric value for other fields
    setValue(name, num);
  };

  // StoreKing AI beta entry point — disabled along with its banner block.
  // const handleTryAi = () => {
  //   appNav.to("/dashboard/inventory/subscribe/ai-add-product");
  // };

  const openSampleModal = () => setShowSampleModal(true);
  const closeSampleModal = () => setShowSampleModal(false);

  const handleUomChange = (value: string) => {
    const prev = getValues("unitType");
    setValue("unitType", value, { shouldValidate: true });
    // Switching between a small uom (gm/ml) and a regular one changes the
    // meaning of the entered price/weight, so clear them to avoid stale values.
    if (
      UomPriceService.isSmallUom(prev) !== UomPriceService.isSmallUom(value)
    ) {
      setValue("mrp", "");
      setValue("weight", "");
    }
  };

  const toggleAddNewBrand = () => {
    setAddNewBrand((prev) => !prev);
  };

  const handleSuccessModal = (data: { action: string; data?: any }) => {
    const action = data?.action;
    setShowSuccessModal(false);
    if (action === "view-requests") {
      viewSubscriptionHistory();
      return;
    }
    // When the seller arrived here from another page (e.g. barcode scan), send
    // them back there once the product is created and they dismiss the modal.
    const from = searchParams.get("from");
    if (from) {
      appNav.to(from);
    }
  };

  const viewSubscriptionHistory = () => {
    appNav.to("/dashboard/inventory/subscribe/approval-history/products", {
      tab: "history",
    });
  };

  return (
    <>
      <AppHeader title={t("header.title")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} />
            <div>
              <AppButton
                onClick={viewSubscriptionHistory}
                color="light"
                size="small"
                fill="outline"
              >
                Subscription History
                <ChevronRight />
              </AppButton>
            </div>
          </div>
          {/* <BulkUploadMainTab activeTab={activeTab} className="tw:mb-4" /> */}

          {/* Approval Pending Count Block — a single tappable strip that takes
              the seller to their pending products. Temporarily disabled. */}
          {/*
          {approvalPendingCount > 0 && (
            <button
              type="button"
              onClick={() =>
                appNav.to(
                  "/dashboard/inventory/subscribe/approval-history/products",
                  { tab: "history" },
                )
              }
              className="tw:group tw:mb-4 tw:flex tw:w-full tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2 tw:text-left tw:shadow-sm tw:transition-colors hover:tw:bg-gray-50"
            >
              <span className="tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-100 tw:px-2 tw:py-0.5 tw:text-xs tw:font-bold tw:text-amber-700">
                {approvalPendingCount}
              </span>
              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:text-gray-700">
                Product{approvalPendingCount > 1 ? "s" : ""} pending approval
              </span>
              <ChevronRight className="tw:w-4 tw:h-4 tw:shrink-0 tw:text-gray-400 tw:transition-transform group-hover:tw:translate-x-0.5" />
            </button>
          )}
          */}

          {/* Scan context banner — shown when the seller arrives from the
              barcode-scan page. Makes it clear they're creating the item they
              just scanned, that the barcode is already captured, and what to do
              next (add a photo for AI fill, or enter details manually below). */}
          {scannedBarcode && (
            <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2.5 tw:rounded-lg tw:border tw:border-blue-200 tw:bg-blue-50 tw:px-3 tw:py-2">
              <ScanLine className="tw:w-4 tw:h-4 tw:shrink-0 tw:text-blue-600" />
              <p className="tw:min-w-0 tw:text-xs tw:text-gray-700">
                Barcode{" "}
                <span className="tw:font-mono tw:font-bold tw:text-blue-700">
                  {scannedBarcode}
                </span>{" "}
                captured — add a photo to auto-fill, or fill details below.
              </p>
            </div>
          )}

          {/* StoreKing AI Block (Beta) — temporarily disabled */}
          {/*
          <div className="tw:mb-4">
            <div className="tw:group tw:relative tw:overflow-hidden tw:bg-white tw:border tw:border-purple-100 tw:rounded-xl tw:shadow-sm hover:tw:shadow-md tw:transition-all tw:duration-300">
              <div className="tw:absolute tw:inset-0 tw:bg-gradient-to-r tw:from-purple-50/50 tw:via-blue-50/30 tw:to-transparent tw:opacity-100" />

              <div className="tw:relative tw:p-3 tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:justify-between tw:gap-3">
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div className="tw:flex-shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:bg-gradient-to-br tw:from-purple-500 tw:to-indigo-600 tw:flex tw:items-center tw:justify-center tw:shadow-sm group-hover:tw:scale-105 tw:transition-transform tw:duration-300">
                    <Sparkles className="tw:w-5 tw:h-5 tw:text-white" />
                  </div>

                  <div className="tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <h3 className="tw:text-sm tw:font-bold tw:text-gray-900">
                        StoreKing AI
                      </h3>
                      <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-purple-100 tw:text-purple-700 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
                        Beta
                      </span>
                    </div>
                    <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                      Upload an image to auto-fill product details instantly
                    </p>
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:justify-end tw:gap-3">
                  <div className="tw:hidden tw:md:flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:text-gray-400 tw:bg-white/50 tw:px-2 tw:py-1 tw:rounded-full tw:border tw:border-purple-50">
                    <span className="tw:text-purple-600">Upload</span>
                    <ChevronRight className="tw:w-3 tw:h-3" />
                    <span className="tw:text-purple-600">Extract</span>
                    <ChevronRight className="tw:w-3 tw:h-3" />
                    <span className="tw:text-purple-600">Fill</span>
                  </div>

                  <AppButton
                    onClick={handleTryAi}
                    color="primary"
                    size="small"
                    className="tw:w-full tw:sm:w-auto tw:shadow-sm hover:tw:shadow tw:text-xs"
                  >
                    <Sparkles className="tw:w-3.5 tw:h-3.5 tw:mr-1.5" />
                    Try AI
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
          */}

          {/* Page content: Add Product Form */}
          <div>
            <div>
              <div className="tw:mb-4">
                <h3 className="tw:text-base tw:font-semibold tw:text-gray-900">
                  {t("form.title")}
                </h3>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                  {t("form.subtitle")}
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="tw:flex tw:flex-col tw:gap-4">
                  {/* Product images */}
                  <FormSection
                    icon={<Image size={18} className="tw:text-violet-600" />}
                    accent="tw:bg-violet-50"
                    title="Product Images"
                    description="Upload clear photos of the product to auto-fill details"
                    extra={
                      <button
                        type="button"
                        onClick={openSampleModal}
                        className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-blue-200 tw:bg-blue-50 tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-blue-600 tw:transition-colors hover:tw:bg-blue-100 tw:cursor-pointer"
                      >
                        <Eye className="tw:w-3.5 tw:h-3.5" />
                        Samples
                      </button>
                    }
                  >
                    <div className="tw:space-y-4">
                      {images && images.length > 0 ? (
                        <div className="tw:grid tw:grid-cols-3 tw:sm:grid-cols-4 tw:lg:grid-cols-6 tw:gap-3">
                          {images.map((img: any, index: number) => (
                            <div
                              key={img.id}
                              className="tw:group tw:relative tw:aspect-square tw:rounded-xl tw:overflow-hidden tw:border tw:border-gray-200 tw:bg-gray-50 tw:shadow-sm"
                            >
                              <button
                                type="button"
                                className="tw:block tw:w-full tw:h-full tw:cursor-pointer"
                                onClick={() => handleImageClick(img.id)}
                                title="View image"
                              >
                                <ImgRender
                                  {...(/^https?:\/\//i.test(img.id)
                                    ? { src: img.id, isAbsolute: true }
                                    : { assetId: img.id })}
                                  className="tw:w-full tw:h-full tw:object-cover tw:transition-transform tw:duration-300 group-hover:tw:scale-105"
                                  alt="Product"
                                />
                                {/* Hover scrim with a preview affordance */}
                                <span className="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:bg-gray-900/0 tw:opacity-0 tw:transition-all tw:duration-200 group-hover:tw:bg-gray-900/35 group-hover:tw:opacity-100">
                                  <Eye className="tw:w-5 tw:h-5 tw:text-white tw:drop-shadow" />
                                </span>
                              </button>

                              {/* The first photo is used as the listing cover */}
                              {index === 0 && (
                                <span className="tw:absolute tw:bottom-1 tw:left-1 tw:rounded-md tw:bg-gray-900/75 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
                                  Cover
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(index);
                                }}
                                className="tw:absolute tw:top-1 tw:right-1 tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-white/90 tw:text-gray-500 tw:shadow-sm tw:transition-all hover:tw:bg-red-500 hover:tw:text-white tw:z-10"
                                title="Remove image"
                              >
                                <Trash2 className="tw:w-3.5 tw:h-3.5" />
                              </button>
                            </div>
                          ))}

                          {/* Inline tile to upload more images */}
                          <FileUpload onFileUpload={handleFileUpload}>
                            <div className="tw:group tw:aspect-square tw:border-2 tw:border-dashed tw:border-gray-200 tw:rounded-xl tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:bg-violet-50/30 hover:tw:border-violet-400 hover:tw:bg-violet-50/60 tw:transition-all cursor-pointer">
                              <span className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:bg-white tw:text-violet-500 tw:shadow-sm group-hover:tw:scale-105 tw:transition-transform">
                                <Plus className="tw:w-5 tw:h-5" />
                              </span>
                              <span className="tw:text-[10px] tw:font-bold tw:text-violet-500">
                                Add Photo
                              </span>
                            </div>
                          </FileUpload>
                        </div>
                      ) : (
                        <FileUpload onFileUpload={handleFileUpload}>
                          <div className="tw:group tw:relative tw:overflow-hidden tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:w-full tw:border-2 tw:border-dashed tw:border-violet-200 tw:rounded-2xl tw:bg-linear-to-br tw:from-violet-50 tw:via-white tw:to-purple-50/60 tw:px-6 tw:py-8 tw:transition-all hover:tw:border-violet-400 hover:tw:from-violet-100/80 cursor-pointer">
                            {/* Camera tile carrying a small AI sparkle badge —
                                signals that the photo auto-fills the form. */}
                            <div className="tw:relative tw:mb-3">
                              <div className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-2xl tw:bg-linear-to-br tw:from-violet-500 tw:to-purple-600 tw:text-white tw:shadow-md group-hover:tw:scale-105 tw:transition-transform">
                                <Camera size={26} />
                              </div>
                              <span className="tw:absolute tw:-top-1.5 tw:-right-1.5 tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-full tw:bg-white tw:text-purple-600 tw:shadow-sm tw:ring-2 tw:ring-violet-50">
                                <Sparkles className="tw:w-3.5 tw:h-3.5" />
                              </span>
                            </div>
                            <span className="tw:block tw:text-sm tw:font-bold tw:text-gray-900">
                              Snap a photo to begin
                            </span>
                            <span className="tw:block tw:text-xs tw:text-gray-500 tw:mt-1 tw:max-w-xs">
                              Take or upload a photo and StoreKing AI fills in
                              the name, price and other details for you
                            </span>
                            <span className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-white/80 tw:border tw:border-violet-100 tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-medium tw:text-gray-500">
                              JPG · PNG · WEBP · up to 10MB
                            </span>
                          </div>
                        </FileUpload>
                      )}

                      {/* Inline Loading State */}
                      {isAiLoading && (
                        <div className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-indigo-100 tw:bg-linear-to-br tw:from-indigo-50 tw:via-white tw:to-purple-50 tw:p-3.5">
                          <div className="tw:flex tw:items-center tw:gap-3">
                            {/* Icon with a pulsing halo — reads as "thinking"
                                without the jittery whole-card pulse. */}
                            <div className="tw:relative tw:shrink-0">
                              <span className="tw:absolute tw:inset-0 tw:rounded-lg tw:bg-indigo-400/40 tw:animate-ping" />
                              <div className="tw:relative tw:w-9 tw:h-9 tw:rounded-lg tw:bg-linear-to-br tw:from-indigo-500 tw:to-purple-600 tw:flex tw:items-center tw:justify-center tw:shadow-sm">
                                <Sparkles className="tw:w-5 tw:h-5 tw:text-white" />
                              </div>
                            </div>
                            <div className="tw:flex-1 tw:min-w-0">
                              <p className="tw:flex tw:items-center tw:text-xs tw:font-semibold tw:text-indigo-900">
                                StoreKing AI is extracting details
                                {/* Animated typing dots */}
                                <span className="tw:ml-1 tw:inline-flex tw:gap-0.5">
                                  <span className="tw:w-1 tw:h-1 tw:rounded-full tw:bg-indigo-500 tw:animate-bounce tw:[animation-delay:-0.3s]" />
                                  <span className="tw:w-1 tw:h-1 tw:rounded-full tw:bg-indigo-500 tw:animate-bounce tw:[animation-delay:-0.15s]" />
                                  <span className="tw:w-1 tw:h-1 tw:rounded-full tw:bg-indigo-500 tw:animate-bounce" />
                                </span>
                              </p>
                              <AiProcessingMessage />
                            </div>
                          </div>
                          {/* Indeterminate progress track with a sweeping stripe */}
                          <div className="tw:mt-3 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-indigo-100">
                            <div className="ai-progress-sweep tw:h-full tw:w-1/3 tw:rounded-full tw:bg-linear-to-r tw:from-indigo-400 tw:to-purple-500" />
                          </div>
                        </div>
                      )}

                      {/* StoreKing AI Assistant Banner Card */}
                      {images && images.length > 0 && !isAiLoading && (
                        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-between tw:gap-3 tw:p-3 tw:bg-purple-50/50 tw:border tw:border-purple-100/60 tw:rounded-xl">
                          <div className="tw:flex tw:items-center tw:gap-2.5 tw:self-start tw:sm:self-auto">
                            <Sparkles className="tw:w-4 tw:h-4 tw:text-purple-600 tw:shrink-0" />
                            <div className="tw:text-left">
                              <span className="tw:block tw:text-xs tw:font-bold tw:text-gray-900">
                                StoreKing AI Assistant
                              </span>
                              <span className="tw:block tw:text-[10px] tw:text-gray-500 tw:mt-0.5">
                                {aiProduct
                                  ? "Details extracted — review them or re-scan the photos"
                                  : "StoreKing AI will fill the product details using your photos"}
                              </span>
                            </div>
                          </div>
                          {/* Once details exist, keep them re-openable (no extra API
                              call) and offer a re-scan; otherwise show the primary CTA. */}
                          {aiProduct ? (
                            <div className="tw:flex tw:items-center tw:gap-2 tw:w-full tw:sm:w-auto">
                              <AppButton
                                type="button"
                                onClick={() => extractDetailsWithAi(images)}
                                color="light"
                                fill="outline"
                                size="small"
                                className="tw:text-xs tw:h-8 tw:px-3 tw:rounded-lg tw:shadow-none tw:flex-1 tw:sm:flex-none"
                              >
                                Re-scan
                              </AppButton>
                              <AppButton
                                type="button"
                                onClick={() => setShowAiDetailsModal(true)}
                                color="primary"
                                size="small"
                                className="tw:text-xs tw:h-8 tw:px-3 tw:rounded-lg tw:shadow-none tw:flex-1 tw:sm:flex-none"
                              >
                                <Eye className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
                                View Details
                              </AppButton>
                            </div>
                          ) : (
                            <AppButton
                              type="button"
                              onClick={() => extractDetailsWithAi(images)}
                              disabled={isAiLoading}
                              color="primary"
                              size="small"
                              className="tw:text-xs tw:h-8 tw:px-3 tw:rounded-lg tw:shadow-none tw:w-full tw:sm:w-auto"
                            >
                              <Sparkles className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
                              Fill from Photo
                            </AppButton>
                          )}
                        </div>
                      )}
                    </div>
                  </FormSection>

                  {/* Path chooser: the user either uploads a photo and lets AI
                      fill the form, or opts to enter the details manually.
                      Uploading is optional, so the manual option is always
                      offered; the "or" divider only appears once a photo exists
                      (i.e. alongside the AI banner). The detail sections stay
                      hidden until one path is taken. Built as a large, icon-led
                      tap target (not a small checkbox) so the choice is obvious
                      for rural users. */}
                  {images && images.length > 0 && !showDetails && (
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
                      <span className="tw:text-[11px] tw:font-medium tw:text-gray-400 tw:uppercase tw:tracking-wide">
                        or
                      </span>
                      <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
                    </div>
                  )}
                  {!showDetails && (
                    <button
                      type="button"
                      onClick={() => setManualFill(true)}
                      className="tw:group tw:flex tw:items-center tw:gap-3 tw:w-full tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:text-left tw:cursor-pointer tw:transition-all hover:tw:border-blue-400 hover:tw:bg-blue-50/30"
                    >
                      <span className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:bg-blue-50 tw:text-blue-600 group-hover:tw:scale-105 tw:transition-transform">
                        <Pencil size={20} />
                      </span>
                      <span className="tw:flex-1">
                        <span className="tw:block tw:text-sm tw:font-bold tw:text-gray-900">
                          I will fill the product details myself
                        </span>
                        <span className="tw:block tw:text-xs tw:text-gray-500 tw:mt-0.5">
                          Type the product name, price and other details
                        </span>
                      </span>
                      <ChevronRight className="tw:w-5 tw:h-5 tw:text-gray-300 group-hover:tw:text-blue-500 tw:transition-colors" />
                    </button>
                  )}

                  {showDetails && (
                    <>
                      {/* Basic details: identity of the product */}
                      <FormSection
                        icon={<Tag size={18} className="tw:text-blue-600" />}
                        accent="tw:bg-blue-50"
                        title="Basic Details"
                        description="Name, brand and category of the product"
                      >
                        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-4">
                          <AppInput
                            name="name"
                            label={t("form.fields.productName.label")}
                            register={register}
                            isRequired
                            size="sm"
                            placeholder={t(
                              "form.fields.productName.placeholder",
                            )}
                            className="tw:col-span-1 tw:sm:col-span-2"
                          />

                          <div>
                            {addNewBrand ? (
                              <>
                                <AppInput
                                  register={register}
                                  name="newBrand"
                                  label="Add New Brand"
                                  size="sm"
                                  placeholder="Enter Brand Name"
                                />
                                <button
                                  className="tw:text-xs tw:text-gray-500 tw:underline tw:cursor-pointer"
                                  onClick={toggleAddNewBrand}
                                  type="button"
                                >
                                  Search All Brands
                                </button>
                              </>
                            ) : (
                              <>
                                <Controller
                                  name="brand"
                                  control={control}
                                  render={({ field }) => (
                                    <BrandSearchInput
                                      size="sm"
                                      values={field.value ? [field.value] : []}
                                      callback={handleBrandChange}
                                      label={t("form.fields.brand.label")}
                                    />
                                  )}
                                />
                                <button
                                  className="tw:text-xs tw:text-gray-500 tw:underline tw:cursor-pointer"
                                  onClick={toggleAddNewBrand}
                                  type="button"
                                >
                                  Add New Brand
                                </button>
                              </>
                            )}
                          </div>

                          <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                              <CategorySearchInput
                                size="sm"
                                values={field.value ? [field.value] : []}
                                callback={handleCategoryChange}
                                label={t("form.fields.category.label")}
                              />
                            )}
                          />

                          {showModelInput && (
                            <AppInput
                              name="model"
                              label={t("form.fields.model.label")}
                              register={register}
                              isRequired
                              size="sm"
                              placeholder={t("form.fields.model.placeholder")}
                            />
                          )}
                        </div>
                      </FormSection>

                      {/* Pricing & units: how the product is measured and priced */}
                      <FormSection
                        icon={
                          <IndianRupee
                            size={18}
                            className="tw:text-emerald-600"
                          />
                        }
                        accent="tw:bg-emerald-50"
                        title="Pricing & Units"
                        description="Unit, price, weight and barcode"
                      >
                        <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
                          <Controller
                            name="unitType"
                            control={control}
                            render={({ field }) => (
                              <AppSelect
                                label={t("form.fields.unitType.label")}
                                placeholder={t(
                                  "form.fields.unitType.placeholder",
                                )}
                                options={uomOptions}
                                value={field.value}
                                onChange={handleUomChange}
                                size="sm"
                                inputClassName="tw:w-full"
                                isRequired
                              />
                            )}
                          />

                          <div>
                            <AppInput
                              type="number"
                              name="mrp"
                              label={t("form.fields.mrp.label")}
                              register={register}
                              isRequired
                              size="sm"
                              placeholder={t("form.fields.mrp.placeholder")}
                              onChange={handleNumberInput}
                            />
                            {isSmallUom && (
                              <p className="tw:text-[11px] tw:text-gray-400 tw:mt-1">
                                Enter price per {displayUom}
                                {mrpWatch
                                  ? ` (≈ ₹${UomPriceService.toApiPrice(mrpWatch, unitType)}/${unitType})`
                                  : ""}
                              </p>
                            )}
                          </div>

                          <AppInput
                            type="number"
                            name="weight"
                            label={t("form.fields.weight.label")}
                            register={register}
                            size="sm"
                            placeholder={t("form.fields.weight.placeholder")}
                            onChange={handleNumberInput}
                          />

                          <div className="tw:col-span-2 tw:lg:col-span-3">
                            <label className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
                              {t("form.fields.barcode.label")}
                              {isLocalDeal && <DealScopeBadge isLocalDeal />}
                            </label>
                            <Controller
                              name="barcode"
                              control={control}
                              render={({ field }) => (
                                <BarcodeInput
                                  value={field.value || ""}
                                  onChange={(barcode) => {
                                    // Any barcode change clears a previous "local deal"
                                    // mark; the markAsLocal callback re-sets it after.
                                    field.onChange(barcode);
                                    setValue("isLocalDeal", false);
                                  }}
                                  useSubscribeBtn={false}
                                  uom={unitType}
                                  callback={handleBarcodeCallback}
                                  placeholder={t(
                                    "form.fields.barcode.placeholder",
                                  )}
                                  dealId={searchParams.get("id") || undefined}
                                  hideCreateProduct
                                />
                              )}
                            />
                          </div>
                        </div>
                      </FormSection>

                      {/* Additional details: free-text description and notes */}
                      <FormSection
                        icon={
                          <FileText size={18} className="tw:text-amber-600" />
                        }
                        accent="tw:bg-amber-50"
                        title="Additional Details"
                        description="Description and any extra information"
                      >
                        <div className="tw:grid tw:grid-cols-1 tw:gap-4">
                          <AppTextarea
                            name="description"
                            label={t("form.fields.description.label")}
                            register={register}
                            rows={3}
                            placeholder={t(
                              "form.fields.description.placeholder",
                            )}
                          />

                          <AppTextarea
                            name="additionalInfo"
                            label={t("form.fields.additionalInfo.label")}
                            register={register}
                            rows={3}
                            placeholder={t(
                              "form.fields.additionalInfo.placeholder",
                            )}
                          />
                        </div>
                      </FormSection>
                    </>
                  )}
                </div>

                {showDetails && (
                  <div className="tw:flex tw:flex-col tw:gap-3 tw:mt-5 tw:pt-4 tw:border-t tw:border-gray-200 tw:md:flex-row tw:md:justify-between tw:md:items-center">
                    <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                      <span className="tw:text-red-500">*</span>
                      Fields marked are mandatory.
                    </span>
                    <AppButton type="submit" isLoading={loading}>
                      {t("form.actions.submit")}
                    </AppButton>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal show={showSuccessModal} callback={handleSuccessModal} />
      <SampleImagesModal
        show={showSampleModal}
        onClose={() => setShowSampleModal(false)}
      />
      <ImgPreviewModal
        show={showImagePreviewModal}
        callback={handleImagePreviewModal}
        images={images || []}
        initialImageId={previewImageId}
      />
      <AiExtractedDetailsModal
        show={showAiDetailsModal}
        product={aiProduct}
        mode="api"
        apiType={useBulkApi ? "bulk" : "single"}
        apiContext={{
          // Prefer the scanned barcode over the AI-extracted one.
          barcode: scannedBarcode || undefined,
          // Merge the AI images onto whatever the seller already uploaded.
          images: images,
          scanItemId: scanItemId || undefined,
          invalidBarcodeId: searchParams.get("id") || undefined,
        }}
        callback={handleAiDetailsModal}
      />
    </>
  );
};

export default ManageProduct;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Catalog Add Item"),
    },
  ];
}
