import { Clock, Edit, Plus, Settings, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import PriceSlabService from "~/services/PriceSlabService";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type {
  PriceSlabConfigModalProps,
  PriceSlabFormValues,
  Slab,
} from "./helper";
import PriceSlabTargetSelector from "./PriceSlabTargetSelector";
import AppTab from "~/components/core/tab/AppTab";

import {
  channelOptions,
  defaultValues,
  headerMap,
  preparePayload,
  statusOptions,
  validate,
  validateAddSlab,
} from "./helper";
import clsx from "clsx";
import PriceSlabConfigLogs from "./PriceSlabConfigLogs";
import type { TabItem } from "~/types/CommonTypes";

const tabs: TabItem[] = [
  { name: "Config", key: "config", icon: <Settings /> },
  { name: "Logs", key: "logs", icon: <Clock /> },
];

const PriceSlabConfigModal: React.FC<PriceSlabConfigModalProps> = ({
  show,
  callback,
  type,
  editId,
  targetDetails,
  slabs: slabsProp,
  channel,
  disableChannel,
  initalTab = "config",
  hideTabs = true,
}) => {
  const methods = useForm<PriceSlabFormValues>({
    defaultValues: defaultValues,
  });

  const { register, handleSubmit, reset, setValue, getValues } = methods;

  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [activeTab, setActiveTab] = useState<"config" | "logs">(initalTab);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useAppToast();

  const [submitting, setSubmitting] = useState(false);
  const modeRef = useRef<"add" | "edit">("add");
  const [referenceInfoName, setReferenceInfoName] = useState<string>("");
  const [slabEditIndex, setSlabEditIndex] = useState<number | null>(null);
  const [status] = useWatch({ control: methods.control, name: ["status"] });

  useEffect(() => {
    if (show) {
      setActiveTab(initalTab);
    }
  }, [show, initalTab]);

  useEffect(() => {
    let mounted = true;

    // Modal opened: set sensible defaults
    setValue("status", "active");
    setValue("channel", channel || "b2b");
    if (targetDetails) {
      setValue("target", targetDetails);
    }

    // If parent provided initial slabs, use them to populate local slabs state
    if (slabsProp && Array.isArray(slabsProp) && slabsProp.length > 0) {
      setSlabs(
        slabsProp
          .map((s) => ({
            fromQty: (s as any).fromQty ?? (s as any).minQuantity ?? 0,
            toQty: (s as any).toQty ?? (s as any).maxQuantity ?? 0,
            discount: (s as any).discount ?? (s as any).discountPercentage ?? 0,
          }))
          .sort((a, b) => Number(a.fromQty) - Number(b.fromQty)),
      );
    }

    const fetchPriceSlab = async (id: string) => {
      try {
        const response = await PriceSlabService.getPriceSlab({
          filter: {
            _id: id,
          },
        });

        if (!mounted) return;

        const d = response.data?.data?.[0] || {};
        if (d._id) {
          let targetForForm: any = [];
          if (d?.referenceInfo && d.referenceInfo.id) {
            targetForForm = [
              {
                label: d.referenceInfo.name || "",
                value: {
                  id: d.referenceInfo.id,
                  name: d.referenceInfo.name,
                  objId: d.referenceInfo.id,
                },
              },
            ];
          }

          reset({
            target: targetForForm,
            status: d.isActive ? "active" : "inactive",
            channel: d.applicableFor === "Network" ? "b2b" : "b2c",
          });
          setSlabs(
            (d?.slab || [])
              .map((s: any) => ({
                fromQty: s.minQuantity,
                toQty: s.maxQuantity,
                discount: s.discountPercentage,
              }))
              .sort(
                (a: Slab, b: Slab) => Number(a.fromQty) - Number(b.fromQty),
              ),
          );
          setReferenceInfoName(d?.referenceInfo?.name || "");
          setAuditLogs(d?.auditLog || d?.auditLogs || []);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error fetching price slab:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // When modal is closed reset form and slabs
    if (!show) {
      reset(defaultValues);
      setSlabs([]);
      modeRef.current = "add";
      setReferenceInfoName("");
    }

    // If editId provided, fetch existing config and set mode to edit
    if (editId) {
      modeRef.current = "edit";
      setLoading(true);
      void fetchPriceSlab(editId);
    } else {
      modeRef.current = "add";
    }

    return () => {
      mounted = false;
    };
  }, [show, editId, reset, setValue, slabsProp]);

  const handleTargetChange = (item: any | null) => {
    setValue("target", item ? [item] : []);
  };

  const onSubmit = async (data: PriceSlabFormValues) => {
    const validation = validate(data, slabs, type);

    if (validation.msg) {
      showToast({ msg: validation.msg, color: "error" });
      return;
    }

    setSubmitting(true);
    try {
      // Force API payload to use B2B channel by default
      const payload = preparePayload({ ...data, channel: "b2b" }, slabs, type);
      let r;
      if (modeRef.current === "edit" && editId) {
        // send editId in the URL path; payload.id should remain the target id
        r = await PriceSlabService.updatePriceSlab(editId, payload);
      } else {
        // For certain target types (menu, brand, category, deal/product)
        // ensure we don't create duplicate configs. If a config already
        // exists for the same referenceInfo.id, switch to update API.
        const checkTypes = ["menu", "brand", "category", "product"];
        if (checkTypes.includes(type)) {
          try {
            const targetId = (payload as any).id;
            if (targetId) {
              const existingResp = await PriceSlabService.getPriceSlab({
                filter: { "referenceInfo.id": targetId },
              });
              const existing = existingResp.data?.data?.[0];
              if (existing && existing._id) {
                // update existing config instead of creating new
                (payload as any).id = existing._id;
                r = await PriceSlabService.updatePriceSlab(
                  existing._id,
                  payload,
                );
              } else {
                r = await PriceSlabService.createPriceSlab(payload);
              }
            } else {
              r = await PriceSlabService.createPriceSlab(payload);
            }
          } catch (err) {
            // if check fails, fallback to create and show error later from response
            console.error("Error checking existing price slab:", err);
            r = await PriceSlabService.createPriceSlab(payload);
          }
        } else {
          r = await PriceSlabService.createPriceSlab(payload);
        }
      }

      if (r.statusCode === 200 || r.statusCode === 201) {
        showToast({
          msg:
            modeRef.current === "edit"
              ? "Price slab configuration updated successfully"
              : "Price slab configuration saved successfully",
          color: "success",
        });
        // pass saved data back to parent to avoid callers reading undefined
        callback({
          action: "save",
          data: {
            target: data.target || [],
            slabs,
            status: data.status,
            channel: data.channel,
          },
        });
        reset();
        setSlabs([]);
      } else {
        const defaultMsg = `Error saving price slab configuration. Please try again.`;
        showToast({
          msg: r.data?.message || defaultMsg,
          color: "error",
        });
      }
    } catch (error: any) {
      showToast({
        msg: error?.message || "Error saving price slab configuration",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSlabs([]);
    callback({ action: "cancel" });
  };

  const handleClose = () => {
    reset();
    setSlabs([]);
    callback({ action: "close" });
  };

  const addSlab = () => {
    const { fromQty, toQty, discount } = getValues();

    const validation = validateAddSlab(
      fromQty,
      toQty,
      discount,
      slabs,
      slabEditIndex,
    );
    if (validation.msg) {
      showToast({ msg: validation.msg, color: "error" });
      return;
    }

    const f = Number(fromQty);
    const t = Number(toQty);
    const d = Number(discount);

    const newSlab: Slab = {
      fromQty: f,
      toQty: t,
      discount: d,
    };

    if (slabEditIndex !== null && slabEditIndex !== undefined) {
      setSlabs((prev) => {
        const tmp = [...prev];
        tmp[slabEditIndex] = newSlab;
        return tmp.sort((a, b) => a.fromQty - b.fromQty);
      });
      setSlabEditIndex(null);
    } else {
      setSlabs([...slabs, newSlab].sort((a, b) => a.fromQty - b.fromQty));
    }
    setValue("fromQty", "");
    setValue("toQty", "");
    setValue("discount", "");
  };

  const removeSlab = (index: number) => {
    setSlabs(slabs.filter((_, i) => i !== index));
  };

  const handleNumericChange = (field: keyof PriceSlabFormValues) => {
    const val = getValues(field);
    const raw = val === undefined || val === null ? "" : String(val);

    // If empty, keep as empty string
    if (raw === "" || raw == null) {
      setValue(field, "");
      return;
    }

    // Block negative input by stripping any '-' characters
    if (raw.includes("-")) {
      const cleaned = raw.replace(/-/g, "");
      setValue(field, cleaned === "" ? "" : cleaned);
      return;
    }

    // Otherwise set the raw value (registration will coerce to number for number inputs)
    setValue(field, raw);
  };

  const editSlab = (index: number) => {
    const slab = slabs[index];
    setValue("fromQty", slab.fromQty.toString());
    setValue("toQty", slab.toQty.toString());
    setValue("discount", slab.discount.toString());
    setSlabEditIndex(index);
  };

  const handleCancelEditSlab = () => {
    setSlabEditIndex(null);
    setValue("fromQty", "");
    setValue("toQty", "");
    setValue("discount", "");
  };

  const headerTitle = headerMap[type] ?? "Price Slab";

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-2xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div>
          <h2 className="tw:text-lg tw:font-semibold">{headerTitle}</h2>
          <p className="tw:text-sm tw:text-gray-500 tw:mt-1">
            {initalTab === "logs"
              ? "View price slab configuration logs"
              : "Configure price slabs for discounts"}
          </p>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh] tw:overflow-auto">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full tw:p-6">
            <AppSpinner />
          </div>
        ) : (
          <div>
            {!hideTabs && (
              <AppTab
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(t: any) => setActiveTab(t.key)}
                className="tw:mb-4"
              />
            )}

            {activeTab === "config" ? (
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="tw:space-y-4"
                >
                  {targetDetails || modeRef.current === "edit" ? (
                    <div className="tw:mb-4 tw:px-3 tw:py-2 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-md">
                      <p className="tw:text-xs tw:font-semibold tw:text-blue-600 tw:uppercase tw:tracking-wide tw:mb-1">
                        {modeRef.current === "edit" ? "Updating" : "Target"}
                      </p>
                      <p className="tw:text-xs tw:font-medium tw:text-gray-900">
                        {modeRef.current === "edit"
                          ? referenceInfoName || "Global"
                          : targetDetails?.[0]?.label || "Global"}
                      </p>
                    </div>
                  ) : (
                    <PriceSlabTargetSelector
                      type={type}
                      callback={handleTargetChange}
                    />
                  )}

                  <div className="tw:grid tw:grid-cols-1 tw:gap-3">
                    <div>
                      <Controller
                        name="status"
                        control={methods.control}
                        render={({ field }) => (
                          <AppSelect
                            options={statusOptions}
                            placeholder="Status"
                            onChange={field.onChange}
                            value={field.value || ""}
                            isRequired={true}
                            inputClassName={clsx(
                              "tw:w-full",
                              status === "inactive"
                                ? "tw:bg-red-50 tw:text-red-900"
                                : status === "active"
                                  ? "tw:bg-green-50 tw:text-green-900"
                                  : "",
                            )}
                            size="sm"
                            label="Status"
                          />
                        )}
                      />
                    </div>

                    <div>
                      {/*
                    Network Type selector (B2B/B2C) commented out per request.
                    The API will always receive `b2b` by default.

                  <Controller
                    name="channel"
                    control={methods.control}
                    render={({ field }) => (
                      <AppSelect
                        options={channelOptions}
                        placeholder="Network Type"
                        onChange={field.onChange}
                        value={field.value || ""}
                        inputClassName="tw:w-full"
                        size="sm"
                        label="Network Type"
                        disabled={disableChannel}
                      />
                    )}
                  />
                  */}
                    </div>
                  </div>

                  <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:border tw:border-gray-200">
                    <label className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-3">
                      Add New Slab <span className="tw:text-red-500">*</span>
                    </label>

                    <div className="tw:space-y-3">
                      <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:items-end">
                        <div>
                          <AppInput
                            name="fromQty"
                            label="From Qty"
                            type="number"
                            placeholder="e.g., 10"
                            register={register}
                            inputClassName="tw:w-full tw:bg-white"
                            onChange={() => handleNumericChange("fromQty")}
                            className="tw:mb-0"
                            size="sm"
                            isRequired={true}
                          />
                        </div>
                        <div>
                          <AppInput
                            name="toQty"
                            label="To Qty"
                            type="number"
                            placeholder="e.g., 50"
                            register={register}
                            inputClassName="tw:w-full tw:bg-white"
                            onChange={() => handleNumericChange("toQty")}
                            className="tw:mb-0"
                            size="sm"
                            isRequired={true}
                          />
                        </div>
                        <div>
                          <AppInput
                            name="discount"
                            label="Discount (%)"
                            type="number"
                            placeholder="e.g., 10"
                            register={register}
                            inputClassName="tw:w-full tw:bg-white"
                            onChange={() => handleNumericChange("discount")}
                            className="tw:mb-0"
                            size="sm"
                            isRequired={true}
                          />
                        </div>
                      </div>

                      <div className="tw:flex tw:justify-end">
                        {slabEditIndex !== null && (
                          <AppButton
                            type="button"
                            onClick={handleCancelEditSlab}
                            fill="outline"
                            color="secondary"
                            size="small"
                            className="tw:mr-2"
                          >
                            Cancel
                          </AppButton>
                        )}

                        <AppButton
                          type="button"
                          onClick={addSlab}
                          color="primary"
                          size="small"
                        >
                          {slabEditIndex !== null ? "Update Slab" : "Add Slab"}
                          <Plus />
                        </AppButton>
                      </div>
                    </div>

                    {slabs.length === 0 ? (
                      <div className="tw:mt-4 tw:p-6 tw:border tw:border-dashed tw:border-blue-200 tw:rounded-lg tw:bg-linear-to-br tw:from-blue-50 tw:to-blue-50">
                        <div className="tw:flex tw:items-center tw:gap-4">
                          <div className="tw:shrink-0 tw:w-12 tw:h-12 tw:bg-blue-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                            <Plus className="tw:w-6 tw:h-6 tw:text-blue-600" />
                          </div>
                          <div className="tw:flex-1">
                            <p className="tw:font-semibold tw:text-sm tw:text-gray-900">
                              No price slabs added yet
                            </p>
                            <p className="tw:text-xs tw:text-gray-600 tw:mt-1">
                              Fill in the quantity range and discount percentage
                              above to add your first slab.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="tw:mt-4">
                        <label className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-2 tw:uppercase tw:tracking-wide">
                          Configured Slabs ({slabs.length})
                        </label>
                        <div className="tw:space-y-1">
                          {slabs.map((slab, index) => (
                            <div
                              key={index}
                              className="tw:flex tw:items-center tw:justify-between tw:px-3 tw:py-2 tw:bg-white tw:border tw:border-gray-200 tw:rounded-sm hover:tw:bg-blue-50 tw:transition-colors"
                            >
                              <div className="tw:flex tw:gap-3 tw:flex-1 tw:items-center tw:text-xs">
                                <div className="tw:flex tw:items-center tw:gap-1">
                                  <span className="tw:text-gray-500 tw:font-medium tw:whitespace-nowrap">
                                    Qty:
                                  </span>
                                  <span className="tw:text-gray-900 tw:font-semibold tw:min-w-fit">
                                    {slab.fromQty}
                                  </span>
                                  <span className="tw:text-gray-400">-</span>
                                  <span className="tw:text-gray-900 tw:font-semibold tw:min-w-fit">
                                    {slab.toQty}
                                  </span>
                                </div>
                                <div className="tw:w-px tw:h-4 tw:bg-gray-300"></div>
                                <div className="tw:flex tw:items-center tw:gap-1">
                                  <span className="tw:text-gray-500 tw:font-medium tw:whitespace-nowrap">
                                    Discount:
                                  </span>
                                  <span className="tw:text-green-700 tw:font-bold tw:min-w-fit">
                                    {slab.discount}%
                                  </span>
                                </div>
                              </div>
                              <AppButton
                                type="button"
                                onClick={() => removeSlab(index)}
                                fill="outline"
                                color="danger"
                                size="small"
                                className="tw:ml-2"
                              >
                                <Trash2 size={16} />
                              </AppButton>

                              <AppButton
                                type="button"
                                onClick={() => editSlab(index)}
                                fill="outline"
                                color="primary"
                                size="small"
                                className="tw:ml-2"
                              >
                                <Edit size={16} />
                              </AppButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* action buttons moved to AppModal.Footer */}
                </form>
              </FormProvider>
            ) : (
              <div>
                <PriceSlabConfigLogs logs={auditLogs} />
              </div>
            )}
          </div>
        )}
      </AppModal.Content>

      {activeTab === "config" && !loading && (
        <AppModal.Footer>
          <div className="tw:flex tw:justify-end tw:gap-3">
            <AppButton
              type="button"
              onClick={handleCancel}
              fill="outline"
              color="secondary"
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              color="primary"
              isLoading={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              Save
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default PriceSlabConfigModal;
