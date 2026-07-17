import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Mail,
  User,
  IndianRupee,
  Camera,
  X,
} from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import CustomerService from "~/services/CustomerService";
import useAppToast from "~/hooks/useAppToast";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import CommonService from "~/services/CommonService";

const SUPPORTED_INPUTS = [
  "age",
  "gender",
  "email",
  "dob",
  "photo",
  "maritalStatus",
  "monthlyShoppingExpenses",
] as const;

type SupportedInput = (typeof SUPPORTED_INPUTS)[number];

interface CustomerUpdateModalProps {
  cid: string;
  show: boolean;
  callback: (result: { action: string; data?: any }) => void;
  inputs: string[];
}

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const maritalStatusOptions = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
];

const CustomerUpdateModal: React.FC<CustomerUpdateModalProps> = ({
  cid,
  show,
  callback,
  inputs,
}) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const { register, control, handleSubmit, reset, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const activeInputs = inputs.filter((k) =>
    SUPPORTED_INPUTS.includes(k as SupportedInput),
  );

  useEffect(() => {
    if (show && cid) {
      loadCustomer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, cid]);

  const loadCustomer = async () => {
    try {
      const resp = await CustomerService.getCustomer(cid);
      const data = resp?.data?.data || resp?.data;
      if (data) {
        setCustomerInfo({
          name: data.name || data.fullName || "",
          phone: data.phone || data.mobile || "",
        });
        if (activeInputs.includes("age")) {
          setValue("age", data.age || "");
        }
        if (activeInputs.includes("gender")) {
          setValue("gender", data.gender || "");
        }
        if (activeInputs.includes("email")) {
          setValue("email", data.email || "");
        }
        if (activeInputs.includes("dob")) {
          setValue("dob", data.dob ? new Date(data.dob) : undefined);
        }
        if (activeInputs.includes("maritalStatus")) {
          setValue("maritalStatus", data.maritalStatus || "");
        }
        if (activeInputs.includes("monthlyShoppingExpenses")) {
          setValue(
            "monthlyShoppingExpenses",
            data.monthlyShoppingExpenses || "",
          );
        }
        if (activeInputs.includes("photo") && data.profileImages?.[0]) {
          setPhotoAssetId(data.profileImages[0]);
        }
      }
    } catch {
      // silently fail, form starts empty
    }
  };

  const onSubmit = async (formData: any) => {
    const errors: string[] = [];

    for (const key of activeInputs) {
      switch (key) {
        case "email":
          if (!formData.email?.trim()) {
            errors.push("Email is required");
          } else if (!CommonService.isValidEmail(formData.email.trim())) {
            errors.push("Invalid email address");
          }
          break;
        case "age":
          if (!formData.age && formData.age !== 0) {
            errors.push("Age is required");
          } else if (Number(formData.age) < 1 || Number(formData.age) > 120) {
            errors.push("Age must be between 1 and 120");
          }
          break;
        case "gender":
          if (!formData.gender) {
            errors.push("Gender is required");
          }
          break;
        case "dob":
          if (!formData.dob) {
            errors.push("Date of birth is required");
          }
          break;
        case "maritalStatus":
          if (!formData.maritalStatus) {
            errors.push("Marital status is required");
          }
          break;
        case "monthlyShoppingExpenses":
          if (
            !formData.monthlyShoppingExpenses &&
            formData.monthlyShoppingExpenses !== 0
          ) {
            errors.push("Monthly shopping expenses is required");
          } else if (Number(formData.monthlyShoppingExpenses) < 0) {
            errors.push("Monthly shopping expenses must be a positive number");
          }
          break;
        case "photo":
          if (!photoAssetId) {
            errors.push("Photo is required");
          }
          break;
      }
    }

    if (errors.length > 0) {
      toast.show({ msg: errors[0], color: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {};

      if (activeInputs.includes("age") && formData.age) {
        payload.age = Number(formData.age);
      }
      if (activeInputs.includes("gender") && formData.gender) {
        payload.gender = formData.gender;
      }
      if (activeInputs.includes("email") && formData.email) {
        payload.email = formData.email;
      }
      if (activeInputs.includes("dob") && formData.dob) {
        payload.dob =
          formData.dob instanceof Date
            ? formData.dob.toISOString()
            : formData.dob;
      }
      if (activeInputs.includes("maritalStatus") && formData.maritalStatus) {
        payload.maritalStatus = formData.maritalStatus;
      }
      if (
        activeInputs.includes("monthlyShoppingExpenses") &&
        formData.monthlyShoppingExpenses
      ) {
        payload.monthlyShoppingExpenses = Number(
          formData.monthlyShoppingExpenses,
        );
      }
      if (activeInputs.includes("photo") && photoAssetId) {
        payload.profileImages = [photoAssetId];
      }

      const resp = await CustomerService.updateCustomer(cid, payload);
      toast.show({
        msg: t("updatedSuccessfully"),
        color: "success",
      });
      callback({ action: "success", data: resp });
    } catch (err: any) {
      toast.show({
        msg: err?.message || t("somethingWentWrong"),
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setPhotoAssetId(null);
    setCustomerInfo(null);
    callback({ action: "close" });
  };

  const handlePhotoUpload = (resp: any) => {
    const assetId = resp?.data?._id || resp?._id;
    if (assetId) {
      setPhotoAssetId(assetId);
    }
  };

  if (!show) return null;

  return (
    <AppModal show={show} callback={() => handleClose()}>
      <AppModal.Title onClose={handleClose}>
        <span className="tw:text-base tw:font-semibold">
          {t("updateCustomerInfo")}
        </span>
      </AppModal.Title>

      <AppModal.Content>
        <BusyLoader show={loading} />

        {customerInfo && (customerInfo.name || customerInfo.phone) && (
          <div className="tw:flex tw:items-center tw:gap-3 tw:p-3 tw:bg-gray-50 tw:rounded-lg tw:mb-4">
            <div className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:bg-primary/10 tw:text-primary">
              <User size={18} />
            </div>
            <div className="tw:flex tw:flex-col">
              {customerInfo.name && (
                <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                  {customerInfo.name}
                </span>
              )}
              {customerInfo.phone && (
                <span className="tw:text-xs tw:text-gray-500">
                  {customerInfo.phone}
                </span>
              )}
            </div>
          </div>
        )}

        <form
          id="customer-update-form"
          onSubmit={handleSubmit(onSubmit)}
          className="tw:flex tw:flex-col tw:gap-4 tw:mt-2"
        >
          {activeInputs.includes("photo") && (
            <div>
              {photoAssetId ? (
                <div className="tw:relative tw:w-24 tw:h-24 tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-300">
                  <ImgRender
                    assetId={photoAssetId}
                    alt={t("photo")}
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoAssetId(null)}
                    className="tw:absolute tw:top-1 tw:right-1 tw:bg-black/60 tw:text-white tw:rounded-full tw:p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <FileUpload
                  label={t("photo")}
                  onFileUpload={handlePhotoUpload}
                >
                  <div className="tw:border tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:cursor-pointer hover:tw:border-primary tw:transition-colors tw:flex tw:flex-col tw:items-center tw:gap-2">
                    <Camera size={24} className="tw:text-gray-400" />
                    <span className="tw:text-sm tw:text-gray-500">
                      {t("tapToUploadPhoto")}
                    </span>
                  </div>
                </FileUpload>
              )}
            </div>
          )}

          {activeInputs.includes("email") && (
            <AppInput
              name="email"
              label={t("email")}
              type="email"
              placeholder={t("enterEmail")}
              register={register}
              size="sm"
              isRequired
              leftIcon={<Mail size={16} />}
            />
          )}

          {activeInputs.includes("age") && (
            <AppInput
              name="age"
              label={t("age")}
              type="number"
              placeholder={t("enterAge")}
              register={register}
              size="sm"
              isRequired
              leftIcon={<User size={16} />}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== "" && Number(value) < 0) {
                  e.target.value = "0";
                }
              }}
            />
          )}

          {activeInputs.includes("gender") && (
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <AppSelect
                  label={t("gender")}
                  options={genderOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("selectGender")}
                  size="sm"
                  isRequired
                  inputClassName="tw:w-full"
                />
              )}
            />
          )}

          {activeInputs.includes("dob") && (
            <Controller
              control={control}
              name="dob"
              render={({ field }) => (
                <AppDateInput
                  label={t("dateOfBirth")}
                  value={field.value}
                  callback={(dt) => {
                    const val = Array.isArray(dt) ? dt[0] : dt;
                    field.onChange(val);
                  }}
                  placeholder={t("selectDob")}
                  size="sm"
                  isRequired
                  dateConfig={{
                    disabled: { after: new Date() },
                  }}
                />
              )}
            />
          )}

          {activeInputs.includes("maritalStatus") && (
            <Controller
              control={control}
              name="maritalStatus"
              render={({ field }) => (
                <AppSelect
                  label={t("maritalStatus")}
                  options={maritalStatusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("selectMaritalStatus")}
                  size="sm"
                  isRequired
                  inputClassName="tw:w-full"
                />
              )}
            />
          )}

          {activeInputs.includes("monthlyShoppingExpenses") && (
            <AppInput
              name="monthlyShoppingExpenses"
              label={t("monthlyShoppingExpenses")}
              type="number"
              placeholder={t("enterAmount")}
              register={register}
              size="sm"
              isRequired
              leftIcon={<IndianRupee size={16} />}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== "" && Number(value) < 0) {
                  e.target.value = "0";
                }
              }}
            />
          )}
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:w-full">
          <AppButton
            type="button"
            fill="outline"
            size="small"
            onClick={handleClose}
            className="tw:flex-1"
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            type="submit"
            size="small"
            form="customer-update-form"
            className="tw:flex-1"
            disabled={loading}
          >
            {loading ? t("updating") : t("update")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CustomerUpdateModal;
