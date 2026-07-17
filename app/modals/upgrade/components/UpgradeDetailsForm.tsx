import { ArrowLeft, Store } from "lucide-react";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";

interface UpgradeDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  onClose: () => void;
  data?: any;
}

interface FormData {
  storeName: string;
  whatsappNumber: string;
  storeOpenTime: string;
  storeCloseTime: string;
  storeSize: string;
  storePhoto: any[];
  deliveryRadius: number;
}

// Generate time options for the day (24-hour format)
const generateTimeOptions = () => {
  return FranchiseService.generateTimeOptions();
};

const timeOptions = generateTimeOptions();

const UpgradeDetailsForm: React.FC<UpgradeDetailsFormProps> = ({
  onNext,
  onBack,
  onClose,
  data,
}) => {
  const appToast = useAppToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      storeName: data?.name || "",
      whatsappNumber: data?.mobile || "",
      storeOpenTime: "",
      storeCloseTime: "",
      storeSize: "",
      storePhoto: [],
      deliveryRadius: undefined as unknown as number,
    },
  });

  const [storePhoto, storeOpenTime, storeCloseTime] = useWatch({
    control,
    name: ["storePhoto", "storeOpenTime", "storeCloseTime"] as const,
  });

  // Helper function to validate time relationship
  const validateTimeRelationship = (
    openTime: string,
    closeTime: string
  ): string | null => {
    if (!openTime || !closeTime) return null;

    const open = new Date(`2000-01-01T${openTime}`);
    const close = new Date(`2000-01-01T${closeTime}`);

    if (open >= close) {
      return "Opening time must be earlier than closing time";
    }

    return null;
  };

  // Get time validation error
  const timeValidationError = validateTimeRelationship(
    storeOpenTime,
    storeCloseTime
  );

  const validateForm = (data: FormData): boolean => {
    if (!data.storeName || data.storeName.trim() === "") {
      appToast.show({
        msg: "Store name is required",
        color: "error",
      });
      return false;
    }

    if (
      data.whatsappNumber &&
      !CommonService.isValidMobileNo(data.whatsappNumber)
    ) {
      appToast.show({
        msg: "Please enter a valid 10-digit WhatsApp number",
        color: "error",
      });
      return false;
    }

    if (!data.storeOpenTime || data.storeOpenTime.trim() === "") {
      appToast.show({
        msg: "Store opening time is required",
        color: "error",
      });
      return false;
    }

    if (!data.storeCloseTime || data.storeCloseTime.trim() === "") {
      appToast.show({
        msg: "Store closing time is required",
        color: "error",
      });
      return false;
    }

    // Validate that opening time is not greater than closing time
    const timeError = validateTimeRelationship(
      data.storeOpenTime,
      data.storeCloseTime
    );
    if (timeError) {
      appToast.show({
        msg: timeError,
        color: "error",
      });
      return false;
    }

    if (!data.storeSize || data.storeSize.trim() === "") {
      appToast.show({
        msg: "Store size is required",
        color: "error",
      });
      return false;
    }

    if (!data.deliveryRadius || data.deliveryRadius <= 0) {
      appToast.show({
        msg: "Delivery radius must be greater than 0",
        color: "error",
      });
      return false;
    }

    if (data.deliveryRadius > 50) {
      appToast.show({
        msg: "Delivery radius cannot exceed 50 km",
        color: "error",
      });
      return false;
    }

    return true;
  };

  const onSubmit = async (fromData: FormData) => {
    if (!validateForm(fromData)) {
      return;
    }

    setIsProcessing(true);

    try {
      // Transform form data to match API payload structure
      const upgradePayload = {
        franchiseId: data?.franchiseId || "",
        mobile: Number(data.mobile || "").toString(),
        whatsAppNumber: fromData.whatsappNumber
          ? Number(fromData.whatsappNumber)
          : undefined,
        name: fromData.storeName,
        operatingHours: {
          openTime: fromData.storeOpenTime,
          closeTime: fromData.storeCloseTime,
        },
        storeSize: fromData.storeSize,
        remarks: `Upgrade request for store: ${fromData.storeName}`,
      };

      // Call the franchise upgrade API
      const response = await FranchiseService.upgradeStore(
        data?.franchiseId || "",
        upgradePayload
      );

      // Check if the API call was successful
      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({
          msg: "Upgrade request submitted successfully!",
          color: "success",
        });

        onNext({
          storeDetails: data,
          submissionDate: new Date().toISOString(),
          apiResponse: response,
        });
      } else {
        // Handle API error with specific status code
        const errorMessage = response.data?.message;
        appToast.show({
          msg:
            errorMessage ||
            "Failed to submit upgrade request. Please try again.",
          color: "error",
        });
      }
    } catch (error: any) {
      // Handle network or other errors
      console.error("Upgrade request error:", error);

      let errorMessage = "Failed to submit upgrade request. Please try again.";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      appToast.show({
        msg: errorMessage,
        color: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (fileData: any) => {
    const current = storePhoto || [];
    setValue("storePhoto", [...current, { id: fileData._id }]);
  };

  const handleRemovePhoto = (index: number) => {
    const current = storePhoto || [];
    const next = current.filter((_, i) => i !== index);
    setValue("storePhoto", next);
  };

  const handleDeliveryRadiusChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const parsed = Number(value);

    // Allow empty string for clearing (store undefined)
    if (value === "") {
      setValue("deliveryRadius", undefined as unknown as number);
      return;
    }

    if (isNaN(parsed)) {
      return;
    }

    // Normalize: non-negative, remove decimals, clamp to 50
    let normalized = Math.abs(parsed);
    normalized = Math.floor(normalized);
    if (normalized > 50) normalized = 50;

    setValue("deliveryRadius", normalized);
  };

  const handleWhatsappNumberChange = () => {
    const value = getValues("whatsappNumber");
    if (Number(value) < 0) {
      setValue("whatsappNumber", "");
    }
  };

  return (
    <>
      <AppModal.Title onClose={onClose} noBg={true}>
        <div className="tw:flex tw:items-center tw:gap-3">
          {/* <button
            onClick={onBack}
            className="tw:p-1 tw:hover:bg-gray-100 tw:rounded-full"
          >
            <ArrowLeft className="tw:w-5 tw:h-5" />
          </button> */}
          <div>
            <div className="tw:font-semibold tw:text-lg">
              Tell Us About Your Store
            </div>
            <div className="tw:text-sm tw:text-gray-500">
              Help us customize your online supermarket experience
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-6">
          {/* Store Information */}
          <div>
            <div className="tw:space-y-4">
              <AppInput
                name="storeName"
                register={register}
                label="Store Name"
                placeholder="e.g., Sharma General Store"
                isRequired
                error={errors.storeName?.message}
                maxLength={100}
                inputClassName="tw:bg-white"
              />

              <AppInput
                name="whatsappNumber"
                register={register}
                label="WhatsApp Number"
                placeholder="e.g., 9876543210"
                type="number"
                error={errors.whatsappNumber?.message}
                maxLength={10}
                inputClassName="tw:bg-white"
                onChange={handleWhatsappNumberChange}
              />

              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <Controller
                  name="storeOpenTime"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Store Opening Time"
                      placeholder="e.g., 09:00 AM"
                      options={timeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      isRequired
                      error={
                        errors.storeOpenTime?.message ||
                        timeValidationError ||
                        undefined
                      }
                      inputClassName="tw:w-full tw:bg-white"
                    />
                  )}
                />
                <Controller
                  name="storeCloseTime"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Store Closing Time"
                      placeholder="e.g., 09:00 PM"
                      options={timeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      isRequired
                      error={
                        errors.storeCloseTime?.message ||
                        timeValidationError ||
                        undefined
                      }
                      inputClassName="tw:w-full tw:bg-white"
                    />
                  )}
                />
              </div>

              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <AppInput
                  name="storeSize"
                  register={register}
                  label="Store Size"
                  placeholder="e.g., 500 sq ft"
                  isRequired
                  error={errors.storeSize?.message}
                  maxLength={10}
                  inputClassName="tw:bg-white"
                />
                <AppInput
                  name="deliveryRadius"
                  register={register}
                  label="Delivery Radius (km)"
                  placeholder="e.g., 5"
                  type="number"
                  isRequired
                  error={errors.deliveryRadius?.message}
                  onChange={handleDeliveryRadiusChange}
                  inputClassName="tw:bg-white"
                />
              </div>

              <div>
                <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
                  Store Photo
                </label>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  allowedExtensions={["jpg", "jpeg", "png"]}
                  maxSizeMB={5}
                  label="Upload Store Photo"
                  note="Upload a clear photo of your store (JPG, PNG, max 5MB)"
                />
                {Array.isArray(storePhoto) && storePhoto.length > 0 && (
                  <div className="tw:mt-3">
                    <FileUploadedSlide
                      images={storePhoto}
                      onRemove={handleRemovePhoto}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-3 tw:w-full">
          <AppButton
            fill="outline"
            color="dark"
            onClick={onBack}
            className="tw:flex-1"
          >
            Back
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            disabled={isProcessing}
            className="tw:flex-1"
          >
            {isProcessing ? "Submitting..." : "Submit Information"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </>
  );
};

export default UpgradeDetailsForm;
