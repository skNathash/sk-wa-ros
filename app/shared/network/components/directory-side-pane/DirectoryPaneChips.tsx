import { Building2, Plus, UserPlus, Users } from "lucide-react";
import { useLocation } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

/** The directory segments the list can be filtered down to. `new` and `coins`
 *  have no chip of their own — they only come from the summary tiles — but
 *  share the selection. */
export type DirectoryChipKey =
  | "all"
  | "loyal"
  | "silent"
  | "paylater"
  | "new"
  | "coins";

/** Display names for the segments — used by the chips and by the page titles
 *  that spell the active segment out ("B2C Customer - Loyal"). */
export const DIRECTORY_SEGMENT_LABELS: Record<DirectoryChipKey, string> = {
  all: "All",
  loyal: "Loyal",
  silent: "Silent",
  paylater: "Paylater",
  new: "New",
  coins: "Coins",
};

/** The sections/actions the nav strip can jump to. */
export type DirectoryNavChipKey =
  | "joining-request"
  | "b2c"
  | "b2b"
  | "new-b2c"
  | "new-b2b";

type Chip = {
  key: DirectoryChipKey;
  label: string;
};

const CHIPS: Chip[] = [
  { key: "all", label: "All" },
  { key: "loyal", label: "Loyal" },
  { key: "silent", label: "Silent" },
  { key: "paylater", label: "Paylater" },
];

type NavChip = {
  key: DirectoryNavChipKey;
  label: string;
  icon: React.ReactNode;
  /** Where the chip lands when the host passes no handler. */
  path: string;
  /** Query params carried into the destination. */
  params?: Record<string, string>;
};

const NAV_CHIPS: NavChip[] = [
  {
    key: "joining-request",
    label: "Joining Request",
    icon: <UserPlus size={14} />,
    path: "/dashboard/network/management/joining-request",
    params: { tab: "joining-request" },
  },
  {
    key: "b2c",
    label: "B2C",
    icon: <Users size={14} />,
    path: "/dashboard/network/management/b2c-customers",
    params: { tab: "b2c-customers" },
  },
  {
    key: "b2b",
    label: "B2B",
    icon: <Building2 size={14} />,
    path: "/dashboard/network/management/b2b-retailers",
    params: { tab: "b2b-retailers" },
  },
  {
    key: "new-b2c",
    label: "Create B2C",
    icon: <Plus size={14} />,
    path: "/dashboard/network/management/b2c-customers/manage",
  },
  {
    key: "new-b2b",
    label: "Create B2B",
    icon: <Plus size={14} />,
    path: "/dashboard/network/management/b2b-retailers/manage",
  },
];

/**
 * Which nav chips the logged-in user may see. Mirrors the tab gating in
 * `NetworkManagementLayout` (`app/routes/dashboard/network/management/layout`)
 * so the pane never offers a section the tab row hides:
 *  - joining request is an SK-seller-only section,
 *  - B2B needs `canHandleB2b`,
 *  - creating a retailer is closed to manpower other than sales employees.
 */
const getVisibleNavChips = (): NavChip[] => {
  const isManpower = AuthService.isManpowerLoggedIn();
  const isSalesEmployee = AuthService.isSalesEmployeeLoggedIn();
  const canSeeJoiningRequest = !isManpower && AuthService.isSkSeller();
  const canSeeB2b =
    AuthService.canHandleB2b() || isManpower || AuthService.isSfSeller();
  const canCreateB2b = canSeeB2b && (!isManpower || isSalesEmployee);

  return NAV_CHIPS.filter((chip) => {
    if (chip.key === "joining-request") return canSeeJoiningRequest;
    if (chip.key === "b2b") return canSeeB2b;
    if (chip.key === "new-b2b") return canCreateB2b;
    return true;
  });
};

/**
 * Which nav chip the current URL sits under. Matches on the path alone (the
 * `tab` param only mirrors it), and prefers the longest match so
 * `/b2c-customers/manage` reads as "Create B2C" rather than "B2C".
 */
const getActiveNavChipKey = (
  chips: NavChip[],
  pathname: string,
): DirectoryNavChipKey | undefined =>
  chips
    .filter(
      (chip) => pathname === chip.path || pathname.startsWith(`${chip.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0]?.key;

/** Counts shown as trailing badges, keyed by chip. Hardcoded until the
 *  segment endpoints exist — the pane passes them straight through. */
export type DirectoryChipCounts = Partial<
  Record<DirectoryChipKey | DirectoryNavChipKey, number>
>;

interface DirectoryPaneChipsProps {
  /** Which chip reads as active. Defaults to "all". */
  activeKey?: DirectoryChipKey;
  /** Trailing count badges — segment chips and nav chips share the map. */
  counts?: DirectoryChipCounts;
  /** Fired with the tapped chip key. */
  onSelect?: (key: DirectoryChipKey) => void;
  /** Render the segment strip (all/loyal/silent/paylater). Defaults to true —
   *  pages with no list to filter (e.g. the create flows) turn it off and keep
   *  the nav strip. */
  showSegmentChips?: boolean;
  /** Render the section/action nav strip above the segments. Defaults to true. */
  showNavChips?: boolean;
  /** Intercept a nav chip; without it the chip navigates itself. */
  onNavSelect?: (key: DirectoryNavChipKey) => void;
  /** Which nav chip reads as active. Defaults to the one matching the URL. */
  activeNavKey?: DirectoryNavChipKey;
  className?: string;
}

/**
 * Chips for the customer/retailer directory pane. Two strips: the section jumps
 * (joining request, B2C, B2B and the two create routes — each shown only where
 * the user's role allows it) and below them the segments — all, loyal, silent
 * and paylater. The parent owns the segment selection and decides what a tap
 * does (in-page filtering), same contract as the catalog chip strips; nav chips
 * are self-navigating unless `onNavSelect` is passed.
 */
const DirectoryPaneChips = ({
  activeKey = "all",
  counts,
  onSelect,
  showSegmentChips = true,
  showNavChips = true,
  onNavSelect,
  activeNavKey,
  className,
}: DirectoryPaneChipsProps) => {
  const appNav = useAppNav();
  const { pathname } = useLocation();

  const data: PaneChipItem[] = (showSegmentChips ? CHIPS : []).map((chip) => ({
    key: chip.key,
    label: chip.label,
    active: chip.key === activeKey,
    count: counts?.[chip.key],
  }));

  const navChips = showNavChips ? getVisibleNavChips() : [];
  const activeNav = activeNavKey ?? getActiveNavChipKey(navChips, pathname);
  const navData: PaneChipItem[] = navChips.map((chip) => ({
    key: chip.key,
    label: chip.label,
    icon: chip.icon,
    active: chip.key === activeNav,
    count: counts?.[chip.key],
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    onSelect?.(item.key as DirectoryChipKey);
  };

  const handleNavCallback = ({ data: item }: PaneChipsAction) => {
    const key = item.key as DirectoryNavChipKey;
    if (onNavSelect) {
      onNavSelect(key);
      return;
    }
    const chip = navChips.find((navChip) => navChip.key === key);
    if (chip) appNav.to(chip.path, chip.params);
  };

  return (
    <div className={className}>
      {navData.length > 0 && (
        <PaneChips
          data={navData}
          callback={handleNavCallback}
          // Only spaced off the segments when there are segments below it.
          className={data.length > 0 ? "tw:mb-2" : undefined}
        />
      )}
      {data.length > 0 && <PaneChips data={data} callback={handleCallback} />}
    </div>
  );
};

export default DirectoryPaneChips;
