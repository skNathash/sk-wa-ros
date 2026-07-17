import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import SellerCatalogService from "~/services/SellerCatalogService";
import PlatformFeeInfo from "../../components/PlatformFeeInfo";

interface ProductRow {
  dealId: string;
  dealName?: string;
  quantity: number;
  mrp: number;
  purchasePrice: number;
  currentStock?: number;
  requiredStock?: number;
}

interface MultipleAddStockModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  products: Array<{
    dealId: string;
    dealName?: string;
    mrp?: number;
    purchasePrice?: number;
    currentStock?: number;
    requiredStock?: number;
  }>;
}

const MultipleAddStockModal: React.FC<MultipleAddStockModalProps> = ({
  show,
  callback,
  products,
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const { show: showToast } = useAppToast();

  type FormValues = { rows: ProductRow[]; globalQty?: number };
  const { register, control, getValues, reset, setValue } = useForm<FormValues>(
    {
      defaultValues: { rows: [], globalQty: undefined },
    },
  );
  const { fields, replace } = useFieldArray({ control, name: "rows" });
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
  const [isSubmitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{
    totalQty: number;
    totalMrp: number;
  }>({ totalQty: 0, totalMrp: 0 });

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: any,
  ) => {
    const value = e.target.value;
    if (value.includes("-") || (value !== "" && parseFloat(value) < 0)) {
      setValue(name, 0);
    }
  };

  // initialize rows when modal opens
  useEffect(() => {
    if (show) {
      const init = (products || []).map((p) => ({
        dealId: p.dealId,
        dealName: p.dealName,
        quantity: 0,
        mrp: typeof p.mrp === "number" ? p.mrp : 0,
        purchasePrice:
          typeof p.purchasePrice === "number"
            ? p.purchasePrice
            : typeof p.mrp === "number"
              ? p.mrp
              : 0,
        currentStock: typeof p.currentStock === "number" ? p.currentStock : 0,
        requiredStock:
          typeof p.requiredStock === "number" ? p.requiredStock : 0,
      }));
      replace(init);
      reset({ rows: init });
      setShowSummary(false);
      setSummary({ totalQty: 0, totalMrp: 0 });
      setCommissionInfo((ci) => ({
        ...ci,
        commissionAmount: 0,
        isCalculating: false,
      }));
    }
  }, [show, products]);

  // Commission calculation will be triggered on Proceed tap
  // Clear any debounced calculation references if present

  const getRows = () => (getValues("rows") as any[]) || [];

  const hasValidDeals = getRows().some(
    (r: any) => Number(r?.quantity) > 0 && Number(r?.purchasePrice) > 0,
  );

  const handleCancel = () => {
    callback({ action: "close" });
  };

  const handleBuyPlan = () => {
    handleCancel();
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  const handleProceed = () => {
    // Validate inputs and build deals
    const rows = getRows() || [];

    // At least one deal must have quantity > 0
    const hasAnyQty = rows.some((r: any) => Number(r.quantity) > 0);
    if (!hasAnyQty) {
      showToast({
        msg: "Please enter quantity for at least one product.",
        color: "error",
      });
      return;
    }

    // No negative values allowed for quantity, mrp, purchasePrice
    const hasNegative = rows.some(
      (r: any) =>
        Number(r.quantity) < 0 ||
        Number(r.mrp) < 0 ||
        Number(r.purchasePrice) < 0,
    );
    if (hasNegative) {
      showToast({
        msg: "Negative values are not allowed for quantity, mrp or purchase price.",
        color: "error",
      });
      return;
    }

    // For rows with quantity > 0, validate purchase price and mrp
    for (const r of rows) {
      if (Number(r.quantity) > 0) {
        if (Number(r.purchasePrice) <= 0) {
          showToast({
            msg: `Purchase price for ${r.dealName || "product"} must be greater than zero.`,
            color: "error",
          });
          return;
        }
        if (Number(r.mrp) <= 0) {
          showToast({
            msg: `MRP for ${r.dealName || "product"} must be greater than zero.`,
            color: "error",
          });
          return;
        }
        if (Number(r.purchasePrice) > Number(r.mrp)) {
          showToast({
            msg: `Purchase price for ${r.dealName || "product"} cannot exceed MRP.`,
            color: "error",
          });
          return;
        }
      }
    }

    const deals = rows
      .filter((r: any) => Number(r.quantity) > 0 && Number(r.purchasePrice) > 0)
      .map((r: any) => ({
        dealId: r.dealId,
        quantity: Number(r.quantity),
        purchasePrice: Number(r.purchasePrice),
        mrp: Number(r.mrp) || 0,
      }));

    const totalQty = deals.reduce((s: number, d: any) => s + d.quantity, 0);
    const totalMrp = deals.reduce(
      (s: number, d: any) => s + d.quantity * d.purchasePrice,
      0,
    );
    setSummary({ totalQty, totalMrp });

    // fetch commission and then show summary
    fetchCommissionAndShowSummary(deals);
  };

  const applyGlobalQty = () => {
    const val = getValues("globalQty");
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      showToast({ msg: "Please enter a valid quantity.", color: "error" });
      return;
    }
    const rows = getRows() || [];
    const updated = (rows || []).map((r: any) => ({ ...r, quantity: num }));
    replace(updated);
    reset({ rows: updated, globalQty: undefined });
    showToast({
      msg: "Global quantity applied successfully.",
      color: "success",
    });
  };

  const fetchCommissionAndShowSummary = async (deals: any[]) => {
    setCommissionInfo((prev) => ({ ...prev, isCalculating: true }));
    try {
      const payload = { deals };
      const result = await FranchiseService.getChargeByDeal(payload);
      setCommissionInfo({
        commissionAmount: result.commissionAmount || 0,
        commissionPercentage: result.commissionPercentage || 0,
        planName: result.planName || "",
        planType: result.planType || "",
        typeOfPlan: result.typeOfPlan || "",
        availableAmount: result.availableAmount || 0,
        hasSufficientBalance: result.hasSufficientBalance ?? true,
        isCalculating: false,
      });
      setShowSummary(true);
    } catch (err) {
      console.error("Error calculating commission:", err);
      setCommissionInfo((prev) => ({
        ...prev,
        commissionAmount: 0,
        commissionPercentage: 0,
        hasSufficientBalance: true,
        isCalculating: false,
      }));
      showToast({
        msg: "Failed to calculate commission. Please try again.",
        color: "error",
      });
    }
  };

  const submitStocks = async () => {
    try {
      if (summary.totalQty <= 0) {
        showToast({
          msg: "Please enter quantity for at least one product.",
          color: "error",
        });
        return;
      }

      if (!commissionInfo.hasSufficientBalance) {
        showToast({
          msg: "Insufficient plan balance. Please top up.",
          color: "error",
        });
        return;
      }

      setSubmitting(true);
      const productList = (getRows() || [])
        .filter((r: any) => Number(r.quantity) > 0)
        .map((r: any) => ({
          dealId: r.dealId,
          dealName: r.dealName,
          qty: Number(r.quantity),
          mrp: Number(r.mrp),
          purchasePrice: Number(r.purchasePrice),
        }));

      const payload = { productList };
      const response = await SellerCatalogService.addStocksInventory(payload);

      if (response?.statusCode && response.statusCode !== 200) {
        showToast({
          msg: response?.data?.message || "Failed to add stock.",
          color: "danger",
        });
        return;
      }

      showToast({ msg: "Stock added successfully", color: "success" });
      callback({ action: "submit", data: { productList } });
    } catch (err: any) {
      showToast({
        msg: err?.data?.message || "Failed to add stock. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[90vh]">
      <AppModal.Title onClose={handleCancel}>
        <div className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:flex-1">
            <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
              {t("addMultipleStock")} ({products?.length || 0})
            </h2>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {!showSummary ? (
          <div className="tw:space-y-4">
            <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-3">
              <p className="tw:text-xs tw:font-medium tw:text-amber-800 tw:mb-2">
                Apply Global Quantity
              </p>
              <div className="tw:flex tw:items-end tw:gap-2 tw:mb-2">
                <div className="tw:flex-1 tw:max-w-xs">
                  <AppInput
                    name="globalQty"
                    type="number"
                    register={register}
                    onChange={(e) => handleNumberChange(e, "globalQty")}
                    inputClassName="tw:bg-white"
                  />
                </div>
                <AppButton onClick={applyGlobalQty} color="primary">
                  {t("apply")}
                </AppButton>
              </div>
              <p className="tw:text-xs tw:text-amber-700 tw:leading-tight">
                💡 {t("globalQtyNote")}
              </p>
            </div>

            <h3 className="tw:text-md tw:font-semibold tw:text-gray-800">
              Products ({fields.length})
            </h3>

            <div className="tw:space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:hover:border-gray-300 tw:hover:shadow-sm tw:transition-all"
                >
                  <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                    <div className="tw:flex-1">
                      <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                        {field.dealName || field.dealId}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                        Current: {field.currentStock || 0} | Required:{" "}
                        {field.requiredStock || 0}
                      </div>
                    </div>
                  </div>
                  <div className="tw:grid tw:grid-cols-3 tw:gap-3">
                    <div>
                      <AppInput
                        name={`rows.${idx}.quantity`}
                        label={t("quantity")}
                        type="number"
                        placeholder="0"
                        register={register}
                        onChange={(e) =>
                          handleNumberChange(e, `rows.${idx}.quantity`)
                        }
                        isRequired={true}
                      />
                    </div>
                    <div>
                      <AppInput
                        name={`rows.${idx}.mrp`}
                        label={t("mrp")}
                        type="number"
                        placeholder="0"
                        register={register}
                        onChange={(e) =>
                          handleNumberChange(e, `rows.${idx}.mrp`)
                        }
                        isRequired={true}
                      />
                    </div>
                    <div>
                      <AppInput
                        name={`rows.${idx}.purchasePrice`}
                        label={t("purchasePrice")}
                        type="number"
                        placeholder="0"
                        register={register}
                        onChange={(e) =>
                          handleNumberChange(e, `rows.${idx}.purchasePrice`)
                        }
                        isRequired={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="tw:space-y-4">
            <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4">
              <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-4">
                {t("summary")}
              </h3>
              <div className="tw:space-y-3">
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-sm tw:text-gray-600">
                    {t("totalQuantity")}
                  </span>
                  <span className="tw:text-lg tw:font-bold tw:text-gray-900">
                    {summary.totalQty} {t("units") || "units"}
                  </span>
                </div>
                <div className="tw:h-px tw:bg-gray-200"></div>
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-sm tw:text-gray-600">
                    {t("totalValue")}
                  </span>
                  <span className="tw:text-lg tw:font-bold tw:text-gray-900">
                    <Amount value={summary.totalMrp} />
                  </span>
                </div>
              </div>
            </div>
            {(commissionInfo.commissionAmount > 0 ||
              commissionInfo.isCalculating) && (
              <div>
                <PlatformFeeInfo
                  commissionAmount={commissionInfo.commissionAmount}
                  commissionPercentage={commissionInfo.commissionPercentage}
                  planName={commissionInfo.planName}
                  planType={commissionInfo.planType}
                  typeOfPlan={commissionInfo.typeOfPlan}
                  availableAmount={commissionInfo.availableAmount}
                  hasSufficientBalance={commissionInfo.hasSufficientBalance}
                  calculating={commissionInfo.isCalculating}
                  onBuyPlan={handleBuyPlan}
                />
              </div>
            )}
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
          <div>
            {showSummary && (
              <AppButton
                onClick={() => setShowSummary(false)}
                fill="outline"
                color="secondary"
                disabled={isSubmitting}
              >
                {t("back")}
              </AppButton>
            )}
          </div>
          <div className="tw:flex tw:gap-3">
            {!showSummary && (
              <AppButton
                onClick={handleCancel}
                fill="outline"
                color="secondary"
                disabled={isSubmitting}
              >
                {t("cancel")}
              </AppButton>
            )}
            {!showSummary ? (
              <AppButton
                onClick={handleProceed}
                color="primary"
                isLoading={commissionInfo.isCalculating}
              >
                {t("proceed")}
              </AppButton>
            ) : (
              <AppButton
                onClick={submitStocks}
                color="primary"
                isLoading={isSubmitting}
                disabled={
                  isSubmitting ||
                  summary.totalQty <= 0 ||
                  !commissionInfo.hasSufficientBalance
                }
              >
                {t("confirm")}
              </AppButton>
            )}
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default MultipleAddStockModal;
