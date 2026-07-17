import { useCallback, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import GeoLocationModal from "~/modals/feature/geo-location/GeoLocationModal";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import ContactInfo from "./components/ContactInfo";
// import DocumentsInfo from "./components/DocumentsInfo";
import { Save, Store } from "lucide-react";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import TermsService from "~/services/TermsService";
import StoreInfo from "./components/StoreInfo";
import StoreLocation from "./components/StoreLocation";
import { useTranslation } from "react-i18next";

const defaultValues = {
  storeName: "",
  address1: "",
  pincode: "",
  address: "",
  doorNo: "",
  pincodeData: {
    city: "",
    state: "",
    district: "",
  },
  ownerName: "",
  email: "",
  mobile: "",
  gstNumber: "",
  fssaiCertificate: "",
  gstCertificateImages: [],
  shopImages: [],
  franchiseDetails: null,
  verifiedReferralCode: "",
  lat: null,
  lng: null,
  agreedToTerms: true,
  state: "",
  district: "",
  town: "",
  storeOpenTime: "",
  storeCloseTime: "",
};

function makeIsoDate1970(time?: string, ms = "008") {
  if (!time || typeof time !== "string") return null;
  // expect time in HH:mm format; we rely on validate() earlier
  return `1970-01-01T${time}:00.${ms}+05:30`;
}

const Register = () => {
  const methods = useForm({
    defaultValues,
  });

  const appToast = useAppToast();
  const appNav = useAppNav();
  const { t } = useTranslation(["signup"]);

  const [busyLoading, setBusyLoading] = useState({
    show: false,
    message: "",
  });

  const [otpModal, setOtpModal] = useState({
    mobile: "",
    show: false,
    validating: false,
    resending: false,
  });

  const [locationModal, setLocationModal] = useState({
    show: false,
  });

  // agreement modal removed; we will fetch terms before submit

  const [termsData, setTermsData] = useState<
    | {
        version: string;
        name: string;
        code: string;
        content: string;
      }[]
    | null
  >(null);

  const otpRespRef = useRef<any>({});

  const validate = (data: any) => {
    let msg = "";

    // 1) Contact info validations first
    if (!data.mobile) {
      msg = t("register.validation.mobileRequired");
    } else if (!CommonService.isValidMobileNo(data.mobile)) {
      msg = t("register.validation.invalidMobile");
    } else if (!data.ownerName?.trim()) {
      msg = t("register.validation.ownerNameRequired");
    } else if (data.email?.trim() && !CommonService.isValidEmail(data.email?.trim())) {
      msg = t("register.validation.invalidEmail");
    }

    // 2) Store info validations next, only if no contact error
    if (!msg) {
      if (!data.storeName?.trim()) {
        msg = t("register.validation.storeNameRequired");
      } else if (!data.doorNo?.trim()) {
        msg = t("register.validation.doorNoRequired");
      } else if (!data.address1?.trim()) {
        msg = t("register.validation.addressRequired");
      } else if (!data.pincode?.trim()) {
        msg = t("register.validation.pincodeRequired");
      } else if (!CommonService.isValidPincode(data.pincode)) {
        msg = t("register.validation.invalidPincode");
      } else if (!data.storeOpenTime?.trim()) {
        msg = t("register.validation.openTimeRequired");
      } else if (
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.storeOpenTime)
      ) {
        msg = t("register.validation.invalidOpenTime");
      } else if (!data.storeCloseTime?.trim()) {
        msg = t("register.validation.closeTimeRequired");
      } else if (
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.storeCloseTime)
      ) {
        msg = t("register.validation.invalidCloseTime");
      } else {
        try {
          const open = new Date(`2000-01-01T${data.storeOpenTime}:00`);
          const close = new Date(`2000-01-01T${data.storeCloseTime}:00`);
          if (!(close > open)) {
            msg = t("register.validation.closingAfterOpening");
          }
        } catch (e) {
          // ignore parse errors, previous regex should catch format
        }
      }
    }

    return msg;
  };

  const prepareSignupPayload = (data: any) => {
    const formData = data;
    const shopImages = formData.shopImages;
    const franchiseDetails = formData.franchiseDetails;

    // Documents-related payload removed

    // prepare ISO date strings for open/close times
    const openTimeIso = makeIsoDate1970(formData.storeOpenTime, "008");
    const closeTimeIso = makeIsoDate1970(formData.storeCloseTime, "010");

    const signupPayload: Record<string, any> = {
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
        full_address: formData.doorNo?.trim() + " " + formData.address1?.trim(),
      },
      state: formData.pincodeData.state?.trim(),
      district: formData.pincodeData.district?.trim(),
      town: formData.pincodeData.city?.trim(),
      locality: formData.pincodeData.city?.trim(),
      pincode: parseInt(formData.pincode),
      primary_business: "Automobile spares & accessories",
      contact_details: [
        {
          isOwner: true,
          name: formData.ownerName?.trim(),
          mobile: parseInt(formData.mobile),
          email: formData.email?.trim(),
          isEmailVerified: false,
        },
      ],
      daily_limit: 1000000,
      services: {
        defined: false,
      },
      OwnerMobileNo: parseInt(formData.mobile),
      finance_details: {
        gstNo: formData.gstNumber?.trim() || "",
      },
      fssai: {
        hasLicense: false,
        docs: [],
        licenseNo: formData.fssaiCertificate?.trim() || "",
        views: 1,
      },
      otpId: otpRespRef.current._id,
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
      shop_photos: shopImages.map((img: any) => img.id),
      bankStatements: [],
      distributorKyc: {
        qualification: "",
      },
      termAndConditions: termsData
        ? termsData.map((t) => ({
            code: t.code,
            isAgree: true,
            status: "Agreed",
            version: t.version,
          }))
        : [],
      registrationFrom: "CLUB",
    };

    return signupPayload;
  };

  const onSubmit = async () => {
    const data = methods.getValues();
    const msg = validate(data);

    if (msg) {
      appToast.show({ msg, color: "danger" });
      return;
    }

    // Ensure user has checked the agreedToTerms checkbox
    if (!data.agreedToTerms) {
      // set a form error so the message appears inline
      methods.setError("agreedToTerms", {
        type: "manual",
        message: t("register.terms.agreeError"),
      });
      appToast.show({
        msg: t("register.terms.agreeError"),
        color: "danger",
      });
      return;
    }

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
        setTermsData(mapped);
      }

      setBusyLoading({ show: false, message: "" });

      // Proceed with signup flow (OTP etc.)
      proceedWithSignup();
    } catch (err) {
      setBusyLoading({ show: false, message: "" });
      appToast.show({ msg: t("register.terms.fetchFailed"), color: "danger" });
    }
  };

  const proceedWithSignup = async () => {
    const data = methods.getValues();

    // Check if mobile number is already registered
    setBusyLoading({ show: true, message: t("register.otp.checkingMobile") });
    const checkMobileResponse = await FranchiseService.searchFranchise({
      mobile: parseInt(data.mobile),
    });
    setBusyLoading({ show: false, message: "" });

    if (
      checkMobileResponse.statusCode === 200 &&
      checkMobileResponse.data.exists
    ) {
      appToast.show({
        msg: t("register.otp.mobileExists"),
        color: "danger",
      });
      return;
    }

    const r = await FranchiseService.sendOtpForRegistration(data.mobile);

    setBusyLoading({ show: false, message: "" });

    if (r.statusCode === 200) {
      otpRespRef.current = r.data;
      setOtpModal({
        mobile: data.mobile,
        show: true,
        validating: false,
        resending: false,
      });
      appToast.show({
        msg: t("register.otp.sent"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: r.data?.message || "Something went wrong",
        color: "danger",
      });
    }
  };

  const verifyOtp = useCallback(
    async ({ otp }: { otp: number | null }) => {
      if (!otp) {
        appToast.show({
          msg: t("register.otp.enter"),
          color: "danger",
        });
        return;
      }

      const mobile = methods.getValues("mobile");

      setOtpModal({
        mobile: mobile,
        show: true,
        validating: true,
        resending: false,
      });

      try {
        setBusyLoading({ show: true, message: "Verifying OTP..." });

        const r = await FranchiseService.verifyOtpForRegistration(
          otpRespRef.current._id,
          otp,
          mobile,
        );
        setBusyLoading({ show: false, message: "" });

        if (r.statusCode === 200) {
          // Close OTP modal
          setOtpModal({
            show: false,
            validating: false,
            resending: false,
            mobile: "",
          });

          // Show busy loader for signup
          setBusyLoading({
            show: true,
            message: t("register.submit.creating"),
          });

          // Prepare signup payload
          const signupPayload = prepareSignupPayload(methods.getValues());

          // Call signup API
          const signupResponse = await FranchiseService.doSignup(signupPayload);
          setBusyLoading({ show: false, message: "" });

          if (signupResponse.statusCode === 200) {
            appToast.show({
              msg: t("register.submit.success"),
              color: "success",
            });

            // Redirect to success page or login
            appNav.replace("/auth/signup/success");
          } else {
            appToast.show({
              msg: signupResponse.data?.message || t("register.submit.failed"),
              color: "danger",
            });
          }
        } else {
          setOtpModal({
            show: true,
            validating: false,
            resending: false,
            mobile,
          });
          appToast.show({
            msg: r.data?.message || t("register.otp.failedVerify"),
            color: "danger",
          });
        }
      } catch (error) {
        setBusyLoading({ show: false, message: "" });
      }
    },
    [appToast, appNav, methods],
  );

  // Resend OTP
  const resendOtp = async () => {
    setBusyLoading({ show: true, message: t("register.otp.resending") });

    const r = await FranchiseService.resendOtpForRegistration(
      otpRespRef.current._id,
    );

    setBusyLoading({ show: false, message: "" });

    if (r.statusCode === 200) {
      appToast.show({
        msg: t("register.otp.resent"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: t("register.otp.resendFailed"),
        color: "danger",
      });
    }
  };

  const onLocationModalCallback = useCallback(
    (data: { action: string; address?: any }) => {
      if (data.action === "submit" && data.address) {
        // Update form values with selected location

        if (data.address?.line1 && data.address?.line2) {
          methods.setValue("address1", data.address.line1 || "");
          methods.setValue(
            "address",
            data.address.line1 + " " + data.address.line2,
          );
        } else {
          methods.setValue("address1", data.address.loc || "");
          methods.setValue("address", data.address.loc || "");
        }

        methods.setValue("pincode", data.address.pincode || "");
        methods.setValue("pincodeData", {
          city: data.address.town || "",
          state: data.address.state || "",
          district: data.address.district || "",
        });

        methods.setValue("lat", data.address.lat || null);
        methods.setValue("lng", data.address.lng || null);

        methods.setValue("state", data.address.state || "");
        methods.setValue("district", data.address.district || "");
        methods.setValue("town", data.address.town || "");

        appToast.show({
          msg: "Location selected successfully",
          color: "success",
        });
      }
      setLocationModal({ show: false });
    },
    [methods, appToast],
  );

  const openLocationModal = useCallback(() => {
    setLocationModal({ show: true });
  }, []);

  // openTermsModal removed (SignupAgreementModal deleted)

  // Core Terms modal state (for viewing T&C / Privacy)
  const [termsModalState, setTermsModalState] = useState<{
    show: boolean;
    code?: string;
    title?: string;
  }>({ show: false });

  const openCoreTermsModal = useCallback((code: string, title?: string) => {
    setTermsModalState({
      show: true,
      code,
      title: title || t("register.terms.terms"),
    });
  }, []);

  const handleCoreTermsCallback = useCallback(
    (a: { action: string; data?: any }) => {
      if (
        a.action === "close" ||
        a.action === "accept" ||
        a.action === "error"
      ) {
        setTermsModalState({ show: false });
      }
      // Optionally handle accept
      if (a.action === "accept") {
        appToast.show({ msg: t("register.terms.viewed"), color: "success" });
      }
    },
    [appToast],
  );

  return (
    <>
      <AppSimpleHeader title={t("register.pageTitle")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container ">
          <div className="tw:mb-4">
            <div className="tw:text-lg tw:font-bold tw:mb-1 tw:flex tw:items-center tw:gap-2">
              <Store size={20} />
              {t("register.headingTitle")}
            </div>
            <div className="tw:text-sm tw:md:text-xs tw:text-slate-500">
              {t("register.headingSubtitle")}
            </div>
          </div>

          <FormProvider {...methods}>
            <div className="tw:grid gap-6 tw:md:gap-4 tw:grid-cols-1 tw:lg:grid-cols-3 tw:items-stretch">
              <div className="tw:flex tw:flex-col tw:h-full">
                <ContactInfo />
              </div>
              <div className="tw:flex tw:flex-col tw:h-full">
                <StoreInfo />
                {/* <Referral /> */}
              </div>
              <div className="tw:flex tw:flex-col tw:h-full">
                <StoreLocation onOpenLocationModal={openLocationModal} />
              </div>
              <div className="tw:lg:col-span-3">
                <div className="tw:rounded-sm tw:md:bg-white tw:md:shadow-sm tw:md:p-4  tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between">
                  <div className="tw:flex-1 tw:md:pb-0 tw:pb-4">
                    <label className="tw:inline-flex tw:items-start tw:gap-2 tw:text-sm tw:md:text-xs tw:text-app-gray-5">
                      <input
                        type="checkbox"
                        {...methods.register("agreedToTerms", {
                          required: t("register.terms.agreeError"),
                        })}
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
                    {methods.formState.errors?.agreedToTerms && (
                      <div className="tw:text-xs tw:text-red-600 tw:mt-2">
                        {methods.formState.errors.agreedToTerms.message}
                      </div>
                    )}
                  </div>

                  <AppButton
                    type="submit"
                    expand="block"
                    onClick={onSubmit}
                    className="tw:w-full tw:h-10 tw:lg:w-auto"
                  >
                    <Save size={16} />
                    {t("register.submit.button")}
                  </AppButton>
                </div>
              </div>
            </div>
          </FormProvider>
        </div>
      </div>

      <OtpModal
        mobile={otpModal.mobile}
        resend={resendOtp}
        show={otpModal.show}
        verify={verifyOtp}
        validating={otpModal.validating}
        resending={otpModal.resending}
        close={() => setOtpModal({ ...otpModal, show: false })}
      />

      <TermsModal
        code={termsModalState.code || "RETAIL_OS_TERMS"}
        show={termsModalState.show}
        title={termsModalState.title}
        callback={handleCoreTermsCallback}
      />

      <GeoLocationModal
        show={locationModal.show}
        callback={onLocationModalCallback}
        enableGeoLoc={true}
        title={t("register.modals.geoLocationTitle")}
      />

      {/* SignupAgreementModal removed - terms are fetched before submit */}

      <BusyLoader show={busyLoading.show} message={busyLoading.message} />
    </>
  );
};

export default Register;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Register"),
    },
  ];
}
