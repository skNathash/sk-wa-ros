import { CreditCard, QrCode, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";

interface ImgPreviewState {
  show: boolean;
  images: Array<{ id: string }>;
  active?: string;
}

const defaultBreadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Configs", redirect: { path: "/configs/settings" } },
  { label: "Payment Config" },
];

const tabItems: TabItem[] = [
  { key: "upi", name: "UPI", icon: <QrCode /> },
  { key: "gpay", name: "GPay", icon: <Smartphone /> },
  { key: "phonepe", name: "PhonePe", icon: <Smartphone /> },
  { key: "paytm", name: "Paytm", icon: <Smartphone /> },
];

const PaymentConfig = () => {
  const { show: showToast } = useAppToast();

  // Form state using react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<{
    displayName: string;
    merchantName: string;
    upiId: string;
    handleId: string;
    qrCode: string;
    additionalNotes: string;
    uploads: Array<{ id: string }>;
  }>({
    defaultValues: {
      displayName: "UPI Payment",
      merchantName: "",
      upiId: "",
      handleId: "",
      qrCode: "",
      additionalNotes: "",
      uploads: [],
    },
  });

  // Use useWatch to watch the uploads field
  const uploads = useWatch({ control, name: "uploads" });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("upi");

  const [busyloader, setBusyloader] = useState({
    loading: false,
    msg: "",
  });

  const [imgPreview, setImgPreview] = useState<ImgPreviewState>({
    show: false,
    images: [],
    active: undefined,
  });

  const [existingConfig, setExistingConfig] = useState<any>(null);

  // Function to auto-fill form based on active tab and existing config
  // Accept an optional config param so callers can pass freshly-fetched data
  // (avoids relying on a state update that may not be flushed yet).
  const autoFillFormFromConfig = (tabKey: string, configParam?: any) => {
    const cfg = configParam ?? existingConfig;
    if (!cfg?.paymentMethodConfig) {
      reset({
        displayName:
          tabKey === "upi"
            ? "UPI Payment"
            : tabKey === "gpay"
            ? "Google Pay"
            : tabKey === "phonepe"
            ? "PhonePe Payment"
            : "Paytm Payment",
        merchantName: "",
        upiId: "",
        handleId: "",
        qrCode: "",
        additionalNotes: "",
        uploads: [],
      });
      return;
    }

    // Find the payment method config that matches the active tab
    const paymentConfig = cfg.paymentMethodConfig.find(
      (config: any) =>
        config.paymentMethod?.toLowerCase() === tabKey.toLowerCase()
    );

    if (paymentConfig) {
      // Auto-fill form fields with existing data
      setValue("displayName", paymentConfig.displayName || "");
      setValue("merchantName", paymentConfig.merchantName || "");

      // Set UPI ID or Handle ID based on tab
      if (tabKey === "upi") {
        setValue("upiId", paymentConfig.refCode || "");
      } else {
        setValue("handleId", paymentConfig.refCode || "");
      }

      setValue("additionalNotes", paymentConfig.additionalNotes || "");

      // Set uploads if images exist
      if (paymentConfig.images && paymentConfig.images.length > 0) {
        setValue(
          "uploads",
          paymentConfig.images.map((img: string) => ({ id: img }))
        );
      } else {
        setValue("uploads", []);
      }
    } else {
      // Reset form if no existing config found for this tab
      reset({
        displayName:
          tabKey === "upi"
            ? "UPI Payment"
            : tabKey === "gpay"
            ? "Google Pay"
            : tabKey === "phonepe"
            ? "PhonePe Payment"
            : "Paytm Payment",
        merchantName: "",
        upiId: "",
        handleId: "",
        qrCode: "",
        additionalNotes: "",
        uploads: [],
      });
    }
  };

  const fetchConfigs = async () => {
    try {
      const franchiseId = AuthService.getLoggedInUserId();
      if (franchiseId) {
        const res = await FranchiseService.getConfigs({});
        // Check if config already exists
        const configData = res?.data?.data?.[0];
        if (configData) {
          setExistingConfig(configData);
          setPayments(configData.paymentMethodConfig || []);
          // Auto-fill form after fetching config - pass configData directly
          // to avoid stale state inside autoFillFormFromConfig
          autoFillFormFromConfig(activeTab, configData);
        } else {
          setExistingConfig(null);
          setPayments([]);
        }
      }
    } catch (e) {
      setExistingConfig(null);
      setPayments([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchConfigs().finally(() => {
      setLoading(false);
    });
  }, []);

  const handleImgPreviewOpen = (imgId: string) => {
    setImgPreview({ show: true, images: getAllQrImages(), active: imgId });
  };

  const handleImgPreviewClose = () => {
    setImgPreview({ show: false, images: [], active: undefined });
  };

  function getAllQrImages(): Array<{ id: string }> {
    return payments
      .map((method) => {
        // Prefer images array when present, fall back to qrCode field for older entries
        if (method.images && method.images.length > 0) {
          return { id: String(method.images[0]) };
        }
        if (method.qrCode) {
          return { id: String(method.qrCode) };
        }
        return undefined;
      })
      .filter((img): img is { id: string } => Boolean(img));
  }

  const handleTabChange = async (tab: TabItem) => {
    setBusyloader({ loading: true, msg: "Loading..." });
    await fetchConfigs();
    setBusyloader({ loading: false, msg: "" });
    setActiveTab(tab.key);
    // Auto-fill form based on existing config for the selected tab
    autoFillFormFromConfig(tab.key);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "upi":
        return "UPI Payment Configuration";
      case "gpay":
        return "Google Pay Configuration";
      case "phonepe":
        return "PhonePe Configuration";
      case "paytm":
        return "Paytm Configuration";
      default:
        return "Payment Configuration";
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case "upi":
        return <QrCode />;
      case "gpay":
        return <Smartphone />;
      case "phonepe":
        return <Smartphone />;
      case "paytm":
        return <Smartphone />;
      default:
        return <CreditCard />;
    }
  };

  const handleFileUpload = (response: any) => {
    if (response?._id) {
      // Update the uploads field with the uploaded file ID
      // Allow only one image as requested
      setValue("uploads", [{ id: response._id }]);
    }
  };

  const handleFileRemove = () => {
    // Remove the uploaded image
    setValue("uploads", []);
  };

  // Validation function that validates one field at a time
  const validateFormData = (data: any): { isValid: boolean; msg?: string } => {
    let isValid = true;
    let errorMsg = "";

    // Validate display name
    if (!data.displayName || data.displayName.trim() === "") {
      isValid = false;
      errorMsg = "Display name is required";
    } else if (data.displayName.trim().length < 3) {
      isValid = false;
      errorMsg = "Display name must be at least 3 characters long";
    }
    // Validate merchant name
    else if (!data.merchantName || data.merchantName.trim() === "") {
      isValid = false;
      errorMsg = "Merchant name is required";
    } else if (data.merchantName.trim().length < 2) {
      isValid = false;
      errorMsg = "Merchant name must be at least 2 characters long";
    }
    // Validate UPI ID for UPI tab
    else if (activeTab === "upi") {
      if (!data.upiId || data.upiId.trim() === "") {
        isValid = false;
        errorMsg = "UPI ID is required for UPI payment method";
      } else {
        // Basic UPI ID format validation (should contain @ symbol)
        const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!upiIdRegex.test(data.upiId.trim())) {
          isValid = false;
          errorMsg = "Please enter a valid UPI ID format (e.g., merchant@bank)";
        }
      }
    }
    // Validate Handle ID for non-UPI tabs
    else if (activeTab !== "upi") {
      if (!data.handleId || data.handleId.trim() === "") {
        isValid = false;
        errorMsg = "Handle ID is required for this payment method";
      } else if (data.handleId.trim().length < 3) {
        isValid = false;
        errorMsg = "Handle ID must be at least 3 characters long";
      }
    }
    // Validate QR code (optional but recommended)
    else if (!data.qrCode || data.qrCode.trim() === "") {
      isValid = false;
      errorMsg = "QR code image is required for payment configuration";
    }

    return { isValid, msg: errorMsg };
  };

  const onSubmit = async (data: any) => {
    // Validate form data
    const validation = validateFormData(data);
    if (!validation.isValid) {
      showToast({
        msg: validation.msg || "Please check your form data",
        color: "error",
        duration: 4000,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Set refCode based on activeTab
      const refCode = activeTab === "upi" ? data.upiId : data.handleId;
      // Prepare images object if uploads exist
      let images: string[] = [];
      if (data.uploads && data.uploads.length > 0) {
        images = data.uploads.map((u: { id: string }) => u.id);
      }
      // Prepare payment method configuration
      const paymentMethod = {
        paymentMethod: activeTab.toUpperCase(),
        displayName: data.displayName,
        merchantName: data.merchantName,
        refCode,
        additionalNotes: data.additionalNotes || "",
        isActive: true,
        images,
      };
      // Get current payments data and find matching type
      const currentPaymentConfigs = [...payments];
      // paymentMethod is the stored key (e.g. 'UPI', 'GVERY') — compare case-insensitively
      const existingIndex = currentPaymentConfigs.findIndex(
        (config) =>
          String(config.paymentMethod || "").toLowerCase() ===
          activeTab.toLowerCase()
      );
      if (existingIndex !== -1) {
        currentPaymentConfigs[existingIndex] = {
          ...currentPaymentConfigs[existingIndex],
          ...paymentMethod,
        };
      } else {
        currentPaymentConfigs.push(paymentMethod);
      }
      // Prepare payload for API
      const payload = {
        paymentMethodConfig: currentPaymentConfigs,
      };
      // Call the API
      const franchiseId = AuthService.getLoggedInUserId();
      if (franchiseId) {
        let response;

        if (existingConfig) {
          // Config already exists, update it
          response = await FranchiseService.updateConfigs(
            existingConfig._id,
            payload
          );
        } else {
          // Config doesn't exist, create new one
          response = await FranchiseService.createConfigs(payload);
        }

        // Handle API response based on status code
        if (response?.statusCode === 200 || response?.statusCode === 201) {
          // Update local state with new data
          setPayments(currentPaymentConfigs);

          // Update existing config state if it was created
          if (!existingConfig && response?.data?.data) {
            setExistingConfig(response.data.data);
          }

          // Show success message
          showToast({
            msg: "Payment configuration saved successfully!",
            color: "success",
            duration: 3000,
          });
        } else {
          // Handle API error with specific message
          const errorMessage =
            response?.data?.message || "Failed to save payment configuration";
          throw new Error(errorMessage);
        }
      } else {
        throw new Error("Franchise ID not found");
      }
    } catch (error) {
      console.error("Error saving payment configuration:", error);
      showToast({
        msg:
          error instanceof Error
            ? error.message
            : "Failed to save payment configuration. Please try again.",
        color: "error",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title={getTabTitle()} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={defaultBreadcrumbs} />
          </div>
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            Configure the payment methods your customer accepts. Add, view, or
            remove payment options.
          </div>

          <BusyLoader show={loading} />

          {!loading && (
            <>
              <AppTab
                tabs={tabItems}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="tabs"
                className="tw:mb-6"
              />

              <AppCard title={`${getTabTitle()}`} icon={getTabIcon()}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="tw:space-y-6">
                    {/* First row - Grid view for display name and merchant name */}
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                      <AppInput
                        name="displayName"
                        label="Display Name"
                        placeholder="Enter display name"
                        register={register}
                        error={errors.displayName?.message}
                        isRequired
                      />
                      <AppInput
                        name="merchantName"
                        label="Merchant Name"
                        placeholder="Enter merchant name"
                        register={register}
                        error={errors.merchantName?.message}
                        isRequired
                      />
                    </div>

                    {/* Divider */}
                    <div className="tw:border-t tw:border-gray-200 tw:my-6"></div>

                    {/* Remaining inputs without grid view */}
                    <div className="tw:space-y-4">
                      {/* UPI ID - Only show for UPI */}
                      {activeTab === "upi" && (
                        <AppInput
                          name="upiId"
                          label="UPI ID"
                          placeholder="Enter UPI ID (e.g., merchant@bank)"
                          register={register}
                          error={errors.upiId?.message}
                          isRequired
                        />
                      )}

                      {/* Handle ID - Hidden for UPI */}
                      {activeTab !== "upi" && (
                        <AppInput
                          name="handleId"
                          label="Handle ID"
                          placeholder="Enter handle ID"
                          register={register}
                          error={errors.handleId?.message}
                          isRequired
                        />
                      )}

                      {/* QR Code Upload - Toggle based on uploads data */}
                      <div>
                        <label className="tw:block tw:mb-2 tw:text-sm tw:font-medium">
                          Upload QR Code
                        </label>
                        {uploads && uploads.length > 0 ? (
                          <FileUploadPreview
                            image={uploads[0].id}
                            onRemove={handleFileRemove}
                            onImageClick={handleImgPreviewOpen}
                          />
                        ) : (
                          <FileUpload
                            maxSizeMB={5}
                            allowedExtensions={["jpg", "jpeg", "png"]}
                            onFileUpload={handleFileUpload}
                            label="Choose QR Code Image"
                          >
                            <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-6 tw:bg-gray-50 tw:flex tw:flex-col tw:items-center tw:justify-center tw:cursor-pointer hover:tw:bg-gray-100 tw:transition-colors">
                              <QrCode
                                size={48}
                                className="tw:text-gray-400 tw:mb-2"
                              />
                              <div className="tw:text-lg tw:font-semibold tw:text-blue-600">
                                Choose QR Code Image
                              </div>
                              <div className="tw:text-xs tw:text-gray-400">
                                JPG, PNG up to 5MB
                              </div>
                            </div>
                          </FileUpload>
                        )}
                      </div>

                      {/* Additional Notes */}
                      <AppTextarea
                        name="additionalNotes"
                        label="Additional Notes"
                        placeholder="Enter any additional notes or instructions"
                        register={register}
                        error={errors.additionalNotes?.message}
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="tw:flex tw:justify-end tw:pt-4">
                      <AppButton
                        type="submit"
                        color="primary"
                        size="small"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Configuration"}
                      </AppButton>
                    </div>
                  </div>
                </form>
              </AppCard>
            </>
          )}
        </div>
      </div>

      <ImgPreviewModal
        show={imgPreview.show}
        images={imgPreview.images}
        callback={handleImgPreviewClose}
      />

      <BusyLoader show={busyloader.loading} message={busyloader.msg} />
    </>
  );
};

export default PaymentConfig;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Payment Configuration"),
    },
  ];
}
