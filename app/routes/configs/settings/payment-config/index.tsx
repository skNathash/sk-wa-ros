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
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SettingsSidePane from "~/shared/settings/components/settings-side-pane/SettingsSidePane";
import { settingsSectionTabs } from "~/shared/settings/components/settings-side-pane/helper";
import AppTab from "~/components/core/tab/AppTab";
import useAppToast from "~/hooks/useAppToast";
import { useIsMobile } from "~/hooks/use-mobile";
import useTheme from "~/hooks/useTheme";
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
  const isMobile = useIsMobile();
  // theme-2 reads sub-navs as free-standing pills, not the grey segmented bar.
  const isTheme2 = useTheme() === "theme-2";

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
        config.paymentMethod?.toLowerCase() === tabKey.toLowerCase(),
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
          paymentConfig.images.map((img: string) => ({ id: img })),
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

  // Returns the fetched config so callers switching tabs can fill the form from
  // the fresh response instead of the not-yet-flushed `existingConfig` state.
  const fetchConfigs = async (tabKey: string = activeTab) => {
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
          autoFillFormFromConfig(tabKey, configData);
          return configData;
        }
        setExistingConfig(null);
        setPayments([]);
        // No config on the server yet — `{}` forces the defaults for `tabKey`
        // rather than reading the stale `existingConfig` state.
        autoFillFormFromConfig(tabKey, {});
      }
    } catch (e) {
      setExistingConfig(null);
      setPayments([]);
    }
    return null;
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
    if (tab.key === activeTab) return;
    // Move the highlight first so the strip responds on tap; the refetch then
    // fills the form for the tab we just moved to.
    setActiveTab(tab.key);
    setBusyloader({ loading: true, msg: "Loading..." });
    await fetchConfigs(tab.key);
    setBusyloader({ loading: false, msg: "" });
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
          activeTab.toLowerCase(),
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
            payload,
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
      <AppHeader
        title={getTabTitle()}
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Settings menu on mobile — theme-2 only (see theme-2.css); the
              desktop equivalent is the side pane below. */}
          <SectionTabs
            tabs={settingsSectionTabs}
            activeTab={"payment-config"}
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail. Settings is a tab of the Profile
                section, so the rail keeps listing the profile entries with
                "Settings" highlighted; moving between the individual config
                pages is the side pane's job. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="settings"
                  title={"Settings"}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Full span: in theme-2 desktop the pane is lifted out of the
                    grid, so the main column owns all 12 columns. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Breadcrumbs + blurb are dropped entirely in theme-2 (they'd
                      be hidden there anyway). Not rendered rather than
                      CSS-hidden so the tab strip below is the column's first
                      child and lands flush under the sticky section bar —
                      same treatment as the bulk upload layout. */}
                  {!isTheme2 && (
                    <>
                      <div className="tw:flex tw:justify-between tw:items-center">
                        <AppBreadcrumbs data={defaultBreadcrumbs} />
                      </div>
                      <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
                        Configure the payment methods your customer accepts.
                        Add, view, or remove payment options.
                      </div>
                    </>
                  )}

                  {/* theme-2 mobile renders the sub-nav as the full-bleed
                      underlined tray pinned right below the sticky section pill
                      bar; theme-2 desktop pins the pills on their own white
                      band (same treatment as the bulk upload / barcode scan
                      sub-navs) so they don't float on page-bg; the other themes
                      keep the segmented control. Kept outside the `loading`
                      branch so the strip stays the column's first child. */}
                  <AppTab
                    tabs={tabItems}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    variant={isTheme2 ? (isMobile ? "underline" : "pills") : "tabs"}
                    className={
                      isTheme2
                        ? isMobile
                          ? "edge-tabs app-tabs-tray app-tabs-sticky"
                          : "subscribe-tabs-sticky barcode-tabs-pills"
                        : "tw:mb-6"
                    }
                    scrollable={isTheme2 && isMobile}
                  />

                  <BusyLoader show={loading} />

                  {!loading && (
                    <>
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
                                {isSubmitting
                                  ? "Saving..."
                                  : "Save Configuration"}
                              </AppButton>
                            </div>
                          </div>
                        </form>
                      </AppCard>
                    </>
                  )}
                </AppPaneMain>

                <SettingsSidePane activeKey="payment-config" />
              </div>
            </div>
          </div>
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
