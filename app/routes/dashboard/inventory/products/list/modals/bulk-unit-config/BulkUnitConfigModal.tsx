import {
  Settings,
  Package,
  Box,
  ShoppingCart,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox, AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";
import AuthService from "~/services/AuthService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";

type SelectedDeal = {
  _id: string;
  id: string;
  name: string;
  caseQty?: number | null;
  innerCaseQty?: number | null;
  sellingType?: "CASE" | "UNIT";
  sellerId?: string;
};

type Props = {
  show: boolean;
  deals: SelectedDeal[];
  callback: (a: { action: string; data?: any }) => void;
};

type FormData = {
  deals: {
    _id: string;
    id: string;
    name: string;
    caseQty: number | null;
    innerCaseQty: number | null;
    sellInCase: boolean;
    sellerId?: string;
  }[];
  globalCaseQty: number | null;
  globalInnerCaseQty: number | null;
};

const BulkUnitConfigModal = ({ show, deals, callback }: Props) => {
  const { control, register, setValue, getValues, reset } = useForm<FormData>({
    defaultValues: {
      deals: [],
      globalCaseQty: null,
      globalInnerCaseQty: null,
    },
  });

  const { fields, replace, remove } = useFieldArray({
    control,
    name: "deals",
  });

  const appToast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => callback({ action: "close" });

  useEffect(() => {
    if (show) {
      if (deals.length > 0) {
        const formattedDeals = deals.map((deal) => ({
          _id: deal._id,
          id: deal.id,
          name: deal.name,
          caseQty: deal.caseQty || null,
          innerCaseQty: deal.innerCaseQty || null,
          sellInCase: deal.sellingType === "CASE",
          sellerId: deal.sellerId,
        }));
        replace(formattedDeals);
      } else {
        replace([]);
      }
      // Reset global inputs when modal opens
      setValue("globalCaseQty", null);
      setValue("globalInnerCaseQty", null);
    }
  }, [show, deals, replace, setValue]);

  const handleApplyGlobal = () => {
    const globalCase = getValues("globalCaseQty");
    const globalInner = getValues("globalInnerCaseQty");

    fields.forEach((_, index) => {
      if (
        globalCase !== null &&
        globalCase !== undefined &&
        String(globalCase) !== ""
      ) {
        setValue(`deals.${index}.caseQty`, Number(globalCase));
      }
      if (
        globalInner !== null &&
        globalInner !== undefined &&
        String(globalInner) !== ""
      ) {
        setValue(`deals.${index}.innerCaseQty`, Number(globalInner));
      }
    });
    appToast.show({
      msg: `Applied to ${fields.length} items`,
      color: "success",
    });
  };

  const onPreSubmit = () => {
    const formData = getValues();
    if (!formData.deals || formData.deals.length === 0) {
      appToast.show({ msg: "No items to update", color: "warning" });
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    const formData = getValues();

    try {
      setSubmitting(true);

      const payloads = formData.deals.map((deal) => {
        const packConfig = [];
        if (deal.caseQty) {
          packConfig.push({
            packType: "Case",
            quantity: Number(deal.caseQty),
            isDefault: deal.sellInCase,
          });
        }
        if (deal.innerCaseQty) {
          packConfig.push({
            packType: "InnerCase",
            quantity: Number(deal.innerCaseQty),
            isDefault: !deal.sellInCase,
          });
        }

        return {
          sellerId: deal.sellerId || AuthService.getLoggedInUserId(),
          dealId: deal._id,
          packConfig,
          remarks: `Bulk update: ${deal.sellInCase ? "Case" : "Inner Case"} type`,
        };
      });

      const resp = await SellerCatalogService.packConfig(payloads);

      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Configurations updated successfully",
          color: "success",
        });
        callback({ action: "submit", data: payloads });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to update configurations",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error updating pack config:", error);
      appToast.show({ msg: "An error occurred", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="tw:max-w-xl">
        <AppModal.Title onClose={handleClose}>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Settings className="tw:w-5 tw:h-5 tw:text-primary" />
            <span className="tw:font-bold tw:text-lg tw:tracking-tight">
              Sell In Configuration
            </span>
            <span className="tw:bg-primary/10 tw:text-primary tw:text-[10px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-bold">
              {fields.length} ITEMS
            </span>
          </div>
        </AppModal.Title>
        <AppModal.Content className="tw:max-h-[75vh] tw:bg-slate-50/50">
          <div className="tw:flex tw:flex-col tw:gap-4 tw:py-2">
            {/* Global Config Step */}
            <div className="tw:bg-white tw:p-4 tw:rounded-xl tw:border tw:border-slate-200 tw:shadow-sm">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                <div className="tw:w-6 tw:h-6 tw:bg-blue-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <Settings className="tw:w-3.5 tw:h-3.5 tw:text-white" />
                </div>
                <h3 className="tw:text-sm tw:font-bold tw:text-slate-800">
                  Quick Fill
                </h3>
                <p className="tw:text-[10px] tw:text-slate-400 tw:font-medium tw:uppercase tw:ml-auto">
                  Batch Apply
                </p>
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mb-3">
                <AppInput
                  name="globalCaseQty"
                  label="Case Qty"
                  type="number"
                  register={register}
                  size="sm"
                  placeholder="0"
                />
                <AppInput
                  name="globalInnerCaseQty"
                  label="Inner Case Qty"
                  type="number"
                  register={register}
                  size="sm"
                  placeholder="0"
                />
              </div>
              <AppButton
                size="small"
                onClick={handleApplyGlobal}
                className="tw:w-full tw:font-bold"
                color="primary"
                fill="outline"
              >
                Apply to all items
              </AppButton>
            </div>

            {/* Selected Items Card List */}
            <div className="tw:space-y-3">
              <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
                <h4 className="tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase tw:tracking-wider">
                  Selected Deals
                </h4>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="tw:bg-white tw:rounded-xl tw:border tw:border-slate-200 tw:shadow-sm tw:overflow-hidden tw:relative group"
                >
                  {/* Card Header */}
                  <div className="tw:p-3 tw:border-b tw:border-slate-50 tw:flex tw:gap-3">
                    <div className="tw:w-10 tw:h-10 tw:bg-slate-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
                      <Package className="tw:w-5 tw:h-5 tw:text-slate-500" />
                    </div>
                    <div className="tw:flex-1 tw:min-w-0">
                      <h4 className="tw:text-sm tw:font-bold tw:text-slate-800 tw:truncate">
                        {field.name}
                      </h4>
                      <p className="tw:text-[10px] tw:font-medium tw:text-slate-400">
                        ID: {field._id}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(index)}
                      className="tw:p-2 tw:text-slate-300 hover:tw:text-red-500 tw:transition-colors tw:shrink-0"
                    >
                      <Trash2 className="tw:w-4 tw:h-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="tw:p-3 tw:grid tw:grid-cols-2 tw:gap-3">
                    <div className="tw:space-y-2">
                      <AppInput
                        name={`deals.${index}.caseQty`}
                        label="Case Qty"
                        type="number"
                        register={register}
                        size="sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="tw:space-y-2">
                      <AppInput
                        name={`deals.${index}.innerCaseQty`}
                        label="Inner Case"
                        type="number"
                        register={register}
                        size="sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Card Footer - Package Type Selection */}
                  <div className="tw:p-3 tw:bg-slate-50/50 tw:flex tw:items-center tw:justify-between tw:gap-2">
                    <div className="tw:flex tw:items-center tw:gap-1.5">
                      <ShoppingCart className="tw:w-3.5 tw:h-3.5 tw:text-blue-500" />
                      <span className="tw:text-[11px] tw:font-bold tw:text-slate-600">
                        Sell In
                      </span>
                    </div>
                    <div className="tw:flex tw:gap-4">
                      <Controller
                        name={`deals.${index}.sellInCase`}
                        control={control}
                        render={({ field: checkboxField }) => (
                          <div
                            className={`tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-1.5 tw:rounded-lg tw:border tw:transition-all tw:cursor-pointer ${
                              checkboxField.value
                                ? "tw:bg-blue-50 tw:border-blue-200 tw:shadow-sm"
                                : "tw:bg-white tw:border-slate-200"
                            }`}
                            onClick={() =>
                              setValue(`deals.${index}.sellInCase`, true)
                            }
                          >
                            <div
                              className={`tw:w-3 tw:h-3 tw:rounded-full tw:border-2 ${
                                checkboxField.value
                                  ? "tw:border-blue-600 tw:bg-blue-600"
                                  : "tw:border-slate-300"
                              }`}
                            />
                            <span
                              className={`tw:text-[11px] tw:font-bold ${checkboxField.value ? "tw:text-blue-700" : "tw:text-slate-500"}`}
                            >
                              Case
                            </span>
                          </div>
                        )}
                      />
                      <Controller
                        name={`deals.${index}.sellInCase`}
                        control={control}
                        render={({ field: checkboxField }) => (
                          <div
                            className={`tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-1.5 tw:rounded-lg tw:border tw:transition-all tw:cursor-pointer ${
                              !checkboxField.value
                                ? "tw:bg-blue-50 tw:border-blue-200 tw:shadow-sm"
                                : "tw:bg-white tw:border-slate-200"
                            }`}
                            onClick={() =>
                              setValue(`deals.${index}.sellInCase`, false)
                            }
                          >
                            <div
                              className={`tw:w-3 tw:h-3 tw:rounded-full tw:border-2 ${
                                !checkboxField.value
                                  ? "tw:border-blue-600 tw:bg-blue-600"
                                  : "tw:border-slate-300"
                              }`}
                            />
                            <span
                              className={`tw:text-[11px] tw:font-bold ${!checkboxField.value ? "tw:text-blue-700" : "tw:text-slate-500"}`}
                            >
                              Unit
                            </span>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:bg-white tw:rounded-2xl tw:border-2 tw:border-dashed tw:border-slate-200">
                  <div className="tw:w-12 tw:h-12 tw:bg-slate-50 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mb-3">
                    <AlertCircle className="tw:w-6 tw:h-6 tw:text-slate-300" />
                  </div>
                  <p className="tw:text-sm tw:font-bold tw:text-slate-400">
                    Your selection is empty
                  </p>
                  <p className="tw:text-xs tw:text-slate-300 tw:mt-1">
                    Close this modal to select items
                  </p>
                </div>
              )}
            </div>
          </div>
        </AppModal.Content>
        <AppModal.Footer className="tw:p-4 tw:bg-white tw:border-t tw:shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="tw:flex tw:gap-3">
            <AppButton
              fill="outline"
              onClick={handleClose}
              color="dark"
              className="tw:flex-1 tw:font-bold tw:rounded-xl"
            >
              Cancel
            </AppButton>
            <AppButton
              color="success"
              onClick={onPreSubmit}
              className="tw:flex-[2] tw:font-bold tw:rounded-xl tw:shadow-lg tw:shadow-green-500/20"
              isLoading={submitting}
              disabled={fields.length === 0}
            >
              Save Configuration
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      <AppAlertDialog
        show={showConfirm}
        title="Confirm Bulk Update"
        description={`Are you sure you want to update the configuration for ${fields.length} selected deals? This action will apply new packaging rules immediately.`}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
        okText="Yes, Update All"
        cancelText="Review Again"
      />
    </>
  );
};

export default BulkUnitConfigModal;
