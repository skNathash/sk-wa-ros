import clsx from "clsx";
import {
  Bell,
  ChevronRight,
  KeyRound,
  Languages,
  Mail,
  MapPin,
  Palette,
  Phone,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import StaticGMap from "~/components/core/map/StaticGMap";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import { useThemeSwitcher } from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import ChangePasswordModal from "~/shared/auth/change-password/ChangePasswordModal";
import NotificationLanguageModal from "~/routes/user/my-profile/modals/NotificationLanguageModal";
import { buildProfilePaneModel } from "../helper";
import ProfileIdentityHero from "./ProfileIdentityHero";

interface ProfileSidePaneProps {
  /**
   * Optional profile data already loaded by the parent page. When supplied,
   * the pane renders it directly and skips its own fetch.
   */
  profileData?: any;
  className?: string;
}

/** Modal-backed rows — everything else navigates via `path`. */
type ProfileLinkAction = "change-password" | "notification-language";

interface ProfileLink {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  path?: string;
  action?: ProfileLinkAction;
  accent: string;
  /**
   * Inline control rendered where the chevron would go (e.g. the theme
   * select). A row that carries one is a setting, not a destination, so it
   * renders as a plain row rather than a button.
   */
  control?: React.ReactNode;
}

interface ProfileLinkGroup {
  label: string;
  links: ProfileLink[];
}

const useProfileData = (externalData?: any) => {
  const [internal, setInternal] = useState<any>(null);
  const [loading, setLoading] = useState(!externalData);

  useEffect(() => {
    if (externalData) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const resp = await AuthService.getLoggedInFranchiseDetails();
        const formatted = FranchiseService.formatFranchise(
          resp?.data?.data || {},
        );
        if (!cancelled) setInternal(formatted);
      } catch {
        if (!cancelled) setInternal(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [externalData]);

  const data = externalData ?? internal;
  return { data, loading };
};

/** The most recent store note, as plain text for the pane's preview. */
const useLatestNote = () => {
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const resp = await FranchiseService.getNotes({
          page: 1,
          count: 1,
          filter: { "franchiseInfo.id": AuthService.getLoggedInUserId() },
        });
        const latest = (
          Array.isArray(resp?.data?.data) ? resp.data.data : []
        )[0];
        const html = latest?.noteContent || "";
        // Notes are authored in a rich text editor, so the preview needs the
        // text without its markup.
        const el = document.createElement("div");
        el.innerHTML = html;
        if (!cancelled) setNote((el.textContent || "").trim());
      } catch {
        if (!cancelled) setNote("");
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  return note;
};

/**
 * Side-pane contents for the profile section in theme-2 desktop — who the
 * store is, how it is trading, and the section's own navigation.
 * The page drops it into `AppPaneSide` (with `app-pane-only`) and the CSS
 * re-homes it as the fixed pane beside the section rail.
 */
const ProfileSidePane = ({
  profileData,
  className = "",
}: ProfileSidePaneProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const toast = useAppToast();
  const { t } = useTranslation(["common"]);
  const { theme, setTheme, options: themeOptions } = useThemeSwitcher();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotificationLang, setShowNotificationLang] = useState(false);

  const { data } = useProfileData(profileData);
  const latestNote = useLatestNote();

  const model = useMemo(() => buildProfilePaneModel(data), [data]);

  // The section rail beside the pane already lists the profile section's own
  // tabs (My Profile, Settings, Store Notes, Help & Support), so the pane
  // carries only what the rail cannot: the account actions and preferences.
  const groups: ProfileLinkGroup[] = [
    {
      label: "Account",
      links: [
        {
          key: "change-password",
          icon: KeyRound,
          title: "Change Password",
          description: "Update your login password",
          action: "change-password",
          accent: "tw:bg-rose-50 tw:text-rose-600",
        },
        {
          key: "notification-logs",
          icon: Bell,
          title: "Notification Logs",
          description: "What we sent you",
          path: "/user/notification-logs",
          accent: "tw:bg-sky-50 tw:text-sky-600",
        },
        {
          key: "notification-language",
          icon: Languages,
          title: "Notification Language",
          description: "Language for alerts & messages",
          action: "notification-language",
          accent: "tw:bg-violet-50 tw:text-violet-600",
        },
      ],
    },
    {
      label: "Appearance",
      links: [
        {
          key: "theme",
          icon: Palette,
          title: "Theme",
          description: "How the app looks",
          accent: "tw:bg-indigo-50 tw:text-indigo-600",
          control: (
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger
                aria-label="Theme"
                className="tw:h-7 tw:gap-1 tw:rounded-full tw:border-0 tw:bg-slate-100 tw:px-2.5 tw:text-xs tw:font-semibold tw:text-slate-600 tw:shadow-none"
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
          ),
        },
      ],
    },
  ];

  const isActive = (link: ProfileLink) =>
    !!link.path &&
    (location.pathname === link.path ||
      location.pathname.startsWith(`${link.path}/`));

  const handleLinkClick = (link: ProfileLink) => {
    switch (link.action) {
      case "change-password":
        // A master login is impersonating the store, so it must not be able to
        // rotate the owner's password.
        if (AuthService.isMasterLogin()) {
          toast.show({
            msg: t("youAreNotAuthorizedToDoThisAction"),
            color: "danger",
          });
          return;
        }
        setShowChangePassword(true);
        return;
      case "notification-language":
        setShowNotificationLang(true);
        return;
      default:
        if (link.path) appNav.to(link.path);
    }
  };

  return (
    <>
      <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
        <ProfileIdentityHero model={model} />

        {/* Contact & address — the details support asks for first. */}
        <div>
          <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
            Contact · Address
          </p>
          <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2.5 tw:px-1 tw:text-sm tw:text-slate-700">
            {model.phone && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Phone className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-slate-400" />
                <span className="tw:truncate">{model.phone}</span>
                <span className="tw:rounded tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-emerald-700">
                  OK
                </span>
              </div>
            )}
            {model.email && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Mail className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-slate-400" />
                <span className="tw:truncate">{model.email}</span>
                <span
                  className={clsx(
                    "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold",
                    model.emailVerified
                      ? "tw:bg-emerald-50 tw:text-emerald-700"
                      : "tw:bg-amber-100 tw:text-amber-800",
                  )}
                >
                  {model.emailVerified ? "OK" : "VERIFY"}
                </span>
              </div>
            )}
            {model.address && (
              <div className="tw:flex tw:items-start tw:gap-2">
                <MapPin className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0 tw:text-slate-400" />
                <span>{model.address}</span>
              </div>
            )}
            {model.registeredOn && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <CalendarDays className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-slate-400" />
                <span>
                  Registered {model.registeredOn}
                  {model.registeredFor && (
                    <>
                      {" · "}
                      <span className="tw:font-semibold">
                        {model.registeredFor}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Store pin — the address spelled out on a map, with a way out to
              Google Maps for directions. */}
          {model.lat !== null && model.lng !== null && (
            <div className="tw:mt-3 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200">
              <StaticGMap
                lat={model.lat}
                lng={model.lng}
                className="tw:h-36 tw:w-full"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${model.lat},${model.lng}`}
                target="_blank"
                rel="noreferrer"
                className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-slate-200 tw:bg-white tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-slate-600 tw:transition-colors tw:hover:bg-slate-50"
              >
                <span className="tw:truncate">
                  {model.lat.toFixed(5)}, {model.lng.toFixed(5)}
                </span>
                <ExternalLink className="tw:h-3.5 tw:w-3.5 tw:shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Latest store note — the pane's own reminder board. */}
        {latestNote && (
          <button
            type="button"
            onClick={() => appNav.to("/user/store-notes")}
            className="tw:cursor-pointer tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
          >
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
              Notes
            </div>
            <p className="tw:mt-1.5 tw:line-clamp-3 tw:text-sm tw:text-slate-600">
              {latestNote}
            </p>
          </button>
        )}

        {/* Account actions and preferences — everything the section rail
            beside the pane does not already list. */}
        {groups.map((group) => (
          <div key={group.label} className="tw:mb-4">
            <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
              {group.label}
            </p>
            <div className="app-bleed-x tw:mt-2 tw:flex tw:flex-col tw:divide-y tw:divide-slate-200 tw:border-y tw:border-slate-200">
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link);
                // A row carrying an inline control is a setting the user
                // changes in place, so it is a plain row; every other row is
                // a destination and stays a button.
                const Row = link.control ? "div" : "button";
                return (
                  <Row
                    key={link.key}
                    {...(link.control
                      ? {}
                      : {
                          type: "button" as const,
                          onClick: () => handleLinkClick(link),
                        })}
                    className={clsx(
                      "tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-none tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors",
                      link.control && "tw:bg-white",
                      !link.control &&
                        (active
                          ? "tw:cursor-pointer tw:bg-primary/10"
                          : "tw:cursor-pointer tw:bg-white tw:hover:bg-slate-50"),
                    )}
                  >
                    <span
                      className={clsx(
                        "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:transition-colors",
                        link.accent,
                      )}
                    >
                      <Icon className="tw:h-4 tw:w-4" />
                    </span>
                    <span className="tw:min-w-0 tw:flex-1">
                      <span
                        className={clsx(
                          "tw:block tw:truncate tw:text-sm tw:font-semibold tw:leading-tight",
                          active ? "tw:text-primary" : "tw:text-slate-800",
                        )}
                      >
                        {link.title}
                      </span>
                      <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                        {link.description}
                      </span>
                    </span>
                    {link.control ?? (
                      <ChevronRight
                        size={16}
                        className={clsx(
                          "tw:shrink-0",
                          active ? "tw:text-primary" : "tw:text-slate-400",
                        )}
                      />
                    )}
                  </Row>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ChangePasswordModal
        show={showChangePassword}
        username={model.phone}
        callback={(a: { action: string }) => {
          setShowChangePassword(false);
          // The password just changed under the live session — send the user
          // back through login with the new one.
          if (a.action === "passwordChanged") appNav.to("/auth/logout");
        }}
      />

      <NotificationLanguageModal
        show={showNotificationLang}
        data={data}
        callback={() => setShowNotificationLang(false)}
      />

    </>
  );
};

export default ProfileSidePane;
