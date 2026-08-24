import { useCallback, useEffect, useRef, useState } from "react";
import { redirect } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { MapPin } from "lucide-react";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import GeoLocationModal from "~/modals/feature/geo-location/GeoLocationModal";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import TermsService from "~/services/TermsService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import SignupStepPill from "../components/SignupStepPill";
import { ALERT_DISMISS_TIME } from "~/constants";

type FormValues = {
  doorNo?: string;
  address1?: string;
  pincode?: string;
  pincodeData?: any;
  state?: string;
  district?: string;
  town?: string;
  lat?: number | null;
  lng?: number | null;
  agreedToTerms?: boolean;
};

const StoreLocationPage = () => {
  const signupTemp = FranchiseService.getSignupTemp();

  const { t } = useTranslation(["signup"]);
  const appToast = useAppToast();
  const appNav = useAppNav();

  const { register, handleSubmit, reset, setValue, control } =
    useForm<FormValues>({
      defaultValues: {
        doorNo: signupTemp.doorNo || signupTemp.doorNo || "",
        address1: signupTemp.address1 || signupTemp.address1 || "",
        pincode: signupTemp.pincode || "",
        pincodeData: signupTemp.pincodeData || {},
        state: signupTemp.state || "",
        district: signupTemp.district || "",
        town: signupTemp.town || "",
        lat: signupTemp.lat || null,
        lng: signupTemp.lng || null,
        agreedToTerms: signupTemp.agreedToTerms || false,
      },
    });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [busyLoading, setBusyLoading] = useState({
    show: false,
    message: "",
  });

  const [termsModalState, setTermsModalState] = useState<{
    show: boolean;
    code?: string;
    title?: string;
  }>({ show: false });

  const [geoModal, setGeoModal] = useState({ show: false });

  const signupPayloadRef = useRef<Record<string, any> | null>(null);

  const termsDataRef = useRef<
    | {
        version: string;
        name: string;
        code: string;
        content: string;
      }[]
    | null
  >(null);

  const [watchedState, watchedDistrict, watchedTown] = useWatch<FormValues>({
    control,
    name: ["state", "district", "town"],
  });

  useEffect(() => {
    const temp = FranchiseService.getSignupTemp();
    reset({
      doorNo: temp.doorNo || "",
      address1: temp.address1 || "",
      pincode: temp.pincode || "",
      pincodeData: temp.pincodeData || {},
      state: temp.state || "",
      district: temp.district || "",
      town: temp.town || "",
      lat: temp.lat || null,
      lng: temp.lng || null,
      agreedToTerms: temp.agreedToTerms || false,
    });
  }, [reset]);

  const handlePincodeSelect = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      setValue("pincode", data.value?.toString() || "");
      setValue("pincodeData", {
        city: data.data.town || "",
        state: data.data.state || "",
        district: data.data.district || "",
      });
      setValue("state", data.data.state || "");
      setValue("district", data.data.district || "");
      setValue("town", data.data.town || "");
    } else if (data.status === "error") {
      setValue("pincodeData", { city: "", state: "", district: "" });
      setValue("state", "");
      setValue("district", "");
      setValue("town", "");
    } else {
      setValue("pincode", data.value?.toString() || "");
      if (!data.value || data.value.toString().length < 6) {
        setValue("pincodeData", { city: "", state: "", district: "" });
        setValue("state", "");
        setValue("district", "");
        setValue("town", "");
      }
    }
  };

  const onLocationModalCallback = useCallback(
    (data: { action: string; address?: any }) => {
      if (data.action === "submit" && data.address) {
        if (data.address?.line1 && data.address?.line2) {
          setValue("address1", data.address.line1 || "");
        } else {
          setValue("address1", data.address.loc || "");
        }

        setValue("pincode", data.address.pincode || "");
        setValue("pincodeData", {
          city: data.address.town || "",
          state: data.address.state || "",
          district: data.address.district || "",
        });

        setValue("lat", data.address.lat || null);
        setValue("lng", data.address.lng || null);

        setValue("state", data.address.state || "");
        setValue("district", data.address.district || "");
        setValue("town", data.address.town || "");

        appToast.show({
          msg: t("register.location.selected"),
          color: "success",
        });
      }
      setGeoModal({ show: false });
    },
    [setValue, appToast, t],
  );

  const openLocationModal = () => setGeoModal({ show: true });

  const validate = (data: FormValues) => {
    if (!data.pincode || !data.pincode.trim()) {
      return t("register.validation.pincodeRequired");
    }
    if (!CommonService.isValidPincode(data.pincode)) {
      return t("register.validation.invalidPincode");
    }
    if (!data.doorNo || !data.doorNo.trim()) {
      return t("register.validation.doorNoRequired");
    }
    if (!data.address1 || !data.address1.trim()) {
      return t("register.validation.addressRequired");
    }
    if (!data.state || !data.state.trim()) {
      return t("pleaseSelectState");
    }
    if (!data.district || !data.district.trim()) {
      return t("pleaseSelectDistrict");
    }
    if (!data.town || !data.town.trim()) {
      return t("pleaseSelectTown");
    }
    return "";
  };

  function makeIsoDate1970(time?: string, ms = "008") {
    if (!time || typeof time !== "string") return null;
    return `1970-01-01T${time}:00.${ms}+05:30`;
  }

  const preparePayload = (temp: Record<string, any>) => {
    const formData = temp || {};

    const openTimeIso = makeIsoDate1970(formData.storeOpenTime, "008");
    const closeTimeIso = makeIsoDate1970(formData.storeCloseTime, "010");

    const franchiseDetails = formData.franchiseDetails;

    const primaryBusinessId =
      formData.primaryBusiness === "choose"
        ? ""
        : formData.primaryBusinessId || "";

    const primaryBusiness =
      formData.primaryBusiness === "choose"
        ? ""
        : formData.primaryBusiness || "";

    const secondaryBusinessId =
      formData.secondaryBusiness === "choose"
        ? ""
        : formData.secondaryBusinessId || "";

    const secondaryBusiness =
      formData.secondaryBusiness === "choose"
        ? ""
        : formData.secondaryBusiness || "";

    const payload: Record<string, any> = {
      franType: "SFSELLER",
      email: formData.email?.trim(),
      shop_details: {
        geolocation: {
          weekly_off_days: [],
          geolocationStatus: "Pending",
          type: "Point",
          coordinates: [formData.lat || 0, formData.lng || 0],
        },
        open_time: openTimeIso,
        close_time: closeTimeIso,
        area: formData.storeSize ? String(formData.storeSize) : undefined,
      },
      sk_franchise_details: {
        franchise_type: "SFSELLER",
        franchise_sub_type: "SF",
        mandatory_documents: {
          address: [],
          photo: [],
          business: formData.businessProof || [],
        },
      },
      name: formData.storeName?.trim(),
      address: {
        door_no: formData.doorNo?.trim(),
        street: formData.address1?.trim(),
        landmark: "",
        full_address:
          (formData.doorNo?.trim() || "") +
          " " +
          (formData.address1?.trim() || ""),
      },
      state: formData.state.trim(),
      district: formData.district.trim(),
      town: formData.town.trim(),
      locality: formData.town.trim(),
      pincode: formData.pincode ? parseInt(formData.pincode) : undefined,
      primary_business: primaryBusiness || "",
      primary_business_id: primaryBusinessId || undefined,
      secondary_business_id: secondaryBusinessId || undefined,
      secondary_business: secondaryBusiness || "",
      contact_details: [
        {
          isOwner: true,
          name: formData.ownerName?.trim(),
          mobile: formData.mobile ? parseInt(formData.mobile) : undefined,
          email: formData.email?.trim() || "",
          isEmailVerified: formData.emailVerified || false,
        },
      ],
      daily_limit: 1000000,
      services: { defined: false },
      OwnerMobileNo: formData.mobile ? parseInt(formData.mobile) : undefined,
      finance_details: { gstNo: formData.gstNumber?.trim() || "" },
      fssai: {
        hasLicense: false,
        docs: [],
        licenseNo: formData.fssaiCertificate?.trim() || "",
        views: 1,
      },
      // OTP is expected to be already taken and stored in temp (otpResp or otpId)
      otpId: formData.otpResp?._id || formData.otpId || undefined,
      referralInfo: {
        referrerReferralCode:
          formData.verifiedReferralCode?.trim() ||
          formData.referralCode?.trim() ||
          "",
        type: "",
      },
      connectedSellerIds: franchiseDetails?.sk_franchise_details?.linkedSellerId
        ? [
            {
              id: franchiseDetails.sk_franchise_details.linkedSellerId,
              name: franchiseDetails.name,
              franId: franchiseDetails._id,
            },
          ]
        : [],
      shop_photos: (formData.shopImages || []).map((img: any) => img.id),
      bankStatements: [],
      distributorKyc: { qualification: "" },
      termAndConditions:
        formData.termsData && Array.isArray(formData.termsData)
          ? formData.termsData.map((t: any) => ({
              code: t.code,
              isAgree: true,
              status: "Agreed",
              version: t.version,
            }))
          : [],
      isEmailVerified: formData.emailVerified || false,
      emailRequestId: formData.emailRequestId || "",
      registrationFrom: "CLUB",
      monthlyTurnOver: formData.monthlyTurnOver || "",
      yearsOfExperience: formData.yearsOfExperience || "",
      notificationMessageLang: formData.notificationMessageLang || "en",
    };

    return payload;
  };

  const onSubmit = async (data: FormValues) => {
    const msg = validate(data);
    if (msg) {
      appToast.show({ msg, color: "danger" });
      return;
    }

    // Ensure user agreed to terms
    if (!data.agreedToTerms) {
      appToast.show({ msg: t("register.terms.agreeError"), color: "danger" });
      return;
    }

    // Persist current location values in temp
    FranchiseService.updateSignupTemp({
      doorNo: data.doorNo,
      address1: data.address1,
      pincode: data.pincode,
      pincodeData: data.pincodeData,
      state: data.state,
      district: data.district,
      town: data.town,
      lat: data.lat,
      lng: data.lng,
    });

    // Get full signup temp with all previously stored details
    const temp = FranchiseService.getSignupTemp();

    // Fetch Terms & Privacy policy details before proceeding
    try {
      setBusyLoading({ show: true, message: t("register.terms.fetchLoading") });

      const keys = ["RETAIL_OS_TERMS", "RETAIL_OS_PRIVACY_POLICY"];

      const responses = await TermsService.getMultipleTermsContent(keys);

      const terms = Array.isArray(responses.data) ? responses.data : [];

      const mapped = terms
        .map((termsObj: any, idx: number) => {
          return {
            version: termsObj?.version || "",
            name: termsObj?.name || "",
            code: termsObj?.code || keys[idx],
            content: termsObj?.description || "",
          };
        })
        .filter(Boolean) as any[];

      if (mapped.length > 0) {
        termsDataRef.current = mapped;
        // attach to temp so payload builder picks it up
        temp.termsData = mapped;
      }

      setBusyLoading({ show: false, message: "" });

      // Prepare payload using stored temp (termsData will be included later in signup)
      const signupPayload = preparePayload(temp);

      // store payload and show confirmation dialog before actually creating franchise
      signupPayloadRef.current = signupPayload;
      setShowConfirmDialog(true);
    } catch (err) {
      setBusyLoading({ show: false, message: "" });
      appToast.show({ msg: t("register.terms.fetchFailed"), color: "danger" });
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      setShowConfirmDialog(false);

      // Wait for dismiss animation / small delay before hitting API
      await new Promise((resolve) => setTimeout(resolve, ALERT_DISMISS_TIME));

      // Show busy loader while performing signup
      setBusyLoading({ show: true, message: t("register.submit.creating") });

      // Call signup API - OTP flow is skipped here (we expect otpId present)
      const resp = await FranchiseService.doSignup(signupPayloadRef.current);

      setBusyLoading({ show: false, message: "" });

      if (resp?.statusCode === 200) {
        // Clear temporary signup data now that signup succeeded
        try {
          FranchiseService.clearSignupTemp();
        } catch (e) {}
        signupPayloadRef.current = null;

        appNav.replace("/auth/signup/success");
      } else {
        appToast.show({
          msg: resp?.data?.message || "Signup failed",
          color: "danger",
        });
      }
    } catch (e: any) {
      setBusyLoading({ show: false, message: "" });
      appToast.show({ msg: e?.message || "Signup failed", color: "danger" });
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const viewPersonalInfo = () => {
    appNav.to("/auth/signup/personal-info");
  };

  const viewStoreInfo = () => {
    appNav.to("/auth/signup/store-info");
  };

  const openCoreTermsModal = useCallback(
    (code: string, title?: string) => {
      setTermsModalState({
        show: true,
        code,
        title: title || t("register.terms.terms"),
      });
    },
    [t],
  );

  const handleCoreTermsCallback = useCallback(
    (a: { action: string; data?: any }) => {
      if (
        a.action === "close" ||
        a.action === "accept" ||
        a.action === "error"
      ) {
        setTermsModalState({ show: false });
      }
      if (a.action === "accept") {
        appToast.show({ msg: t("register.terms.viewed"), color: "success" });
      }
    },
    [appToast, t],
  );

  return (
    <>
      <AppSimpleHeader title={t("register.pageTitle")} />

      <div className="app-page tw:min-h-screen signup-bg-2">
        <div className="tw:max-w-md tw:mx-auto">
          <div className="tw:z-10 tw:px-6 tw:pt-6 tw:md:px-0 tw:pb-10">
            <div className="tw:relative tw:z-10">
              <SignupStepPill
                title={t("register.steps.personalInfo")}
                onClick={viewPersonalInfo}
                className="tw:mb-4"
              />
              <SignupStepPill
                title={t("register.steps.storeInfo")}
                onClick={viewStoreInfo}
              />
            </div>

            <div className="tw:-mt-12 tw:text-center">
              <ImgRender
                src="signup/location.jpg"
                className="signup-page-img tw:mx-auto tw:inline-block tw:object-cover tw:mix-blend-multiply"
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="tw:bg-white tw:rounded-lg tw:shadow-md tw:p-5">
                <h2 className="tw:font-semibold tw:text-lg">
                  {t("register.store.storeLocation.title")}
                </h2>

                <div className="tw:flex tw:mt-1">
                  <button
                    type="button"
                    onClick={openLocationModal}
                    className="tw:text-primary tw:font-medium tw:flex tw:items-center tw:gap-2 tw:mt-2 tw:text-xs"
                  >
                    <MapPin size={16} />
                    {t("register.store.addLocationOnMap")}
                  </button>
                </div>

                <AppPincodeInput
                  name="pincode"
                  label={t("register.store.pincode.label")}
                  placeholder={t("register.store.pincode.placeholder")}
                  register={register}
                  onPincodeSelect={handlePincodeSelect}
                  showMultipleResult={false}
                  isRequired={true}
                  className="tw:mb-4 tw:mt-4"
                />

                <AppInput
                  label={t("register.store.doorNo.label")}
                  placeholder={t("register.store.doorNo.placeholder")}
                  register={register}
                  name="doorNo"
                  inputClassName="tw:bg-white"
                  isRequired={true}
                />

                <AppTextarea
                  name="address1"
                  register={register}
                  label={t("register.store.address.label")}
                  placeholder={t("register.store.address.placeholder")}
                  isRequired={true}
                  rows={2}
                  className="tw:mt-4 tw:mb-2"
                />

                <div className="tw:grid tw:gap-4 tw:mb-4 tw:grid-cols-2 tw:[&>*:first-child]:col-span-2">
                  <SdtLocation
                    state={watchedState}
                    district={watchedDistrict}
                    town={watchedTown}
                    callback={({ data }) => {
                      setValue("state", data.state || "");
                      setValue("district", data.district || "");
                      setValue("town", data.town || "");
                      setValue("pincodeData", {
                        city: data.town || "",
                        state: data.state || "",
                        district: data.district || "",
                      });
                    }}
                    isStateRequired={true}
                    isDistrictRequired={true}
                    isTownRequired={true}
                  />
                </div>
              </div>

              <div className="tw:mt-4">
                <label className="tw:inline-flex tw:items-start tw:gap-2 tw:text-sm tw:md:text-xs tw:text-app-gray-5">
                  <input
                    type="checkbox"
                    {...register("agreedToTerms")}
                    className="tw:w-4 tw:h-4 tw:accent-blue-600"
                  />
                  <span>
                    {t("register.terms.agreePrefix")}{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCoreTermsModal(
                          "RETAIL_OS_TERMS",
                          t("register.terms.terms"),
                        );
                      }}
                      className="tw:text-blue-600 tw:underline tw:cursor-pointer hover:tw:text-blue-800"
                    >
                      {t("register.terms.terms")}
                    </button>{" "}
                    {t("register.terms.and")}{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCoreTermsModal(
                          "RETAIL_OS_PRIVACY_POLICY",
                          t("register.terms.privacy"),
                        );
                      }}
                      className="tw:text-blue-600 tw:underline tw:cursor-pointer hover:tw:text-blue-800"
                    >
                      {t("register.terms.privacy")}
                    </button>
                  </span>
                </label>
              </div>

              <div className="tw:mt-6 tw:text-right">
                <AppButton
                  color="primary"
                  className="tw:px-6 tw:py-3 tw:font-semibold tw:text-base"
                  type="submit"
                >
                  {t("register.submit.button")}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      </div>

      <GeoLocationModal
        show={geoModal.show}
        callback={onLocationModalCallback}
        enableGeoLoc={true}
        title={t("register.modals.geoLocationTitle")}
      />
      <TermsModal
        code={termsModalState.code || "RETAIL_OS_TERMS"}
        show={termsModalState.show}
        title={termsModalState.title}
        callback={handleCoreTermsCallback}
      />
      <AppAlertDialog
        show={showConfirmDialog}
        title={t("register.submit.confirmTitle")}
        description={t("register.submit.confirmDescription")}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        type="confirm"
        okText={t("register.submit.confirm") || "Create"}
        cancelText={t("cancel", { ns: "common" }) || "Cancel"}
      />

      <BusyLoader show={busyLoading.show} message={busyLoading.message} />
    </>
  );
};

export default StoreLocationPage;

export async function clientLoader() {
  const has = FranchiseService.hasTempSignupData();
  if (!has) {
    throw redirect("/auth/signup/mobile");
  }
  return null;
}
