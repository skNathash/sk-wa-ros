import React, { useMemo, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import { buildProfilePaneModel } from "~/shared/profile/helper";
import ProfileIdentityHero from "~/shared/profile/components/ProfileIdentityHero";
import VerifyEmailModal from "~/shared/auth/modals/verify-email/VerifyEmailModal";
import BankDetailModal from "../../modals/BankDetailModal";
import FssaiLicenseModal from "../../modals/FssaiLicenseModal";
import GstSettingsModal from "../../modals/GstSettingsModal";
import UpdateOwnerInformationModal from "../../modals/UpdateOwnerInformationModal";
import UpdateStoreInformationModal from "../../modals/UpdateStoreInformationModal";
import KycChecklist from "./KycChecklist";
import ProfileStatTiles from "./ProfileStatTiles";
import ProfileTrustCard from "./ProfileTrustCard";
import SellerUpgradeCard from "./SellerUpgradeCard";
import StoreDetailSections from "./StoreDetailSections";
import StoreIdentityCard from "./StoreIdentityCard";
import { buildProfileOverviewModel, type KycCheck } from "./helper";

interface ProfileOverviewProps {
  profileData: any;
  /** Re-reads the profile after any modal writes to it. */
  onRefresh: () => void;
  /** Fired once an SK Seller upgrade request goes through. */
  onSellerUpgrade?: () => void;
}

type ModalKey = "store" | "owner" | "gst" | "fssai" | "bank" | "email";

/**
 * The theme-2 profile overview — identity, the KYC checklist and the trust
 * column, each row of the checklist wired to the modal that clears it.
 */
const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profileData,
  onRefresh,
  onSellerUpgrade,
}) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const [modal, setModal] = useState<ModalKey | null>(null);

  const model = useMemo(
    () => buildProfileOverviewModel(profileData),
    [profileData],
  );

  // The identity hero the side pane shows on desktop leads the page on
  // mobile, where there is no pane to carry it.
  const paneModel = useMemo(
    () => buildProfilePaneModel(profileData),
    [profileData],
  );

  const showUpgrade = AuthService.isSfSeller() && !AuthService.isSkBuyer();

  const handleCheckAction = (check: KycCheck) => {
    switch (check.action) {
      case "verify-email":
        // A master login is impersonating the store, so it must not be able
        // to claim the owner's email.
        if (AuthService.isMasterLogin()) return;
        setModal("email");
        return;
      case "add-bank":
        setModal("bank");
        return;
      // Documents live on their own page in theme-2 — adding or editing a
      // proof hands off there instead of opening the submission modal on top
      // of the profile.
      case "upload-business-proof":
      case "upload-address-proof":
        appNav.to("/user/documents");
        return;
      case "store-photos":
        appNav.to("/user/store-photos");
        return;
      case "documents":
        appNav.to("/user/documents");
        return;
      case "edit-fssai":
        setModal("fssai");
        return;
      case "edit-gst":
        setModal("gst");
        return;
      case "edit-owner":
        setModal("owner");
        return;
      default:
        setModal("store");
    }
  };

  /** "Complete now" picks up the first check the store still owes. */
  const handleCompleteNow = () => {
    const next = model.checks.find((check) => check.status !== "verified");
    if (next) handleCheckAction(next);
  };

  const closeModal = (refresh: boolean) => {
    setModal(null);
    if (refresh) onRefresh();
  };

  return (
    <>
      {/* Mobile leads with the identity hero — it already carries the trust
          score and the trading stats, so the trust banner and stat tiles
          below are desktop-only. */}
      {isMobile ? (
        <ProfileIdentityHero
          className="detail-hero-flush"
          model={paneModel}
          primaryAction="photo"
        />
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:xl:grid-cols-12">
          <div className="tw:xl:col-span-5">
            <ProfileTrustCard model={model} onComplete={handleCompleteNow} />
          </div>

          <div className="tw:xl:col-span-7">
            <ProfileStatTiles model={model} />
          </div>
        </div>
      )}

      <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:xl:grid-cols-12">
        <div className="tw:flex tw:flex-col tw:xl:col-span-7">
          <StoreIdentityCard
            model={model}
            onEditPhotos={() => appNav.to("/user/store-photos")}
          />
        </div>

        <div className="tw:flex tw:flex-col tw:gap-4 tw:xl:col-span-5">
          <KycChecklist model={model} onAction={handleCheckAction} />
          {showUpgrade && <SellerUpgradeCard onSuccess={onSellerUpgrade} />}
        </div>
      </div>

      {/* Everything the identity card and the checklist do not carry —
          branding, business, tax, location, owner, bank and the legal
          record — each opening the modal that already owns its form. */}
      <StoreDetailSections profileData={profileData} onRefresh={onRefresh} />

      <UpdateStoreInformationModal
        show={modal === "store"}
        data={{
          storeName: profileData?.name || "",
          storeOpenTime: profileData?.operatingHours?.openTime || "",
          storeCloseTime: profileData?.operatingHours?.closeTime || "",
          primaryBusiness: profileData?.primaryBusiness,
          secondaryBusiness: profileData?.secondaryBusiness,
          primaryBusinessId: profileData?.primaryBusinessId,
          secondaryBusinessId: profileData?.secondaryBusinessId,
          storeSize: profileData?.storeSize || "",
          deliveryRadius: profileData?.deliveryRadius ?? 0,
          monthlyTurnover: profileData?.monthlyTurnOver,
          yearsOfExperience: profileData?.yearsOfExperience,
          latitude: profileData?.geoLocation?.coordinates?.[1],
          longitude: profileData?.geoLocation?.coordinates?.[0],
        }}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <UpdateOwnerInformationModal
        show={modal === "owner"}
        type="main"
        data={{
          name: profileData?.ownerDetails?.name || "",
          phone: profileData?.ownerDetails?.phone || profileData?.mobile || "",
          email: profileData?.ownerDetails?.email || "",
          alternateMobile: profileData?.ownerDetails?.alternateMobile,
          addressLine1: profileData?.ownerDetails?.addressLine1,
          addressLine2: profileData?.ownerDetails?.addressLine2,
          pincode: profileData?.ownerDetails?.pincode,
          state: profileData?.ownerDetails?.state,
          district: profileData?.ownerDetails?.district,
          city: profileData?.ownerDetails?.city,
        }}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <GstSettingsModal
        show={modal === "gst"}
        gstNumber={profileData?.gstNumber}
        profileRequestLogs={profileData?.profileUpdateRequest}
        callback={({ action }) =>
          closeModal(action === "submit" || action === "success")
        }
      />

      <FssaiLicenseModal
        show={modal === "fssai"}
        profileRequestLogs={profileData?.profileUpdateRequest}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <BankDetailModal
        show={modal === "bank"}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <VerifyEmailModal
        show={modal === "email"}
        email={profileData?.email || ""}
        callback={({ action }) => closeModal(action === "verified")}
      />
    </>
  );
};

export default ProfileOverview;
