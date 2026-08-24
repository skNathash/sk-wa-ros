import clsx from "clsx";
import {
  House,
  MessageCircle,
  Package,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { isTabActive } from "~/components/core/bottom-tab/BottomTab";

type RunnerTab = {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
};

/** The runner app's five sections — the only navigation the runner gets. */
export const RUNNER_TABS: RunnerTab[] = [
  { key: "home", label: "Home", path: "/runner/home", icon: House },
  { key: "jobs", label: "Jobs", path: "/runner/jobs", icon: Package },
  {
    key: "earnings",
    label: "Earnings",
    path: "/runner/earnings",
    icon: Wallet,
  },
  { key: "chats", label: "Chats", path: "/runner/chats", icon: MessageCircle },
  { key: "profile", label: "Profile", path: "/runner/profile", icon: User },
];

/**
 * Runner navigation. One list of sections in two shapes: fixed to the bottom of
 * the screen on a phone, where the runner works one-handed and the sections
 * belong under the thumb, and a full-height rail beside the content from `lg`
 * up, where a bar across the foot of a wide window would strand them. The
 * switch is entirely in `runner-shell.css`; pages leave `runner-shell` room for
 * the bar at the end of their content while it is a bar.
 */
export default function RunnerBottomTab() {
  const location = useLocation();

  return (
    <nav className="runner-tabbar">
      {/* Only the rail has room for the app's mark — hidden while the nav is a
          bottom bar. The rail is icon-width, so the name renders as a small
          mark with the full word kept for screen readers. */}
      <p className="runner-rail-brand">
        <span aria-hidden="true">R</span>
        <span className="tw:sr-only">Runner</span>
      </p>

      <ul className="tw:flex tw:items-stretch">
        {RUNNER_TABS.map((tab) => {
          const active = isTabActive(location.pathname, tab.path);
          const Icon = tab.icon;

          return (
            <li key={tab.key} className="tw:flex-1">
              <Link
                to={tab.path}
                className={clsx("runner-tabbar-item", {
                  "runner-tabbar-item--active": active,
                })}
              >
                <Icon size={21} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
