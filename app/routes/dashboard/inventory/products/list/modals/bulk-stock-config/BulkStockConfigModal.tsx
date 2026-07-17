import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import AppProgress from "~/components/core/progress/AppProgress";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import CommonService from "~/services/CommonService";
import { debounce } from "lodash";

interface StockFormData {
  stockQuantity: number | undefined;
}

interface BulkStockConfigModalProps {
  show: boolean;
  callback: (action: { action: string; data?: any }) => void;
  products?: any[];
}

const BulkStockConfigModal = ({
  show,
  callback,
  products: propProducts = [],
}: BulkStockConfigModalProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [products, setProducts] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processingResults, setProcessingResults] = useState<{
    success: any[];
    errors: any[];
  }>({ success: [], errors: [] });
  const [processingCompleted, setProcessingCompleted] = useState(false);
  const [showFailedProducts, setShowFailedProducts] = useState(false);
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [isCalculatingCommission, setIsCalculatingCommission] = useState(false);

  const { register, handleSubmit, setValue, getValues, reset, control } =
    useForm<StockFormData>({
      defaultValues: {
        stockQuantity: undefined,
      },
    });

  const watchedStockQuantity = useWatch({
    control,
    name: "stockQuantity",
  });

  // Debounced commission calculation function
  const calculateCommissionDebounced = useCallback(
    debounce(async (stockQuantity: number) => {
      if (!stockQuantity || stockQuantity <= 0 || products.length === 0) {
        setCommissionPercentage(0);
        setIsCalculatingCommission(false);
        return;
      }

      setIsCalculatingCommission(true);
      try {
        // Prepare deals for commission calculation
        const deals = products
          .filter((product) => product._id && product.purchasePrice)
          .map((product) => ({
            id: product._id,
            qty: stockQuantity,
            price: product.purchasePrice || 0,
          }));

        if (deals.length > 0) {
          const commissionResult =
            await PurchaseOrderService.calculateCommissionValue(deals);
          setCommissionPercentage(commissionResult.commissionPercentage || 0);
        } else {
          setCommissionPercentage(0);
        }
      } catch (error) {
        console.error("Error calculating commission:", error);
        setCommissionPercentage(0);
      } finally {
        setIsCalculatingCommission(false);
      }
    }, 500), // 500ms debounce delay
    [products]
  );

  // Watch for changes in stock quantity to trigger commission calculation
  useEffect(() => {
    if (watchedStockQuantity && watchedStockQuantity > 0) {
      calculateCommissionDebounced(watchedStockQuantity);
    } else {
      setCommissionPercentage(0);
      setIsCalculatingCommission(false);
    }
  }, [watchedStockQuantity, calculateCommissionDebounced]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      calculateCommissionDebounced.cancel();
    };
  }, [calculateCommissionDebounced]);

  // Reset modal state when opened
  useEffect(() => {
    if (show) {
      setIsProcessing(false);
      setProcessingProgress(0);
      setShowConfirmDialog(false);
      setProcessingResults({ success: [], errors: [] });
      setProcessingCompleted(false);
      setShowFailedProducts(false);
      setCommissionPercentage(0);
      setIsCalculatingCommission(false);
      setValue("stockQuantity", undefined);
    }
  }, [show, setValue]);

  // Initialize products with data from props
  useEffect(() => {
    if (propProducts.length > 0) {
      setProducts(propProducts);
    } else {
      setProducts([]);
    }
  }, [propProducts]);

  const handleClose = () => {
    if (isProcessing) {
      appToast.show({
        msg: "Please wait for the processing to complete before closing the modal.",
        color: "warning",
      });
      return;
    }
    callback({ action: "close" });
  };

  const handleApplyClick = () => {
    const stockValue = getValues("stockQuantity");

    // Custom validation
    if (stockValue === undefined || stockValue === null) {
      appToast.show({
        msg: "Please enter a valid stock quantity",
        color: "danger",
      });
      return;
    }

    if (stockValue <= 0) {
      appToast.show({
        msg: "Stock quantity must be greater than 0",
        color: "danger",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmApply = async () => {
    setShowConfirmDialog(false);
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingResults({ success: [], errors: [] });

    const totalProducts = products.length;
    const stockQuantity = getValues("stockQuantity");

    // This should not happen due to validation, but just in case
    if (stockQuantity === undefined || stockQuantity === null) {
      appToast.show({
        msg: "Please enter a valid stock quantity",
        color: "danger",
      });
      setIsProcessing(false);
      return;
    }

    try {
      // Prepare bulk payload for all products
      const productList = products.map((product) => ({
        dealId: product._id,
        dealName: product.name,
        dealRefId: product.id,
        qty: stockQuantity,
        mrp: product.mrp || 0,
        purchasePrice: product.purchasePrice || 0,
        remarks: `Bulk stock update - ${stockQuantity} units added`,
      }));

      const payload = {
        productList,
      };

      // Update progress to show processing
      setProcessingProgress(50);

      // Make single bulk API call
      const response = await SellerCatalogService.addStocksInventory(payload);

      // Update progress to show completion
      setProcessingProgress(100);

      if (response?.statusCode && response.statusCode === 200) {
        // All products processed successfully
        setProcessingResults({
          success: products.map((product) => ({ product, response })),
          errors: [],
        });

        appToast.show({
          msg: `Successfully updated stock for all ${totalProducts} products.`,
          color: "success",
        });
      } else {
        // All products failed
        setProcessingResults({
          success: [],
          errors: products.map((product) => ({
            product,
            error: response?.data?.message || "Unknown error",
          })),
        });

        appToast.show({
          msg: `Failed to update stock for all ${totalProducts} products.`,
          color: "danger",
        });
      }
    } catch (error: any) {
      // All products failed due to API error
      setProcessingResults({
        success: [],
        errors: products.map((product) => ({
          product,
          error: error.message || "API call failed",
        })),
      });

      appToast.show({
        msg: "An unexpected error occurred during processing.",
        color: "danger",
      });
    } finally {
      setIsProcessing(false);
      setProcessingCompleted(true);
    }
  };

  const handleCancelApply = () => {
    setShowConfirmDialog(false);
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setValue("stockQuantity", undefined);
      return;
    }
    const num = Number(value);
    if (isNaN(num)) return;

    // Round off decimal values
    const roundedNum = Math.round(num);

    // Prevent entering 0 or negative values
    if (roundedNum <= 0) {
      setValue("stockQuantity", undefined);
      return;
    }

    setValue("stockQuantity", roundedNum);
  };

  return (
    <>
      <AppModal show={show} callback={callback} backdropDismiss={false}>
        <AppModal.Title
          onClose={isProcessing ? () => {} : handleClose}
          noShadow={true}
        >
          {t("bulkStockConfig")} - {t("addStock")}
        </AppModal.Title>
        <AppModal.Content className="modal-bg">
          {/* Info Note */}
          <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded tw:px-2 tw:py-1 tw:mb-3 tw:mt-4">
            <div className="tw:flex tw:items-center tw:gap-1">
              <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-500 tw:rounded-full"></div>
              <span className="tw:text-xs tw:text-blue-700">
                Note: The stock quantity will be added to all {products.length}{" "}
                selected products.
                {isProcessing &&
                  " Please do not close this modal during processing."}
              </span>
            </div>
          </div>

          {/* Stock Input Block */}
          {!processingCompleted && (
            <AppCard className="tw:mb-4">
              <div className="tw:mb-3">
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                  <Package className="tw:w-4 tw:h-4" />
                  <span className="tw:font-semibold">{t("addStock")}</span>
                </div>

                <form
                  onSubmit={handleSubmit(handleApplyClick)}
                  className="tw:flex tw:items-end tw:gap-3"
                >
                  <div className="tw:flex-1">
                    <AppInput
                      name="stockQuantity"
                      label={t("stockQuantity")}
                      type="number"
                      placeholder={t("enterStockQuantity")}
                      register={register}
                      onChange={handleStockChange}
                      disabled={isProcessing}
                    />
                  </div>
                  <AppButton
                    type="submit"
                    className="tw:flex tw:items-center tw:gap-2"
                    disabled={isProcessing}
                  >
                    <TrendingUp className="tw:w-4 tw:h-4" />
                    {t("applyStock")}
                  </AppButton>
                </form>

                {/* Commission Display - Compact Format */}
                {watchedStockQuantity &&
                  watchedStockQuantity > 0 &&
                  commissionPercentage > 0 && (
                    <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-gray-200">
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        <span>
                          {CommonService.roundedByDecimalPlace(
                            commissionPercentage,
                            2
                          )}
                          % Commission will be charged
                        </span>
                        {isCalculatingCommission && (
                          <AppSpinner className="tw:w-3 tw:h-3 tw:inline-block" />
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </AppCard>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <AppCard className="tw:mb-4">
              <div className="tw:mb-3">
                <div className="tw:font-semibold tw:mb-2">
                  {t("processingUpdates")}...
                </div>
                <div className="tw:text-sm tw:text-gray-600 tw:mb-3">
                  {t("updatingStockFor")} {products.length} {t("products")}.{" "}
                  {t("pleaseDoNotCloseModal")}.
                </div>
                <AppProgress
                  value={processingProgress}
                  color="primary"
                  className="tw:h-2"
                />
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {Math.round(processingProgress)}% {t("complete")}
                </div>
              </div>
            </AppCard>
          )}

          {/* Results Summary */}
          {processingCompleted && (
            <AppCard className="tw:mb-4">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                <div className="tw:w-2 tw:h-2 tw:bg-green-500 tw:rounded-full"></div>
                <span className="tw:font-semibold tw:text-gray-800">
                  {t("processingComplete")}
                </span>
              </div>

              <div className="tw:flex tw:items-center tw:justify-center tw:gap-8 tw:py-4">
                <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:bg-green-50 tw:rounded-lg tw:border tw:border-green-200">
                  <CheckCircle className="tw:w-5 tw:h-5 tw:text-green-600" />
                  <div className="tw:text-center">
                    <div className="tw:text-xl tw:font-bold tw:text-green-700">
                      {processingResults.success.length}
                    </div>
                    <div className="tw:text-xs tw:text-green-600 tw:font-medium">
                      {t("successful")}
                    </div>
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:bg-red-50 tw:rounded-lg tw:border tw:border-red-200">
                  <XCircle className="tw:w-5 tw:h-5 tw:text-red-600" />
                  <div className="tw:text-center">
                    <div className="tw:text-xl tw:font-bold tw:text-red-700">
                      {processingResults.errors.length}
                    </div>
                    <div className="tw:text-xs tw:text-red-600 tw:font-medium">
                      {t("failed")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw:text-center tw:text-xs tw:text-gray-500 tw:mt-2">
                {t("total")}: {products.length} {t("productsProcessed")}
              </div>

              {/* Failed Products List - Only show if there are errors */}
              {processingResults.errors.length > 0 && (
                <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-gray-200">
                  <button
                    onClick={() => setShowFailedProducts(!showFailedProducts)}
                    className="tw:flex tw:items-center tw:gap-1.5 tw:w-full tw:text-left tw:hover:bg-gray-50 tw:rounded tw:px-2 tw:py-1.5 tw:transition-colors"
                  >
                    {showFailedProducts ? (
                      <ChevronDown className="tw:w-3.5 tw:h-3.5 tw:text-gray-500" />
                    ) : (
                      <ChevronRight className="tw:w-3.5 tw:h-3.5 tw:text-gray-500" />
                    )}
                    <AlertTriangle className="tw:w-3.5 tw:h-3.5 tw:text-red-500" />
                    <span className="tw:font-medium tw:text-gray-700 tw:text-xs">
                      {t("viewFailedProducts")} (
                      {processingResults.errors.length})
                    </span>
                  </button>

                  {showFailedProducts && (
                    <div className="tw:mt-2 tw:max-h-48 tw:overflow-y-auto">
                      <div className="tw:space-y-1.5">
                        {processingResults.errors.map((errorItem, index) => (
                          <div
                            key={index}
                            className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded tw:p-2"
                          >
                            <div className="tw:flex tw:items-start tw:gap-2">
                              <div className="tw:flex-shrink-0 tw:mt-0.5">
                                <XCircle className="tw:w-3.5 tw:h-3.5 tw:text-red-500" />
                              </div>
                              <div className="tw:flex-1 tw:min-w-0">
                                <div className="tw:font-medium tw:text-gray-900 tw:text-xs tw:truncate">
                                  {errorItem.product.name}
                                </div>
                                <div className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
                                  ID: {errorItem.product.id}
                                </div>
                                <div className="tw:text-xs tw:text-red-600 tw:mt-0.5 tw:font-medium">
                                  {errorItem.error}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AppCard>
          )}

          {/* Footer with Done Button - Only shown when summary is displayed */}
          {processingCompleted && (
            <div className="tw:flex tw:justify-end tw:pt-4 tw:border-t tw:border-gray-200">
              <AppButton
                onClick={handleClose}
                className="tw:px-6 tw:py-2 tw:bg-blue-600 tw:hover:bg-blue-700 tw:text-white tw:rounded-md tw:font-medium tw:transition-colors"
              >
                {t("done")}
              </AppButton>
            </div>
          )}
        </AppModal.Content>
      </AppModal>

      {/* Confirmation Dialog */}
      <AppAlertDialog
        show={showConfirmDialog}
        title={t("confirmBulkUpdate")}
        description={`${t("areYouSureUpdateStock")} ${products.length} ${t(
          "products"
        )}? ${t("thisActionCannotBeUndone")}.`}
        onConfirm={handleConfirmApply}
        onCancel={handleCancelApply}
        type="confirm"
        okText={t("yesUpdateAll")}
        cancelText={t("cancel")}
      />
    </>
  );
};

export default BulkStockConfigModal;
