import { CheckCheck, EditIcon, MapPin } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox, AppInput, AppPincodeInput } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import StaticGMap from "~/components/core/map/StaticGMap";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useGeoLocation from "~/hooks/useGeoLocation";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import GeoLocationModal from "~/modals/feature/geo-location/GeoLocationModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import VendorService from "~/services/VendorService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import VendorSidePane from "~/shared/vendor/components/vendor-side-pane/VendorSidePane";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import type {
  PincodeData,
  VendorData,
  VendorFormData,
} from "~/types/VendorTypes";
import ConfirmationModal from "./ConfirmationModal";
import VendorExistsModal, { type ExistingVendor } from "./VendorExistsModal";
import { defaultFormData, preparePayload, validateForm } from "./helper";
import UploadForm from "./UploadForm";
import PageDescription from "~/components/core/page-description/PageDescription";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.ADD", "VENDOR.UPDATE"], {
    blockForMasterLogin: true,
  });
}

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Vendors",
    redirect: {
      path: "/dashboard/vendor/list",
    },
  },
  {
    label: "Manage Vendor",
  },
];

const VendorManage = () => {
  const [searchParams] = useSearchParams();
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { t } = useTranslation(["common", "menu"]);

  const formMethods = useForm<VendorFormData>({
    defaultValues: {
      ...defaultFormData,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors },
    control,
  } = formMethods;

  const vendorId = searchParams.get("id");
  const isEditing = !!vendorId;

  const [breadcrumbs, setBreadcrumbs] =
    useState<BreadcrumbItem[]>(defaultBreadcrumbs);

  const [activeTab, setActiveTab] = useState<string>("basic");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCreatedByMe, setIsCreatedByMe] = useState<boolean | null>(null);
  const [pincodeData, setPincodeData] = useState<PincodeData>({
    city: "",
    state: "",
    district: "",
  });

  // track whether vendor data load completed (so we don't overwrite existing coords)
  const vendorDataLoadedRef = useRef(false);

  const { pickLocation } = useGeoLocation();

  // Geo location modal state {show, lat, lng}
  const [geoModal, setGeoModal] = useState<{
    show: boolean;
    lat?: number | null;
    lng?: number | null;
  }>({ show: false });

  // OTP related state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpId, setOtpId] = useState<string>("");
  const [pendingVendorId, setPendingVendorId] = useState<string>("");
  const [validatingOtp, setValidatingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [vendorPayloadForRegister, setVendorPayloadForRegister] =
    useState<Record<string, any> | null>(null);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    show: boolean;
    formData: VendorFormData;
    pincodeData: PincodeData;
    brands: any[];
  }>({
    show: false,
    formData: defaultFormData,
    pincodeData: { city: "", state: "", district: "" },
    brands: [],
  });

  // Existing-vendor modal state (shown when the entered mobile/GST already
  // exists). `source` tracks which field triggered it so we can clear it on close.
  const [existsModal, setExistsModal] = useState<{
    show: boolean;
    vendor: ExistingVendor | null;
    source: "contactMobile" | "gst" | null;
  }>({ show: false, vendor: null, source: null });

  // Brand margins state - using the same structure as PosAdvanceFilterModal
  const [selectedBrands, setSelectedBrands] = useState<any[]>([]);

  const [sourceAllBrands] = useWatch({
    control,
    name: ["sourceAllBrands"],
  });

  const [watchedState, watchedDistrict, watchedTown] = useWatch({
    control,
    name: ["state", "district", "town"],
  });

  // watch lat/lng from form to show static map when present
  const [watchedLat, watchedLng] = useWatch({
    control,
    name: ["lat", "lng"],
  });

  useEffect(() => {
    if (searchParams.get("from") === "import") {
      setBreadcrumbs((prev) => {
        const newBreadcrumbs = [...prev];
        newBreadcrumbs[1] = {
          label: "Vendors",
          redirect: {
            path: "/dashboard/vendor/list",
          },
        };
        return newBreadcrumbs;
      });
    } else {
      setBreadcrumbs(defaultBreadcrumbs);
    }
  }, [searchParams]);

  // Load vendor data for editing
  useEffect(() => {
    if (isEditing && vendorId) {
      loadVendorData(vendorId);
    }
  }, [isEditing, vendorId]);

  const loadVendorData = async (id: string) => {
    try {
      setLoading(true);
      const response = await VendorService.getDetail(id, {
        filter: {
          franchiseId: AuthService.getLoggedInUserId(),
        },
      });

      if (response?.statusCode === 200 && response?.data?.data) {
        const vendor: VendorData = response.data.data;
        // capture whether this vendor was created by the logged-in user's franchise
        setIsCreatedByMe(Boolean((vendor as any)._isCreatedByMe));
        const contact = vendor.contact?.[0] || {};

        // Prepare selectedBrands from sourceableBrands (API response)
        let selectedBrandsArr: any[] = [];

        if (
          vendor.sourceableBrands &&
          Array.isArray(vendor.sourceableBrands) &&
          vendor.sourceableBrands.length > 0
        ) {
          selectedBrandsArr = vendor.sourceableBrands
            .map((b: any) => ({
              label: b.brandName || b.brand_name || "",
              value: {
                id: b.brandId || b.brand_id || "",
                name: b.brandName || b.brand_name || "",
                _id: b.id,
              },
            }))
            .filter((b: any) => b.value.id && b.label);
        }

        // Populate form with vendor data (auto-fill address fields from vendor.address if present)
        const address = vendor.address || {};
        const formValues = {
          vendorName: vendor.name || "",
          doorNo: (address as any).doorNo || (address as any).door_no || "",
          addressLine1: (address as any).street || (address as any).line1 || "",
          landmark: (address as any).landmark || "",
          pincode:
            (address as any).postcode ||
            (address as any).pincode ||
            vendor.pincode ||
            "",
          state: vendor.address?.state || "",
          district: vendor.address?.district || "",
          town: vendor.address?.town || "",
          contactName: contact.name || "",
          contactMobile: contact.mobile || "",
          contactEmail: contact.email || "",
          pan: vendor.pan || "",
          gst: vendor.gst_no || "",
          aadharNo:
            vendor.documents?.find((d: any) => d.type === "Aadhar")?.refNo ||
            "",
          panImg:
            vendor.documents?.find((d: any) => d.type === "PAN")?.assetId || "",
          gstImg:
            vendor.documents?.find((d: any) => d.type === "GST")?.assetId || "",
          cancelChqImg:
            vendor.documents?.find((d: any) => d.type === "Cancel Cheque")
              ?.assetId || "",
          sourceAllBrands: vendor.sourceAllBrands,
        };

        // Read coordinates from geoPoint.coordinates (API uses [lng, lat])
        const geoPointCoords = (vendor as any).geoPoint?.coordinates;
        if (Array.isArray(geoPointCoords) && geoPointCoords.length >= 2) {
          const lngFromVendor = geoPointCoords[0];
          const latFromVendor = geoPointCoords[1];
          // Attach to form values so reset populates them
          (formValues as any).lat = latFromVendor ?? null;
          (formValues as any).lng = lngFromVendor ?? null;
        }

        // No need to pre-load SDT options here as SdtLocation manages its own state

        setSelectedBrands(selectedBrandsArr);
        reset(formValues);
        // mark vendor data load finished so initial location pick doesn't override existing coords
        vendorDataLoadedRef.current = true;

        // If editing an existing vendor and coordinates are missing, assign Bangalore fallback
        if (isEditing) {
          const latVal = (formValues as any).lat;
          const lngVal = (formValues as any).lng;
          if (latVal == null || lngVal == null) {
            const bangaloreLat = 12.9715987;
            const bangaloreLng = 77.5945627;
            setValue("lat", bangaloreLat);
            setValue("lng", bangaloreLng);
          }
        }

        // Set pincode data from vendor fields
        setPincodeData({
          city: formValues.town || "",
          state: formValues.state || "",
          district: formValues.district || "",
        });

        // If vendor had coordinates, also ensure geoModal/watchers reflect them
        if (
          (formValues as any).lat != null &&
          (formValues as any).lng != null
        ) {
          setValue("lat", (formValues as any).lat);
          setValue("lng", (formValues as any).lng);
        }
      } else {
        appToast.show({
          msg: response?.data?.message || t("vendorDetailsNotFound"),
          color: "danger",
        });
        appNav.back();
      }
    } catch (error) {
      console.error("Error loading vendor data:", error);
      appToast.show({
        msg: t("failedToLoadVendorDetails"),
        color: "danger",
      });
      appNav.back();
    } finally {
      setLoading(false);
    }
  };

  // Try to pick current location when no lat/lng is provided in the form.
  // If permission denied or unavailable, fallback to Bangalore coordinates.
  useEffect(() => {
    const initLocation = () => {
      const currentLat = getValues("lat");
      const currentLng = getValues("lng");

      // if form already has coordinates (e.g., editing vendor), don't override
      if (currentLat != null || currentLng != null) return;

      pickLocation((res: any) => {
        if (res && res.lat != null && res.lng != null) {
          setValue("lat", res.lat);
          setValue("lng", res.lng);
          // show geo modal so user can adjust if desired
          setGeoModal({ show: true, lat: res.lat, lng: res.lng });
        } else {
          // fallback to Bangalore coordinates when location unavailable
          const bangaloreLat = 12.9715987;
          const bangaloreLng = 77.5945627;
          setValue("lat", bangaloreLat);
          setValue("lng", bangaloreLng);
        }
      });
    };

    // Only attempt to initialize if vendor data hasn't explicitly loaded with coords
    if (!vendorDataLoadedRef.current) {
      // small delay to ensure form is registered
      const t = setTimeout(() => {
        initLocation();
        clearTimeout(t);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePincodeSelect = async (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      setValue("pincode", data.value?.toString() || "");
      setPincodeData({
        city: data.data.town || "",
        state: data.data.state || "",
        district: data.data.district || "",
      });

      // Also set the form values for state, district, and town
      setValue("state", data.data.state || "");
      setValue("district", data.data.district || "");
      setValue("town", data.data.town || "");

      // If pincode data contains lat/long open geo modal and save lat/lng in form
      if (data.data.lat && data.data.long) {
        const lat = Number(data.data.lat);
        // some sources use 'long' for longitude; fallback to 'lng' if needed
        const lng = Number(data.data.long);
        setValue("lat", lat);
        setValue("lng", lng);
        setGeoModal({ show: true, lat, lng });
      }
    } else if (data.status === "error") {
      console.error(t("invalidPincodeOrNoData"));
      setPincodeData({ city: "", state: "", district: "" });
      setValue("state", "");
      setValue("district", "");
      setValue("town", "");
    } else {
      setValue("pincode", data.value?.toString() || "");
      if (!data.value || data.value.toString().length < 6) {
        setPincodeData({ city: "", state: "", district: "" });
        setValue("state", "");
        setValue("district", "");
        setValue("town", "");
      }
    }
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pan = CommonService.formatPan(e.target.value);
    setValue("pan", pan);
  };

  const handleGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gst = CommonService.formatGst(e.target.value);
    setValue("gst", gst);
    // Check for an existing vendor once a valid GST number is entered
    if (CommonService.isValidGst(gst)) {
      checkVendorExists(gst, "gst");
    }
  };

  // Debounced check to see whether a vendor with the entered term (mobile or
  // GST) already exists. If found, surface the "already exists" modal with the
  // option to link that vendor to the logged-in user's vendor list.
  const checkVendorExists = useDebouncedCallback(
    async (term: string, source: "contactMobile" | "gst") => {
      // Only relevant while creating a new vendor
      if (isEditing || !term) return;

      try {
        const response = await VendorService.getDashboardVendorList({
          page: 1,
          count: 1,
          search: term,
        });

        const vendor = response?.data?.data?.[0];
        if (response?.statusCode === 200 && vendor?._id) {
          const contact =
            vendor.contact?.find((c: any) => c.isOwner) ||
            vendor.contact?.[0] ||
            {};
          setExistsModal({
            show: true,
            source,
            vendor: {
              _id: vendor._id,
              name: vendor.name || "",
              mobile: contact.mobile || "",
              email: contact.email || "",
              gst: vendor.gst_no || "",
              address:
                VendorService.formatVendorData(vendor)?._fullAddress || "",
            },
          });
        }
      } catch (error) {
        console.error("Error checking existing vendor:", error);
      }
    },
    600,
  );

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mobile = CommonService.formatMobileNo(e.target.value);
    setValue("contactMobile", mobile);
    // Check for an existing vendor once a valid mobile number is entered
    if (CommonService.isValidMobileNo(mobile)) {
      checkVendorExists(mobile, "contactMobile");
    }
  };

  const handleExistsModalCallback = ({
    action,
  }: {
    action: "close" | "goToList";
  }) => {
    // When dismissed (not navigating away), clear the field that matched an
    // existing vendor so the user can enter a different value.
    if (action === "close" && existsModal.source) {
      setValue(existsModal.source, "");
    }
    setExistsModal({ show: false, vendor: null, source: null });
    if (action === "goToList") {
      appNav.replace("/dashboard/vendor/list");
    }
  };

  const handleBrandSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      // Prevent adding the same brand twice
      const alreadySelected = selectedBrands.some((b) => {
        const currentId = (b?.value && (b.value.id || b.value._id)) || b?.id;
        const incomingId =
          (item?.value && (item.value.id || item.value._id)) || item?.id;
        return currentId && incomingId && currentId === incomingId;
      });

      if (alreadySelected) {
        const brandName =
          item?.label || item?.value?.name || item?.name || "Brand";
        appToast.show({
          msg: `${brandName} already selected`,
          color: "warning",
        });
        return;
      }

      setSelectedBrands((prev) => [...prev, item]);
    } else {
      setSelectedBrands((prev) =>
        prev.filter((brand) => brand.value.id !== item.value.id),
      );
    }
  };

  // Common redirect handler after successful vendor creation
  const handleSuccessRedirect = (vendorId?: string) => {
    const fromParam = searchParams.get("from");
    if (fromParam === "po" && vendorId) {
      appNav.replace(`/dashboard/purchase-order/manage?vid=${vendorId}`);
    } else {
      appNav.replace("/dashboard/vendor/list");
    }
  };

  // OTP handling functions
  const handleVerifyOtp = async ({ otp }: { otp: number }) => {
    try {
      setValidatingOtp(true);
      // Use registerWithOtp to complete vendor creation. Payload requires
      // { otpRequestId, otp, vendorPayload }
      const payload = {
        otpRequestId: otpId,
        otp: otp.toString(),
        vendorData: vendorPayloadForRegister || undefined,
      } as Record<string, any>;

      const response = await VendorService.registerWithOtp(payload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({ msg: "Vendor created successfully", color: "success" });
        setShowOtpModal(false);
        // If API returns vendorId after successful registerWithOtp, redirect to it
        const createdVendorId =
          response.data?.data?.vendorId || pendingVendorId;
        const t = setTimeout(() => {
          clearTimeout(t);
          handleSuccessRedirect(createdVendorId);
        }, 1000);
      } else {
        appToast.show({
          msg: response.data?.message || "Invalid OTP",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      appToast.show({
        msg: error?.response?.data?.message || "Failed to verify OTP",
        color: "danger",
      });
    } finally {
      setValidatingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendingOtp(true);
      // If we have a pendingVendorId (server created a vendor resource), try server resend
      // otherwise, re-call register with the saved payload to request a fresh OTP
      let response;
      if (pendingVendorId) {
        response = await VendorService.generateOtp(pendingVendorId, otpId);
      } else if (vendorPayloadForRegister) {
        response = await VendorService.register(vendorPayloadForRegister);
        // update otpId if returned
        const newOtpId =
          response?.data?.data?.otp?.otpRequestId ||
          response?.data?.data?.otpRequestId;
        if (newOtpId) setOtpId(newOtpId);
      } else {
        appToast.show({ msg: "Unable to resend OTP", color: "danger" });
        return;
      }

      if (response?.statusCode === 200) {
        appToast.show({ msg: "OTP resent successfully", color: "success" });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to resend OTP",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      appToast.show({
        msg: error?.response?.data?.message || "Failed to resend OTP",
        color: "danger",
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtpId("");
    setPendingVendorId("");
  };

  const handleConfirmationModalCallback = (action: "cancel" | "confirm") => {
    if (action === "cancel") {
      setConfirmationModal((prev) => ({ ...prev, show: false }));
    } else if (action === "confirm") {
      // Close modal immediately, then proceed with the submit flow
      setConfirmationModal((prev) => ({ ...prev, show: false }));
      handleConfirmSubmit();
    }
  };

  // Named callback for GeoLocationModal to avoid inline functions in JSX
  const handleGeoLocationModalCallback = (data: {
    action: string;
    address?: any;
  }) => {
    if (data.action === "submit" && data.address) {
      // Map modal address fields to vendor form
      if (data.address?.line1) {
        setValue("addressLine1", data.address.line1 || "");
      } else {
        setValue("addressLine1", data.address.loc || "");
      }

      setValue("pincode", data.address.pincode || "");
      setPincodeData({
        city: data.address.town || "",
        state: data.address.state || "",
        district: data.address.district || "",
      });

      // Also set individual location fields in the form
      setValue("state", data.address.state || "");
      setValue("district", data.address.district || "");
      setValue("town", data.address.town || "");

      setValue("lat", data.address.lat || null);
      setValue("lng", data.address.lng || null);

      appToast.show({
        msg: "Location selected successfully",
        color: "success",
      });
    }

    setGeoModal({ show: false });
  };

  const onSubmit = async () => {
    try {
      // Prevent editing if this vendor was not created by the current user's franchise
      if (isEditing && isCreatedByMe === false) {
        appToast.show({
          msg: t("notAllowedToEditVendor"),
          color: "danger",
        });
        return;
      }
      const data = getValues();

      // Validate all form data
      const validation = validateForm(data, t);
      if (!validation.status) {
        appToast.show({ msg: validation.msg, color: "danger" });
        return;
      }

      // Show confirmation modal after validation success
      setConfirmationModal({
        show: true,
        formData: getValues(),
        pincodeData,
        brands: selectedBrands,
      });
    } catch (error: any) {
      console.error("Error validating form:", error);
      appToast.show({
        msg: t("errorValidatingForm"),
        color: "danger",
      });
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      // Double-check before performing update on server
      if (isEditing && isCreatedByMe === false) {
        appToast.show({
          msg: t("notAllowedToUpdateVendor"),
          color: "danger",
        });
        return;
      }
      const data = getValues();
      setSubmitting(true);
      const payload = preparePayload(data, selectedBrands, pincodeData);
      let response;
      if (isEditing && vendorId) {
        response = await VendorService.update(vendorId, payload);
      } else if (data.verifyWithOtp) {
        // Initiate OTP flow prior to final creation
        response = await VendorService.register(payload);
        setVendorPayloadForRegister(payload);
      } else {
        // Direct create without OTP
        response = await VendorService.create(payload as any);
      }

      if (response.statusCode === 200) {
        if (!isEditing && data.verifyWithOtp) {
          // Expect register response to contain otpRequestId and optionally vendorId
          const otpRequestId =
            response.data?.data?.otp?.otpRequestId ||
            response.data?.data?.otpRequestId ||
            "";
          setOtpId(otpRequestId);
          setPendingVendorId(response.data?.data?.vendorId || "");
          setShowOtpModal(true);
          setConfirmationModal((prev) => ({ ...prev, show: false }));
          appToast.show({
            msg: t("vendorCreatedSuccessfullyOtp"),
            color: "success",
          });
        } else if (isEditing) {
          setConfirmationModal((prev) => ({ ...prev, show: false }));
          appToast.show({
            msg: t("vendorUpdatedSuccessfully"),
            color: "success",
          });
          handleSuccessRedirect(response.data?.data?.vendorId || vendorId);
        } else {
          // Direct create success
          setConfirmationModal((prev) => ({ ...prev, show: false }));
          appToast.show({
            msg: t("vendorCreatedSuccessfully"),
            color: "success",
          });
          handleSuccessRedirect(response.data?.data?.vendorId);
        }
      } else {
        appToast.show({
          msg:
            response.data?.message ||
            (isEditing ? t("failedToUpdateVendor") : t("failedToCreateVendor")),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error submitting vendor:", error);
      appToast.show({
        msg:
          error?.response?.data?.message ||
          (isEditing ? t("failedToUpdateVendor") : t("failedToCreateVendor")),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSourceAllBrandsChange =
    (chngFn: (v: boolean) => void) => (v: boolean) => {
      chngFn(v);
      if (v) {
        setSelectedBrands([]);
      }
    };

  return (
    <>
      <AppHeader
        title={isEditing ? t("editLocalVendor") : t("createLocalVendor")}
      />
      <div className="app-page page-bg page-padding">
        <div className="app-container">
          {/* Breadcrumbs */}
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="vendors"
            variant="chips"
            sticky
          /> */}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="vendors"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:max-w-4xl tw:mx-auto">
                    <PageDescription
                      description="manageVendor"
                      className="tw:mb-4"
                    />

                    {loading ? (
                      <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
                        <BusyLoader show={true} />
                      </div>
                    ) : (
                      <FormProvider {...formMethods}>
                        <AppCard
                          title={t("basicInformation")}
                          subtitle={t("basicInformationSubtitle")}
                        >
                          <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Basic Info Tab */}

                            <div>
                              {/* Grid Layout for Basic Info Fields */}
                              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-6 tw:space-y-4">
                                <AppInput
                                  name="vendorName"
                                  label={t("vendorName")}
                                  placeholder={t("enterVendorName")}
                                  register={register}
                                  error={errors.vendorName?.message}
                                  isRequired
                                />

                                <AppInput
                                  name="contactName"
                                  label={t("contactPersonName")}
                                  placeholder={t("enterContactPersonName")}
                                  register={register}
                                  error={errors.contactName?.message}
                                  isRequired
                                />

                                <div>
                                  <AppInput
                                    name="contactMobile"
                                    label={t("contactMobile")}
                                    type="tel"
                                    placeholder={t("enter10DigitMobile")}
                                    register={register}
                                    error={errors.contactMobile?.message}
                                    onChange={handleMobileChange}
                                    maxLength={10}
                                    isRequired
                                  />
                                  {/* OTP Verification Checkbox - only show in add mode */}
                                  {!isEditing && (
                                    <div className="tw:mt-2">
                                      <Controller
                                        control={control}
                                        name="verifyWithOtp"
                                        render={({ field }) => (
                                          <AppCheckbox
                                            label={t("verifyWithOtp")}
                                            name="verifyWithOtp"
                                            onChange={field.onChange}
                                            value={field.value as any}
                                            size="xs"
                                          />
                                        )}
                                      />
                                    </div>
                                  )}
                                </div>

                                <AppInput
                                  name="contactEmail"
                                  label={t("contactEmail")}
                                  type="email"
                                  placeholder={t("enterEmailAddress")}
                                  register={register}
                                  error={errors.contactEmail?.message}
                                />
                              </div>

                              {/* Brand Selection */}
                              <div className="tw:col-span-2 tw:mb-4">
                                <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-2">
                                  <div className="tw:flex-1">
                                    <BrandSearchInput
                                      label={t("selectBrands")}
                                      placeholder={t("searchAndSelectBrands")}
                                      multiSelect={true}
                                      callback={handleBrandSelect}
                                      values={selectedBrands}
                                      disabled={sourceAllBrands}
                                    />
                                  </div>
                                  <div className="tw:mt-6">
                                    <Controller
                                      control={control}
                                      name="sourceAllBrands"
                                      render={({ field }) => (
                                        <AppCheckbox
                                          label={t("sourceAllBrands")}
                                          name="sourceAllBrands"
                                          onChange={onSourceAllBrandsChange(
                                            field.onChange,
                                          )}
                                          value={field.value as any}
                                        />
                                      )}
                                    />
                                  </div>
                                </div>
                                {sourceAllBrands ? (
                                  <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                                    {t("allBrandsWillBeSourced")}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Documents Tab */}
                            {activeTab === "documents" && (
                              <div className="tw:space-y-6">
                                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                                  <AppInput
                                    name="pan"
                                    label={t("panNumber")}
                                    placeholder={t("enterPanNumber")}
                                    register={register}
                                    error={errors.pan?.message}
                                    onChange={handlePanChange}
                                  />

                                  <AppInput
                                    name="gst"
                                    label={t("gstNumber")}
                                    placeholder={t("enterGstNumber")}
                                    register={register}
                                    error={errors.gst?.message}
                                    onChange={handleGstChange}
                                  />
                                </div>

                                {/* Submit Buttons */}
                                <div className="tw:flex tw:justify-between tw:pt-6">
                                  <AppButton
                                    onClick={() => setActiveTab("basic")}
                                    fill="outline"
                                    color="medium"
                                  >
                                    {t("back")}
                                  </AppButton>
                                  <AppButton
                                    type="submit"
                                    color="primary"
                                    isLoading={submitting}
                                  >
                                    <CheckCheck />
                                    {isEditing
                                      ? t("updateVendor")
                                      : t("createVendor")}
                                  </AppButton>
                                </div>
                              </div>
                            )}
                          </form>
                        </AppCard>

                        <AppCard title={t("address")}>
                          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-6 tw:space-y-4">
                            <AppPincodeInput
                              name="pincode"
                              label={t("pincode")}
                              placeholder={t("enter6DigitPincode")}
                              register={register}
                              error={errors.pincode?.message}
                              onPincodeSelect={handlePincodeSelect}
                              isRequired
                            />

                            <AppInput
                              name="doorNo"
                              label={t("doorNo")}
                              placeholder={t("enterDoorNumber")}
                              register={register}
                              error={errors.doorNo?.message}
                            />

                            <AppInput
                              name="addressLine1"
                              label={t("streetAddress")}
                              placeholder={t("enterStreetAddress")}
                              register={register}
                              error={errors.addressLine1?.message}
                              isRequired
                            />

                            <AppInput
                              name="landmark"
                              label={t("landmark")}
                              placeholder={t("enterNearbyLandmark")}
                              register={register}
                              error={errors.landmark?.message}
                            />

                            <div className="tw:col-span-2 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                              <SdtLocation
                                state={watchedState}
                                district={watchedDistrict}
                                town={watchedTown}
                                callback={({ data }) => {
                                  setValue("state", data.state || "");
                                  setValue("district", data.district || "");
                                  setValue("town", data.town || "");
                                }}
                              />
                            </div>

                            {/* Static map preview when lat/lng available */}
                            {watchedLat && watchedLng ? (
                              <div className="tw:col-span-2 tw:mt-2">
                                <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                                  <div className="tw:text-sm tw:font-medium tw:flex tw:gap-2">
                                    <MapPin size={20} />
                                    Vendor Location
                                  </div>
                                </div>
                                <div className="tw:relative tw:rounded tw:overflow-hidden tw:border tw:border-gray-200 tw:h-48">
                                  <StaticGMap
                                    lat={Number(watchedLat)}
                                    lng={Number(watchedLng)}
                                    className="tw:w-full tw:h-full"
                                  />
                                  <div className="tw:absolute tw:top-2 tw:right-2">
                                    <AppButton
                                      onClick={() =>
                                        setGeoModal({
                                          show: true,
                                          lat: watchedLat,
                                          lng: watchedLng,
                                        })
                                      }
                                      size="small"
                                      fill="solid"
                                      color="danger"
                                    >
                                      <EditIcon />
                                      {t("editOnMap") || "Edit on map"}
                                    </AppButton>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </AppCard>

                        <AppCard title={t("financialAndTaxInformation")}>
                          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-6 tw:space-y-4">
                            <AppInput
                              name="pan"
                              label={t("panNumber")}
                              placeholder={t("enterPanNumber")}
                              register={register}
                              error={errors.pan?.message}
                              onChange={handlePanChange}
                            />

                            <AppInput
                              name="gst"
                              label={t("gstNumber")}
                              placeholder={t("enterGstNumber")}
                              register={register}
                              error={errors.gst?.message}
                              onChange={handleGstChange}
                            />

                            {/* <AppInput
                    name="aadharNo"
                    label="Aadhar Number"
                    placeholder="Enter 12-digit Aadhar number"
                    register={register}
                    error={errors.aadharNo?.message}
                    maxLength={12}
                  /> */}
                          </div>
                        </AppCard>

                        <AppCard title={t("uploadDocuments")}>
                          <UploadForm />
                        </AppCard>

                        <div className="tw:flex tw:justify-end tw:gap-2">
                          <AppButton
                            onClick={() => appNav.back()}
                            fill="outline"
                            color="medium"
                          >
                            {t("cancel")}
                          </AppButton>

                          <AppButton
                            type="button"
                            onClick={onSubmit}
                            isLoading={submitting}
                            color="primary"
                          >
                            <CheckCheck />
                            {isEditing ? t("updateVendor") : t("saveVendor")}
                          </AppButton>
                        </div>
                      </FormProvider>
                    )}
                  </div>
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    vendor list pane beside the section icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <VendorSidePane activeVendorId={vendorId || undefined} />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={submitting} />

      {/* OTP Modal */}
      <OtpModal
        show={showOtpModal}
        verify={handleVerifyOtp}
        resend={handleResendOtp}
        close={handleCloseOtpModal}
        mobile={getValues("contactMobile")}
        validating={validatingOtp}
        resending={resendingOtp}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={confirmationModal.show}
        callback={handleConfirmationModalCallback}
        formData={confirmationModal.formData}
        pincodeData={confirmationModal.pincodeData}
        selectedBrands={confirmationModal.brands}
        isEditing={isEditing}
        isLoading={submitting}
      />

      {/* Existing Vendor Modal - shown when the entered mobile already exists */}
      <VendorExistsModal
        show={existsModal.show}
        vendor={existsModal.vendor}
        callback={handleExistsModalCallback}
      />

      {/* Geo Location Modal - used to pick/edit lat/lng */}
      <GeoLocationModal
        show={geoModal.show}
        callback={handleGeoLocationModalCallback}
        enableGeoLoc={true}
        lat={geoModal.lat as any}
        lng={geoModal.lng as any}
        title={"Set Vendor Location"}
      />
    </>
  );
};

export default VendorManage;

export function meta() {
  return [
    { title: "Manage Vendor - Purchase Order" },
    {
      name: "description",
      content: "Create or edit vendor information for purchase orders",
    },
  ];
}
