import {
  AlertTriangle,
  Barcode,
  Boxes,
  CheckCircle2,
  Copy,
  FileText,
  Factory,
  ImagePlus,
  Info,
  IndianRupee,
  ListChecks,
  Package,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import { AppSelect } from "~/components/core/form";
import InpLabel from "~/components/core/form/InpLabel";
import { Input } from "~/components/ui/input";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";

interface AiExtractedDetailsModalProps {
  show: boolean;
  /** Raw AI-extracted product (aiSuggestedDeals[0]); null while none extracted. */
  product: any | null;
  /**
   * What the modal does when the seller confirms the details:
   * - "select" (default): hand the confirmed details back to the parent via
   *   `callback({ action: "use", data })` — no API call. The parent owns the
   *   create request.
   * - "api": build the create-request payload and call the create API itself,
   *   then report the outcome via `callback({ action: "success", data })`.
   */
  mode?: "select" | "api";
  /** In "api" mode, which create-request API to call. Defaults to "single". */
  apiType?: "single" | "bulk";
  /**
   * Extra context merged into the payload in "api" mode. Ignored in "select"
   * mode (the parent supplies these when it builds the payload itself).
   */
  apiContext?: {
    /** Preferred barcode (e.g. the scanned barcode); falls back to AI barcode. */
    barcode?: string;
    /** Already-uploaded images to merge with the AI images. */
    images?: { id: string }[];
    /** Links the created product back to a scanned item. */
    scanItemId?: string;
    /** The invalid barcode this product is replacing, if any. */
    invalidBarcodeId?: string;
  };
  callback: (data: { action: string; data?: any }) => void;
}

// The only units the seller can map an AI-extracted product to. The AI's free-form
// uom is coerced into one of these before the deal is created.
const UOM_OPTIONS = [
  { label: "piece", value: "piece" },
  { label: "gm", value: "gm" },
  { label: "ml", value: "ml" },
];

/**
 * Coerce the AI's free-form uom into a supported unit. Only piece/gm/ml are
 * accepted; the AI's "unit" is treated as "piece", and anything else (or empty)
 * falls back to "piece".
 */
const normalizeAiUom = (raw?: string) => {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "unit") return "piece";
  if (v === "piece" || v === "gm" || v === "ml") return v;
  return "piece";
};

/** A small inline button that copies the given text to the clipboard. */
const CopyButton: React.FC<{ value?: React.ReactNode; className?: string }> = ({
  value,
  className,
}) => {
  const appToast = useAppToast();
  if (value === undefined || value === null || value === "") return null;

  const onCopy = () => {
    try {
      CommonService.copyToClipboard(String(value));
      appToast.show({ msg: "Copied to clipboard", color: "success" });
    } catch (e) {
      appToast.show({ msg: "Failed to copy", color: "danger" });
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title="Copy"
      className={`tw:shrink-0 tw:inline-flex tw:items-center tw:justify-center tw:rounded tw:p-1 tw:text-gray-400 tw:hover:bg-gray-100 tw:hover:text-gray-700 ${
        className || ""
      }`}
    >
      <Copy className="tw:w-3.5 tw:h-3.5" />
    </button>
  );
};

/** A labelled section card with an accent icon chip. */
const Section: React.FC<{
  icon: React.ReactNode;
  accent: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, accent, title, children }) => (
  <section className="tw:mb-3 tw:break-inside-avoid tw:rounded-xl tw:border tw:border-gray-200/70 tw:bg-white tw:shadow-sm tw:overflow-hidden">
    <div className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:border-b tw:border-gray-100">
      <div
        className={`tw:shrink-0 tw:w-6 tw:h-6 tw:rounded-md tw:flex tw:items-center tw:justify-center ${accent}`}
      >
        {icon}
      </div>
      <h4 className="tw:text-sm tw:font-semibold tw:text-gray-900">{title}</h4>
    </div>
    <div className="tw:p-3">{children}</div>
  </section>
);

/** A label / value info tile — light background for scannability. */
const Field: React.FC<{
  label: string;
  value?: React.ReactNode;
  full?: boolean;
}> = ({ label, value, full }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div
      className={`tw:group tw:rounded-md tw:bg-gray-50 tw:px-2.5 tw:py-1.5 ${
        full ? "tw:col-span-2" : ""
      }`}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-1">
        <span className="tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          {label}
        </span>
        <CopyButton value={value} />
      </div>
      <span className="tw:block tw:text-[13px] tw:font-medium tw:text-gray-900 tw:wrap-break-word">
        {value}
      </span>
    </div>
  );
};

/** A label + free-text paragraph block for long descriptive fields. */
const TextField: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => {
  if (!value) return null;
  return (
    <div>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-1 tw:mb-1">
        <span className="tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          {label}
        </span>
        <CopyButton value={value} />
      </div>
      <p className="tw:text-sm tw:text-gray-600 tw:leading-relaxed tw:whitespace-pre-line">
        {value}
      </p>
    </div>
  );
};

const AiExtractedDetailsModal: React.FC<AiExtractedDetailsModalProps> = ({
  show,
  product,
  mode = "select",
  apiType = "single",
  apiContext,
  callback,
}) => {
  const appToast = useAppToast();
  const onClose = () => callback({ action: "close" });

  // Editable price & unit — pre-filled from the AI extraction, but the seller
  // confirms/overrides them before the deal is created.
  const [mrp, setMrp] = useState<string>("");
  const [uom, setUom] = useState<string>("piece");
  // Editable barcode — seeded from the scanned/AI barcode; the seller can
  // correct it before the deal is created.
  const [barcode, setBarcode] = useState<string>("");
  // Images the seller uploads to supplement the AI-extracted ones. Each entry
  // is a freshly uploaded asset ({ id }); merged onto the AI images on submit.
  const [uploadedImages, setUploadedImages] = useState<{ id: string }[]>([]);
  // Set while the create-request API is in flight (api mode only).
  const [submitting, setSubmitting] = useState(false);

  // Re-seed the editable fields whenever a fresh extraction is shown.
  useEffect(() => {
    if (!product) return;
    setMrp(product.mrp != null ? String(product.mrp) : "");
    setUom(normalizeAiUom(product.uom));
    setBarcode(apiContext?.barcode || product.barcodes?.[0] || "");
    setUploadedImages([]);
    // apiContext is intentionally omitted — a new extraction (product change)
    // is what should re-seed these fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Confirm. MRP is mandatory and must be a positive number. In "select" mode
  // the (possibly edited) details are handed back to the parent; in "api" mode
  // the modal builds the payload and calls the create-request API itself.
  const handleUse = async () => {
    const mrpNum = Number(mrp);
    if (!mrp || Number.isNaN(mrpNum) || mrpNum <= 0) {
      appToast.show({ msg: "Please enter a valid MRP", color: "warning" });
      return;
    }

    // Uploaded images supplement any already-uploaded images from the parent.
    const images = [...(apiContext?.images || []), ...uploadedImages];

    if (mode === "select") {
      callback({
        action: "use",
        data: {
          ...product,
          mrp: mrpNum,
          uom,
          barcode: barcode.trim(),
          uploadedImages,
        },
      });
      return;
    }

    // api mode: build the create-request payload exactly as the Add Product
    // page does and submit through the single/bulk endpoint.
    setSubmitting(true);
    try {
      const payload = InventorySubscribeService.buildAiImportPayload(product, {
        mrp: mrpNum,
        uom,
        barcode: barcode.trim() || apiContext?.barcode,
        images,
        scanItemId: apiContext?.scanItemId,
        invalidBarcodeId: apiContext?.invalidBarcodeId,
      });
      const { response, succeeded } =
        await InventorySubscribeService.createSellerImportRequest(
          payload,
          apiType,
        );
      if (succeeded) {
        callback({ action: "success", data: { response, payload } });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to create request",
          color: "danger",
        });
      }
    } catch (err: any) {
      appToast.show({
        msg: err?.message || "Failed to create request",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <AppModal show={show} callback={onClose} className="tw:!max-w-4xl">
        <AppModal.Title onClose={onClose}>
          <div className="tw:font-semibold">StoreKing AI Extracted Details</div>
        </AppModal.Title>
        <AppModal.Content className="tw:max-h-[70vh]">
          <p className="tw:text-sm tw:text-gray-500 tw:py-8 tw:text-center">
            No details were extracted. Please try again with a clearer image.
          </p>
        </AppModal.Content>
      </AppModal>
    );
  }

  const brandName = product.applicableBrand?.brandName || "";
  const categoryName = product.applicableCategory?.categoryName || "";
  const parentCategoryName =
    product.applicableParentCategory?.categoryName || "";
  const menuName = product.applicableMenu?.menuName || "";
  const barcodes: string[] = Array.isArray(product.barcodes)
    ? product.barcodes.filter(Boolean)
    : [];
  const attributes: { name: string; value: string }[] = Array.isArray(
    product.csaAttr,
  )
    ? product.csaAttr.filter((a: any) => a?.name && a?.value)
    : [];
  const highlights: string[] = Array.isArray(product.highlights)
    ? product.highlights.filter(Boolean)
    : [];
  // Absolute, cross-origin image URLs from the AI response — routed through the
  // image proxy (useProxy) so the different-origin assets load.
  const images: string[] = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  // The category breadcrumb (menu › parent › category), only non-empty parts.
  const classificationTrail = [menuName, parentCategoryName, categoryName]
    .filter(Boolean)
    .join("  ›  ");

  // Veg / non-veg indicator (only when the AI is confident either way).
  const vegType = product.isVegetarian
    ? "veg"
    : product.isNonVegetarian
      ? "nonveg"
      : null;

  const hasManufacturer =
    product.companyName || product.manufacturerDetails || product.marketedBy;
  const hasMoreInfo =
    product.ingredients ||
    product.allergenInformation ||
    product.howToUse ||
    product.storageInstruction ||
    product.nutritionInformation;

  return (
    <AppModal show={show} callback={onClose} className="tw:!max-w-4xl">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-linear-to-br tw:from-purple-500 tw:to-indigo-600 tw:flex tw:items-center tw:justify-center">
            <Sparkles className="tw:w-4 tw:h-4 tw:text-white" />
          </div>
          <div className="tw:text-left">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
              StoreKing AI Extracted Details
            </div>
            <div className="tw:text-[11px] tw:text-gray-500">
              Review the details below, then create your product request
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[75vh] tw:bg-linear-to-b tw:from-gray-50 tw:to-gray-100/60">
        {/* Hero: product name + key pricing/identity chips */}
        <div className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-purple-100 tw:bg-linear-to-br tw:from-purple-50 tw:via-white tw:to-white tw:shadow-sm tw:p-3.5 tw:mb-3 tw:mt-3">
          <div className="tw:flex tw:items-start tw:gap-3">
            <div className="tw:shrink-0 tw:w-9 tw:h-9 tw:rounded-lg tw:bg-white tw:border tw:border-purple-100 tw:shadow-sm tw:flex tw:items-center tw:justify-center">
              <Package className="tw:w-4.5 tw:h-4.5 tw:text-purple-500" />
            </div>
            <div className="tw:min-w-0">
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-purple-600">
                <Sparkles className="tw:w-3 tw:h-3" />
                Extracted by StoreKing AI
              </span>
              <div className="tw:flex tw:items-start tw:gap-1">
                <h3 className="tw:text-base tw:font-bold tw:text-gray-900 tw:leading-snug">
                  {product.name || "Unnamed product"}
                </h3>
                {product.name ? <CopyButton value={product.name} /> : null}
              </div>
              <div className="tw:flex tw:flex-wrap tw:gap-1.5 tw:mt-2.5">
                {vegType ? (
                  <span
                    className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:text-xs tw:font-bold tw:px-2.5 tw:py-1 tw:ring-1 ${
                      vegType === "veg"
                        ? "tw:bg-green-100 tw:text-green-700 tw:ring-green-200"
                        : "tw:bg-red-100 tw:text-red-700 tw:ring-red-200"
                    }`}
                  >
                    <span
                      className={`tw:w-2 tw:h-2 tw:rounded-full ${
                        vegType === "veg" ? "tw:bg-green-600" : "tw:bg-red-600"
                      }`}
                    />
                    {vegType === "veg" ? "Veg" : "Non-veg"}
                  </span>
                ) : null}
                {brandName ? (
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-purple-100 tw:text-purple-700 tw:text-xs tw:font-bold tw:px-2.5 tw:py-1 tw:ring-1 tw:ring-purple-200">
                    <Tag className="tw:w-3 tw:h-3" />
                    <span className="tw:font-semibold tw:opacity-70">
                      Brand
                    </span>
                    {brandName}
                  </span>
                ) : null}
                {barcodes.map((code) => (
                  <span
                    key={code}
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-white tw:text-gray-600 tw:text-xs tw:px-2.5 tw:py-1 tw:ring-1 tw:ring-gray-200"
                  >
                    <span className="tw:font-semibold tw:opacity-70">
                      Barcode
                    </span>
                    <span className="tw:font-mono">{code}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirm price & unit — the seller reviews/overrides these before the
            deal is created. UOM is constrained to the supported units. */}
        <div className="tw:mb-3 tw:rounded-xl tw:border tw:border-emerald-100 tw:bg-white tw:shadow-sm tw:p-3.5">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <div className="tw:shrink-0 tw:w-6 tw:h-6 tw:rounded-md tw:bg-emerald-50 tw:flex tw:items-center tw:justify-center">
              <IndianRupee size={14} className="tw:text-emerald-600" />
            </div>
            <h4 className="tw:text-sm tw:font-semibold tw:text-gray-900">
              Confirm Price, Unit &amp; Barcode
            </h4>
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <div>
              <InpLabel isRequired size="sm">
                MRP
              </InpLabel>
              <Input
                type="number"
                min={0}
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="Enter MRP"
                className="tw:h-8 tw:text-sm"
              />
            </div>
            <AppSelect
              label="Unit"
              placeholder="Select unit"
              options={UOM_OPTIONS}
              value={uom}
              onChange={setUom}
              size="sm"
              inputClassName="tw:w-full"
              isRequired
            />
            <div className="tw:col-span-2">
              <InpLabel size="sm">Barcode</InpLabel>
              <div className="tw:relative">
                <Barcode className="tw:absolute tw:left-2 tw:top-1/2 tw:-translate-y-1/2 tw:w-4 tw:h-4 tw:text-gray-400" />
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter or scan barcode"
                  className="tw:h-8 tw:text-sm tw:pl-8 tw:font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product images — absolute cross-origin URLs via the image proxy */}
        {images.length > 0 && (
          <div className="tw:mb-3 tw:rounded-xl tw:border tw:border-gray-200/70 tw:bg-white tw:shadow-sm tw:p-3">
            <span className="tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400 tw:mb-2">
              Product Images
            </span>
            <div className="tw:flex tw:gap-2 tw:overflow-x-auto">
              {images.map((url) => (
                <ImgRender
                  key={url}
                  src={url}
                  isAbsolute
                  useProxy
                  alt={product.name || "Product image"}
                  className="tw:shrink-0 tw:w-24 tw:h-24 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50 tw:object-contain tw:p-1"
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload additional images — seller-supplied assets that supplement
            the AI-extracted images on the create request. */}
        <div className="tw:mb-3 tw:rounded-xl tw:border tw:border-gray-200/70 tw:bg-white tw:shadow-sm tw:p-3">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:shrink-0 tw:w-6 tw:h-6 tw:rounded-md tw:bg-indigo-50 tw:flex tw:items-center tw:justify-center">
              <ImagePlus size={14} className="tw:text-indigo-600" />
            </div>
            <h4 className="tw:text-sm tw:font-semibold tw:text-gray-900">
              Upload Images
            </h4>
          </div>
          <FileUpload
            onFileUpload={(res: any) =>
              setUploadedImages((prev) => [...prev, { id: res._id }])
            }
            accept="image/*"
            allowedExtensions={["jpg", "jpeg", "png", "webp"]}
            maxSizeMB={5}
            label="Upload Product Images"
          >
            <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:bg-gray-50 tw:hover:bg-gray-100 tw:hover:border-gray-400 tw:transition-all tw:cursor-pointer">
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1.5">
                <Upload size={20} className="tw:text-gray-500" />
                <span className="tw:text-sm tw:font-medium tw:text-gray-600">
                  Click to upload images
                </span>
                <span className="tw:text-xs tw:text-gray-400">
                  JPG, PNG, WEBP up to 5MB
                </span>
              </div>
            </div>
          </FileUpload>

          {uploadedImages.length > 0 && (
            <div className="tw:mt-3">
              <span className="tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400 tw:mb-2">
                Uploaded ({uploadedImages.length})
              </span>
              <FileUploadedSlide
                images={uploadedImages}
                onRemove={(index: number) =>
                  setUploadedImages((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
              />
            </div>
          )}
        </div>

        {/* Detail sections — masonry columns so cards pack tightly */}
        <div className="tw:columns-1 tw:md:columns-2 tw:gap-3">
          {/* Classification */}
          {(classificationTrail ||
            product.itemForm ||
            product.hsnNumber ||
            product.tax ||
            product.packagingType ||
            product.productSize ||
            product.originCountry ||
            product.shelfLife) && (
            <Section
              icon={<Boxes size={16} className="tw:text-blue-600" />}
              accent="tw:bg-blue-50"
              title="Classification"
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-1.5">
                <Field label="Category" value={classificationTrail} full />
                <Field label="Item Form" value={product.itemForm} />
                <Field label="Packaging" value={product.packagingType} />
                <Field label="Pack Size" value={product.packSize || ""} />
                <Field label="Product Size" value={product.productSize} />
                <Field
                  label="Shelf Life"
                  value={product.shelfLife ? `${product.shelfLife} days` : ""}
                />
                <Field label="HSN" value={product.hsnNumber} />
                <Field
                  label="Tax"
                  value={product.tax ? `${product.tax}%` : ""}
                />
                <Field label="Origin" value={product.originCountry} />
              </div>
            </Section>
          )}

          {/* Attributes */}
          {attributes.length > 0 && (
            <Section
              icon={<ListChecks size={16} className="tw:text-amber-600" />}
              accent="tw:bg-amber-50"
              title="Attributes"
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-1.5">
                {attributes.map((a, i) => (
                  <Field key={i} label={a.name} value={a.value} />
                ))}
              </div>
            </Section>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <Section
              icon={<Sparkles size={16} className="tw:text-purple-600" />}
              accent="tw:bg-purple-50"
              title="Highlights"
            >
              <ul className="tw:space-y-1.5">
                {highlights.map((h, i) => (
                  <li
                    key={i}
                    className="tw:flex tw:items-start tw:gap-2 tw:rounded-md tw:bg-purple-50/60 tw:px-2.5 tw:py-1.5 tw:text-[13px] tw:text-gray-700"
                  >
                    <CheckCircle2 className="tw:w-4 tw:h-4 tw:text-purple-500 tw:shrink-0 tw:mt-0.5" />
                    <span className="tw:flex-1">{h}</span>
                    <CopyButton value={h} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Manufacturer & marketing */}
          {hasManufacturer && (
            <Section
              icon={<Factory size={16} className="tw:text-teal-600" />}
              accent="tw:bg-teal-50"
              title="Manufacturer"
            >
              <div className="tw:grid tw:grid-cols-1 tw:gap-1.5">
                <Field label="Company" value={product.companyName} full />
                <Field
                  label="Manufactured By"
                  value={product.manufacturerDetails}
                  full
                />
                <Field label="Marketed By" value={product.marketedBy} full />
              </div>
            </Section>
          )}

          {/* Description */}
          {product.description && (
            <Section
              icon={<FileText size={16} className="tw:text-gray-600" />}
              accent="tw:bg-gray-100"
              title="Description"
            >
              <div className="tw:flex tw:items-start tw:gap-1">
                <p className="tw:text-sm tw:text-gray-600 tw:leading-relaxed tw:whitespace-pre-line">
                  {product.description}
                </p>
                <CopyButton value={product.description} />
              </div>
            </Section>
          )}

          {/* More information — long-text fields */}
          {hasMoreInfo && (
            <Section
              icon={<Info size={16} className="tw:text-indigo-600" />}
              accent="tw:bg-indigo-50"
              title="More Information"
            >
              <div className="tw:space-y-3">
                <TextField label="Ingredients" value={product.ingredients} />
                <TextField
                  label="Allergen Information"
                  value={product.allergenInformation}
                />
                <TextField label="How To Use" value={product.howToUse} />
                <TextField
                  label="Storage Instructions"
                  value={product.storageInstruction}
                />
                <TextField
                  label="Nutrition Information"
                  value={product.nutritionInformation}
                />
              </div>
            </Section>
          )}
        </div>

        {/* Disclaimer / note */}
        {product.disclaimer && (
          <div className="tw:flex tw:items-start tw:gap-2.5 tw:mt-1 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3">
            <AlertTriangle className="tw:w-4 tw:h-4 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
            <p className="tw:text-xs tw:text-amber-800 tw:leading-relaxed">
              {product.disclaimer}
            </p>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
        <p className="tw:text-[11px] tw:text-gray-500 tw:text-center tw:sm:text-left">
          Use the above details to create a product request
        </p>
        <AppButton
          color="primary"
          onClick={handleUse}
          isLoading={submitting}
          disabled={submitting}
          className="tw:w-full tw:sm:w-auto tw:shrink-0"
        >
          <Sparkles className="tw:w-4 tw:h-4 tw:mr-1.5 tw:shrink-0" />
          Create Request
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AiExtractedDetailsModal;
