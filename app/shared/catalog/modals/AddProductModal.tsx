import {
  Barcode,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  IndianRupee,
  Package,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import ProductService from "~/services/ProductService";
import UomPriceService from "~/services/UomPriceService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";

type Props = {
  show: boolean;
  data?: any;
  // the block id in parent that opened this modal
  blockId?: string;
  images?: Array<{ id: string }>;
  callback: (a: { action: string; data?: any }) => void;
  title?: string;
  allowImageUpload?: boolean;
  /**
   * When true the modal does NOT hit the create API — it validates, builds the
   * same payload and hands it straight back via `callback({ action: "created",
   * data: { product, blockId } })`. The caller is responsible for persisting it
   * (e.g. onto a line item) and creating the product later in bulk.
   */
  returnDataOnly?: boolean;
  // "localDeal": create the product as a local deal — the editable barcode input
  //   is hidden and the pre-filled barcode is shown read-only at the top.
  // "scan": the barcode comes from an actual scan and must not be changed by
  //   hand — the editable input is hidden and the barcode shown read-only.
  mode?: "localDeal" | "scan";
  useBulkApi?: boolean;
  itemId?: string;
  // Cache id of the AI-extracted product this form was prefilled from. When
  // present it's attached to the create payload so the backend can correlate
  // the created item with its AI extraction.
  aiCacheId?: string;
};

const UOM_OPTIONS = InventorySubscribeService.getUomOptions();

// GST rate options for the optional tax dropdown. Drop the "all" placeholder
// entry from the shared list — the AppSelect placeholder handles the empty state.
// Also exclude the 12, 28 and 33 rates which aren't selectable here.
const EXCLUDED_GST_RATES = ["12", "28", "33"];
const GST_OPTIONS = CommonService.getGstOptions().filter(
  (o) => o.value !== "all" && !EXCLUDED_GST_RATES.includes(String(o.value)),
);

// Fall back to the first available UOM option when nothing usable is provided.
const DEFAULT_UOM = UOM_OPTIONS[0]?.value || "piece";

// Normalize incoming UOM strings to one of the option `value`s above.
const normalizeUom = (uom?: string | null) => {
  if (!uom) return DEFAULT_UOM;
  const s = String(uom).toLowerCase().trim();

  if (["pcs", "pc", "piece", "pieces", "unit", "units"].includes(s))
    return DEFAULT_UOM;
  // Only piece/gm/ml are supported, so kg/ltr mappings are intentionally disabled
  // if (["kg", "kgs", "kilogram", "kilograms"].includes(s)) return "kg";
  // if (["g", "gram", "grams"].includes(s)) return "g";
  // if (["ltr", "l", "liter", "litre", "liters", "litres", "ml"].includes(s))
  //   return "ltr";

  // Fallback: if the incoming string matches any label in options, map by label
  const byLabel = UOM_OPTIONS.find(
    (o) => o.label.toLowerCase() === s || o.value.toLowerCase() === s,
  );
  return byLabel ? byLabel.value : DEFAULT_UOM;
};

// Lightweight titled card used to group the form into scannable sections so the
// long product form reads as a few clear chunks instead of one flat stack.
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:shadow-sm">
      <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
        <span className="tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded-md tw:bg-primary/10 tw:text-primary">
          {icon}
        </span>
        <h3 className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-500">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export default function AddProductModal({
  show,
  data,
  blockId,
  images,
  callback,
  title = "Review Product",
  allowImageUpload = true,
  returnDataOnly = false,
  mode,
  useBulkApi = false,
  itemId,
  aiCacheId,
}: Props) {
  const isLocalDealMode = mode === "localDeal";
  // In both local-deal and scan flows the barcode is fixed: show it read-only at
  // the top and hide the editable barcode input.
  const showBarcodeReadOnly = isLocalDealMode || mode === "scan";
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<Record<string, any>>({
    defaultValues: {
      name: "",
      mrp: "",
      uom: DEFAULT_UOM,
      barcode: "",
      hsn: "",
      gst: "",
      description: "",
      brand: undefined,
      category: undefined,
      images: [],
    },
  });

  const uploadedImages =
    useWatch<Record<string, any>>({ control, name: "images" }) || [];

  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [previewImageId, setPreviewImageId] = useState<string>("");

  const handleFileUpload = (resp: any) => {
    if (resp && resp._id) {
      setValue("images", [...uploadedImages, { id: resp._id }], {
        shouldValidate: true,
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const next = uploadedImages.filter((_: any, i: number) => i !== index);
    setValue("images", next, { shouldValidate: true });
  };

  const handleImageClick = (imageId: string) => {
    setPreviewImageId(imageId);
    setShowImagePreviewModal(true);
  };

  const [addNewBrand, setAddNewBrand] = useState(false);
  const prevUomRef = useRef<string | undefined>(undefined);
  const uomWatch = useWatch<Record<string, any>>({ control, name: "uom" });

  // Watch the selected category to decide if the model input applies (electronics)
  const categoryWatch = useWatch<Record<string, any>>({
    control,
    name: "category",
  });
  const showModelInput = CommonService.shouldShowModelInput(
    categoryWatch?.value?.name,
  );

  useEffect(() => {
    const prev = prevUomRef.current;
    if (prev === uomWatch) return;
    if (
      UomPriceService.isSmallUom(prev) !== UomPriceService.isSmallUom(uomWatch)
    ) {
      setValue("mrp", "");
    }
    prevUomRef.current = uomWatch;
  }, [uomWatch, setValue]);

  useEffect(() => {
    if (show) {
      setCreated(false);
      if (data) {
        const name = data?.name || "";
        const description = data?.description || "";
        const mrp = data?.mrp || "";
        const barcode = data?.barcode || "";

        const rawUom = data?.uom || DEFAULT_UOM;
        const finalUom = normalizeUom(rawUom);

        setValue("name", name);
        setValue("description", description);
        setValue("mrp", UomPriceService.toDisplayPrice(mrp, finalUom));
        setValue("uom", finalUom);
        prevUomRef.current = finalUom;
        setValue("barcode", barcode);
        setValue("model", data?.modelNo || "");
        setValue("hsn", data?.hsn || "");
        setValue(
          "gst",
          data?.gst !== undefined && data?.gst !== null && data?.gst !== ""
            ? String(data.gst)
            : "",
        );

        // Restore brand from the saved payload shape { id, name, brandId } back
        // into the search-input value shape the form/BrandSearchInput expects.
        if (data?.brand && (data.brand.brandId || data.brand.id)) {
          setValue("brand", {
            label: data.brand.name,
            value: {
              id: data.brand.brandId ?? "",
              name: data.brand.name ?? "",
              objId: data.brand.id ?? "",
            },
          });
        } else {
          setValue("brand", undefined);
        }

        // Restore category from the saved payload shape { id, categoryId, name }.
        if (data?.category && (data.category.categoryId || data.category.id)) {
          setValue("category", {
            label: data.category.name,
            value: {
              id: data.category.categoryId ?? "",
              name: data.category.name ?? "",
              objId: data.category.id ?? "",
            },
          });
        } else {
          setValue("category", undefined);
        }

        // Restore user-uploaded images. The payload carries plain asset ids, so
        // map them back to the { id } shape the upload field/FileUpload uses.
        const restoredImages = Array.isArray(data?.uploadedImages)
          ? data.uploadedImages.map((img: any) =>
              typeof img === "string" ? { id: img } : img,
            )
          : [];

        const prefilledImages = Array.isArray(data?.images)
          ? data.images.map((img: any) => {
              const obj = typeof img === "string" ? { id: img } : img;
              return {
                ...obj,
                useProxy: obj.useProxy ?? /^https?:\/\//i.test(obj.id),
              };
            })
          : Array.isArray(images)
            ? images.map((img: any) => {
                const obj = typeof img === "string" ? { id: img } : img;
                return {
                  ...obj,
                  useProxy: obj.useProxy ?? /^https?:\/\//i.test(obj.id),
                };
              })
            : [];

        setValue("images", [...prefilledImages, ...restoredImages]);

        const restoredNewBrand = data?.newBrand || "";
        setValue("newBrand", restoredNewBrand);
        setAddNewBrand(Boolean(restoredNewBrand));
      } else {
        const initialImages = Array.isArray(images)
          ? images.map((img: any) => {
              const obj = typeof img === "string" ? { id: img } : img;
              return {
                ...obj,
                useProxy: obj.useProxy ?? /^https?:\/\//i.test(obj.id),
              };
            })
          : [];
        setValue("images", initialImages);
        setValue("model", "");
        setValue("hsn", "");
        setValue("gst", "");
      }
    }
  }, [data, setValue, show, images]);

  const onClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  // Fired only from the success screen's "Done" button, so the caller can tell
  // a completed creation apart from a plain discard/close.
  const onDone = useCallback(() => {
    callback({ action: "done" });
  }, [callback]);

  const { show: toast } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const toggleAddNewBrand = () => {
    setAddNewBrand((prev) => !prev);
  };

  const handleBrandChange = (item: any, action: string) => {
    if (action === "add") setValue("brand", item);
    if (action === "remove") setValue("brand", undefined);
  };

  const handleCategoryChange = (item: any, action: string) => {
    if (action === "add") setValue("category", item);
    if (action === "remove") setValue("category", undefined);
  };

  const onSubmit = async (vals: any) => {
    // Validate Product Name
    if (!vals.name || vals.name.trim() === "") {
      toast({ msg: "Product name is required", color: "danger" });
      return;
    }
    // Validate MRP
    if (!vals.mrp || vals.mrp === "") {
      toast({ msg: "MRP is required", color: "danger" });
      return;
    }
    const mrpNum = Number(vals.mrp);
    if (isNaN(mrpNum) || mrpNum < 0) {
      toast({ msg: "MRP cannot be negative", color: "danger" });
      return;
    }
    // Validate UOM
    if (!vals.uom) {
      toast({ msg: "UOM is required", color: "danger" });
      return;
    }
    // Model is mandatory for electronics categories
    const needsModel = CommonService.shouldShowModelInput(
      vals.category?.value?.name,
    );
    if (needsModel && (!vals.model || vals.model.trim() === "")) {
      toast({ msg: "Model is required", color: "danger" });
      return;
    }

    const payload: Record<string, any> = {
      productName: vals.name?.trim(),
      qty: 0,
      mrp: Number(UomPriceService.toApiPrice(mrpNum, vals.uom)),
      barcode: vals.barcode,
      uom: normalizeUom(vals.uom),
      description: vals.description,
      images: (uploadedImages || []).map((i: any) => i.id),
    };

    // HSN and GST are optional — only attach when the user provided them.
    if (vals.hsn && vals.hsn.trim()) {
      payload.hsnNumber = vals.hsn.trim();
    }
    if (vals.gst !== undefined && vals.gst !== null && vals.gst !== "") {
      payload.tax = Number(vals.gst);
    }

    if (itemId) {
      payload.scanItemId = itemId;
    }

    if (aiCacheId) {
      payload.aiCacheId = aiCacheId;
    }

    if (isLocalDealMode) {
      payload.isLocalDeal = true;
    }

    // Model only applies to electronics; include it as modelNo when present
    if (needsModel && vals.model?.trim()) {
      payload.modelNo = vals.model.trim();
    }

    // Category handling: normalize to { id, categoryId, name }
    if (vals.category?.value) {
      payload.category = {
        id: vals.category.value.objId ?? "",
        categoryId: vals.category.value.id ?? "",
        name: vals.category.value.name ?? "",
      };
    }

    // Brand handling: if newBrand exists, attach generic brand and keep newBrand
    const selectedBrand = vals.brand?.value;
    const newBrand = (vals.newBrand || "").trim();
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

    // Capture-only mode: hand the filled payload back to the caller without
    // creating the product — it'll be created later as part of a bulk request.
    if (returnDataOnly) {
      callback({ action: "created", data: { product: payload, blockId } });
      return;
    }

    setLoading(true);
    try {
      const res = useBulkApi
        ? await InventorySubscribeService.bulkImportStoreProducts([payload])
        : await InventorySubscribeService.importStoreProduct(payload);

      if (
        res?.statusCode === 200 ||
        (useBulkApi && res?.statusCode >= 200 && res?.statusCode < 300)
      ) {
        callback({ action: "created", data: { product: res.data, blockId } });
        setCreated(true);
      } else {
        toast({
          msg: res?.data?.message || "Failed to create product",
          color: "danger",
        });
      }
    } catch (err: any) {
      toast({
        msg: err?.message || "Failed to create product",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[95vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
            <Sparkles className="tw:h-5 tw:w-5" />
          </div>
          <div>
            <div className="tw:font-bold tw:text-gray-900">{title}</div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:leading-relaxed">
              Please verify the details extracted by our StoreKing AI assistant
              before saving
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[95vh]">
        {created ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:h-full tw:px-6 tw:py-10">
            <div className="tw:relative tw:mb-5 tw:flex tw:h-20 tw:w-20 tw:items-center tw:justify-center tw:rounded-full tw:bg-green-100 tw:ring-8 tw:ring-green-50">
              <CheckCircle2 className="tw:h-10 tw:w-10 tw:text-green-600" />
            </div>
            <div className="tw:mb-2 tw:text-lg tw:font-bold tw:text-gray-900">
              Request Sent Successfully
            </div>
            <p className="tw:max-w-sm tw:text-sm tw:leading-relaxed tw:text-gray-600">
              Your product request has been sent to the StoreKing catalog team
              for verification. Once it is approved, it will appear in your
              inventory.
            </p>
          </div>
        ) : (
          <>
            <div className="tw:mb-4 tw:flex tw:items-start tw:gap-2.5 tw:rounded-lg tw:border tw:border-blue-200 tw:bg-blue-50 tw:p-3">
              <ShieldCheck className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0 tw:text-blue-600" />
              <div className="tw:text-xs tw:leading-relaxed tw:text-blue-700">
                <span className="tw:font-semibold">Product verification:</span>{" "}
                Once saved, the product is submitted for verification. You'll get
                a notification when it's confirmed.
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
              <SectionCard
                icon={<Package className="tw:h-3.5 tw:w-3.5" />}
                title="Product details"
              >
                <div className="tw:space-y-4">
                  {showBarcodeReadOnly && data?.barcode ? (
                    <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-2.5">
                      <span className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:bg-white tw:text-gray-600 tw:shadow-sm">
                        <Barcode className="tw:h-4 tw:w-4" />
                      </span>
                      <div className="tw:flex tw:flex-col">
                        <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
                          Barcode / EAN
                        </span>
                        <span className="tw:font-mono tw:text-sm tw:font-bold tw:tracking-wide tw:text-gray-900">
                          {data.barcode}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <AppInput
                    name="name"
                    label="Product Name"
                    placeholder="Enter product name"
                    register={register}
                    error={errors.name?.message as string | undefined}
                    size="sm"
                    isRequired
                    leftIcon={
                      <Package className="tw:w-4 tw:h-4 tw:text-gray-400" />
                    }
                    className="tw:flex-1"
                  />

                  <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                    <div className="tw:space-y-1">
                      <Controller
                        control={control}
                        name="uom"
                        render={({
                          field: { onChange, value },
                          fieldState: { error },
                        }) => (
                          <AppSelect
                            label="UOM"
                            options={UOM_OPTIONS}
                            value={value}
                            onChange={onChange}
                            placeholder="Select"
                            isRequired
                            size="sm"
                            error={error?.message}
                            inputClassName="tw:w-full"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <AppInput
                        name="mrp"
                        label="MRP"
                        placeholder="0.00"
                        register={register}
                        error={errors.mrp?.message as string | undefined}
                        type="number"
                        size="sm"
                        isRequired
                        leftIcon={
                          <IndianRupee className="tw:w-4 tw:h-4 tw:text-gray-400" />
                        }
                      />
                      {uomWatch && (
                        <div className="tw:text-[9px] tw:text-gray-500 tw:mt-0.5 tw:leading-tight">
                          per {UomPriceService.getDisplayUom(uomWatch)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                    <AppInput
                      name="hsn"
                      label="HSN"
                      placeholder="Enter HSN code"
                      register={register}
                      size="sm"
                      leftIcon={
                        <FileText className="tw:w-4 tw:h-4 tw:text-gray-400" />
                      }
                    />
                    <Controller
                      control={control}
                      name="gst"
                      render={({ field: { onChange, value } }) => (
                        <AppSelect
                          label="GST"
                          options={GST_OPTIONS}
                          value={value}
                          onChange={onChange}
                          placeholder="Select GST rate"
                          size="sm"
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                  </div>

                  {!showBarcodeReadOnly && (
                    <div>
                      <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
                        Barcode / EAN
                      </label>
                      <Controller
                        name="barcode"
                        control={control}
                        render={({ field }) => (
                          <BarcodeInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Scan or enter barcode"
                            uom={uomWatch as string}
                            dealId={data?.dealId || data?._id}
                            hideCreateProduct
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={<Tags className="tw:h-3.5 tw:w-3.5" />}
                title="Brand & category"
              >
                <div className="tw:space-y-4">
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
                          className="tw:mt-1 tw:text-xs tw:text-primary tw:underline tw:cursor-pointer"
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
                              label="Brand"
                            />
                          )}
                        />
                        <button
                          className="tw:mt-1 tw:text-xs tw:text-primary tw:underline tw:cursor-pointer"
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
                        label="Category"
                      />
                    )}
                  />

                  {showModelInput && (
                    <AppInput
                      name="model"
                      label="Model"
                      placeholder="Enter model"
                      register={register}
                      isRequired
                      size="sm"
                    />
                  )}
                </div>
              </SectionCard>

              {allowImageUpload && (
                <SectionCard
                  icon={<ImagePlus className="tw:h-3.5 tw:w-3.5" />}
                  title="Product images"
                >
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    allowedExtensions={["jpg", "jpeg", "png"]}
                    maxSizeMB={10}
                  >
                    <div className="tw:flex tw:w-full tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border-2 tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:p-6 tw:transition-colors tw:hover:border-primary tw:hover:bg-primary/5">
                      <span className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
                        <ImageIcon className="tw:h-5 tw:w-5" />
                      </span>
                      <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                        Click to upload product images
                      </span>
                      <span className="tw:text-xs tw:text-gray-400">
                        JPG, JPEG or PNG · up to 10 MB
                      </span>
                    </div>
                  </FileUpload>

                  {uploadedImages && uploadedImages.length > 0 && (
                    <div className="tw:mt-3">
                      <FileUploadedSlide
                        images={uploadedImages}
                        onRemove={handleRemoveImage}
                        onImageClick={handleImageClick}
                      />
                    </div>
                  )}
                </SectionCard>
              )}

              <SectionCard
                icon={<FileText className="tw:h-3.5 tw:w-3.5" />}
                title="Description"
              >
                <AppTextarea
                  name="description"
                  placeholder="Short description of the product"
                  register={register}
                  rows={5}
                  inputClassName="tw:text-xs tw:resize-none"
                />
              </SectionCard>
            </form>
            <ImgPreviewModal
              show={showImagePreviewModal}
              callback={() => setShowImagePreviewModal(false)}
              images={uploadedImages || []}
              initialImageId={previewImageId}
            />
          </>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        {created ? (
          <div className="tw:flex tw:items-center tw:justify-end tw:w-full">
            <AppButton
              color="primary"
              size="small"
              type="button"
              onClick={onDone}
            >
              Done
            </AppButton>
          </div>
        ) : (
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <AppButton
              fill="clear"
              color="light"
              onClick={onClose}
              type="button"
              size="small"
            >
              Discard
            </AppButton>
            <AppButton
              type="submit"
              color="primary"
              size="small"
              isLoading={loading}
              className="tw:gap-2"
              onClick={handleSubmit(onSubmit)}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <CheckCircle2 className="tw:w-4 tw:h-4" />
                  Send Request
                </>
              )}
            </AppButton>
          </div>
        )}
      </AppModal.Footer>
    </AppModal>
  );
}
