import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import UomPriceService from "~/services/UomPriceService";
import AppCard from "~/components/core/card/AppCard";
import { AppDateInput, AppInput, AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { SellerDeal } from "~/types/CommonTypes";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import PosService from "~/services/PosService";
import AuthService from "~/services/AuthService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { AlertTriangle, CheckCircle, EyeOff, Save, X } from "lucide-react";
import CommonService from "~/services/CommonService";
import clsx from "clsx";
import { endOfDay, startOfDay } from "date-fns";
import Rbac from "~/components/core/rbac/Rbac";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealId: string;
};

type FormData = {
  offerDiscount: number | null;
  offerStartDate: Date[] | Date | null;
  offerEndDate: Date[] | Date | null;
  calculateOn: "beforeTax" | "afterTax";
};

const today = new Date();

const startDateConfig: DayPickerProps = {
  defaultMonth: today,
  startMonth: today,
  disabled: { before: today },
};

const calculateOnOptions = [
  {
    value: "beforeTax",
    label: "Before Tax",
  },
  {
    value: "afterTax",
    label: "After Tax",
  },
];

const PriceSchemeModal = ({ show, callback, dealId }: Props) => {
  const { control, register, getValues, setValue, reset } = useForm<FormData>({
    defaultValues: {
      calculateOn: "afterTax",
      offerDiscount: null,
    },
  });
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deal, setDeal] = useState<SellerDeal | null>(null);

  const offerStartDate = useWatch({ name: "offerStartDate", control });

  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);

  const calculateOn = useWatch({ name: "calculateOn", control });

  const [appAlert, setAppAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: string;
  } | null>(null);

  const endDateConfig = useMemo(() => {
    const startDate = Array.isArray(offerStartDate)
      ? offerStartDate[0]
      : offerStartDate;

    if (!startDate) {
      return {
        defaultMonth: today,
        startMonth: today,
        disabled: { before: today },
      };
    }

    return {
      defaultMonth: offerStartDate,
      startMonth: offerStartDate,
      disabled: { before: offerStartDate },
    };
  }, [offerStartDate]);

  useEffect(() => {
    if (show) {
      const fetchDeal = async () => {
        setLoading(true);
        const deal = await SellerCatalogService.getProducts({
          filter: { dealId },
        });
        const formatted =
          SellerCatalogService.formatProductResponse(deal.data?.data || [], {
            includeRawResponse: true,
          })?.[0] || null;
        setDeal(formatted);
        setLoading(false);

        const discount = formatted?.b2bScheme?.offerDiscount || 0;
        const uom = (formatted as any)?.selectedStockUom;
        const price = Number(
          UomPriceService.toDisplayPrice(formatted?.basePrice || 0, uom),
        );
        const purchase = Number(
          UomPriceService.toDisplayPrice(formatted?.purchasePrice || 0, uom),
        );
        const cess = Number(
          UomPriceService.toDisplayPrice(formatted?.additionalCess || 0, uom),
        );
        const { offerPrice, profit } = CommonService.calculateScheme(
          price,
          discount,
          formatted?.b2bScheme?.isTaxInclusive || false,
          formatted?.gst || 0,
          purchase,
          cess,
        );

        setOfferPrice(
          Number(UomPriceService.toApiPrice(Number(offerPrice), uom)),
        );
        // profit is already in display (per-kg/ltr) space; Amount renders it
        // without conversion, so keep it as-is (no toApiPrice round-trip).
        setProfit(Number(profit));

        reset({
          offerDiscount: discount || null,
          offerStartDate: formatted?.b2bScheme?.offerStartDate
            ? new Date(formatted?.b2bScheme?.offerStartDate)
            : null,
          offerEndDate: formatted?.b2bScheme?.offerEndDate
            ? new Date(formatted?.b2bScheme?.offerEndDate)
            : null,
          calculateOn: formatted?.b2bScheme?.isTaxInclusive
            ? "afterTax"
            : "beforeTax",
        });
      };
      fetchDeal();
    }
  }, [show, dealId]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleDiscountChange = () => {
    const value = getValues("offerDiscount");
    if (!value || value < 0) {
      setValue("offerDiscount", null);
    }

    if (value && value > 100) {
      setValue("offerDiscount", 100);
    }

    const discount = getValues("offerDiscount");
    const uom = deal?.selectedStockUom;
    const price = Number(
      UomPriceService.toDisplayPrice(deal?.basePrice || 0, uom),
    );
    const purchase = Number(
      UomPriceService.toDisplayPrice(deal?.purchasePrice || 0, uom),
    );
    const cess = Number(
      UomPriceService.toDisplayPrice(deal?.additionalCess || 0, uom),
    );
    const { offerPrice, profit } = CommonService.calculateScheme(
      price,
      discount || 0,
      getValues("calculateOn") === "afterTax" ? true : false,
      deal?.gst || 0,
      purchase,
      cess,
    );

    setOfferPrice(Number(UomPriceService.toApiPrice(Number(offerPrice), uom)));
    // profit stays in display (per-kg/ltr) space; Amount renders it without
    // conversion, so don't round-trip it through toApiPrice.
    setProfit(Number(profit));
  };

  const handleStartDateChange =
    (chgnFn: (date: Date[] | Date | null) => void) => (dt: Date | Date[]) => {
      chgnFn(dt || null);
      setValue("offerEndDate", dt || null);
    };

  const validateForm = () => {
    const values = getValues();

    if (!values.offerDiscount) {
      return "Scheme discount is required";
    }

    if (values.offerDiscount < 0 || values.offerDiscount > 100) {
      return "Scheme discount must be between 0 and 100";
    }

    if (!values.offerStartDate) {
      return "Scheme start date is required";
    }

    if (!values.offerEndDate) {
      return "Scheme end date is required";
    }

    if (values.offerStartDate > values.offerEndDate) {
      return "Scheme start date cannot be greater than scheme end date";
    }

    return null;
  };

  const preparePayload = () => {
    const values = getValues();
    const networkSellingPrice = deal?._raw?.networkSellingPrice || {};
    const payload: any = {
      franchiseId: AuthService.getLoggedInUserId(),
      discount: networkSellingPrice.discount || 0,
      id: dealId,
      applicableFor: "Network",
      configOnType: "Deal",
      isFixedPrice: networkSellingPrice.discountType === "Fixed" ? true : false,
      offerOfTheDay: {
        isOfferOfTheDay: true,
        isDefaultOffer: false,
        offerStartDate: startOfDay(new Date(values.offerStartDate as Date)),
        offerEndDate: endOfDay(new Date(values.offerEndDate as Date)),
        offerDiscount: values.offerDiscount,
        isTaxInclusive: calculateOn === "afterTax" ? true : false,
      },
    };
    return payload;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      appToast.show({ msg: error, color: "danger" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = preparePayload();

      const response = await PosService.createRspConfig(payload);

      if (response.statusCode === 200) {
        appToast.show({
          msg: response.data?.message || "Price scheme saved successfully",
          color: "success",
        });
        callback({
          action: "save",
          data: { ...response.data, _payload: payload },
        });
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to save price scheme",
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({ msg: "Failed to save price scheme", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setAppAlert({
      show: true,
      title: "Remove Price Scheme",
      message: "Are you sure you want to remove the price scheme?",
      action: "remove",
    });
  };

  const doDisable = async () => {
    const payload = preparePayload();
    payload.offerOfTheDay = {
      isOfferOfTheDay: false,
      isDefaultOffer: false,
      offerStartDate: null,
      offerEndDate: null,
      offerDiscount: null,
    };

    setSubmitting(true);

    try {
      const response = await PosService.createRspConfig(payload);
      if (response.statusCode === 200) {
        appToast.show({
          msg: response.data?.message || "Price scheme removed successfully",
          color: "success",
        });
        callback({ action: "remove", data: response.data });
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to remove price scheme",
          color: "danger",
        });
      }
    } catch (error: any) {
      appToast.show({
        msg: error.message || "Failed to remove price scheme",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const alertSuccessCb = () => {
    setAppAlert(null);

    if (appAlert?.action === "remove") {
      doDisable();
    }
  };

  const alertCancelCb = () => {
    setAppAlert(null);
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="tw:max-h-[90vh]">
        <AppModal.Title onClose={handleClose}>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-lg tw:font-semibold">
              Edit B2B Price Scheme
            </span>
          </div>
        </AppModal.Title>
        <AppModal.Content className="tw:max-h-[90vh]">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center">
              <AppSpinner />
            </div>
          ) : null}

          {!loading && deal ? (
            <>
              <AppCard>
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                  <div className="tw:w-10 tw:h-10 tw:shrink-0">
                    <ImgRender
                      assetId={deal.images?.[0]}
                      alt={deal.name}
                      className="tw:w-10 tw:h-10 tw:object-contain tw:rounded"
                    />
                  </div>
                  <div className="tw:min-w-0">
                    <div className="tw:text-sm tw:font-semibold tw:truncate">
                      {deal.name}
                    </div>
                    <div className="tw:text-[11px] tw:text-gray-500">
                      ID: {deal.id}
                    </div>
                  </div>
                </div>

                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-5 tw:gap-y-1 tw:text-xs tw:border-t tw:border-gray-100 dark:tw:border-gray-800 tw:pt-2">
                  <span className="tw:text-gray-500">
                    MRP{" "}
                    <DisplayPrice
                      price={deal.mrp}
                      uom={deal.selectedStockUom}
                      className="tw:text-red-500 tw:font-semibold"
                    />
                  </span>
                  <span className="tw:text-gray-500">
                    Pur.{" "}
                    <DisplayPrice
                      price={deal.purchasePrice}
                      uom={deal.selectedStockUom}
                      className="tw:font-semibold tw:text-gray-700 dark:tw:text-gray-200"
                    />
                    {UomPriceService.isSmallUom(deal.selectedStockUom) && (
                      <span className="tw:text-gray-400">
                        {" ("}
                        <Amount
                          value={Number(deal.purchasePrice)}
                          decimalPlaces={2}
                        />
                        {`/${UomPriceService.getBaseUom(deal.selectedStockUom)})`}
                      </span>
                    )}
                  </span>
                  <span className="tw:text-gray-500">
                    B2B{" "}
                    <DisplayPrice
                      price={deal.b2bPrice}
                      uom={deal.selectedStockUom}
                      className="tw:text-primary tw:font-semibold"
                    />
                    {UomPriceService.isSmallUom(deal.selectedStockUom) && (
                      <span className="tw:text-gray-400">
                        {" ("}
                        <Amount
                          value={Number(deal.b2bPrice)}
                          decimalPlaces={2}
                        />
                        {`/${UomPriceService.getBaseUom(deal.selectedStockUom)})`}
                      </span>
                    )}
                  </span>
                  <span className="tw:text-gray-500">
                    GST{" "}
                    <span className="tw:font-semibold tw:text-gray-700 dark:tw:text-gray-200">
                      {deal.gst || 0}%
                    </span>
                  </span>
                </div>
              </AppCard>

              {deal.b2bScheme?.status === "Running" && (
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:shrink-0 tw:mb-2 tw:font-medium tw:rounded tw:border tw:border-emerald-200 tw:bg-emerald-50/80 tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-emerald-700">
                  <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:shrink-0">
                    <CheckCircle size={12} />
                    B2B scheme is active and running
                  </span>
                </div>
              )}

              {deal.b2bScheme?.status === "Completed" && (
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:shrink-0 tw:mb-2 tw:font-medium tw:rounded tw:border tw:border-red-200 tw:bg-red-50/80 tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-red-700">
                  <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:shrink-0">
                    <AlertTriangle size={12} />
                    B2B scheme has completed
                  </span>
                </div>
              )}

              <AppCard>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-4">
                  <p>
                    Please enter the discount, start date and end date for the
                    price scheme.
                  </p>
                  <p className="tw:mt-1 tw:font-medium tw:text-primary">
                    * Note: This feature is exclusively for B2B Customers.
                  </p>
                </div>

                <div className="tw:mb-4">
                  <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                    <Controller
                      control={control}
                      name="calculateOn"
                      render={({ field }) => (
                        <AppSelect
                          options={calculateOnOptions}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            handleDiscountChange();
                          }}
                          size="sm"
                          label="Calculate On"
                          isRequired
                          className="tw:mb-2"
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                    <AppInput
                      name="offerDiscount"
                      register={register}
                      type="number"
                      size="sm"
                      placeholder="Enter discount (%)"
                      isRequired
                      className="tw:mb-2"
                      label="Scheme Discount (%)"
                      onChange={handleDiscountChange}
                    />
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-3 tw:mt-2 tw:py-2 tw:px-3 tw:rounded-md tw:bg-gray-50 dark:tw:bg-gray-800/50 tw:text-xs">
                    <span className="tw:text-gray-500 dark:tw:text-gray-400">
                      Scheme price:
                    </span>
                    <DisplayPrice
                      price={offerPrice}
                      uom={deal?.selectedStockUom}
                      className="tw:font-semibold tw:text-primary"
                    />

                    <span className="tw:text-gray-300 dark:tw:text-gray-600">
                      |
                    </span>
                    <span className="tw:text-gray-500 dark:tw:text-gray-400">
                      Profit:
                    </span>
                    <Amount
                      value={profit}
                      decimalPlaces={2}
                      className={clsx("tw:font-semibold", {
                        "tw:text-green-600": profit >= 0,
                        "tw:text-red-600": profit < 0,
                      })}
                    />
                  </div>
                </div>
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                  <Controller
                    control={control}
                    name="offerStartDate"
                    render={({ field }) => (
                      <AppDateInput
                        callback={handleStartDateChange(field.onChange)}
                        value={field.value || undefined}
                        size="sm"
                        placeholder="Enter start date"
                        isRequired
                        label="Scheme Start Date"
                        dateConfig={startDateConfig}
                        className="tw:mb-4"
                      />
                    )}
                  />
                  <Controller
                    name="offerEndDate"
                    control={control}
                    render={({ field }) => (
                      <AppDateInput
                        callback={field.onChange}
                        value={field.value || undefined}
                        size="sm"
                        placeholder="Enter end date"
                        isRequired
                        label="Scheme End Date"
                        dateConfig={endDateConfig as DayPickerProps}
                        className="tw:mb-4"
                      />
                    )}
                  />
                </div>
              </AppCard>
            </>
          ) : null}
        </AppModal.Content>
        {!loading && deal ? (
          <AppModal.Footer>
            <div className="tw:flex tw:justify-between tw:gap-2 tw:w-full">
              {/* remove */}
              <Rbac roles={["CONFIGS.PRICE-SCHEME-DELETE"]}>
                <AppButton
                  color="danger"
                  fill="outline"
                  onClick={handleDisable}
                  disabled={submitting}
                  isLoading={submitting}
                >
                  <EyeOff size={16} />
                  Remove
                </AppButton>
              </Rbac>

              <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full">
                <AppButton
                  color="light"
                  onClick={handleClose}
                  disabled={submitting}
                  fill="outline"
                >
                  <X size={16} />
                  Cancel
                </AppButton>

                <Rbac roles={["CONFIGS.PRICE-SCHEME-UPDATE"]}>
                  <AppButton
                    color="primary"
                    onClick={handleSave}
                    disabled={submitting}
                    isLoading={submitting}
                  >
                    <Save size={16} />
                    Save
                  </AppButton>
                </Rbac>
              </div>
            </div>
          </AppModal.Footer>
        ) : null}
      </AppModal>
      <AppAlertDialog
        show={appAlert?.show}
        title={appAlert?.title}
        description={appAlert?.message}
        onConfirm={alertSuccessCb}
        onCancel={alertCancelCb}
      />
    </>
  );
};

export default PriceSchemeModal;
