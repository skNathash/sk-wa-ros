import {
  AlertTriangle,
  Bell,
  FileText,
  HelpCircle,
  KeyRound,
  Languages,
  ScrollText,
  Settings,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { redirect } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppPopover from "~/components/core/popover/AppPopover";
import {
  APP_PRIVACY_POLICY_KEY,
  APP_PRIVACY_POLICY_VERSION,
  APP_TERMS_KEY,
  APP_TERMS_VERSION,
} from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import AuthService from "~/services/AuthService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import ProfileSidePane from "~/shared/profile/components/ProfileSidePane";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import PageAccessService from "~/services/PageAccessService";
import ChangePasswordModal from "~/shared/auth/change-password/ChangePasswordModal";
import DeclarationAgreementModal from "~/shared/store/declaration-agreement/DeclarationAgreementModal";
import DeclarationSignedBlock from "~/shared/store/declaration-agreement/DeclarationSignedBlock";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AgreedTerms from "./components/AgreedTerms";
import BankDetails from "./components/BankDetails";
import BasicInfo from "./components/BasicInfo";
import ConnectedSellerDetails from "./components/ConnectedSellerDetails";
import DeclarationForm from "./components/DeclarationForm";
import Documents from "./components/Documents";
import FssaiLicense from "./components/FssaiLicense";
import GstTypeSetting from "./components/GstTypeSetting";
import OwnerInformation from "./components/OwnerInformation";
import StoreBranding from "./components/StoreBranding";
import StoreInformation from "./components/StoreInformation";
import StoreLocation from "./components/StoreLocation";
import StorePhoto from "./components/StorePhoto";
import ProfileOverview from "./components/theme2/ProfileOverview";
import UpgradeToSKSeller from "./components/UpgradeToSKSeller";
import NotificationLanguageModal from "./modals/NotificationLanguageModal";
import PersonalInfoEditModal from "./modals/PersonalInfoEditModal";
import SKSellerSuccessModal from "./modals/SKSellerSuccessModal";
import StoreInfoEditModal from "./modals/StoreInfoEditModal";

export async function clientLoader() {
  if (
    PageAccessService.canAccessPage([], {
      allowNoSubscribe: true,
      allowIncompleteProfile: true,
    })
  ) {
    return;
  }
  if (AuthService.isManpowerLoggedIn()) {
    return redirect("/user/emp-profile");
  }
  return null;
}

const breadcrumbsBase: BreadcrumbItem[] = [
  {
    label: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "myProfile",
  },
];

const ProfilePage: React.FC = () => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  // theme-2 replaces the stack of per-field cards with the overview layout —
  // identity, KYC checklist and trust column.
  const isTheme2 = useTheme() === "theme-2";

  const { t } = useTranslation(["common"]);

  const breadcrumbs: BreadcrumbItem[] = breadcrumbsBase.map((b) => ({
    ...b,
    label: typeof b.label === "string" ? t(b.label as string) : b.label,
  }));
  const toast = useAppToast();

  const [profileData, setProfileData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [missingFields, setMissingFields] = useState<
    Array<Record<string, any>>
  >([]);

  const [declarationVerified, setDeclarationVerified] = useState(false);

  const [declarationAgreementModal, setDeclarationAgreementModal] = useState<{
    show: boolean;
  }>({ show: false });

  const [docModal, setDocModal] = useState<{
    show: boolean;
    data?: any;
    title?: string;
  }>({
    show: false,
    title: "",
  });

  const [storeInfoModal, setStoreInfoModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });

  const [personalInfoModal, setPersonalInfoModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });

  const [skSellerSuccessModal, setSkSellerSuccessModal] = useState(false);

  const [changePasswordModal, setChangePasswordModal] = useState<{
    show: boolean;
  }>({ show: false });

  const [notificationLangModal, setNotificationLangModal] = useState<{
    show: boolean;
  }>({ show: false });

  const [termsModal, setTermsModal] = useState<{
    show: boolean;
    code?: string;
    title?: string;
    version?: string;
  }>({ show: false });

  const documentsRef = React.useRef<HTMLDivElement | null>(null);

  // `silent` refetches in the background without swapping the page for the
  // loader — used when the UI has already been updated optimistically.
  const fetchProfile = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const userId = AuthService.getLoggedInUserId();

      if (userId) {
        const resp = await AuthService.getLoggedInFranchiseDetails();

        if (resp && resp.data?.data?._id) {
          AuthService.setloggedInUser(resp.data.data);
        }

        // Format franchise data to include addressLogs and other computed fields
        let profileData = FranchiseService.formatFranchise(
          resp.data.data || {},
        );

        // Transform shopPhotosDetails structure from {fileUrl} to {id}
        if (Array.isArray(profileData.shopPhotosDetails)) {
          profileData.shopPhotosDetails = profileData.shopPhotosDetails.map(
            (photo: any) => ({
              id: photo.fileUrl,
              status: photo.status,
              comment: photo.comment || "",
            }),
          );
        }

        const photos = Array.isArray(profileData.shopPhotosDetails)
          ? profileData.shopPhotosDetails
          : [];
        // Only an approved shop photo may be shown as the profile picture —
        // pending/rejected uploads must not surface anywhere.
        const approved = photos.find((p: any) => p.status === "Approved");
        profileData.approvedStoreImage = approved?.id || "";

        profileData._canShowDeclarationForm =
          shouldShowDeclarationFor(profileData);

        const profileComplete = AuthService.isFranchiseProfileComplete();
        setMissingFields(profileComplete.missingFields);

        setDeclarationVerified(
          profileData.declaration?.acceptedAt ? true : false,
        );

        if (
          (!AuthService.userAgreedPrivacyPolicy() ||
            !AuthService.userAgreedTerms()) &&
          !AuthService.isMasterLogin()
        ) {
          let code = "";
          let version = "";
          let title = "";

          if (!AuthService.userAgreedTerms()) {
            code = APP_TERMS_KEY;
            version = APP_TERMS_VERSION;
            title = "Retail OS Terms & Conditions";
          } else if (!AuthService.userAgreedPrivacyPolicy()) {
            code = APP_PRIVACY_POLICY_KEY;
            version = APP_PRIVACY_POLICY_VERSION;
            title = "Retail OS Privacy Policy";
          }

          if (code) {
            setTermsModal({
              show: true,
              code: code,
              version: version,
              title: title,
            });
          } else {
            toast.show({
              msg: "Failed to fetch terms data",
              color: "danger",
            });
          }
        }

        setProfileData(profileData);

        MiscService.createEvent("profile-updated", {
          data: profileData,
        });
      } else {
        setProfileData(null);
      }
    } catch (e) {
      // A failed background refresh must not blank out what's already rendered
      if (!silent) setProfileData(null);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Auto-scroll to the declaration form only once per visit — otherwise every
  // profile update (photo reorder, upload, ...) yanks the page back down.
  const didScrollToDocuments = React.useRef(false);

  useEffect(() => {
    if (
      !didScrollToDocuments.current &&
      !loading &&
      profileData &&
      !declarationVerified &&
      profileData._canShowDeclarationForm &&
      documentsRef.current
    ) {
      didScrollToDocuments.current = true;
      const t = setTimeout(() => {
        CommonService.scrollToView(documentsRef.current);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [loading, profileData, declarationVerified]);

  const handleStoreInfoModalClose = (r: { action: string }) => {
    setStoreInfoModal({ show: false });

    if (r.action === "submit") {
      fetchProfile();
    }
  };
  const handlePersonalInfoModalClose = (r: { action: string }) => {
    setPersonalInfoModal({ show: false });
    if (r.action === "submit") {
      fetchProfile();
    }
  };

  const handlePhotoCallback = async (params: {
    action: string;
    data?: any;
  }) => {
    const { action, data } = params;
    if (action === "refresh") {
      // When the child already knows the resulting photo list (upload, remove,
      // reorder), apply it in place and revalidate in the background so the
      // page doesn't collapse into the full-page loader.
      if (Array.isArray(data?.shopPhotosDetails)) {
        setProfileData((prev: any) => {
          if (!prev) return prev;
          const prevPhotos: any[] = Array.isArray(prev.shopPhotosDetails)
            ? prev.shopPhotosDetails
            : [];
          // Removed photos are still present in the payload (flagged
          // `isDeleted`) — they must not show up in the rendered list.
          const photos = data.shopPhotosDetails
            .filter((photo: any) => photo.isDeleted !== true)
            .map((photo: any) => ({
              id: photo.fileUrl,
              status: photo.status,
              comment:
                prevPhotos.find((p) => p.id === photo.fileUrl)?.comment || "",
            }));
          const approved = photos.find((p: any) => p.status === "Approved");
          return {
            ...prev,
            shopPhotosDetails: photos,
            approvedStoreImage: approved?.id || "",
          };
        });
        fetchProfile({ silent: true });
        return;
      }

      // Refresh profile data when child component requests it
      fetchProfile();
    }
  };

  const handleLocationUpdate = async (locationData: {
    address: string;
    addressLine1: string;
    addressLine2: string;
    pincode: string;
    state: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      // The UpdateStoreLocationModal already calls FranchiseService.updateFranchise
      // So we just need to refresh the profile data to show the updated information
      fetchProfile();
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const handleSKSellerAction = (action: "accept" | "reject") => {
    if (action === "accept") {
      toast.show({
        msg: t("skSellerUpgradeAccepted"),
        color: "success",
      });
      // TODO: Implement accept logic
    } else if (action === "reject") {
      toast.show({ msg: t("skSellerUpgradeRejected"), color: "warning" });
      // TODO: Implement reject logic
    }
  };

  const handleSKSellerSuccess = () => {
    setSkSellerSuccessModal(true);
  };

  const handleSKSellerSuccessClose = () => {
    setSkSellerSuccessModal(false);
  };

  const onDeclarationVerified = async () => {
    setDeclarationVerified(true);
    await fetchProfile();
    const t = setTimeout(async () => {
      clearTimeout(t);
      appNav.to("/dashboard/inventory/subscribe/search", {
        tab: "search",
      });
      await new Promise((res) => setTimeout(res, 500));
      location.reload();
    }, 1000);
  };

  const handleViewDeclaration = (a: { action: string; data?: any }) => {
    if (a.action === "viewDeclaration") {
      setDeclarationAgreementModal({ show: true });
    }
  };

  const handleDeclartionModalCb = (a: { action: string; data?: any }) => {
    setDeclarationAgreementModal({ show: false });
  };

  const handleChangePasswordCb = async (a: { action: string; data?: any }) => {
    setChangePasswordModal({ show: false });

    if (a.action === "passwordChanged") {
      appNav.to("/auth/logout");
    }
  };

  // Helper to decide whether declaration UI should be shown.
  const shouldShowDeclarationFor = (pData: any) => {
    const docs = pData?.documents || {};
    const photoDocs = Array.isArray(docs.photo) ? docs.photo : [];
    const businessDocs = Array.isArray(docs.business) ? docs.business : [];
    const addressDocs = Array.isArray(docs.address) ? docs.address : [];

    const PHOTO_STATUS_KEY = "photoIdStatus";
    const BUSINESS_STATUS_KEY = "businessIDStatus";
    const ADDRESS_STATUS_KEY = "addressProofIdStatus";

    const hasApproved = (arr: any[], key: string) => {
      if (!Array.isArray(arr) || arr.length === 0) return false;
      return arr.some((d: any) => d && d[key] === "Approved");
    };

    // If any one of photo, business or address is approved, we can hide declaration form
    const anyApproved =
      hasApproved(photoDocs, PHOTO_STATUS_KEY) ||
      hasApproved(businessDocs, BUSINESS_STATUS_KEY) ||
      hasApproved(addressDocs, ADDRESS_STATUS_KEY);

    // Show declaration UI unless any one document is approved.
    return !anyApproved;
  };

  const changePassword = () => {
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    setChangePasswordModal({ show: true });
  };

  const handleTermsModalCb = async (a: { action: string; data?: any }) => {
    if (a.action === "agree") {
      setTermsModal({ show: false });

      // toast.show({
      //   msg: "Terms and conditions agreed successfully",
      //   color: "success",
      // });

      // await new Promise((resolve) => setTimeout(resolve, 1000));

      // if (!AuthService.userAgreedPrivacyPolicy()) {
      //   toast.show({
      //     msg: "Please agree to the privacy policy",
      //     color: "warning",
      //   });

      //   setTermsModal({
      //     show: true,
      //     code: APP_PRIVACY_POLICY_KEY,
      //     version: APP_PRIVACY_POLICY_VERSION,
      //     title: "Retail OS Privacy Policy",
      //   });
      // }

      fetchProfile();
    }
  };

  return (
    <>
      <AppHeader
        title={t("myProfile")}
        sectionKey="profile"
        activeTab="my-profile"
        mobileLead="menu"
        showAudioNote={true}
        audioNoteTitle={t("myProfile")}
        audioFeature="myProfile"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — profile section menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="my-profile"
                  title="Manage profile"
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* theme-2 hides breadcrumbs and the page description, and
                      moves Store Notes and the settings actions into the
                      profile side pane — so the whole row goes with them and
                      the identity hero can lead the page. */}
                  {!isTheme2 ? (
                    <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:mb-4 tw:gap-4">
                      <div>
                        <AppBreadcrumbs data={breadcrumbs} />
                        <PageDescription description="profile" />
                      </div>
                      <div className="tw:self-end tw:flex tw:items-center tw:gap-2">
                        <button
                          className="tw:inline-flex tw:items-center tw:gap-1 tw:px-3 tw:py-1.5 tw:text-sm tw:border tw:border-gray-300 tw:rounded-md tw:bg-white tw:hover:bg-gray-50 tw:cursor-pointer"
                          onClick={() => appNav.to("/user/store-notes")}
                        >
                          <FileText className="tw:w-4 tw:h-4" />
                          <span>Store Notes</span>
                        </button>
                        <AppPopover
                          align="end"
                          side="bottom"
                          triggerContent={
                            <button className="tw:inline-flex tw:items-center tw:gap-1 tw:px-3 tw:py-1.5 tw:text-sm tw:border tw:border-gray-300 tw:rounded-md tw:bg-white tw:hover:bg-gray-50 tw:cursor-pointer">
                              <Settings className="tw:w-4 tw:h-4" />
                              <span>Settings</span>
                            </button>
                          }
                        >
                          <div className="tw:flex tw:flex-col tw:min-w-[180px]">
                            <button
                              className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:text-sm tw:hover:bg-gray-100 tw:rounded-md tw:text-left"
                              onClick={changePassword}
                            >
                              <KeyRound className="tw:w-4 tw:h-4" />
                              Change Password
                            </button>
                            <button
                              className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:text-sm tw:hover:bg-gray-100 tw:rounded-md tw:text-left"
                              onClick={() =>
                                appNav.to("/user/notification-logs")
                              }
                            >
                              <Bell className="tw:w-4 tw:h-4" />
                              Notification Logs
                            </button>
                            <button
                              className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:text-sm tw:hover:bg-gray-100 tw:rounded-md tw:text-left"
                              onClick={() =>
                                setNotificationLangModal({ show: true })
                              }
                            >
                              <Languages className="tw:w-4 tw:h-4" />
                              Notification Language
                            </button>
                          </div>
                        </AppPopover>
                      </div>
                    </div>
                  ) : null}
                  {/* theme-2 says the same thing better — the trust score and
                      the KYC checklist both name what is still missing — so
                      the banner stays out of the hero's way there. */}
                  {missingFields.length > 0 ? (
                    <InfoBlock
                      variant="warning"
                      size="sm"
                      bordered
                      shadow
                      className="tw:mb-3"
                    >
                      <div className="tw:flex tw:items-start tw:gap-2">
                        <AlertTriangle className="tw:w-4 tw:h-4 tw:mt-[2px]" />
                        <div className="tw:flex-1">
                          <div>
                            <span className="tw:font-semibold">
                              {t("weNoticedThatYourProfileIsIncomplete")}.{" "}
                            </span>
                            <span className="tw:me-1">
                              {t(
                                "pleaseTakeAMomentToCompleteItToAccessAllFeatures",
                              )}
                            </span>
                            <div className="tw:mt-1">
                              <ul className="tw:list-disc tw:pl-5 tw:text-sm">
                                {missingFields.map((field, idx) => (
                                  <li key={idx}>{field.msg || field.name}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </InfoBlock>
                  ) : null}
                  {!isTheme2 &&
                  AuthService.isSfSeller() &&
                  missingFields.length === 0 &&
                  !AuthService.isSkBuyer() ? (
                    <UpgradeToSKSeller
                      onUpgradeClick={() => {}}
                      onSuccess={handleSKSellerSuccess}
                    />
                  ) : null}

                  {loading ? (
                    <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
                      <div className="tw:w-10 tw:h-10 tw:border-t-2 tw:border-b-2 tw:border-gray-900 tw:rounded-full tw:animate-spin"></div>
                    </div>
                  ) : profileData ? (
                    <>
                      {isTheme2 ? (
                        <ProfileOverview
                          profileData={profileData}
                          onRefresh={fetchProfile}
                          onSellerUpgrade={handleSKSellerSuccess}
                        />
                      ) : null}
                      {isTheme2 ? null : (
                        <>
                          <BasicInfo
                            name={profileData.name || ""}
                            contactPerson={profileData?.name || ""}
                            phone={profileData.mobile || ""}
                            email={profileData.email || ""}
                            createdAt={profileData.createdAt}
                            ownerImage={profileData.ownerDetails?.photoUrl}
                            storeImage={profileData.approvedStoreImage}
                            callback={handlePhotoCallback}
                            isVerified={declarationVerified}
                            franchiseId={profileData.franchiseId}
                            isEmailVerified={profileData.isEmailVerified}
                          />
                          {profileData?.linkedFranchise?._id ? (
                            <div className="tw:mt-4">
                              <ConnectedSellerDetails
                                fid={profileData?.linkedFranchise?._id}
                              />
                            </div>
                          ) : null}

                          {/* Owner Information Section */}
                          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-4">
                            <StoreBranding
                              storeLogo={profileData.storeLogo}
                              storeCaption={profileData.storeCaption}
                              socialMediaLinks={profileData.socialMediaLinks}
                              callback={fetchProfile}
                            />

                            <StoreInformation
                              storeName={profileData.name}
                              fssaiLicense={profileData.fssaiLicense}
                              storeSize={profileData.storeSize}
                              storeOpenTime={
                                profileData.operatingHours?.openTime
                              }
                              storeCloseTime={
                                profileData.operatingHours?.closeTime
                              }
                              primaryBusiness={profileData.primaryBusiness}
                              secondaryBusiness={profileData.secondaryBusiness}
                              primaryBusinessId={profileData.primaryBusinessId}
                              secondaryBusinessId={
                                profileData.secondaryBusinessId
                              }
                              deliveryRadius={profileData.deliveryRadius}
                              latitude={
                                profileData.geoLocation?.coordinates?.[1]
                              }
                              longitude={
                                profileData.geoLocation?.coordinates?.[0]
                              }
                              monthlyTurnover={profileData.monthlyTurnOver}
                              yearsOfExperience={profileData.yearsOfExperience}
                              callback={fetchProfile}
                              profileRequestLogs={
                                profileData.profileUpdateRequest
                              }
                            />

                            <div className="tw:md:col-span-2">
                              <GstTypeSetting
                                gstNumber={profileData.gstNumber}
                                profileRequestLogs={
                                  profileData.profileUpdateRequest
                                }
                                callback={fetchProfile}
                              />
                            </div>

                            {/* <OwnerInformation
                  title={t("secondaryOwnerInformation")}
                  type="secondary"
                  name={profileData.secondaryOwnerDetails?.name}
                  phone={profileData.secondaryOwnerDetails?.phone}
                  email={profileData.secondaryOwnerDetails?.email}
                  alternateMobile={
                    profileData.secondaryOwnerDetails?.alternateMobile
                  }
                  addressLine1={profileData.secondaryOwnerDetails?.addressLine1}
                  addressLine2={profileData.secondaryOwnerDetails?.addressLine2}
                  city={profileData.secondaryOwnerDetails?.city}
                  district={profileData.secondaryOwnerDetails?.district}
                  state={profileData.secondaryOwnerDetails?.state}
                  pincode={profileData.secondaryOwnerDetails?.pincode}
                  onUpdate={fetchProfile}
                /> */}

                            <StoreLocation
                              addressLine1={profileData.addressLine1}
                              addressLine2={profileData.addressLine2}
                              latitude={
                                profileData.geoLocation?.coordinates?.[1]
                              }
                              longitude={
                                profileData.geoLocation?.coordinates?.[0]
                              }
                              pincode={profileData.pincode}
                              state={profileData.state}
                              district={profileData.district}
                              city={profileData.city}
                              addressLogs={profileData.addressLogs || []}
                              onLocationUpdate={handleLocationUpdate}
                            />

                            <StorePhoto
                              photos={profileData.shopPhotosDetails}
                              callback={handlePhotoCallback}
                            />

                            <OwnerInformation
                              title={t("mainOwnerInformation")}
                              type="main"
                              name={profileData.ownerDetails?.name}
                              phone={profileData.ownerDetails?.phone}
                              email={profileData.ownerDetails?.email}
                              alternateMobile={
                                profileData.ownerDetails?.alternateMobile
                              }
                              addressLine1={
                                profileData.ownerDetails?.addressLine1
                              }
                              addressLine2={
                                profileData.ownerDetails?.addressLine2
                              }
                              city={profileData.ownerDetails?.city}
                              district={profileData.ownerDetails?.district}
                              state={profileData.ownerDetails?.state}
                              pincode={profileData.ownerDetails?.pincode}
                              onUpdate={fetchProfile}
                            />

                            <FssaiLicense
                              profileRequestLogs={
                                profileData.profileUpdateRequest
                              }
                              callback={fetchProfile}
                            />

                            <div className="tw:md:col-span-2">
                              <BankDetails
                                bankName={profileData.bankList?.[0]?.bank_name}
                                accountHolderName={
                                  profileData.bankList?.[0]?.accountHolderName
                                }
                                accountNumber={
                                  profileData.bankList?.[0]?.accountNumber
                                }
                                ifsc={profileData.bankList?.[0]?.ifsc}
                                onUpdate={fetchProfile}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Documents Section — theme-2 shows it only while the
                          store still has to sign the declaration; everything
                          else moved to the checklist and /user/documents. */}
                      {!isTheme2 ||
                      (!declarationVerified &&
                        profileData?._canShowDeclarationForm) ? (
                        <div className="tw:mt-4" ref={documentsRef}>
                          <AppCard>
                            {declarationVerified ? (
                              <div className="tw:mb-4">
                                <DeclarationSignedBlock
                                  name={profileData.ownerDetails?.name}
                                  date={profileData.declaration?.acceptedAt}
                                  showViewDeclaration={true}
                                  callback={handleViewDeclaration}
                                />
                              </div>
                            ) : null}
                            {!declarationVerified &&
                            profileData?._canShowDeclarationForm ? (
                              <InfoBlock
                                bordered
                                variant="info"
                                size="sm"
                                className="tw:mb-4"
                              >
                                <span className="tw:font-semibold tw:flex tw:items-center tw:gap-2 tw:mb-2">
                                  <HelpCircle size={16} /> Please note:
                                </span>
                                <div className="tw:text-sm">
                                  You can upload documents or just submit the
                                  declaration form.{" "}
                                  <span className="tw:font-semibold">
                                    &quot;Submitting the declaration form will
                                    complete your profile verification.&quot;
                                  </span>
                                </div>
                              </InfoBlock>
                            ) : null}
                            <Documents
                              documents={profileData.documents}
                              onRefresh={fetchProfile}
                            />
                            {!declarationVerified &&
                            profileData?._canShowDeclarationForm ? (
                              <div className="tw:flex tw:items-center tw:gap-2 tw:my-6">
                                <div className="tw:flex-1 tw:border-t tw:border-gray-400"></div>
                                <div className="tw:text-gray-900 tw:text-sm">
                                  <span className="tw:font-medium tw:border tw:border-gray-900 tw:px-2 tw:py-1 tw:rounded-md">
                                    OR
                                  </span>
                                </div>
                                <div className="tw:flex-1 tw:border-t tw:border-gray-400"></div>
                              </div>
                            ) : null}
                            {/* Declaration form for agreeing to signup declaration */}
                            <div className="tw:mt-4">
                              {!declarationVerified &&
                              profileData?._canShowDeclarationForm ? (
                                <DeclarationForm
                                  mobile={profileData.mobile}
                                  onVerified={onDeclarationVerified}
                                  acceptedAt={
                                    profileData.declaration?.acceptedAt
                                  }
                                />
                              ) : null}
                            </div>
                          </AppCard>
                          {/* Agreed terms (from signup) */}
                          <div className="tw:mt-4">
                            <AgreedTerms
                              terms={profileData.termAndConditions}
                            />
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="tw:text-center tw:py-8">
                      {t("noProfileDataFound")}
                    </div>
                  )}
                </AppPaneMain>

                {/* The pane is CSS-hidden below lg, but mounting it there
                    would still run its fetches — and its identity hero now
                    leads the page on mobile, so keep it off entirely. */}
                {!isMobile ? (
                  <AppPaneSide className="app-pane-only">
                    <ProfileSidePane profileData={profileData} />
                  </AppPaneSide>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <StoreInfoEditModal
        show={storeInfoModal.show}
        data={storeInfoModal.data}
        callback={handleStoreInfoModalClose}
      />
      <PersonalInfoEditModal
        show={personalInfoModal.show}
        data={personalInfoModal.data}
        callback={handlePersonalInfoModalClose}
      />
      <SKSellerSuccessModal
        show={skSellerSuccessModal}
        onClose={handleSKSellerSuccessClose}
      />

      <DeclarationAgreementModal
        show={declarationAgreementModal.show}
        callback={handleDeclartionModalCb}
        acceptedAt={profileData?.declaration?.acceptedAt}
      />

      <ChangePasswordModal
        show={changePasswordModal.show}
        username={profileData?.mobile || ""}
        callback={handleChangePasswordCb}
      />

      <TermsModal
        show={termsModal.show}
        code={termsModal.code || APP_TERMS_KEY}
        title={termsModal.title}
        version={termsModal.version || APP_TERMS_VERSION}
        callback={handleTermsModalCb}
        canUpdate={true}
        noCancelButton={true}
      />
      <NotificationLanguageModal
        show={notificationLangModal.show}
        data={profileData}
        callback={(r: { action: string }) => {
          setNotificationLangModal({ show: false });
          if (r.action === "submit") {
            fetchProfile();
          }
        }}
      />
    </>
  );
};

export default ProfilePage;
