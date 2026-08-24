import { add, sub } from "date-fns";
import { AlertCircle, Camera, Trash } from "lucide-react";
import { useRef } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { Swiper, SwiperOptions } from "swiper/types";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import LocationInput from "~/components/feature/inventory/location-input/LocationInput";
import { applyQtyFieldChange } from "./productQtyUtils";
import ProductVariation from "./ProductVariation";

const swiperConfig: SwiperOptions = {
  breakpoints: {
    0: { slidesPerView: 1.5 }, // mobile
    768: { slidesPerView: 4 }, // desktop (md and up)
  },
};

type Props = {
  orderedQty: number;
  dealName?: string;
  productIndex: number;
};

const allowedExtensions = ["jpg", "jpeg", "png"];

const manufactureDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { after: new Date(), before: sub(new Date(), { years: 10 }) },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
};

const expiryDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { before: new Date(), after: add(new Date(), { years: 10 }) },
  startMonth: new Date(),
  endMonth: add(new Date(), { years: 10 }),
};

const ProductItemForm = ({ orderedQty, dealName, productIndex }: Props) => {
  const { t } = useTranslation();

  const {
    control,
    getValues,
    setValue,
    register,
    formState: { errors },
    clearErrors,
  } = useFormContext();

  const swiperRef = useRef<Swiper | null>(null);
  const fieldPrefix = `products.${productIndex}.formData`;
  const fieldErrors = (errors as any)?.products?.[productIndex]?.formData || {};

  const [damageQty, receivedQty, damageDocs, mrp] = useWatch({
    control,
    name: [
      `${fieldPrefix}.damageQty`,
      `${fieldPrefix}.receivedQty`,
      `${fieldPrefix}.damageDocs`,
      `${fieldPrefix}.mrp`,
    ],
  });

  const handleNonNegativeNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "invoiceQty" | "receivedQty" | "damageQty",
    additionalCallback?: () => void,
  ) => {
    const product = getValues(`products.${productIndex}`);
    const nextFormData = applyQtyFieldChange({
      product: { ...product, quantity: orderedQty },
      field: fieldName,
      rawValue: e.target.value,
    });
    setValue(`products.${productIndex}.formData`, nextFormData, {
      shouldDirty: true,
    });
    clearErrors(`${fieldPrefix}.${fieldName}`);

    if (additionalCallback) {
      additionalCallback();
    }
  };

  const handlePurchasePriceChange = () => {
    clearErrors(`${fieldPrefix}.purchasePrice`);
  };

  const handleLocationChange = ({
    location,
    locationDetail,
    rack,
    rackDetails,
    bin,
    binDetails,
  }: {
    location: string;
    locationDetail: any;
    rack: string;
    rackDetails: any;
    bin: string;
    binDetails: any;
  }) => {
    const normalizedLocation = locationDetail
      ? {
          id: locationDetail.id || locationDetail._id,
          name: locationDetail.name,
        }
      : null;
    const normalizedBin = binDetails
      ? {
          ...binDetails,
          binName: binDetails.binName || binDetails.name,
        }
      : null;

    setValue(`${fieldPrefix}.location`, location);
    setValue(`${fieldPrefix}.locationDetail`, normalizedLocation);
    setValue(`${fieldPrefix}.locationDetails`, normalizedLocation);
    setValue(`${fieldPrefix}.rack`, rack);
    setValue(`${fieldPrefix}.rackDetails`, rackDetails);
    setValue(`${fieldPrefix}.bin`, bin);
    setValue(`${fieldPrefix}.binDetails`, normalizedBin);
    clearErrors([
      `${fieldPrefix}.location`,
      `${fieldPrefix}.rack`,
      `${fieldPrefix}.bin`,
    ]);
  };

  const handleFileUpload = (file: any) => {
    const existingFiles =
      getValues(`products.${productIndex}.formData.damageDocs`) || [];
    setValue(`products.${productIndex}.formData.damageDocs`, [
      { id: file._id },
      ...existingFiles,
    ]);

    if (swiperRef.current) {
      const t = setTimeout(() => {
        clearTimeout(t);
        swiperRef.current?.update();
      }, 200);
    }
  };

  const handleSwiperCallback = (a: {
    swiper: Swiper;
    action: "init" | "slideChange";
  }) => {
    if (a.action === "init") {
      swiperRef.current = a.swiper;
    }
  };

  const handleRemoveDamageDoc = (id: string) => {
    const existingFiles =
      getValues(`products.${productIndex}.formData.damageDocs`) || [];
    setValue(
      `products.${productIndex}.formData.damageDocs`,
      existingFiles.filter((doc: any) => doc.id !== id)
    );
  };

  return (
    <>
      <div className="tw:p-3 tw:sm:p-4">
        {/* Two up on mobile: these are short numeric fields, so a single
            column wasted half the row and pushed the rest of the sheet below
            the fold. */}
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-3 tw:sm:gap-4 tw:mb-4">
          <AppInput
            type="number"
            name={`${fieldPrefix}.invoiceQty`}
            label={t("invoiceQty")}
            register={register}
            inputClassName="tw:bg-white"
            onChange={(e) => handleNonNegativeNumberChange(e, "invoiceQty")}
            isRequired={true}
            min={1}
            error={fieldErrors.invoiceQty?.message}
            rules={{
              required: t("invoiceQtyRequired", {
                defaultValue: "Invoice quantity is required",
              }),
              validate: (v) =>
                Number(v) > 0 ||
                t("invoiceQtyRequired", {
                  defaultValue: "Invoice quantity is required",
                }),
            }}
          />
          <AppInput
            type="number"
            name={`${fieldPrefix}.receivedQty`}
            label={t("receivedQty")}
            register={register}
            inputClassName="tw:bg-white"
            onChange={(e) => handleNonNegativeNumberChange(e, "receivedQty")}
            isRequired={true}
            min={0}
            error={fieldErrors.receivedQty?.message}
          />
          <AppInput
            type="number"
            name={`${fieldPrefix}.damageQty`}
            label={t("damageQty")}
            register={register}
            inputClassName="tw:bg-white"
            onChange={(e) => handleNonNegativeNumberChange(e, "damageQty")}
            labelClassName="tw:!text-red-500"
            min={0}
            error={fieldErrors.damageQty?.message}
          />
          <AppInput
            type="number"
            name={`${fieldPrefix}.purchasePrice`}
            label={t("purchasePrice") + " (Rs.)"}
            register={register}
            inputClassName="tw:bg-white"
            isRequired={true}
            min={0}
            step="0.01"
            onChange={handlePurchasePriceChange}
            error={fieldErrors.purchasePrice?.message}
            rules={{
              required: t("purchasePriceRequired", {
                defaultValue: "Purchase price is required",
              }),
              validate: (v) => {
                if (!v || Number(v) <= 0) {
                  return t("purchasePriceRequired", {
                    defaultValue: "Purchase price is required",
                  });
                }
                if (mrp && Number(v) > Number(mrp)) {
                  return t("purchasePriceCannotExceedMrp", {
                    defaultValue: "Purchase price cannot be greater than MRP",
                  });
                }
                return true;
              },
            }}
          />
        </div>

        {damageQty > 0 && (
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3 tw:sm:gap-4 tw:mb-4 tw:border tw:border-red-100 tw:p-3 tw:sm:p-4 tw:rounded-md">
            <div>
              <div className="tw:mb-2">
                <label className="tw:text-sm tw:font-medium tw:text-red-800 tw:flex tw:items-center tw:gap-2">
                  <AlertCircle className="tw:w-4 tw:h-4" />
                  {t("damageDocuments")}
                </label>
              </div>
              <AppSwiper config={swiperConfig} callback={handleSwiperCallback}>
                <AppSwiper.Slide>
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    allowedExtensions={allowedExtensions}
                  >
                    <div className="tw:border-2 tw:border-dashed tw:border-red-300 tw:rounded-lg tw:p-2 tw:text-red-500 tw:h-20 tw:flex tw:items-center tw:justify-center">
                      <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                        <Camera className="tw:w-4 tw:h-4" />
                        <div className="tw:text-xs">{t("addPhoto")}</div>
                      </div>
                    </div>
                  </FileUpload>
                </AppSwiper.Slide>

                {damageDocs?.map((doc: any) => (
                  <AppSwiper.Slide key={doc.id}>
                    <div className="tw:bg-white tw:rounded-lg tw:p-1 tw:h-20 tw:relative tw:border tw:border-gray-200">
                      <ImgRender
                        assetId={doc.id}
                        className="tw:w-full tw:h-full"
                      />
                      <div className="tw:flex tw:items-center tw:gap-2 tw:absolute tw:top-2 tw:right-2 tw:bg-white tw:rounded-full tw:p-1">
                        <button
                          className="tw:text-xs tw:text-red-500 tw:cursor-pointer"
                          onClick={() => handleRemoveDamageDoc(doc.id)}
                        >
                          <Trash className="tw:w-4 tw:h-4" />
                        </button>
                      </div>
                    </div>
                  </AppSwiper.Slide>
                ))}
              </AppSwiper>
            </div>
            <AppInput
              name={`products.${productIndex}.formData.damageRemarks`}
              register={register}
              inputClassName="tw:bg-white tw:mt-2"
              placeholder={t("damageRemarks")}
            />
          </div>
        )}

        {/* Location + Notes */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3 tw:sm:gap-4 tw:mb-4">
          <div className="tw:min-w-0">
            <LocationInput
              layout="auto"
              locationId={getValues(`${fieldPrefix}.location`) || ""}
              rackId={getValues(`${fieldPrefix}.rack`) || ""}
              binId={getValues(`${fieldPrefix}.bin`) || ""}
              dealId={getValues(`products.${productIndex}.dealId`) || ""}
              qty={receivedQty}
              callback={handleLocationChange}
              locationType="sellable"
              isRequired={true}
              hideLocationDropdown={true}
            />
            {(fieldErrors.location?.message ||
              fieldErrors.rack?.message ||
              fieldErrors.bin?.message) && (
              <div className="tw:text-red-500 tw:text-xs tw:mt-1">
                {fieldErrors.location?.message ||
                  fieldErrors.rack?.message ||
                  fieldErrors.bin?.message}
              </div>
            )}
          </div>

          <AppInput
            name={`${fieldPrefix}.notes`}
            label={t("notes")}
            register={register}
            inputClassName="tw:bg-white"
            placeholder={t("enterAdditionalNotes")}
          />
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:gap-4">
          <Controller
            control={control}
            name={`products.${productIndex}.formData.manufactureDate`}
            render={({ field }) => (
              <AppDateInput
                label={t("manufactureDate")}
                size="sm"
                isRequired={false}
                callback={field.onChange}
                value={field.value}
                inputClassName="tw:bg-white"
                dateConfig={manufactureDateConfig}
              />
            )}
          />

          <Controller
            control={control}
            name={`products.${productIndex}.formData.expiryDate`}
            render={({ field }) => (
              <AppDateInput
                label={t("expiryDate")}
                size="sm"
                isRequired={false}
                callback={field.onChange}
                value={field.value}
                inputClassName="tw:bg-white"
                dateConfig={expiryDateConfig}
              />
            )}
          />
        </div>
      </div>

      <ProductVariation
        productIndex={productIndex}
        dealName={dealName}
        receivedQty={receivedQty}
      />
    </>
  );
};
export default ProductItemForm;
