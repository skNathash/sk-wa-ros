import {
  BookOpen,
  HelpCircle,
  Mail,
  Phone,
  Power,
  Share2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ImgRender from "~/components/core/img/ImgRender";
import AppPopover from "~/components/core/popover/AppPopover";
import UserPic from "~/shared/users/components/UserPic";
import { useSidebar } from "~/components/ui/sidebar";
import {
  APP_VERSION,
  CLUB_STORE_URL,
  SUPPORT_WHATSAPP_NUMBER,
} from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import { AuthService } from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import UserService from "~/services/UserService";
import AppBadge from "~/components/core/badge/AppBadge";
import UserBadge from "~/shared/store/badge/UserBadge";
import AppButton from "../button/AppButton";
import AppLink from "../link/AppLink";

interface UserData {
  name?: string;
  mobile?: string;
  email?: string;
  profileImage?: string;
  subType?: string;
  franchiseId?: string;
  ownerDetails?: {
    photoUrl?: string;
  };
  shopPhotosDetails?: Array<{
    fileUrl?: string;
    status?: string;
    [key: string]: any;
  }>;
}

interface UserProfileProps {
  onInviteCustomer: (url: string) => void;
}

export default function UserProfile({ onInviteCustomer }: UserProfileProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const userData: UserData = AuthService.getLoggedInUser();
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { t } = useTranslation(["common"]);
  const { setOpenMobile } = useSidebar();

  const isMasterLogin = AuthService.isMasterLogin();
  const isLoggedIn = AuthService.isLoggedIn?.() ?? Boolean(userData);
  const hasActivePlan =
    isLoggedIn && FranchiseService.isActivePlanAvailable();

  const handleLogout = () => {
    // Close sidebar on mobile before navigating
    if (setOpenMobile) setOpenMobile(false);
    appNav.to("/auth/logout");
  };

  const handleInviteCustomer = () => {
    const user = AuthService.getLoggedInUser();
    const mobile = user?.mobile;
    if (mobile) {
      const url = CLUB_STORE_URL + mobile;

      if (setOpenMobile) setOpenMobile(false);
      onInviteCustomer(url);
    } else {
      appToast.show({
        msg: "No mobile number found",
        color: "danger",
      });
    }
  };

  // If manpower is logged in, prefer manpower data stored under `_m`
  const isManpowerLoggedIn =
    AuthService.isManpowerLoggedIn && AuthService.isManpowerLoggedIn();
  const manpowerData: Record<string, any> | null = isManpowerLoggedIn
    ? UserService.formatUser(AuthService.getManpower() || {})
    : null;

  // Extract user information (prefer manpower fields when manpower is logged in)
  const userName =
    (manpowerData && (manpowerData.name || manpowerData.displayName)) ||
    userData.name ||
    "N/A";
  const userMobile =
    (manpowerData && (manpowerData.mobile || manpowerData.mobileNo)) ||
    userData.mobile ||
    "N/A";
  const userEmail =
    (manpowerData && (manpowerData.email || manpowerData.emailId)) ||
    userData.email ||
    "";

  // Prefer a franchise id (fid) for display. For manpower logins, check common id fields.
  const userFid =
    (manpowerData && manpowerData.referenceId) ||
    (userData && userData.franchiseId) ||
    "";

  // Resolve location fields (prefer manpower data)
  const locationTown =
    (manpowerData &&
      (manpowerData.town || manpowerData.city || manpowerData.locality)) ||
    (userData as any).town ||
    (userData as any).city ||
    (userData as any).locality ||
    "N/A";

  const locationPincode =
    (manpowerData &&
      (manpowerData.pincode || manpowerData.pin || manpowerData.pinCode)) ||
    (userData as any).pincode ||
    (userData as any).pin ||
    (userData as any).pinCode ||
    "N/A";

  const getStorePhoto = () => {
    const photos = userData.shopPhotosDetails;
    if (!Array.isArray(photos) || photos.length === 0) return null;

    const approved = photos.find((p) => p.status === "Approved");
    return approved?.fileUrl || photos[0]?.fileUrl;
  };

  const profileImage = isManpowerLoggedIn
    ? manpowerData && (manpowerData.profileImage || manpowerData.profileImages?.[0])
    : getStorePhoto() ||
      userData.ownerDetails?.photoUrl ||
      userData.profileImage;

  const manpowerGender = manpowerData?.gender;
  const manpowerPicType = manpowerData?._userPicType;

  const handleUserManual = () => {
    if (setOpenMobile) setOpenMobile(false);
    appNav.to("/manual");
  };

  const handleContact = () => {
    try {
      let waNumber = SUPPORT_WHATSAPP_NUMBER;
      const message = "hi";
      const waUrl = CommonService.prepareWhatsappMessage(message, waNumber);

      if (setOpenMobile) setOpenMobile(false);
      CommonService.windowOpenHandler(waUrl, () => {});
    } catch (e) {
      // Fallback to a blank wa.me if anything goes wrong
      if (setOpenMobile) setOpenMobile(false);
      CommonService.windowOpenHandler("https://wa.me/", () => {});
    }
  };

  // Append role suffix based on manpower status
  const roleSuffix = isManpowerLoggedIn ? "EMP." : "OWNER";

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:pb-0">
      {/* Profile Info */}
      <div className="tw:flex tw:items-start tw:gap-2">
        {/* Avatar */}
        <div className="tw:relative tw:shrink-0">
          {isManpowerLoggedIn ? (
            <UserPic
              assetId={profileImage}
              gender={manpowerGender}
              type={manpowerPicType}
              alt={userName}
              className="tw:w-8 tw:h-8 tw:rounded-full tw:object-cover tw:border tw:border-gray-200"
            />
          ) : profileImage ? (
            <ImgRender
              alt={userName}
              className="tw:w-8 tw:h-8 tw:rounded-full tw:object-cover tw:border tw:border-gray-200"
              assetId={profileImage}
            />
          ) : (
            <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-blue-50 tw:flex tw:items-center tw:justify-center tw:border tw:border-blue-100 tw:text-blue-600 tw:font-bold tw:text-xs">
              {getInitials(userName)}
            </div>
          )}
          <div className="tw:absolute tw:-bottom-0 tw:-right-0 tw:w-2.5 tw:h-2.5 tw:bg-green-500 tw:border-2 tw:border-white tw:rounded-full"></div>
        </div>

        {/* Details */}
        <div className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:gap-0">
          <AppLink
            href={`/user/my-profile`}
            asLink
            onClick={() => {
              if (setOpenMobile) setOpenMobile(false);
            }}
            className="tw:font-bold tw:text-sm tw:text-gray-900 tw:truncate hover:tw:underline"
          >
            {userName}
          </AppLink>

          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-700">
            <span className="tw:font-medium tw:truncate">{`${locationTown} - ${locationPincode}`}</span>
          </div>
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-1">
        {userFid && (
          <div className="tw:text-xs tw:text-gray-600 tw:truncate">
            #{userFid}
          </div>
        )}
        <span className="tw:text-[10px] tw:px-1.5 tw:py-0.5 tw:bg-gray-100 tw:text-gray-600 tw:rounded tw:font-medium tw:border tw:border-gray-200">
          {roleSuffix}
        </span>
        <span className="tw:relative tw:inline-flex">
          {isManpowerLoggedIn ? (
            <AppBadge variant={manpowerData?._positionBadgeColor}>
              {manpowerData?._position}
            </AppBadge>
          ) : (
            <UserBadge />
          )}
          {hasActivePlan && (
            <span
              className="tw:absolute tw:-top-1 tw:-right-1 tw:w-2 tw:h-2 tw:rounded-full tw:bg-green-500 tw:border tw:border-white"
              aria-label="Active plan"
              title="Active plan"
            />
          )}
        </span>
        <span className="tw:ml-auto tw:text-[10px] tw:text-gray-400">
          v{APP_VERSION}
        </span>
      </div>

      {/* Actions Grid */}
      <div className="tw:flex tw:gap-1.5 tw:mt-2">
        {/* Help Button */}
        <AppPopover
          align="center"
          side="top"
          contentClassName="tw:w-48 tw:p-1.5"
          modal={true}
          triggerContent={
            <button
              className="tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-1 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-blue-700 tw:bg-blue-50/80 hover:tw:bg-blue-100 tw:border tw:border-blue-200/60 tw:rounded-md tw:transition-colors"
              aria-label="Help & Support"
            >
              <HelpCircle size={12} />
              <span>Help</span>
            </button>
          }
          open={helpOpen}
          onOpenChange={setHelpOpen}
        >
          <div className="tw:flex tw:flex-col tw:gap-0.5">
            <AppButton
              type="button"
              onClick={() => {
                setHelpOpen(false);
                handleUserManual();
              }}
              fill="clear"
              className="tw:flex tw:items-center tw:gap-2 tw:text-gray-700 hover:tw:text-blue-700 tw:w-full tw:px-2 tw:py-1.5 hover:tw:bg-blue-50/50 tw:rounded tw:text-[12px] tw:font-medium tw:transition-colors"
            >
              <BookOpen size={13} className="tw:text-blue-600 tw:shrink-0" />
              <span>User Manual</span>
            </AppButton>

            <AppButton
              type="button"
              onClick={() => {
                setHelpOpen(false);
                handleContact();
              }}
              fill="clear"
              className="tw:flex tw:items-center tw:gap-2 tw:text-gray-700 hover:tw:text-green-700 tw:w-full tw:px-2 tw:py-1.5 hover:tw:bg-green-50/50 tw:rounded tw:text-[12px] tw:font-medium tw:transition-colors"
            >
              <ImgRender
                src="whatsapp-logo.png"
                alt="WhatsApp"
                className="tw:h-3 tw:w-3 tw:shrink-0"
              />
              <span>Contact Support</span>
            </AppButton>
          </div>
        </AppPopover>

        {/* Logout Button */}
        {!isMasterLogin && (
          <button
            type="button"
            onClick={handleLogout}
            className="tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-1 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-red-700 tw:bg-red-50/80 hover:tw:bg-red-100 tw:border tw:border-red-200/60 tw:rounded-md tw:transition-colors"
            aria-label="Logout"
          >
            <Power size={12} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
