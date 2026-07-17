import { Barcode, Copy, Package } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import Amount from "~/components/core/amount/Amount";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import {
  printTypeOptions,
  priceTypeOptions,
  sizeOptionsMap,
  templateOptions,
} from "~/services/PrintBarcodeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import StorageService from "~/services/StorageService";
import type { SellerDeal } from "~/types/CommonTypes";
import type { SwiperOptions } from "swiper/types";

type Props = {
  show: boolean;
  dealId: string;
  callback?: (a: { action: string; data?: any }) => void;
};

type FieldKey = "name" | "price" | "mrp" | "barcodeText" | "dealId";

type FormData = {
  selectedBarcode: string;
  quantity: number | null;
  printType: string;
  size: string;
  template: string;
  priceType: string;
  customizeFields: boolean;
  fields: Record<FieldKey, boolean>;
};

const swiperConfig: SwiperOptions = {
  slidesPerView: 1,
  spaceBetween: 10,
};

const STORAGE_KEY = "print-barcode-prefs";

const defaultFields: Record<FieldKey, boolean> = {
  name: true,
  price: true,
  mrp: true,
  barcodeText: true,
  dealId: false,
};

type StoredPrefs = {
  printType?: string;
  size?: string;
  template?: string;
  customizeFields?: boolean;
  fields?: Record<FieldKey, boolean>;
};

const PrintBarcodeModal: React.FC<Props> = ({ show, dealId, callback }) => {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [deal, setDeal] = useState<SellerDeal | null>(null);
  const [barcodes, setBarcodes] = useState<{ barcode: string; type: string }[]>(
    [],
  );

  const saved = StorageService.get<StoredPrefs>(STORAGE_KEY);
  const initPrintType =
    saved?.printType && sizeOptionsMap[saved.printType]
      ? saved.printType
      : "1ups";
  const initSize =
    saved?.size &&
    sizeOptionsMap[initPrintType]?.some((o) => o.value === saved.size)
      ? saved.size
      : sizeOptionsMap[initPrintType][0].value;
  const initTemplate =
    saved?.template && templateOptions.some((o) => o.value === saved.template)
      ? saved.template
      : "full";

  const { register, handleSubmit, reset, setValue, control, getValues } =
    useForm<FormData>({
      defaultValues: {
        selectedBarcode: "",
        quantity: 1,
        printType: initPrintType,
        size: initSize,
        template: initTemplate,
        priceType: "B2C",
        customizeFields: saved?.customizeFields ?? false,
        fields: { ...defaultFields, ...(saved?.fields || {}) },
      },
    });

  const selected = useWatch({ control, name: "selectedBarcode" });
  const printType = useWatch({ control, name: "printType" });
  const template = useWatch({ control, name: "template" });
  const sizeOptions = sizeOptionsMap[printType] || [];

  const handleClose = () => {
    if (callback) callback({ action: "close", data: {} });
    setDeal(null);
    setBarcodes([]);
    reset();
  };

  useEffect(() => {
    if (!show || !dealId) return;

    const stored = StorageService.get<StoredPrefs>(STORAGE_KEY);
    const pt =
      stored?.printType && sizeOptionsMap[stored.printType]
        ? stored.printType
        : "1ups";
    const sz =
      stored?.size && sizeOptionsMap[pt]?.some((o) => o.value === stored.size)
        ? stored.size
        : sizeOptionsMap[pt][0].value;
    const tpl =
      stored?.template && templateOptions.some((o) => o.value === stored.template)
        ? stored.template
        : "full";
    setValue("printType", pt);
    setValue("size", sz);
    setValue("template", tpl);
    setValue("priceType", "B2C");
    setValue("customizeFields", stored?.customizeFields ?? false);
    setValue("fields", { ...defaultFields, ...(stored?.fields || {}) });

    const fetch = async () => {
      try {
        setLoading(true);
        const resp = await SellerCatalogService.getProducts({
          filter: { dealId: dealId },
        });
        const formatted = SellerCatalogService.formatProductResponse(
          resp?.data?.data || [],
        )?.[0];
        setDeal(formatted);

        const barcodeList: string[] = (formatted?.barcodes || []) as string[];
        const all = (barcodeList || []).map((b: string) => ({
          barcode: b,
          type: "primary",
        }));
        setBarcodes(all);
        setValue("selectedBarcode", all[0]?.barcode || "");
      } catch (e: any) {
        toast.show({
          msg: e?.message || "Failed to fetch deal",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [show, dealId]);

  const onSubmit = async (data: FormData) => {
    if (!data.selectedBarcode) {
      toast.show({ msg: "Please select a barcode", color: "danger" });
      return;
    }
    if (!data.quantity || data.quantity <= 0) {
      toast.show({ msg: "Please provide number of copies", color: "danger" });
      return;
    }

    try {
      setPrinting(true);
      StorageService.set(STORAGE_KEY, {
        printType: data.printType,
        size: data.size,
        template: data.template,
        customizeFields: data.customizeFields,
        fields: data.fields,
      });

      const payload: Record<string, any> = {
        size: data.size,
        template: data.template,
        deals: [
          {
            dealId: dealId,
            barcode: data.selectedBarcode,
            quantity: data.quantity,
          },
        ],
      };
      if (data.template === "retail") {
        payload.priceType = data.priceType;
      }
      if (data.customizeFields) {
        payload.fields = data.fields;
      }

      const resp = await SellerCatalogService.barcodePrint(payload);
      if (resp?.statusCode === 200) {
        const downloadUrl: string | undefined = resp.data?.data?.downloadUrl;

        if (downloadUrl) {
          CommonService.windowOpenHandler(
            SellerCatalogService.barcodeAbsoluteUrl(downloadUrl),
            () => {},
          );
        }
        toast.show({ msg: "Print request submitted", color: "success" });
        if (callback) callback({ action: "printed", data: resp.data });
        handleClose();
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to print",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({ msg: e?.message || "Failed to print", color: "danger" });
    } finally {
      setPrinting(false);
    }
  };

  const handleQtyInput = () => {
    const value = getValues("quantity");
    if (value === null || value === undefined) {
      setValue("quantity", 1);
      return;
    }
    const num = Number(value);
    if (num <= 0) {
      setValue("quantity", null);
    }
    if (!Number.isInteger(num)) {
      setValue("quantity", Math.floor(num));
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>Print Barcode</AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:space-y-3">
          <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-gray-50">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:p-2 tw:bg-primary/10 tw:rounded-lg">
                <Package size={18} className="tw:text-primary" />
              </div>
              <div className="tw:flex-1">
                <div className="tw:text-sm tw:text-gray-600 tw:uppercase tw:tracking-wide">
                  Product
                </div>
                <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:mt-1">
                  {deal?.name || "-"}
                </div>
                <div className="tw:flex tw:gap-4 tw:mt-2 tw:text-xs tw:text-gray-600">
                  <span>
                    MRP:{" "}
                    <Amount
                      value={deal?.mrp ?? deal?.price ?? 0}
                      className="tw:font-medium"
                    />
                  </span>
                  <span>
                    Stock:{" "}
                    <span className="tw:font-medium">
                      {deal?.maxQty ?? "-"} units
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <Barcode size={16} className="tw:text-gray-700" />
              <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                Select Barcode
              </span>
            </div>

            {loading ? (
              <div className="tw:py-6 tw:flex tw:flex-col tw:items-center tw:justify-center">
                <AppSpinner size="lg" />
                <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
                  Loading barcodes...
                </div>
              </div>
            ) : barcodes.length === 0 ? (
              <div className="tw:py-4 tw:text-sm tw:text-gray-500 tw:text-center">
                No barcodes found
              </div>
            ) : (
              <AppSwiper config={swiperConfig}>
                {barcodes.map((b, idx) => {
                  const isSelected = selected === b.barcode;
                  return (
                    <AppSwiper.Slide key={idx} isAutoWidth>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setValue("selectedBarcode", b.barcode)}
                        className={`tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-3 tw:px-3 tw:rounded-lg tw:border-2 tw:cursor-pointer tw:transition-all ${
                          isSelected
                            ? "tw:border-primary tw:bg-primary/5"
                            : "tw:border-gray-200 tw:bg-white tw:hover:border-gray-300"
                        }`}
                      >
                        <code className="tw:text-xs tw:text-gray-800 tw:break-all tw:text-center">
                          {b.barcode}
                        </code>
                      </div>
                    </AppSwiper.Slide>
                  );
                })}
              </AppSwiper>
            )}
          </div>

          <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3">
            <div className="tw:space-y-3">
              <div>
                <Controller
                  name="printType"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Print Type"
                      options={printTypeOptions}
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        const first = sizeOptionsMap[v]?.[0]?.value || "";
                        setValue("size", first);
                      }}
                      inputClassName="tw:w-full"
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="size"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Size"
                      options={sizeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      inputClassName="tw:w-full"
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  name="template"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Template"
                      options={templateOptions}
                      value={field.value}
                      onChange={field.onChange}
                      inputClassName="tw:w-full"
                    />
                  )}
                />
              </div>

              {template === "retail" && (
                <div>
                  <Controller
                    name="priceType"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label="Price Type"
                        options={priceTypeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                </div>
              )}

              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <AppInput
                  name="quantity"
                  label="Number of copies"
                  type="number"
                  register={register}
                  className="tw:w-full"
                  leftIcon={<Copy size={14} className="tw:text-gray-600" />}
                  onChange={handleQtyInput}
                  isRequired={true}
                />
              </div>
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton fill="clear" onClick={handleClose} type="button">
            Cancel
          </AppButton>
          <AppButton
            color="primary"
            isLoading={printing}
            onClick={handleSubmit(onSubmit)}
          >
            Print
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PrintBarcodeModal;
