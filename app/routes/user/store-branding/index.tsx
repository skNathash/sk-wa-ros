import { ExternalLink, Image as ImageIcon, Info, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { redirect } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { CLUB_URL } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BrandingPreviewPane from "./components/BrandingPreviewPane";
import {
  buildBrandingPayload,
  buildBrandingForm,
  EMPTY_BRANDING_FORM,
  LOGO_UPLOAD_PROPS,
  MAX_CAPTION_LENGTH,
  SOCIAL_FIELDS,
  validateSocialLinks,
  type BrandingFormValues,
} from "./helper";

export const clientLoader = async () => {
  if (!AuthService.getLoggedInUserId()) {
    return redirect("/auth/login");
  }
  return null;
};

export const meta = () => [{ title: "Store Branding" }];

const breadcrumbsBase: BreadcrumbItem[] = [
  { label: "dashboard", redirect: { path: "/dashboard" } },
  { label: "myProfile", redirect: { path: "/user/my-profile" } },
  { label: "Store branding" },
];

/**
 * Full-page editor for the store's public identity — logo, tagline and social
 * links. Theme-2 sends the profile page's branding card here instead of
 * opening the branding modal.
 */
const StoreBrandingPage: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const appNav = useAppNav();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const breadcrumbs: BreadcrumbItem[] = breadcrumbsBase.map((b) => ({
    ...b,
    label: typeof b.label === "string" ? t(b.label as string) : b.label,
  }));

  const { register, control, handleSubmit, reset, setValue, setError, formState } =
    useForm<BrandingFormValues>({ defaultValues: EMPTY_BRANDING_FORM });

  const { errors, isDirty } = formState;

  // The side pane previews what the store is typing, so watch the whole form.
  const values = useWatch({ control }) as BrandingFormValues;

  const readOnly = AuthService.isMasterLogin();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const resp = await AuthService.getLoggedInFranchiseDetails();
      // Other profile surfaces read the cached user, so keep it in step with
      // what this page just read.
      if (resp?.data?.data?._id) {
        AuthService.setloggedInUser(resp.data.data);
      }
      const profile = FranchiseService.formatFranchise(resp?.data?.data || {});
      setProfileData(profile);
      reset(buildBrandingForm(profile));
    } catch {
      setProfileData(null);
      toast.show({ msg: "Failed to fetch store branding", color: "danger" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogoUpload = (response: any) => {
    const assetId = response?.id || response?._id;
    if (assetId) {
      setValue("storeLogo", assetId, { shouldDirty: true });
    }
  };

  const removeLogo = () => setValue("storeLogo", "", { shouldDirty: true });

  const onSubmit = async (formValues: BrandingFormValues) => {
    if (readOnly) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    const invalid = validateSocialLinks(formValues);
    if (invalid) {
      setError(invalid.name, { type: "manual", message: invalid.msg });
      toast.show({ msg: invalid.msg, color: "danger" });
      return;
    }

    setSubmitting(true);
    try {
      const resp: any = await FranchiseService.updateFranchise(
        buildBrandingPayload(formValues),
      );

      if (resp && (resp.statusCode === 200 || resp.statusCode === 201)) {
        toast.show({ msg: "Store branding updated", color: "success" });
        reset(formValues);
        appNav.to("/user/my-profile");
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update store branding",
          color: "danger",
        });
      }
    } catch {
      toast.show({ msg: "Failed to update store branding", color: "danger" });
    }
    setSubmitting(false);
  };

  const storeName = profileData?.name || "";
  const clubUrl = `${CLUB_URL}/${profileData?.mobile || ""}`;

  return (
    <>
      <AppHeader
        title="Store branding"
        subtitle="Logo, tagline and social links"
        sectionKey="profile"
        activeTab="store-branding"
        mobileLead="back"
      />

      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — profile section menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="store-branding"
                  title="Manage profile"
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12 tw:mx-auto tw:w-full tw:max-w-5xl">
                  <AppBreadcrumbs data={breadcrumbs} />

                  {readOnly ? (
                    <InfoBlock
                      variant="warning"
                      size="sm"
                      bordered
                      className="tw:my-3"
                    >
                      You are viewing this store as a master login — branding
                      cannot be changed from here.
                    </InfoBlock>
                  ) : (
                    <InfoBlock
                      variant="info"
                      size="sm"
                      bordered
                      className="app-note-block tw:my-3"
                    >
                      <div className="tw:flex tw:items-start tw:gap-2">
                        <Info className="app-note-block-icon tw:w-4 tw:h-4 tw:mt-0.5" />
                        <div>
                          Branding is what customers see on WhatsApp shares and
                          on your{" "}
                          <a
                            href={clubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="tw:font-semibold tw:text-primary tw:hover:underline"
                          >
                            club store
                          </a>{" "}
                          page.
                        </div>
                      </div>
                    </InfoBlock>
                  )}

                  {loading ? (
                    <div className="tw:flex tw:justify-center tw:py-16">
                      <AppSpinner />
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <AppCard
                        title="Store logo"
                        subtitle="Shown on WhatsApp shares and the club app"
                      >
                        <div className="tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-start">
                          {values?.storeLogo ? (
                            <div className="tw:relative tw:h-32 tw:w-32 tw:shrink-0 tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:shadow-sm">
                              <ImgRender
                                assetId={values.storeLogo}
                                alt="Store logo"
                                className="tw:h-full tw:w-full tw:object-contain"
                              />
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={removeLogo}
                                  title="Remove logo"
                                  className="tw:absolute tw:top-2 tw:right-2 tw:z-10 tw:rounded-full tw:border tw:border-gray-100 tw:bg-white tw:p-1.5 tw:text-red-600 tw:shadow-md tw:hover:bg-red-50 tw:cursor-pointer"
                                >
                                  <X className="tw:h-4 tw:w-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <FileUpload
                              {...LOGO_UPLOAD_PROPS}
                              onFileUpload={handleLogoUpload}
                              label="Upload logo"
                            >
                              <div className="tw:group tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:rounded-xl tw:border-2 tw:border-dashed tw:border-gray-200 tw:bg-white tw:p-8 tw:transition-all tw:hover:border-primary tw:hover:bg-gray-50">
                                <div className="tw:mb-3 tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:transition-transform tw:group-hover:scale-110">
                                  <ImageIcon className="tw:h-6 tw:w-6 tw:text-gray-500" />
                                </div>
                                <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                                  Click to upload your logo
                                </span>
                                <p className="tw:mt-1 tw:text-xs tw:text-gray-500">
                                  PNG, JPG or WEBP up to 10MB · square works
                                  best
                                </p>
                              </div>
                            </FileUpload>
                          )}

                          {values?.storeLogo && !readOnly ? (
                            <FileUpload
                              {...LOGO_UPLOAD_PROPS}
                              onFileUpload={handleLogoUpload}
                              label="Replace logo"
                            >
                              <AppButton
                                size="small"
                                color="light"
                                fill="outline"
                              >
                                Replace logo
                              </AppButton>
                            </FileUpload>
                          ) : null}
                        </div>
                      </AppCard>

                      <AppCard
                        title="Tagline"
                        subtitle="A short line about your store, shown beside the logo"
                      >
                        <AppTextarea
                          name="storeCaption"
                          label=""
                          register={register}
                          rows={3}
                          placeholder="e.g. Fresh groceries delivered to your door since 2015"
                          maxLength={MAX_CAPTION_LENGTH}
                          className="tw:mb-1"
                          error={errors.storeCaption?.message}
                        />
                        <span className="tw:text-xs tw:text-gray-500">
                          Max {MAX_CAPTION_LENGTH} characters
                        </span>
                      </AppCard>

                      <AppCard
                        title="Social links"
                        subtitle="Where customers can follow your store"
                      >
                        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
                          {SOCIAL_FIELDS.map((field) => {
                            const Icon = field.icon;
                            return (
                              <AppInput
                                key={field.name}
                                name={field.name}
                                label={`${field.label} link`}
                                type="text"
                                register={register}
                                placeholder={field.placeholder}
                                className="tw:mb-0"
                                inputClassName="tw:bg-white"
                                error={errors[field.name]?.message}
                                leftIcon={
                                  <Icon
                                    className={`tw:w-4 tw:h-4 ${field.iconClass}`}
                                  />
                                }
                              />
                            );
                          })}
                        </div>

                        <p className="tw:mt-3 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                          <ExternalLink className="tw:h-3.5 tw:w-3.5" />
                          Paste the full profile url, starting with https://
                        </p>
                      </AppCard>

                      <div className="tw:flex tw:justify-end tw:gap-2">
                        <AppButton
                          type="button"
                          color="light"
                          fill="outline"
                          disabled={submitting}
                          onClick={() => appNav.to("/user/my-profile")}
                        >
                          Cancel
                        </AppButton>
                        <AppButton
                          type="submit"
                          color="primary"
                          isLoading={submitting}
                          disabled={submitting || !isDirty || readOnly}
                        >
                          Save branding
                        </AppButton>
                      </div>
                    </form>
                  )}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <BrandingPreviewPane
                    values={values || EMPTY_BRANDING_FORM}
                    storeName={storeName}
                    clubUrl={clubUrl}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreBrandingPage;
