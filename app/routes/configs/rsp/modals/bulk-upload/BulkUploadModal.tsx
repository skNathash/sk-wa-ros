import { produce } from "immer";
import {
  CheckCircle,
  Percent,
  TrendingUp,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import AppProgress from "~/components/core/progress/AppProgress";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";

interface DiscountFormData {
  discountPercentage: number | undefined;
}

interface BulkUploadModalProps {
  show: boolean;
  callback: (action: { action: string; data?: any }) => void;
  type: string;
  products?: any[];
}

// Profit calculation functions
interface ProfitCalculationResult {
  profitValue: number;
  profitPercentage: number;
  finalPrice: number;
  isProfitable: boolean;
}

/**
 * Calculate profit value and percentage based on final price and purchase price
 * Profit = Selling Price - Purchase Price (can be negative for losses)
 */
const calculateProfit = (
  finalPrice: number,
  purchasePrice: number
): ProfitCalculationResult => {
  const profitValue = finalPrice - purchasePrice;
  const profitPercentage =
    purchasePrice > 0 ? (profitValue / purchasePrice) * 100 : 0;

  return {
    profitValue,
    profitPercentage,
    finalPrice,
    isProfitable: profitValue > 0,
  };
};

/**
 * Calculate final price after applying discount percentage to MRP
 */
const calculateFinalPriceAfterDiscount = (
  mrp: number,
  discountPercentage: number
): number => {
  return mrp - (mrp * discountPercentage) / 100;
};

/**
 * Calculate profit for a product with updated pricing
 */
const calculateProductProfit = (
  product: any,
  updatedPrice: number,
  type: string
): ProfitCalculationResult => {
  const purchasePrice = product.basePrice;
  return calculateProfit(updatedPrice, purchasePrice);
};

const BulkUploadModal = ({
  show,
  callback,
  type,
  products: propProducts = [],
}: BulkUploadModalProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [products, setProducts] = useState<any[]>([]);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processingResults, setProcessingResults] = useState<{
    success: any[];
    errors: any[];
  }>({ success: [], errors: [] });
  const [processingCompleted, setProcessingCompleted] = useState(false);
  const [showFailedProducts, setShowFailedProducts] = useState(false);

  const { register, handleSubmit, setValue, getValues, control } =
    useForm<DiscountFormData>({
      defaultValues: {
        discountPercentage: 0,
      },
    });

  // Watch the discount value to conditionally show updated price block
  const discountValue = useWatch({
    control,
    name: "discountPercentage",
    defaultValue: 0,
  });

  // Reset modal state when opened
  useEffect(() => {
    if (show) {
      setDiscountApplied(false);
      setIsProcessing(false);
      setProcessingProgress(0);
      setShowConfirmDialog(false);
      setProcessingResults({ success: [], errors: [] });
      setProcessingCompleted(false);
      setShowFailedProducts(false);
      setValue("discountPercentage", 0);
    }
  }, [show, setValue]);

  // Initialize products with data from props and calculate initial profit
  useEffect(() => {
    if (propProducts.length > 0) {
      setProducts(
        propProducts.map((product) => {
          const purchasePrice =
            type === "network" ? product.basePrice : product.purchasePrice;
          const currentPrice =
            type === "network" ? product.b2bPrice : product.b2cPrice;
          const profitCalculation = calculateProductProfit(
            product,
            currentPrice,
            type
          );

          return {
            ...product,
            _purchasePrice: purchasePrice,
            profit: profitCalculation.profitValue,
            profitPerc: profitCalculation.profitPercentage,
          };
        })
      );
    } else {
      setProducts([]);
    }
  }, [propProducts, type]);

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

  const applyDiscount = () => {
    setProducts(
      produce((draft) => {
        draft.forEach((product) => {
          const mrp = product.mrp;
          const discountPercentage = getValues("discountPercentage") || 0;
          const updatedPrice = calculateFinalPriceAfterDiscount(
            mrp,
            discountPercentage
          );
          const profitCalculation = calculateProductProfit(
            product,
            updatedPrice,
            type
          );

          product.updatedPrice = updatedPrice;
          product.profit = profitCalculation.profitValue;
          product.profitPerc = profitCalculation.profitPercentage;
        });
      })
    );
    // Mark that discount has been applied
    setDiscountApplied(true);
  };

  const handleApplyClick = () => {
    const discountValue = getValues("discountPercentage");

    // Custom validation
    if (discountValue === undefined || discountValue === null) {
      appToast.show({
        msg: "Please enter a valid discount percentage",
        color: "danger",
      });
      return;
    }

    // For B2C (customer), cannot be negative
    if (type === "customer" && discountValue < 0) {
      appToast.show({
        msg: "Discount percentage cannot be negative for B2C pricing",
        color: "danger",
      });
      return;
    }

    // Cannot go more than 100
    if (discountValue > 100) {
      appToast.show({
        msg: "Discount percentage cannot be more than 100%",
        color: "danger",
      });
      return;
    }

    // First apply the discount
    applyDiscount();
    // Then show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmApply = async () => {
    setShowConfirmDialog(false);
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingResults({ success: [], errors: [] });
    // Filter out fixed-price products from processing
    const productsToProcess = products;
    const totalProducts = productsToProcess.length;
    let processedCount = 0;
    const successResults: any[] = [];
    const errorResults: any[] = [];

    try {
      if (totalProducts === 0) {
        appToast.show({
          msg: "No eligible products to update. Fixed-price products are ignored.",
          color: "warning",
        });
      }

      for (const product of productsToProcess) {
        try {
          const payload = {
            applicableFor: type === "network" ? "Network" : "Customer",
            configOnType: "Deal",
            discount: getValues("discountPercentage") || 0,
            franchiseId: AuthService.getLoggedInUserId(),
            id: product._id,
            isFixedPrice: false,
            fixedPrice: 0,
          };

          const response = await PosService.createRspConfig(payload);

          if (response.statusCode === 200) {
            successResults.push({ product, response });
          } else {
            errorResults.push({
              product,
              error: response.data?.message || "Unknown error",
            });
          }
        } catch (error: any) {
          errorResults.push({
            product,
            error: error.message || "API call failed",
          });
        }

        processedCount++;
        const progress =
          totalProducts > 0 ? (processedCount / totalProducts) * 100 : 100;
        setProcessingProgress(progress);
      }

      setProcessingResults({ success: successResults, errors: errorResults });

      // Show final results
      if (errorResults.length === 0) {
        appToast.show({
          msg: `Successfully updated pricing for all ${totalProducts} products.`,
          color: "success",
        });
      } else if (successResults.length === 0) {
        appToast.show({
          msg: `Failed to update pricing for all ${totalProducts} products.`,
          color: "danger",
        });
      } else {
        appToast.show({
          msg: `Updated ${successResults.length} products successfully. ${errorResults.length} products failed.`,
          color: "warning",
        });
      }
    } catch (error: any) {
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

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setValue("discountPercentage", undefined);
      // Reset discount applied state when input is cleared
      setDiscountApplied(false);
      return;
    }
    const num = Number(value);
    if (isNaN(num)) return;
    setValue("discountPercentage", num);

    if (num > 100) {
      setValue("discountPercentage", 100);
      return;
    }

    if (num < 0) {
      setValue("discountPercentage", undefined);
      // Reset discount applied state when input is invalid
      setDiscountApplied(false);
      return;
    }
  };

  return (
    <>
      <AppModal show={show} callback={callback} backdropDismiss={false}>
        <AppModal.Title
          onClose={isProcessing ? () => {} : handleClose}
          noShadow={true}
        >
          {t("bulkUpload")} -{" "}
          {type === "network" ? t("b2bPricing") : t("b2cPricing")}
        </AppModal.Title>
        <AppModal.Content className="modal-bg">
          {/* Info Note */}
          <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded tw:px-2 tw:py-1 tw:mb-3 tw:mt-4">
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-500 tw:rounded-full" />
              <div>
                <div className="tw:text-[12px] tw:text-blue-700 tw:font-medium">
                  {type === "network" ? "Margin Update" : "Discount Update"}
                </div>
                <div className="tw:text-[11px] tw:text-blue-600">
                  This will update pricing for{" "}
                  <span className="tw:font-semibold">
                    {products.length} selected products
                  </span>
                  {isProcessing &&
                    " Please do not close this modal during processing."}
                </div>
              </div>
            </div>
          </div>

          {/* Discount Input Block */}
          {!processingCompleted && (
            <AppCard className="tw:mb-4">
              <div className="tw:mb-3">
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                  <Percent className="tw:w-4 tw:h-4" />
                  <span className="tw:font-semibold">
                    Apply {type === "network" ? "Margin" : "Discount"}
                  </span>
                </div>

                <form
                  onSubmit={handleSubmit(handleApplyClick)}
                  className="tw:flex tw:items-end tw:gap-3"
                >
                  <div className="tw:flex-1">
                    <AppInput
                      name="discountPercentage"
                      label={`${
                        type === "network" ? "Margin" : "Discount"
                      } Percentage`}
                      type="number"
                      step="any"
                      placeholder={`Enter ${
                        type === "network" ? "margin" : "discount"
                      } percentage`}
                      register={register}
                      onChange={handleDiscountChange}
                      rightIcon={<span className="tw:text-gray-500">%</span>}
                      disabled={isProcessing}
                    />
                  </div>
                  <AppButton
                    type="submit"
                    className="tw:flex tw:items-center tw:gap-2"
                    disabled={isProcessing}
                  >
                    <TrendingUp className="tw:w-4 tw:h-4" />
                    Apply {type === "network" ? "Margin" : "Discount"}
                  </AppButton>
                </form>
                {/* Small helper note explaining how percentage is applied */}
                <div className="tw:mt-1">
                  <span className="tw:text-xs tw:text-slate-700">
                    {type === "network"
                      ? "Discount percentage will be applied on MRP"
                      : "Discount percentage will be applied on MRP"}
                  </span>
                </div>
              </div>
            </AppCard>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <AppCard className="tw:mb-4">
              <div className="tw:mb-3">
                <div className="tw:font-semibold tw:mb-2">
                  Processing Updates...
                </div>
                <div className="tw:text-sm tw:text-gray-600 tw:mb-3">
                  Updating pricing for {products.length} products. Please do not
                  close this modal.
                </div>
                <AppProgress
                  value={processingProgress}
                  color="primary"
                  className="tw:h-2"
                />
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {Math.round(processingProgress)}% complete
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
                  Processing Complete
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
                      Successful
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
                      Failed
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw:text-center tw:text-xs tw:text-gray-500 tw:mt-2">
                Total: {products.length} products processed
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
                      View Failed Products ({processingResults.errors.length})
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
                Done
              </AppButton>
            </div>
          )}
        </AppModal.Content>
      </AppModal>

      {/* Confirmation Dialog */}
      <AppAlertDialog
        show={showConfirmDialog}
        title="Confirm Bulk Update"
        description={`Are you sure you want to update pricing for ${products.length} products? This action cannot be undone.`}
        onConfirm={handleConfirmApply}
        onCancel={handleCancelApply}
        type="confirm"
        okText="Yes, Update All"
        cancelText="Cancel"
      />
    </>
  );
};

export default BulkUploadModal;
