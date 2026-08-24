import { ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { redirect } from "react-router";
import { useForm, useWatch, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import VerifyEmailModal from "~/shared/auth/modals/verify-email/VerifyEmailModal";

type FormValues = {
  mobile: string;
  isWhatsapp?: boolean;
  ownerName?: string;
  email?: string;
  notificationMessageLang?: string;
};

const PersonalInfo = () => {
  const signupTemp = FranchiseService.getSignupTemp();
  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: { mobile: signupTemp.mobile || "" },
  });
  const emailValue = useWatch({ control, name: "email" });
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    const temp = FranchiseService.getSignupTemp();
    reset({
      mobile: temp.mobile || "",
      isWhatsapp: temp.isWhatsapp || false,
      ownerName: temp.ownerName || "",
      email: temp.email || "",
      notificationMessageLang: temp.notificationMessageLang || "en",
    });
    if (temp.emailVerified && temp.email) {
      setEmailVerified(true);
      setVerifiedEmail(temp.email);
    }
  }, [reset]);

  useEffect(() => {
    if (emailVerified && emailValue !== verifiedEmail) {
      setEmailVerified(false);
      FranchiseService.updateSignupTemp({ emailVerified: false });
    }
  }, [emailValue, emailVerified, verifiedEmail]);

  const appToast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const [verifyEmailModal, setVerifyEmailModal] = useState(false);
  const appNav = useAppNav();
  const { t } = useTranslation(["signup"]);

  const handleVerifyEmail = () => {
    if (!emailValue || !CommonService.isValidEmail(emailValue)) {
      appToast.show({
        msg: t("register.validation.invalidEmail"),
        color: "danger",
      });
      return;
    }
    setVerifyEmailModal(true);
  };

  const onSubmit = (data: FormValues) => {
    // For now, validate basic fields and navigate to next step
    if (!data.mobile) {
      appToast.show({
        msg: t("register.validation.mobileRequired"),
        color: "danger",
      });
      return;
    }

    if (!data.ownerName?.trim()) {
      appToast.show({
        msg: t("register.validation.ownerNameRequired"),
        color: "danger",
      });
      return;
    }

    if (data.email && !CommonService.isValidEmail(data.email)) {
      appToast.show({
        msg: t("register.validation.invalidEmail"),
        color: "danger",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Persist personal info into signup temp storage
      FranchiseService.updateSignupTemp({
        mobile: data.mobile,
        isWhatsapp: data.isWhatsapp,
        ownerName: data.ownerName,
        email: data.email,
        notificationMessageLang: data.notificationMessageLang || "en",
      });

      // Navigate to register step using router helper (no params needed)
      appNav.to("/auth/signup/store-info");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppSimpleHeader title={t("register.pageTitle")} />

      <div className="app-page tw:min-h-screen signup-bg-2">
        <div className="tw:max-w-md tw:mx-auto">
          <div className="tw:z-10 tw:px-6 tw:pt-6 tw:md:px-0 tw:pb-10">
            <h1 className="tw:text-2xl tw:font-semibold tw:text-gray-900">
              {t("register.headingTitle")}
            </h1>
            <p className="tw:mt-2 tw:text-sm tw:text-gray-600 tw:relative tw:z-10">
              {t("register.headingSubtitle")}
            </p>

            <div className="tw:-mt-4 tw:text-center">
              <ImgRender
                src="signup/personal.jpg"
                className="signup-page-img tw:mx-auto tw:inline-block tw:object-cover tw:mix-blend-multiply"
              />
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="tw:-mt-4 tw:relative tw:z-10"
            >
              <div className="tw:bg-white tw:rounded-lg tw:shadow-md tw:p-5">
                <h2 className="tw:font-semibold tw:text-lg">
                  {t("register.contact.title")}
                </h2>

                <AppInput
                  type="tel"
                  placeholder=""
                  register={register}
                  name="mobile"
                  inputClassName="tw:bg-whitetw:ps-12"
                  className="tw:mt-4"
                  leftIcon={<span className="tw:text-gray-400">+91</span>}
                  maxLength={10}
                  disabled={true}
                />

                <div className="tw:flex tw:items-center tw:mt-3">
                  <input
                    id="isWhatsapp"
                    type="checkbox"
                    {...register("isWhatsapp")}
                    className="tw:h-4 tw:w-4 tw:rounded"
                  />
                  <label
                    htmlFor="isWhatsapp"
                    className="tw:ml-2 tw:text-xs tw:text-gray-600"
                  >
                    {t("register.contact.mobile.isWhatsapp")}
                  </label>
                </div>

                <AppInput
                  label={t("register.contact.name.label")}
                  placeholder={t("register.contact.name.placeholder")}
                  register={register}
                  name="ownerName"
                  className="tw:mt-4"
                  inputClassName="tw:bg-white"
                  isRequired={true}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^A-Za-z.\s]/g, "");
                    if (cleaned !== e.target.value) {
                      e.target.value = cleaned;
                    }
                  }}
                />

                <div>
                  <AppInput
                    label={t("register.contact.email.label")}
                    placeholder={t("register.contact.email.placeholder")}
                    register={register}
                    name="email"
                    type="email"
                    className="tw:mt-4"
                    inputClassName="tw:bg-white"
                    isRequired={false}
                  />
                  {emailValue && (
                    <div className="tw:flex tw:justify-end tw:mt-1">
                      {emailVerified ? (
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-green-600">
                          <ShieldCheck size={12} />
                          {t("register.contact.email.verified", "Verified")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifyEmail()}
                          className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-blue-600 hover:tw:text-blue-800 hover:tw:underline"
                        >
                          <ShieldCheck size={12} />
                          {t("register.contact.email.verify", "Verify Email")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* <p className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:mb-4">
                  {t("register.contact.email.optionalHint")}
                </p> */}

                <div className="tw:mt-4">
                  <Controller
                    name="notificationMessageLang"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label={t(
                          "register.contact.msgLang.label",
                          "Notification Language",
                        )}
                        options={CommonService.getMessageLanguages()}
                        onChange={field.onChange}
                        value={field.value}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    {t(
                      "register.contact.msgLang.note",
                      "Language for your WhatsApp messages",
                    )}
                  </div>
                </div>
              </div>

              <div className="tw:mt-6 tw:flex tw:justify-between tw:items-center">
                <AppButton
                  color="medium"
                  fill="outline"
                  className="tw:px-6 tw:py-3 tw:font-semibold tw:text-base"
                  type="button"
                  onClick={() => appNav.to("/auth/signup/mobile")}
                >
                  {t("register.submit.back", "Back")}
                </AppButton>
                <AppButton
                  color="primary"
                  className="tw:px-6 tw:py-3 tw:font-semibold tw:text-base"
                  type="submit"
                  disabled={submitting}
                >
                  {t("register.submit.next")}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      </div>

      <VerifyEmailModal
        show={verifyEmailModal}
        email={emailValue || ""}
        callback={(a) => {
          if (a.action === "verified") {
            setEmailVerified(true);
            setVerifiedEmail(emailValue || "");
            FranchiseService.updateSignupTemp({ emailVerified: true });
            setVerifyEmailModal(false);
          } else if (a.action === "close") {
            setVerifyEmailModal(false);
          }
        }}
        autoTrigger={true}
      />
    </>
  );
};

export default PersonalInfo;

export async function clientLoader() {
  const has = FranchiseService.hasTempSignupData();
  if (!has) {
    throw redirect("/auth/signup/mobile");
  }
  return null;
}
