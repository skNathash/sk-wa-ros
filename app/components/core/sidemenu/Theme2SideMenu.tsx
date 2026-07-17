import {
  ChevronRight,
  Crown,
  Globe,
  HelpCircle,
  Power,
  Settings,
  StickyNote,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { APP_VERSION, EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import StorageService from "~/services/StorageService";
import UserBadge from "~/shared/store/badge/UserBadge";
import NotesModal from "~/routes/user/my-profile/modals/notes/NotesModal";

/**
 * theme-2 account/side menu — an overlay drawer that slides in from the left on
 * both desktop and mobile (theme-2 disables the classic shadcn SideMenu and
 * navigates via the BottomTab, so this is the home for profile/account
 * actions). It is rendered once by the sidebar layout and opened from the
 * AppHeader hamburger, which dispatches `EVENTS.OPEN_APP_MENU`.
 */

interface MenuRow {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  onClick: () => void;
  /** Optional right-aligned value/badge shown before the chevron. */
  trailing?: React.ReactNode;
  /** Hide the row entirely when false. */
  show?: boolean;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function Theme2SideMenu() {
  const [open, setOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const appNav = useAppNav();
  const { t, i18n } = useTranslation(["common", "menu"]);

  const languageOptions = CommonService.getAppSupportedLanguages();

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    MiscService.listenEvent(EVENTS.OPEN_APP_MENU, handleOpen);
    return () => MiscService.removeEvent(EVENTS.OPEN_APP_MENU, handleOpen);
  }, []);

  const userData = AuthService.getLoggedInUser() || {};
  const isMasterLogin = AuthService.isMasterLogin();
  const canUpgradeToSeller = AuthService.isSfSeller();

  const storeName = userData.name || "N/A";
  const ownerName = userData.ownerDetails?.name || "";
  const phone = userData.mobile || userData.ownerDetails?.phone || "";
  const fid = userData.franchiseId || "";
  const storePhoto =
    userData.shopPhotosDetails?.find((p: any) => p.status === "Approved")
      ?.fileUrl ||
    userData.shopPhotosDetails?.[0]?.fileUrl ||
    userData.ownerDetails?.photoUrl ||
    userData.profileImage;

  const go = (path: string, params?: Record<string, any>) => {
    setOpen(false);
    appNav.to(path, params);
  };

  const handleLanguageChange = async (newLang: string) => {
    try {
      await i18n.changeLanguage(newLang);
    } finally {
      StorageService.set("language", newLang);
      window.location.reload();
    }
  };

  const currentLanguageLabel =
    languageOptions.find((o) => o.value === i18n.language)?.label ||
    i18n.language;

  const rows: MenuRow[] = [
    {
      key: "profile",
      label: t("myProfile", "My Profile"),
      icon: User,
      iconClassName: "tw:bg-blue-50 tw:text-blue-600",
      onClick: () => go("/user/my-profile"),
    },
    {
      key: "settings",
      label: t("settings", "Settings"),
      icon: Settings,
      iconClassName: "tw:bg-gray-100 tw:text-gray-600",
      onClick: () => go("/configs/settings"),
    },
    {
      key: "notes",
      label: t("storeNotes", "Store notes"),
      icon: StickyNote,
      iconClassName: "tw:bg-amber-50 tw:text-amber-600",
      onClick: () => {
        setOpen(false);
        setShowNotes(true);
      },
    },
    {
      key: "upgrade",
      label: t("upgradeToSkSeller", "Upgrade to SK Seller"),
      icon: Crown,
      iconClassName: "tw:bg-yellow-50 tw:text-yellow-600",
      show: canUpgradeToSeller,
      onClick: () =>
        go("/dashboard/network/management/sk-sellers", { tab: "sk-sellers" }),
    },
    {
      key: "help",
      label: t("helpAndSupport", "Help & Support"),
      icon: HelpCircle,
      iconClassName: "tw:bg-red-50 tw:text-red-500",
      onClick: () => go("/manual"),
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          // Hide Sheet's built-in close button — we render our own in the header.
          className="tw:w-[85%] tw:max-w-sm tw:gap-0 tw:p-0 tw:[&>button]:hidden"
        >
          <SheetTitle className="tw:sr-only">{storeName}</SheetTitle>

          {/* Header */}
          <div className="tw:relative tw:overflow-hidden tw:bg-primary tw:px-5 tw:pt-6 tw:pb-5 tw:text-primary-foreground">
            {/* decorative circle */}
            <span className="tw:pointer-events-none tw:absolute tw:-top-10 tw:-right-8 tw:h-32 tw:w-32 tw:rounded-full tw:bg-white/10" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="tw:absolute tw:top-4 tw:right-4 tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15 tw:text-white tw:transition-colors hover:tw:bg-white/25"
            >
              <X className="tw:h-4 tw:w-4" />
            </button>

            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-white/20 tw:text-lg tw:font-bold tw:ring-2 tw:ring-white/30">
                {storePhoto ? (
                  <img
                    src={storePhoto}
                    alt={storeName}
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                ) : (
                  getInitials(storeName)
                )}
              </div>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-lg tw:font-bold tw:leading-tight">
                  {storeName}
                </div>
                <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5">
                  <UserBadge />
                  {fid && (
                    <span className="tw:text-xs tw:text-white/80">
                      ID {fid}
                    </span>
                  )}
                </div>
                {(ownerName || phone) && (
                  <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-white/90">
                    {ownerName && (
                      <span className="tw:truncate">{ownerName}</span>
                    )}
                    {ownerName && phone && <span>·</span>}
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="tw:whitespace-nowrap tw:font-medium"
                      >
                        📞 {phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="tw:flex-1 tw:overflow-y-auto tw:bg-white tw:py-2">
            {/* Language */}
            <div className="tw:flex tw:items-center tw:gap-3 tw:px-5 tw:py-3">
              <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-sky-50 tw:text-sky-600">
                <Globe className="tw:h-5 tw:w-5" />
              </span>
              <span className="tw:flex-1 tw:text-sm tw:font-medium tw:text-gray-800">
                {t("language", "language")}
              </span>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="tw:h-7 tw:gap-1 tw:border-0 tw:bg-transparent tw:px-1 tw:text-xs tw:font-medium tw:text-gray-500 tw:shadow-none">
                  <SelectValue>{currentLanguageLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rows
              .filter((r) => r.show !== false)
              .map((row) => {
                const Icon = row.icon;
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={row.onClick}
                    className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-5 tw:py-3 tw:text-left tw:transition-colors hover:tw:bg-gray-50"
                  >
                    <span
                      className={`tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${row.iconClassName}`}
                    >
                      <Icon className="tw:h-5 tw:w-5" />
                    </span>
                    <span className="tw:flex-1 tw:text-sm tw:font-medium tw:text-gray-800">
                      {row.label}
                    </span>
                    {row.trailing}
                    <ChevronRight className="tw:h-4 tw:w-4 tw:text-gray-300" />
                  </button>
                );
              })}

            {!isMasterLogin && (
              <>
                <div className="tw:mx-5 tw:my-2 tw:border-t tw:border-gray-100" />
                <button
                  type="button"
                  onClick={() => go("/auth/logout")}
                  className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-5 tw:py-3 tw:text-left tw:transition-colors hover:tw:bg-red-50"
                >
                  <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-red-50 tw:text-red-600">
                    <Power className="tw:h-5 tw:w-5" />
                  </span>
                  <span className="tw:flex-1 tw:text-sm tw:font-semibold tw:text-red-600">
                    {t("logout", "Logout")}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="tw:border-t tw:border-gray-100 tw:bg-white tw:px-5 tw:py-3 tw:text-center">
            <div className="tw:text-xs tw:font-medium tw:text-gray-500">
              StoreKing OS · Dukaan v{APP_VERSION}
            </div>
            <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-400">
              Reduces daily ops for 55,000+ retailers.
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <NotesModal
        show={showNotes}
        callback={() => setShowNotes(false)}
      />
    </>
  );
}
