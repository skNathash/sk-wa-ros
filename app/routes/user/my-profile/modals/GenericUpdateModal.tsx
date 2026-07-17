import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Clock, CheckCircle2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppModal from "~/components/core/modal/AppModal";
import AuthService from "~/services/AuthService";
import { orderBy } from "lodash";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  inputs: Array<string>;
  values: Record<string, any>;
};

const GenericUpdateModal = ({ show, callback, inputs, values }: Props) => {
  const toast = useAppToast();
  const { register, reset, control, getValues } = useForm();

  const [submitting, setSubmitting] = useState(false);
  const [display, setDisplay] = useState<"form" | "success">("form");
  const isDemoAccount = !!(AuthService.getLoggedInUser() as any)?.isDemoAccount;

  const [businessCategories, setBusinessCategories] = useState<any[]>([]);
  const [loadingBusinessCategories, setLoadingBusinessCategories] =
    useState(false);

  // derive pending profile update value (if any) for the current input
  const getPendingRequestForInput = () => {
    try {
      const logged = AuthService.getLoggedInUser() || {};
      const logs = FranchiseService.formatProfileUpdateRequestLog(
        logged.profileUpdateRequest || [],
      );

      // determine target type
      let targetType = "";
      if (inputs?.includes("gstNo")) targetType = "GST_UPDATE";
      if (inputs?.includes("primaryBusiness"))
        targetType = "PRIMARY_BUSINESS_UPDATE";
      if (inputs?.includes("secondaryBusiness"))
        targetType = "SECONDARY_BUSINESS_UPDATE";

      if (!targetType) return null;

      const filtered = orderBy(logs || [], "createdAt", "desc").filter(
        (l: any) =>
          l.type === targetType && String(l.status).toLowerCase() === "pending",
      );

      return filtered.length > 0 ? filtered[0] : null;
    } catch (e) {
      return null;
    }
  };

  const pendingRequest = getPendingRequestForInput();

  const renderPendingBlock = () =>
    pendingRequest ? (
      <InfoBlock variant="warning" size="sm" className="tw:mt-3 tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Clock size={16} className="tw:shrink-0" />
          <div>
            <div className="tw:text-xs tw:font-semibold tw:mb-1">
              Pending Approval
            </div>
            <div className="tw:text-xs">
              New value:{" "}
              <span className="tw:font-semibold">
                {pendingRequest.displayValue}
              </span>
            </div>
          </div>
        </div>
      </InfoBlock>
    ) : null;

  const loadBusinessCategories = async () => {
    setLoadingBusinessCategories(true);
    const resp = await CommonService.getBusinessCategories({
      page: 1,
      count: 100,
      filter: {
        isActive: true,
      },
    });
    setBusinessCategories(
      (resp.data?.data || []).map((item: any) => ({
        value: item.oldSystemRefId,
        label: item.name,
      })),
    );
    setLoadingBusinessCategories(false);
  };

  useEffect(() => {
    if (show) {
      loadBusinessCategories();
      reset(values);
      setDisplay("form");
    }
  }, [show, values, reset]);

  const validateForm = () => {
    const formValues = getValues();

    let msg = "";
    if (inputs?.includes("gstNo") && !formValues.gstNo) {
      msg = "GST No is required";
      return msg;
    }
    if (
      inputs?.includes("gstNo") &&
      formValues.gstNo &&
      !CommonService.isValidGst(formValues.gstNo)
    ) {
      msg = "Invalid GST No";
      return msg;
    }
    if (inputs?.includes("primaryBusiness") && !formValues.primaryBusiness) {
      msg = "Primary Business is required";
      return msg;
    }
    if (
      inputs?.includes("secondaryBusiness") &&
      !formValues.secondaryBusiness
    ) {
      msg = "Secondary Business is required";
      return msg;
    }

    // Prevent submitting the same value as existing
    let changed = false;
    if (inputs?.includes("gstNo")) {
      const oldGst = (values?.gstNo || "").toString().trim().toUpperCase();
      const newGst = (formValues.gstNo || "").toString().trim().toUpperCase();
      if (newGst && newGst !== oldGst) changed = true;
    }
    if (inputs?.includes("primaryBusiness")) {
      const oldVal = values?.primaryBusiness;
      const newVal = formValues.primaryBusiness;
      if (newVal && String(newVal) !== String(oldVal)) changed = true;
    }
    if (inputs?.includes("secondaryBusiness")) {
      const oldVal = values?.secondaryBusiness;
      const newVal = formValues.secondaryBusiness;
      if (newVal && String(newVal) !== String(oldVal)) changed = true;
    }

    if (!changed) {
      msg = "Please make a change before saving.";
    }

    return msg;
  };

  const preparePaylaod = () => {
    const formValues = getValues();
    if (inputs?.includes("gstNo")) {
      return {
        profileRequest: {
          type: "GST_UPDATE",
          value: formValues.gstNo,
        },
      };
    }
    if (inputs?.includes("primaryBusiness")) {
      const category = businessCategories.find(
        (item) => item.value === formValues.primaryBusiness,
      );
      return {
        profileRequest: {
          type: "PRIMARY_BUSINESS_UPDATE",
          value: {
            primaryBusiness: category?.label,
            primaryBusinessId: category?.value,
          },
        },
      };
    }
    if (inputs?.includes("secondaryBusiness")) {
      const category = businessCategories.find(
        (item) => item.value === formValues.secondaryBusiness,
      );
      return {
        profileRequest: {
          type: "SECONDARY_BUSINESS_UPDATE",
          value: {
            secondaryBusiness: category?.label,
            secondaryBusinessId: category?.value,
          },
        },
      };
    }
  };

  const onSubmit = async () => {
    const msg = validateForm();

    if (msg) {
      toast.show({ msg, color: "danger" });
      return;
    }

    setSubmitting(true);
    try {
      const resp = await FranchiseService.updateFranchise(preparePaylaod());
      if (resp && resp.statusCode === 200) {
        // toast.show({
        //   msg: "Information updated successfully!",
        //   color: "success",
        // });
        // show success block; parent will refresh once approval is complete
        setDisplay("success");
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update information.",
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
    }
    setSubmitting(false);
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:font-semibold">Update Information</div>
      </AppModal.Title>
      <AppModal.Content>
        {display === "form" && (
          <>
            {inputs?.includes("gstNo") && (
              <AppInput
                label="GST No."
                name="gstNo"
                register={register}
                className="tw:w-full"
                isRequired
              />
            )}
            {inputs?.includes("gstNo") && renderPendingBlock()}

            {/* primary business */}
            {inputs?.includes("primaryBusiness") && (
              <Controller
                name="primaryBusiness"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    label="Primary Business"
                    options={businessCategories}
                    value={field.value}
                    onChange={field.onChange}
                    isRequired
                    inputClassName="tw:w-full"
                    loading={loadingBusinessCategories}
                  />
                )}
              />
            )}
            {inputs?.includes("primaryBusiness") &&
              !isDemoAccount &&
              renderPendingBlock()}

            {/* secondary business */}
            {inputs?.includes("secondaryBusiness") && (
              <Controller
                name="secondaryBusiness"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    label="Secondary Business"
                    options={businessCategories}
                    value={field.value}
                    onChange={field.onChange}
                    isRequired
                    inputClassName="tw:w-full"
                    loading={loadingBusinessCategories}
                  />
                )}
              />
            )}
            {inputs?.includes("secondaryBusiness") &&
              !isDemoAccount &&
              renderPendingBlock()}
          </>
        )}

        {display === "success" && (
          <div className="tw:py-8 tw:px-4 tw:text-center">
            <div className="tw:flex tw:justify-center tw:mb-4">
              <div className="tw:w-14 tw:h-14 tw:rounded-full tw:bg-green-100 tw:flex tw:items-center tw:justify-center">
                <CheckCircle2 className="tw:w-7 tw:h-7 tw:text-green-600" />
              </div>
            </div>

            {isDemoAccount &&
            (inputs?.includes("primaryBusiness") ||
              inputs?.includes("secondaryBusiness")) ? (
              <>
                <h3 className="tw:text-base tw:font-bold tw:text-gray-900 tw:mb-2">
                  Information Updated
                </h3>
                <p className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                  Your profile has been updated successfully.
                </p>
              </>
            ) : (
              <>
                <h3 className="tw:text-base tw:font-bold tw:text-gray-900 tw:mb-2">
                  Sent for Approval
                </h3>
                <p className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                  Your update request has been submitted and is awaiting
                  StoreKing's review. Once approved, it will be updated in your
                  profile.
                </p>
              </>
            )}
          </div>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        {display === "form" && (
          <>
            <AppButton
              type="button"
              color="medium"
              onClick={() => callback({ action: "close" })}
              disabled={submitting}
              fill="outline"
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              color="primary"
              isLoading={submitting}
              disabled={submitting}
              onClick={onSubmit}
            >
              Save
            </AppButton>
          </>
        )}

        {display === "success" && (
          <AppButton
            type="button"
            color="primary"
            onClick={() => callback({ action: "success" })}
          >
            Got it
          </AppButton>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default GenericUpdateModal;
