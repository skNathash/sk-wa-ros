import { CheckCircle2, IndianRupee, Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import { ASSET } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import ProductService from "~/services/ProductService";
import UomPriceService from "~/services/UomPriceService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";

type Props = {
  show: boolean;
  data?: any;
  // the block id in parent that opened this modal
  blockId?: string;
  images?: Array<{ id: string }>;
  callback: (a: { action: string; data?: any }) => void;
};

const UOM_OPTIONS = InventorySubscribeService.getUomOptions();

// Normalize incoming UOM strings to one of the option `value`s above.
const normalizeUom = (uom?: string | null) => {
  if (!uom) return "unit";
  const s = String(uom).toLowerCase().trim();

  if (["pcs", "pc", "piece", "pieces", "unit", "units"].includes(s))
    return "unit";
  // Only piece/gm/ml are supported, so kg/ltr mappings are intentionally disabled
  // if (["kg", "kgs", "kilogram", "kilograms"].includes(s)) return "kg";
  // if (["g", "gram", "grams"].includes(s)) return "g";
  // if (["ltr", "l", "liter", "litre", "liters", "litres", "ml"].includes(s))
  //   return "ltr";

  // Fallback: if the incoming string matches any label in options, map by label
  const byLabel = UOM_OPTIONS.find(
    (o) => o.label.toLowerCase() === s || o.value.toLowerCase() === s,
  );
  return byLabel ? byLabel.value : "unit";
};

export default function ReviewModal({
  show,
  data,
  blockId,
  images,
  callback,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      mrp: "",
      uom: "",
      barcode: "",
      description: "",
      brand: undefined,
      category: undefined,
      isLocalDeal: false,
    },
  });

  const [addNewBrand, setAddNewBrand] = useState(false);

  // Watch uom/mrp so the per-base-unit (per kg/ltr) price hint reflects the
  // current selection for small uoms (gm/ml); isLocalDeal drives the badge.
  const [uomWatch, mrpWatch, isLocalDealWatch] = useWatch({
    control,
    name: ["uom", "mrp", "isLocalDeal"],
  });
  // Display unit shown in the hint (kg/ltr for small uoms, else the uom).
  const displayUom = UomPriceService.getDisplayUom(uomWatch);
  const isSmallUom = UomPriceService.isSmallUom(uomWatch);

  useEffect(() => {
    if (data && show) {
      const name = data?.product_basic_info?.product_name || "";
      const description =
        data?.visual_description?.short_description ||
        data?.visual_description?.detailed_description ||
        "";
      const mrp = data?.pricing_info?.mrp || "";
      const barcode = data?.pricing_info?.barcode || "";

      const rawUom = data?.pricing_info?.uom || "unit";
      const finalUom = normalizeUom(rawUom);

      setValue("name", name);
      setValue("description", description);
      setValue("mrp", mrp);
      setValue("uom", finalUom);
      setValue("barcode", barcode);
      setValue("brand", undefined);
      setValue("category", undefined);
      setValue("isLocalDeal", false);
    }
  }, [data, setValue, show]);

  const onClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const { show: toast } = useAppToast();
  const [loading, setLoading] = useState(false);

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

  // Marking a scanned barcode as the seller's own product flags it as a local deal.
  // "useBarcode" = the barcode is linked to other deals but the seller chose to
  // use it anyway for their own product.
  const handleBarcodeCallback = (params: { action: string; data?: any }) => {
    if (params.action === "markAsLocal" || params.action === "useBarcode") {
      setValue("isLocalDeal", true);
    }
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

    const uom = normalizeUom(vals.uom);

    const payload: Record<string, any> = {
      productName: vals.name?.trim(),
      qty: 0,
      // For small uoms (gm/ml) the user enters the price per display unit
      // (per kg/ltr); convert to the lower uom for the API.
      mrp: Number(UomPriceService.toApiPrice(mrpNum, vals.uom)),
      barcode: vals.barcode,
      uom,
      description: vals.description,
      images: (images || []).map((i) => i.id),
      ...(vals.isLocalDeal ? { isLocalDeal: true } : {}),
    };

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

    setLoading(true);
    try {
      const res = await InventorySubscribeService.importStoreProduct(payload);
      if (res?.statusCode === 200) {
        callback({ action: "created", data: { product: res.data, blockId } });
        toast({ msg: "Product created successfully", color: "success" });
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
        <div className="tw:font-bold">Review Product</div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Please verify the details extracted by our StoreKing AI assistant
          before saving
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[95vh]">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Image Preview Section */}
          {images && images.length > 0 && (
            <div className="tw:space-y-2">
              <div className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                Extracted Images
              </div>
              <div className="tw:flex tw:gap-2 tw:overflow-x-auto tw:pb-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="tw:relative tw:aspect-square tw:w-20 tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-100 tw:shrink-0 tw:shadow-sm"
                  >
                    <img
                      src={`${ASSET}/${img.id}?size=200x200`}
                      className="tw:w-full tw:h-full tw:object-cover"
                      alt="Product"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tw:space-y-4">
            <AppInput
              name="name"
              label="Product Name"
              placeholder="Enter product name"
              register={register}
              error={errors.name?.message}
              size="sm"
              isRequired
              leftIcon={<Package className="tw:w-4 tw:h-4 tw:text-gray-400" />}
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
                  error={errors.mrp?.message}
                  type="number"
                  size="sm"
                  isRequired
                  leftIcon={
                    <IndianRupee className="tw:w-4 tw:h-4 tw:text-gray-400" />
                  }
                />
                {isSmallUom && (
                  <p className="tw:text-[11px] tw:text-gray-400 tw:mt-1">
                    Enter price per {displayUom}
                    {mrpWatch
                      ? ` (≈ ₹${UomPriceService.toApiPrice(mrpWatch, uomWatch)}/${uomWatch})`
                      : ""}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
                Barcode / EAN
                {isLocalDealWatch && <DealScopeBadge isLocalDeal />}
              </label>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <BarcodeInput
                    value={field.value || ""}
                    onChange={(barcode) => {
                      // Any barcode change clears a previous "local deal"
                      // mark; the useBarcode callback re-sets it after.
                      field.onChange(barcode);
                      setValue("isLocalDeal", false);
                    }}
                    placeholder="Scan or enter barcode"
                    uom={uomWatch}
                    dealId={data?.dealId || data?._id}
                    callback={handleBarcodeCallback}
                    hideCreateProduct
                  />
                )}
              />
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
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
                          label="Brand"
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
                    label="Category"
                  />
                )}
              />
            </div>

            <AppTextarea
              name="description"
              label="Description"
              placeholder="Short description of the product"
              register={register}
              rows={5}
              inputClassName="tw:text-xs tw:resize-none"
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
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
                Save Product
              </>
            )}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
}
