import { add, format, sub } from "date-fns";
import { debounce } from "lodash";
import { Info, PlusCircle, Store } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppButton from "~/components/core/button/AppButton";
import AuthService from "~/services/AuthService";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import UomPriceService from "~/services/UomPriceService";
import type { TabItem } from "~/types/CommonTypes";
import BarcodesList from "./components/BarcodesList";
import PlatformFeeInfo from "../../components/PlatformFeeInfo";
import PlatformFeeRequiredBlock from "~/shared/accounts/platform-fee/components/PlatformFeeRequiredBlock";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";

// Delay before re-fetching deal details so the backend has time to process
// the newly added stock.
const FETCH_DEAL_DELAY_MS = 3000;

interface InventoryAddStockFormData {
  quantity: number | "";
  purchasePrice: number | "";
  mrp: number | "";
  barcode?: string;
  mfgDate?: Date;
  expiryDate?: Date;
  notes: string;
}

interface InventoryAddStockModalProps {
  show: boolean;
  callback: (params: {
    action: string;
    data?: InventoryAddStockFormData;
    product?: any;
  }) => void;
  productId?: string;
  productName?: string;
  dealRefId?: string;
  mrp?: number;
  feature?: string;
  importId?: string;
  qty?: number;
  purchasePrice?: number;
  barcodes?: Array<string>;
  currentStock?: number;
  selectedStockUom?: string;
  showCommission?: boolean;
}

const InventoryAddStockModal: React.FC<InventoryAddStockModalProps> = ({
  show,
  callback,
  productId,
  productName,
  dealRefId,
  mrp,
  feature = "inventory",
  importId,
  qty,
  purchasePrice,
  barcodes,
  currentStock,
  selectedStockUom,
  showCommission = true,
}) => {
  const { t } = useTranslation(["common"]);
  const { show: showToast } = useAppToast();
  const appNav = useAppNav();

  const loggedInUser = AuthService.getLoggedInUser();
  const baseVendorName = loggedInUser?.name || "You";

  // State to hold the fetched stock UOM, falling back to prop value if provided
  const [internalStockUom, setInternalStockUom] = useState<string | undefined>(
    selectedStockUom,
  );

  useEffect(() => {
    setInternalStockUom(selectedStockUom);
  }, [selectedStockUom]);

  useEffect(() => {
    if (show && productId && !selectedStockUom) {
      const fetchProductUom = async () => {
        try {
          const productDetails = await SellerCatalogService.getProducts({
            filter: { dealId: productId },
          });
          const product = SellerCatalogService.formatProductResponse(
            productDetails.data?.data || [],
          )?.[0];
          if (product?.selectedStockUom) {
            setInternalStockUom(product.selectedStockUom);
          }
        } catch (error) {
          console.error("Error fetching product UOM in modal:", error);
        }
      };
      fetchProductUom();
    }
  }, [show, productId, selectedStockUom]);

  // For small UOMs (gm/ml) the user enters quantity in the display unit
  // (kg/ltr) while the API expects the base unit (gm/ml).
  const isSmallUom = UomPriceService.isSmallUom(internalStockUom);
  const quantityUom = isSmallUom
    ? UomPriceService.getDisplayUom(internalStockUom)
    : internalStockUom;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InventoryAddStockFormData>({
    defaultValues: {
      quantity: "",
      purchasePrice: "",
      mrp: "",
      barcode: "",
      mfgDate: undefined,
      expiryDate: undefined,
      notes: "",
    },
  });

  const [isSubmitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [commissionInfo, setCommissionInfo] = useState({
    commissionAmount: 0,
    commissionPercentage: 0,
    planName: "",
    planType: "",
    typeOfPlan: "",
    availableAmount: 0,
    hasSufficientBalance: true,
    isCalculating: false,
  });
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  // Watch form fields using useWatch with array destructuring
  const [watchedQuantity, watchedPurchasePrice, watchedMrp] = useWatch({
    control,
    name: ["quantity", "purchasePrice", "mrp"],
  });

  useEffect(() => {
    if (typeof watchedQuantity === "number" && watchedQuantity < 0) {
      setValue("quantity", 0);
    }
  }, [watchedQuantity, setValue]);

  // Debounced commission calculation function
  const calculateCommissionDebounced = useCallback(
    debounce(async (quantity: number, purchasePrice: number, mrp?: number) => {
      if (!productId || quantity <= 0 || purchasePrice <= 0) {
        setCommissionInfo((prev) => ({
          ...prev,
          commissionAmount: 0,
          isCalculating: false,
        }));
        return;
      }

      setCommissionInfo((prev) => ({ ...prev, isCalculating: true }));
      try {
        const payload: any = {
          deals: [
            {
              dealId: productId,
              quantity: quantity,
              purchasePrice: purchasePrice,
              mrp: mrp,
            },
          ],
        };

        const commissionResult =
          await FranchiseService.getChargeByDeal(payload);

        setCommissionInfo({
          commissionAmount: commissionResult.commissionAmount || 0,
          commissionPercentage: commissionResult.commissionPercentage || 0,
          planName: commissionResult.planName || "",
          planType: commissionResult.planType || "",
          typeOfPlan: commissionResult.typeOfPlan || "",
          availableAmount: commissionResult.availableAmount || 0,
          hasSufficientBalance: commissionResult.hasSufficientBalance ?? true,
          isCalculating: false,
        });
      } catch (error) {
        console.error("Error calculating commission:", error);
        setCommissionInfo((prev) => ({
          ...prev,
          commissionAmount: 0,
          commissionPercentage: 0,
          hasSufficientBalance: true,
          isCalculating: false,
        }));
      }
    }, 500), // 500ms debounce delay
    [productId],
  );

  // Watch for changes in quantity and purchase price to trigger commission calculation
  useEffect(() => {
    if (watchedQuantity > 0 && watchedPurchasePrice > 0) {
      calculateCommissionDebounced(
        isSmallUom
          ? UomPriceService.toApiQuantity(watchedQuantity, internalStockUom)
          : watchedQuantity,
        isSmallUom
          ? UomPriceService.toApiPrice(watchedPurchasePrice, internalStockUom)
          : watchedPurchasePrice,
        isSmallUom
          ? UomPriceService.toApiPrice(watchedMrp, internalStockUom)
          : watchedMrp,
      );
    } else {
      setCommissionInfo((prev) => ({
        ...prev,
        commissionAmount: 0,
        commissionPercentage: 0,
        hasSufficientBalance: true,
        isCalculating: false,
      }));
    }
  }, [
    watchedQuantity,
    watchedPurchasePrice,
    watchedMrp,
    calculateCommissionDebounced,
    isSmallUom,
    internalStockUom,
  ]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      calculateCommissionDebounced.cancel();
    };
  }, [calculateCommissionDebounced]);

  // When modal opens, reset active tab and prefill MRP (if provided)
  useEffect(() => {
    if (show) {
      fetchPlan();
      setActiveTab("basic");
      reset();
      setCommissionInfo({
        commissionAmount: 0,
        commissionPercentage: 0,
        planName: "",
        planType: "",
        typeOfPlan: "",
        availableAmount: 0,
        hasSufficientBalance: true,
        isCalculating: false,
      });
      if (typeof mrp === "number" && mrp > 0) {
        setValue(
          "mrp",
          isSmallUom
            ? UomPriceService.toDisplayPrice(mrp, internalStockUom)
            : mrp,
        );
      }
      if (typeof qty === "number" && qty > 0) {
        setValue(
          "quantity",
          isSmallUom
            ? UomPriceService.toDisplayQuantity(qty, internalStockUom)
            : qty,
        );
      }
      if (typeof purchasePrice === "number" && purchasePrice > 0) {
        setValue(
          "purchasePrice",
          isSmallUom
            ? UomPriceService.toDisplayPrice(purchasePrice, internalStockUom)
            : purchasePrice,
        );
      }
    }
  }, [show, mrp, qty, purchasePrice, setValue, isSmallUom, internalStockUom]);

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const activePlan = await FranchiseService.getActivePlan();
      setHasPlan(activePlan?.isPlanActive || false);
    } catch (error) {
      console.error("Error fetching plan:", error);
      setHasPlan(false);
    } finally {
      setPlanLoading(false);
    }
  };

  // Tab configuration
  const tabs: TabItem[] = [
    {
      name: "Basic",
      key: "basic",
      langKey: "basic",
    },
    {
      name: "Dates",
      key: "variation",
      langKey: "variation",
    },
    {
      name: "Barcode",
      key: "barcode",
      langKey: "barcode",
    },
  ];

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  // Date configurations
  const mfgDateConfig: DayPickerProps = {
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

  // Validation function
  const validateForm = (
    data: InventoryAddStockFormData,
  ): { msg: string } | null => {
    let msg = "";
    if (!data.quantity || data.quantity <= 0) {
      msg = "Quantity must be greater than 0";
    } else if (!data.purchasePrice || data.purchasePrice <= 0) {
      msg = "Purchase price must be greater than 0";
    } else if (!data.mrp || data.mrp <= 0) {
      msg = "MRP must be greater than 0";
    } else if (data.purchasePrice > data.mrp) {
      msg = "Purchase price cannot be greater than MRP";
    } else if (
      data.mfgDate &&
      data.expiryDate &&
      data.mfgDate > data.expiryDate
    ) {
      msg = "Manufacturing date cannot be after expiry date";
    } else if (
      commissionInfo.commissionAmount > 0 &&
      !commissionInfo.hasSufficientBalance
    ) {
      msg = "Insufficient plan balance. Please top up your account to proceed.";
    }
    return msg ? { msg } : null;
  };

  const handleFormSubmit = async (data: InventoryAddStockFormData) => {
    try {
      // Validate form data
      const validationError = validateForm(data);
      if (validationError) {
        showToast({
          msg: validationError.msg,
          color: "error",
        });
        return;
      }

      // Proceed with submission directly
      await submitStock(data);
    } catch (error: any) {
      showToast({
        msg: error?.data?.message || "Failed to add stock. Please try again.",
        color: "danger",
      });
    }
  };

  const submitStock = async (data: InventoryAddStockFormData) => {
    setSubmitting(true);
    try {
      // Prepare payload for SellerCatalogService.addStocksInventory
      // Quantity & prices are entered in kg/ltr for small UOMs; API expects gm/ml.
      const apiQuantity = isSmallUom
        ? UomPriceService.toApiQuantity(data.quantity, internalStockUom)
        : data.quantity;
      const apiMrp = isSmallUom
        ? UomPriceService.toApiPrice(data.mrp, internalStockUom)
        : data.mrp;
      const apiPurchasePrice = isSmallUom
        ? UomPriceService.toApiPrice(data.purchasePrice, internalStockUom)
        : data.purchasePrice;

      const productData: any = {
        dealId: productId,
        dealName: productName,
        dealRefId: dealRefId,
        qty: apiQuantity,
        mrp: apiMrp,
        barcode: data.barcode,
        purchasePrice: apiPurchasePrice,
        manufactureDate: data.mfgDate
          ? format(data.mfgDate, "yyyy-MM-dd")
          : undefined,
        expiry: data.expiryDate
          ? format(data.expiryDate, "yyyy-MM-dd")
          : undefined,
        remarks: data.notes,
      };

      // Add importId only when feature is subscribe
      if (feature === "subscribe") {
        productData.importId = importId;
      }

      const payload = {
        productList: [productData],
      };

      let response;
      if (feature === "subscribe") {
        response =
          await InventorySubscribeService.subscribePendingProducts(payload);
      } else {
        response = await SellerCatalogService.addStocksInventory(payload);
      }

      if (response?.statusCode && response.statusCode !== 200) {
        showToast({
          msg:
            response?.data?.message || "Failed to add stock. Please try again.",
          color: "danger",
        });
        return;
      }

      // Wait briefly so the backend can finish processing the newly added
      // stock before we re-fetch the deal details (loading stays active via
      // isSubmitting until the finally block runs).
      await new Promise((resolve) => setTimeout(resolve, FETCH_DEAL_DELAY_MS));

      // fetch product details
      const productDetails = await SellerCatalogService.getProducts({
        filter: { dealId: productId },
      });

      const product = SellerCatalogService.formatProductResponse(
        productDetails.data?.data || [],
      )?.[0];

      showToast({
        msg: "Stock added successfully",
        color: "success",
      });

      // Call the callback with submit action and send values in gm/ml for small UOMs
      callback({
        action: "submit",
        data: {
          ...data,
          quantity: apiQuantity,
          mrp: apiMrp,
          purchasePrice: apiPurchasePrice,
        },
        product: product,
      });

      reset();
    } catch (error: any) {
      showToast({
        msg: error?.data?.message || "Failed to add stock. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Cancel any pending commission calculations
    calculateCommissionDebounced.cancel();
    reset();
    callback({ action: "close" });
  };

  const handleBuyPlan = () => {
    handleCancel();
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  const handleClose = () => {
    // Cancel any pending commission calculations
    calculateCommissionDebounced.cancel();
    callback({ action: "close" });
  };

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      setValue("barcode", r.data);
    }
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="tw:md:h-[90vh]">
        <AppModal.Title onClose={handleClose}>
          <div className="tw:flex tw:items-start tw:gap-3">
            <div className="tw:flex-shrink-0 tw:self-center">
              <PlusCircle size={18} />
            </div>
            <div className="tw:flex-1">
              <h2 className="tw:text-lg tw:font-bold tw:text-gray-900 tw:sm:line-clamp-2">
                {t("addStoreStock")}
              </h2>
            </div>
          </div>
        </AppModal.Title>

        <AppModal.Content className="tw:md:max-h-[90vh]">
          {productName && (
            <div className="tw:mb-3 tw:overflow-hidden tw:rounded-md tw:border tw:border-gray-200">
              {/* Product row */}
              <div className="tw:bg-gray-50 tw:px-3 tw:py-2">
                <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
                  {t("product")}
                </div>
                <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-3 tw:gap-y-1">
                  <div className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-gray-800 tw:sm:line-clamp-1">
                    {productName}
                  </div>
                  {typeof currentStock === "number" && (
                    <div className="tw:shrink-0 tw:text-xs tw:text-gray-600">
                      {t("currentStock")}:{" "}
                      <span
                        className={`tw:font-semibold ${
                          currentStock <= 0
                            ? "tw:text-red-600"
                            : "tw:text-green-600"
                        }`}
                      >
                        {currentStock} {t("units")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Base vendor row */}
              <div className="tw:border-t tw:border-blue-100 tw:bg-blue-50 tw:px-3 tw:py-2">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Store size={14} className="tw:shrink-0 tw:text-blue-600" />
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-blue-700">
                    Base Vendor
                  </span>
                  <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                    {baseVendorName}
                  </span>
                  <span className="tw:shrink-0 tw:rounded tw:bg-blue-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-blue-700">
                    YOU
                  </span>
                </div>
                <div className="tw:mt-1 tw:flex tw:items-start tw:gap-1 tw:text-[11px] tw:leading-snug tw:text-blue-800">
                  <Info size={12} className="tw:mt-0.5 tw:shrink-0" />
                  <span>
                    A Purchase Order will be auto-created against you when this
                    stock is added.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Buy Plan Block */}
          {hasPlan === false && (
            <PlatformFeeRequiredBlock onSubscribe={handleBuyPlan} />
          )}

          {/* Tab Navigation and Form */}
          <div
            className={
              hasPlan === false ? "tw:opacity-50 tw:pointer-events-none" : ""
            }
          >
            {/* Tab Navigation */}
            <div className="tw:mb-6">
              <AppTab
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Tab Content */}
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="tw:space-y-6 tw:p-0.5"
            >
              {/* Basic Tab Content */}
              {activeTab === "basic" && (
                <>
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                    {/* Quantity */}
                    <AppInput
                      name="quantity"
                      label={
                        quantityUom
                          ? `${t("quantity")} (in ${quantityUom})`
                          : t("quantity")
                      }
                      type="number"
                      placeholder="Enter quantity"
                      register={register}
                      rules={{
                        min: {
                          value: 0,
                          message: "Quantity cannot be negative",
                        },
                      }}
                      error={errors.quantity?.message}
                      isRequired
                    />

                    {/* MRP */}
                    <div className="tw:flex tw:flex-col">
                      <AppInput
                        name="mrp"
                        label={
                          quantityUom
                            ? `${t("mrp")} (per ${quantityUom})`
                            : t("mrp")
                        }
                        type="number"
                        placeholder="Enter MRP"
                        register={register}
                        error={errors.mrp?.message}
                        isRequired
                      />
                      {isSmallUom && (
                        <div className="tw:mt-0.5 tw:text-[10px] tw:leading-tight tw:text-gray-500">
                          ={" "}
                          <Amount
                            value={UomPriceService.toApiPrice(
                              watchedMrp,
                              internalStockUom,
                            )}
                            decimalPlaces={3}
                          />{" "}
                          / {internalStockUom}
                        </div>
                      )}
                    </div>

                    {/* Purchase Price */}
                    <div className="tw:col-span-2">
                      <AppInput
                        name="purchasePrice"
                        label={
                          quantityUom
                            ? `${t("purchasePrice")} (per ${quantityUom})`
                            : t("purchasePrice")
                        }
                        type="number"
                        placeholder="Enter purchase price"
                        register={register}
                        error={errors.purchasePrice?.message}
                        isRequired
                      />
                      {isSmallUom && (
                        <div className="tw:mt-0.5 tw:text-[10px] tw:leading-tight tw:text-gray-500">
                          ={" "}
                          <Amount
                            value={UomPriceService.toApiPrice(
                              watchedPurchasePrice,
                              internalStockUom,
                            )}
                            decimalPlaces={3}
                          />{" "}
                          / {internalStockUom}
                        </div>
                      )}
                      {/* Commission Information */}
                      {showCommission &&
                        (commissionInfo.commissionAmount > 0 ||
                          commissionInfo.isCalculating) && (
                          <div className="tw:mt-1.5">
                            <PlatformFeeInfo
                              commissionAmount={commissionInfo.commissionAmount}
                              commissionPercentage={
                                commissionInfo.commissionPercentage
                              }
                              planName={commissionInfo.planName}
                              planType={commissionInfo.planType}
                              typeOfPlan={commissionInfo.typeOfPlan}
                              availableAmount={commissionInfo.availableAmount}
                              hasSufficientBalance={
                                commissionInfo.hasSufficientBalance
                              }
                              calculating={commissionInfo.isCalculating}
                              onBuyPlan={handleBuyPlan}
                            />
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Notes - In Basic Tab */}
                  <AppTextarea
                    name="notes"
                    label={t("notes")}
                    placeholder={t("enterAnyAdditionalNotes")}
                    register={register}
                    error={errors.notes?.message}
                  />
                </>
              )}

              {/* Variation Tab Content */}
              {activeTab === "variation" && (
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                  {/* Manufacturing Date */}
                  <Controller
                    name="mfgDate"
                    control={control}
                    render={({ field }) => (
                      <AppDateInput
                        label={t("manufacturingDate")}
                        callback={field.onChange}
                        value={field.value}
                        error={errors.mfgDate as any}
                        dateConfig={mfgDateConfig}
                        placeholder={t("choose")}
                        forceClose={!show}
                      />
                    )}
                  />

                  {/* Expiry Date */}
                  <Controller
                    name="expiryDate"
                    control={control}
                    render={({ field }) => (
                      <AppDateInput
                        label={t("expiryDate")}
                        callback={field.onChange}
                        value={field.value}
                        error={errors.expiryDate as any}
                        dateConfig={expiryDateConfig}
                        placeholder={t("choose")}
                        forceClose={!show}
                      />
                    )}
                  />
                </div>
              )}

              {/* Barcode Tab Content */}
              {activeTab === "barcode" && (
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                  {/* Barcode */}

                  <div className="tw:col-span-2">
                    <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
                      {t("barcode")}
                    </label>
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                      <Controller
                        name="barcode"
                        control={control}
                        render={({ field }) => (
                          <BarcodeInput
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder={t("enterBarcode")}
                            dealId={productId}
                            uom={internalStockUom}
                          />
                        )}
                      />
                      <BarcodeScan
                        callback={handleBarcodeScan}
                        className="tw:cursor-pointer"
                      />
                    </div>

                    {/* Existing list of barcodes (if provided) */}
                    {barcodes && barcodes.length > 0 && (
                      <div className="tw:mb-2 tw:w-full">
                        {/* Lazy import local component */}
                        <BarcodesList barcodes={barcodes} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:justify-end tw:gap-3">
            <AppButton
              onClick={handleCancel}
              fill="outline"
              color="secondary"
              disabled={isSubmitting || planLoading}
            >
              {t("cancel")}
            </AppButton>
            {hasPlan && (
              <AppButton
                onClick={handleSubmit(handleFormSubmit)}
                color="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting || !commissionInfo.hasSufficientBalance}
              >
                {t("submit")}
              </AppButton>
            )}
          </div>
        </AppModal.Footer>
      </AppModal>
    </>
  );
};

export default InventoryAddStockModal;
