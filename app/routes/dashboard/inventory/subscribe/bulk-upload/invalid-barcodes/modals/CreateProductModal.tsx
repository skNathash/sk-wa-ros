import { Image, Info, Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import AppTextarea from "~/components/core/form/AppTextarea";
import BrandSearchInput from "~/components/feature/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/components/feature/search-input/category/CategorySearchInput";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import ProductService from "~/services/ProductService";

interface CreateProductModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  barcodeData?: {
    _id?: string;
    barcode: string;
    createdAt?: string | Date;
    error?: string;
    validationMessage?: string;
    status?: string;
  };
}

type FormData = {
  name: string;
  brand: any;
  category: any;
  unitType: string;
  images: any[];
  mrp: string;
  description: string;
  newBrand?: string;
};

const defaultValues: FormData = {
  name: "",
  brand: undefined,
  category: undefined,
  unitType: "",
  images: [],
  mrp: "",
  description: "",
  newBrand: "",
};

const validateProduct = (data: Record<string, any>) => {
  const mrp = Number(data.mrp);

  let msg = "";

  if (!data.name || data.name.trim() === "") {
    msg = "Product name is required";
  } else if (!data.mrp) {
    msg = "MRP is required";
  } else if (isNaN(mrp)) {
    msg = "MRP must be a number";
  } else if (mrp < 0) {
    msg = "MRP cannot be less than 0";
  } else if (!data.unitType) {
    msg = "Unit type is required";
  } else {
    msg = "";
  }
  return { msg };
};

const CreateProductModal = ({
  show,
  callback,
  barcodeData,
}: CreateProductModalProps) => {
  const { register, control, setValue, handleSubmit, reset } =
    useForm<FormData>({
      defaultValues: { ...defaultValues },
    });
  const { show: showToast } = useAppToast();
  const [addNewBrand, setAddNewBrand] = useState(false);
  const [loading, setLoading] = useState(false);

  const [images] = useWatch({ control, name: ["images"] });

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      reset({ ...defaultValues });
      setAddNewBrand(false);
    }
  }, [show, reset]);

  const toggleAddNewBrand = () => {
    setAddNewBrand(!addNewBrand);
  };

  const handleBrandChange = (item: any, action: string) => {
    if (action === "add") setValue("brand", item);
    if (action === "remove") setValue("brand", undefined);
  };

  const handleCategoryChange = (item: any, action: string) => {
    if (action === "add") setValue("category", item);
    if (action === "remove") setValue("category", undefined);
  };

  const handleFileUpload = (data: any) => {
    if (data && data._id) {
      setValue("images", [...images, { id: data._id }], {
        shouldValidate: true,
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_: any, i: number) => i !== index);
    setValue("images", newImages, { shouldValidate: true });
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

    // clamp maximum
    if (num > 1000000) {
      setValue(name, "1000000");
      return;
    }

    // for mrp, enforce minimum of 1
    if (name === "mrp" && num < 1) {
      setValue(name, "1");
      return;
    }

    // previous behaviour: clear negative values
    if (num < 0) {
      setValue(name, "");
      return;
    }
  };

  const onSubmit = async (data: any) => {
    const validation = validateProduct(data);
    if (validation.msg) {
      showToast({
        msg: validation.msg || "Validation failed",
        color: "danger",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        productName: data.name?.trim(),
        qty: 0,
        price: Number(data.mrp), // Use MRP as price
        mrp: Number(data.mrp),
        barcode: barcodeData?.barcode,
        uom: data.unitType,
        description: data.description,
        images: (data.images || []).map((e: any) => e.id),
      };

      // Include category only if it has data
      if (data.category?.value) {
        payload.category = {
          id: data.category.value.objId ?? "",
          categoryId: data.category.value.id ?? "",
          name: data.category.value.name ?? "",
        };
      }

      // Include invalid barcode id if present
      if (barcodeData?._id) {
        payload.invalidBarcodeId = barcodeData._id;
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

      const response = await InventorySubscribeService.importStoreProduct(
        payload
      );
      if (response?.statusCode && response.statusCode === 200) {
        reset({ ...defaultValues });
        callback({ action: "submit", data: response.data });
      } else {
        showToast({
          msg: response?.data?.message || "Failed to create product",
          color: "danger",
        });
      }
    } catch (err: any) {
      showToast({
        msg: err?.message || "Failed to create product",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:h-[85vh]"
      backdropDismiss={false}
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:text-lg tw:font-medium">Create Product</div>
        <div className="tw:text-xs tw:text-gray-500">
          Add a new product to your inventory.
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[85vh]">
        {barcodeData?.barcode && (
          <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg">
            <Info size={14} className="tw:text-gray-600 tw:flex-shrink-0" />
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:text-xs tw:font-medium tw:text-gray-700">
                Creating product for barcode
              </div>
              <div className="tw:mt-0.5 tw:text-sm tw:font-mono tw:font-semibold tw:text-gray-900 tw:truncate">
                {barcodeData.barcode}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="tw:flex tw:flex-col tw:gap-3">
            <AppInput
              name="name"
              label="Name"
              register={register}
              placeholder="Enter product name"
              isRequired
              size="sm"
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
                  <div className="tw:mt-1">
                    <button
                      className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 hover:tw:text-blue-700 tw:font-medium tw:cursor-pointer tw:transition-colors"
                      onClick={toggleAddNewBrand}
                      type="button"
                    >
                      <Search size={12} className="tw:flex-shrink-0" />
                      <span>Search All Brands</span>
                    </button>
                  </div>
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
                  <div className="tw:mt-1">
                    <button
                      className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 hover:tw:text-blue-700 tw:font-medium tw:cursor-pointer tw:transition-colors"
                      onClick={toggleAddNewBrand}
                      type="button"
                    >
                      <Plus size={12} className="tw:flex-shrink-0" />
                      <span>Add New Brand</span>
                    </button>
                  </div>
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

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
              <AppInput
                type="number"
                name="mrp"
                label="MRP"
                register={register}
                isRequired
                size="sm"
                placeholder="Enter MRP"
                onChange={handleNumberInput}
              />

              <Controller
                name="unitType"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    label="Unit Type"
                    isRequired
                    size="sm"
                    options={InventorySubscribeService.getUomOptions()}
                    value={field.value}
                    onChange={field.onChange}
                    inputClassName="tw:w-full"
                    placeholder="Select unit type"
                  />
                )}
              />
            </div>

            <AppTextarea
              name="description"
              label="Description"
              register={register}
              rows={2}
              placeholder="Enter product description"
            />

            <div>
              <FileUpload
                onFileUpload={handleFileUpload}
                allowedExtensions={["jpg", "jpeg", "png"]}
                maxSizeMB={10}
              >
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:w-full tw:border tw:border-dashed tw:border-gray-300 tw:rounded-md tw:p-3">
                  <Image size={36} className="tw:text-gray-400" />
                  <span className="tw:text-xs tw:text-gray-500">
                    Upload Product Images
                  </span>
                </div>
              </FileUpload>
              <div className="tw:mt-2 tw:px-2 tw:py-1.5 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:text-xs tw:text-gray-600">
                <div className="tw:flex tw:items-center tw:gap-4">
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span className="tw:font-medium">Formats:</span>
                    <span className="tw:font-mono tw:text-gray-700">
                      JPG, JPEG, PNG
                    </span>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span className="tw:font-medium">Max size:</span>
                    <span className="tw:font-mono tw:text-gray-700">10 MB</span>
                  </div>
                </div>
              </div>
              {images && images.length > 0 && (
                <div className="tw:mt-2">
                  <FileUploadedSlide
                    images={images}
                    onRemove={handleRemoveImage}
                  />
                </div>
              )}
            </div>
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <AppButton
          fill="outline"
          color="light"
          onClick={() => callback({ action: "close" })}
          disabled={loading}
        >
          Cancel
        </AppButton>
        <AppButton
          onClick={handleSubmit(onSubmit)}
          isLoading={loading}
          disabled={loading}
        >
          Create Product
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CreateProductModal;
