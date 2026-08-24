import clsx from "clsx";
import { Store, Trash2, Users } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import FranchiseSearchInput from "~/routes/dashboard/employee/components/FranchiseSearchInput";
import SellerGroupPriceConfigService from "~/services/SellerGroupPriceConfigService";
import type {
  GroupFranchise,
  PriceGroupConfigModalProps,
  PriceGroupFormValues,
} from "./helper";
import {
  defaultValues,
  findExistingGroupForFranchise,
  getGroupById,
  preparePayload,
  statusOptions,
  toGroupFranchise,
  validate,
} from "./helper";

const PriceGroupConfigModal: React.FC<PriceGroupConfigModalProps> = ({
  show,
  callback,
  editId,
}) => {
  const methods = useForm<PriceGroupFormValues>({ defaultValues });
  const { register, handleSubmit, reset, control } = methods;

  const [franchises, setFranchises] = useState<GroupFranchise[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const modeRef = useRef<"add" | "edit">("add");
  const { show: showToast } = useAppToast();
  const [status] = useWatch({ control, name: ["status"] });

  useEffect(() => {
    let mounted = true;

    if (!show) {
      reset(defaultValues);
      setFranchises([]);
      modeRef.current = "add";
      return;
    }

    const fetchGroup = async (id: string) => {
      try {
        const group = await getGroupById(id);
        if (!mounted || !group) return;

        reset({
          name: group.name || "",
          status: group.status || "Active",
        });
        setFranchises(
          (group.sellersInfo || []).map((s: any) => ({
            id: s.id || s._id || "",
            name: s.name || s.shopName || s.id || "",
            refId: s.refId || "",
            mobile: s.mobile || "",
          })),
        );
      } catch (error) {
        console.error("Error fetching price group:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (editId) {
      modeRef.current = "edit";
      setLoading(true);
      void fetchGroup(editId);
    } else {
      modeRef.current = "add";
      reset(defaultValues);
      setFranchises([]);
    }

    return () => {
      mounted = false;
    };
  }, [show, editId, reset]);

  const handleFranchiseSelect = useCallback(
    async (item: any, action: "add" | "remove") => {
      if (action !== "add") {
        return;
      }

      const franchise = toGroupFranchise(item);
      if (!franchise) {
        return;
      }

      if (franchises.some((f) => f.id === franchise.id)) {
        showToast({
          msg: `${franchise.name} is already added to this group`,
          color: "error",
        });
        return;
      }

      setChecking(true);
      try {
        const existing = await findExistingGroupForFranchise(
          franchise.id,
          editId,
        );
        if (existing) {
          showToast({
            msg: `${franchise.name} is already part of the group "${existing.name || ""}"`,
            color: "error",
          });
          return;
        }
        setFranchises((prev) => [...prev, franchise]);
      } catch (error) {
        console.error("Error checking existing price group:", error);
        showToast({
          msg: "Unable to verify the retailer. Please try again.",
          color: "error",
        });
      } finally {
        setChecking(false);
      }
    },
    [franchises, editId, showToast],
  );

  const removeFranchise = (id: string) => {
    setFranchises((prev) => prev.filter((f) => f.id !== id));
  };

  const onSubmit = async (data: PriceGroupFormValues) => {
    const validation = validate(data, franchises);
    if (validation.msg) {
      showToast({ msg: validation.msg, color: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = preparePayload(data, franchises);
      const r =
        modeRef.current === "edit" && editId
          ? await SellerGroupPriceConfigService.updateGroup(editId, payload)
          : await SellerGroupPriceConfigService.createGroup(payload);

      if (r.statusCode === 200 || r.statusCode === 201) {
        showToast({
          msg:
            modeRef.current === "edit"
              ? "Price group updated successfully"
              : "Price group created successfully",
          color: "success",
        });
        callback({
          action: "save",
          data: { ...payload, franchises },
        });
        reset(defaultValues);
        setFranchises([]);
      } else {
        showToast({
          msg: r.data?.message || "Error saving the price group. Please try again.",
          color: "error",
        });
      }
    } catch (error: any) {
      showToast({
        msg: error?.message || "Error saving the price group",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset(defaultValues);
    setFranchises([]);
    callback({ action: "close" });
  };

  const handleCancel = () => {
    reset(defaultValues);
    setFranchises([]);
    callback({ action: "cancel" });
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-2xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div>
          <h2 className="tw:text-lg tw:font-semibold">
            {modeRef.current === "edit"
              ? "Edit Price Group"
              : "Configure Price Group"}
          </h2>
          <p className="tw:text-sm tw:text-gray-500 tw:mt-1">
            Group retailers together to apply a common price configuration
          </p>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh] tw:overflow-auto">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full tw:p-6">
            <AppSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-5">
            <AppInput
              name="name"
              label="Group Name"
              placeholder="e.g., WholeSale partners"
              register={register}
              rules={{ required: true }}
              inputClassName="tw:w-full tw:h-10 tw:lg:h-10 tw:px-4 tw:py-2"
              labelClassName="tw:mb-2"
              size="sm"
              isRequired={true}
              maxLength={60}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={statusOptions}
                  placeholder="Status"
                  onChange={field.onChange}
                  value={field.value || ""}
                  isRequired={true}
                  inputClassName={clsx(
                    "tw:w-full tw:data-[size=sm]:h-10 tw:px-4 tw:py-2",
                    status === "Inactive"
                      ? "tw:bg-red-50 tw:text-red-900"
                      : "tw:bg-green-50 tw:text-green-900",
                  )}
                  size="sm"
                  label="Status"
                />
              )}
            />

            <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:border tw:border-gray-200">
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
                <label className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900">
                  Add Retailer <span className="tw:text-red-500">*</span>
                </label>
                {checking ? (
                  <span className="tw:text-xs tw:text-gray-500">
                    Checking...
                  </span>
                ) : null}
              </div>

              <FranchiseSearchInput
                size="sm"
                placeholder="Search retailer by name, ID or mobile"
                callback={handleFranchiseSelect}
                disabled={checking}
                className="tw:w-full"
              />

              {franchises.length === 0 ? (
                <div className="tw:mt-4 tw:p-6 tw:border tw:border-dashed tw:border-blue-200 tw:rounded-lg tw:bg-blue-50">
                  <div className="tw:flex tw:items-center tw:gap-4">
                    <div className="tw:shrink-0 tw:w-12 tw:h-12 tw:bg-blue-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                      <Users className="tw:w-6 tw:h-6 tw:text-blue-600" />
                    </div>
                    <div className="tw:flex-1">
                      <p className="tw:font-semibold tw:text-sm tw:text-gray-900">
                        No retailers added yet
                      </p>
                      <p className="tw:text-xs tw:text-gray-600 tw:mt-1">
                        Search above and pick the retailers that belong to this
                        price group. A retailer already mapped to another group
                        can't be added again.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="tw:mt-4">
                  <label className="tw:block tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-2 tw:uppercase tw:tracking-wide">
                    Retailers ({franchises.length})
                  </label>
                  <div className="tw:space-y-1">
                    {franchises.map((f) => (
                      <div
                        key={f.id}
                        className="tw:flex tw:items-center tw:justify-between tw:px-3 tw:py-2 tw:bg-white tw:border tw:border-gray-200 tw:rounded-sm hover:tw:bg-blue-50 tw:transition-colors"
                      >
                        <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0 tw:flex-1">
                          <Store className="tw:w-4 tw:h-4 tw:text-gray-400 tw:shrink-0" />
                          <div className="tw:min-w-0">
                            <p className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:truncate">
                              {f.name}
                            </p>
                            <p className="tw:text-[11px] tw:text-gray-500 tw:truncate">
                              {[f.refId, f.mobile].filter(Boolean).join(" • ")}
                            </p>
                          </div>
                        </div>
                        <AppButton
                          type="button"
                          onClick={() => removeFranchise(f.id)}
                          fill="outline"
                          color="danger"
                          size="small"
                          className="tw:ml-2"
                        >
                          <Trash2 size={16} />
                        </AppButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </AppModal.Content>

      {!loading && (
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

export default PriceGroupConfigModal;
