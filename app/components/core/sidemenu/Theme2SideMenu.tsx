import {
  ChevronRight,
  Crown,
  Globe,
  LogOut,
  MessageCircle,
  Palette,
  Pencil,
  Settings,
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
import { useThemeSwitcher } from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import ProfileScoreService from "~/services/ProfileScoreService";
import StorageService from "~/services/StorageService";
import UserBadge from "~/shared/store/badge/UserBadge";

/**
 * theme-2 account/side menu — an overlay drawer that slides in from the left on
 * both desktop and mobile (theme-2 disables the classic shadcn SideMenu and
 * navigates via the BottomTab, so this is the home for profile/account
 * actions). It is rendered once by the sidebar layout and opened from the
 * AppHeader hamburger, which dispatches `EVENTS.OPEN_APP_MENU`.
 */

// Number of config cards on /configs/settings (see configCards in
// app/routes/configs/settings/index.tsx) — shown as a count badge.
const SETTINGS_SECTIONS_COUNT = 6;

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

/** Circular "trust score" gauge shown in place of the avatar. */
const TrustRing = ({ percent }: { percent: number }) => {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div className="tw:relative tw:h-16 tw:w-16 tw:shrink-0 tw:rounded-full tw:bg-white tw:shadow-sm">
      <svg viewBox="0 0 56 56" className="tw:h-full tw:w-full tw:-rotate-90">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(c * percent) / 100} ${c}`}
        />
      </svg>
      <span className="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold tw:text-gray-800">
        {percent}
        <span className="tw:text-[9px] tw:font-semibold">%</span>
      </span>
    </div>
  );
};

const CountBadge = ({ value }: { value: number }) => (
  <span className="tw:flex tw:h-6 tw:min-w-6 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:px-1.5 tw:text-xs tw:font-semibold tw:text-gray-600">
    {value}
  </span>
);

export default function Theme2SideMenu() {
  const [open, setOpen] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const appNav = useAppNav();
  const { i18n } = useTranslation(["common", "menu"]);
  const { theme, setTheme, options: themeOptions } = useThemeSwitcher();

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
  const fid = userData.franchiseId || "";

  // Verification chips + trust score — scored centrally so the drawer and the
  // profile side pane always report the same number.
  const { items: chips, percent: trustPercent } =
    ProfileScoreService.get(userData);

  // Lazily fetch upgrade request status the first time the menu opens.
  useEffect(() => {
    if (!open || fetched) return;
    setFetched(true);

    if (canUpgradeToSeller) {
      FranchiseService.getSkSellerJoinRequests(AuthService.getLoggedInUserId())
        .then((resp: any) => {
          const status = resp?.data?.data?.status;
          if (status) setUpgradeStatus(String(status));
        })
        .catch(() => {});
    }
  }, [open, fetched, canUpgradeToSeller]);

  const go = (path: string, params?: Record<string, any>) => {
    setOpen(false);
    appNav.to(path, params);
  };

  const goToUpgrade = () =>
    go("/dashboard/network/management/sk-sellers", { tab: "sk-sellers" });

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
      label: "My Profile",
      icon: User,
      iconClassName: "tw:bg-blue-50 tw:text-blue-600",
      onClick: () => go("/user/my-profile"),
    },
    {
      key: "settings",
      label: "Settings",
      icon: Settings,
      iconClassName: "tw:bg-gray-100 tw:text-gray-600",
      trailing: <CountBadge value={SETTINGS_SECTIONS_COUNT} />,
      onClick: () => go("/configs/settings"),
    },

    {
      key: "notes",
      label: "Store Notes",
      icon: Pencil,
      iconClassName: "tw:bg-amber-50 tw:text-amber-600",
      onClick: () => go("/user/store-notes"),
    },
    {
      key: "upgrade",
      label: "Upgrade to SK Seller",
      icon: Crown,
      iconClassName: "tw:bg-violet-50 tw:text-violet-600",
      show: canUpgradeToSeller,
      trailing: upgradeStatus ? (
        <span
          className={`tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase ${
            upgradeStatus.toLowerCase() === "approved"
              ? "tw:bg-green-100 tw:text-green-700"
              : "tw:bg-amber-100 tw:text-amber-700"
          }`}
        >
          {upgradeStatus}
        </span>
      ) : null,
      onClick: goToUpgrade,
    },
    {
      key: "help",
      label: "Help & Support",
      icon: MessageCircle,
      iconClassName: "tw:bg-emerald-50 tw:text-emerald-600",
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
          <div className="tw:relative tw:overflow-hidden tw:bg-primary tw:px-4 tw:pt-6 tw:pb-8 tw:text-primary-foreground">
            {/* decorative circle */}
            <span className="tw:pointer-events-none tw:absolute tw:-top-10 tw:-right-8 tw:h-32 tw:w-32 tw:rounded-full tw:bg-white/10" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="tw:absolute tw:top-4 tw:right-4 tw:z-10 tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15 tw:text-white tw:transition-colors tw:hover:bg-white/25"
            >
              <X className="tw:h-4 tw:w-4" />
            </button>

            <div className="tw:flex tw:items-start tw:gap-3">
              <TrustRing percent={trustPercent} />
              <div className="tw:min-w-0 tw:flex-1 tw:pr-8">
                <div className="tw:truncate tw:text-lg tw:font-bold tw:leading-tight">
                  {storeName}
                </div>
                <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-white/80">
                  {fid && <span>ID {fid}</span>}
                  {fid && ownerName && <span>·</span>}
                  {ownerName && (
                    <span className="tw:truncate">{ownerName}</span>
                  )}
                </div>
                <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                  <UserBadge />
                  {canUpgradeToSeller && !upgradeStatus && (
                    <button
                      type="button"
                      onClick={goToUpgrade}
                      className="tw:flex tw:items-center tw:gap-1 tw:rounded-md tw:bg-green-500 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:text-white"
                    >
                      <Crown className="tw:h-3 tw:w-3 tw:text-yellow-300" />
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Verification chips */}
            <div className="tw:mt-4 tw:flex tw:flex-wrap tw:gap-1.5 tw:rounded-xl tw:bg-black/15 tw:p-2.5">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className={`tw:flex tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase ${
                    chip.ok
                      ? "tw:bg-white/20 tw:text-white"
                      : "tw:bg-white/5 tw:text-white/55"
                  }`}
                >
                  {chip.ok ? "✓" : "○"} {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="tw:relative tw:-mt-4 tw:flex-1 tw:overflow-y-auto tw:rounded-t-3xl tw:bg-white tw:py-3">
            {rows
              .filter((r) => r.show !== false)
              .map((row) => {
                const Icon = row.icon;
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={row.onClick}
                    className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-gray-50"
                  >
                    <span
                      className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl ${row.iconClassName}`}
                    >
                      <Icon className="tw:h-5 tw:w-5" />
                    </span>
                    <span className="tw:flex-1 tw:text-[15px] tw:font-semibold tw:text-gray-900">
                      {row.label}
                    </span>
                    {row.trailing}
                    <ChevronRight className="tw:h-4 tw:w-4 tw:text-gray-300" />
                  </button>
                );
              })}

            {/* Language */}
            <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-2.5">
              <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-green-50 tw:text-green-600">
                <Globe className="tw:h-5 tw:w-5" />
              </span>
              <span className="tw:flex-1 tw:text-[15px] tw:font-semibold tw:text-gray-900">
                Language
              </span>
              <Select
                value={i18n.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="tw:h-6 tw:gap-1 tw:rounded-full tw:border-0 tw:bg-gray-100 tw:px-2.5 tw:text-xs tw:font-semibold tw:text-gray-600 tw:shadow-none">
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
              <ChevronRight className="tw:h-4 tw:w-4 tw:text-gray-300" />
            </div>

            {/* Theme — switching away from theme-2 unmounts this drawer (the
                layout swaps in the classic SideMenu), so close it first. */}
            <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-2.5">
              <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-indigo-50 tw:text-indigo-600">
                <Palette className="tw:h-5 tw:w-5" />
              </span>
              <span className="tw:flex-1 tw:text-[15px] tw:font-semibold tw:text-gray-900">
                Theme
              </span>
              <Select
                value={theme}
                onValueChange={(next) => {
                  setOpen(false);
                  setTheme(next);
                }}
              >
                <SelectTrigger
                  aria-label="Theme"
                  className="tw:h-6 tw:gap-1 tw:rounded-full tw:border-0 tw:bg-gray-100 tw:px-2.5 tw:text-xs tw:font-semibold tw:text-gray-600 tw:shadow-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ChevronRight className="tw:h-4 tw:w-4 tw:text-gray-300" />
            </div>

            {!isMasterLogin && (
              <>
                <div className="tw:mx-5 tw:my-2 tw:border-t tw:border-gray-100" />
                <button
                  type="button"
                  onClick={() => go("/auth/logout")}
                  className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-red-50"
                >
                  <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-red-50 tw:text-red-600">
                    <LogOut className="tw:h-5 tw:w-5" />
                  </span>
                  <span className="tw:flex-1 tw:text-[15px] tw:font-semibold tw:text-red-600">
                    Sign out
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="tw:border-t tw:border-gray-100 tw:bg-white tw:px-5 tw:py-3 tw:text-center">
            <div className="tw:text-xs tw:font-medium tw:text-gray-500">
              StoreKing OS · Modern v{APP_VERSION}
            </div>
            <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-400">
              Reduces daily ops for 55,000+ retailers.
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}
