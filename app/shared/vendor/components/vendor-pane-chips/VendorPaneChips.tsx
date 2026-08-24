import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

interface VendorChip {
  key: string;
  langKey: string;
  label: string;
  path: string;
  /** Route matched to mark the chip active; defaults to `path`. */
  matchPath?: string;
  /** Optional leading icon rendered before the label. */
  icon?: ReactNode;
}

/** The vendor views reachable from the side pane. */
const CHIPS: VendorChip[] = [
  {
    key: "vendors",
    langKey: "vendors",
    label: "Vendors",
    path: "/dashboard/vendor/list",
    // The detail pages sit under /dashboard/vendor/view/:id and still belong
    // to the Vendors chip.
    matchPath: "/dashboard/vendor/",
  },
  {
    key: "brands",
    langKey: "byBrand",
    label: "By Brand",
    path: "/dashboard/vendor/brands",
  },
  {
    key: "new",
    langKey: "create",
    label: "Create",
    path: "/dashboard/vendor/manage",
    icon: <Plus className="tw:h-3.5 tw:w-3.5" />,
  },
];

interface VendorPaneChipsProps {
  className?: string;
}

/**
 * Quick-nav chips over the vendor views for the vendor side pane, built on the
 * generic {@link PaneChips}. The chip set is fixed; the active chip is resolved
 * from the current URL and a tap navigates to that view. Mirrors
 * `InventoryPaneChips` on the catalog side.
 */
const VendorPaneChips = ({ className }: VendorPaneChipsProps) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const location = useLocation();

  // The Vendors chip uses a broad prefix, so a more specific chip (brands /
  // new) wins whenever its own path matches.
  const specificMatch = CHIPS.find(
    (chip) => !chip.matchPath && location.pathname.startsWith(chip.path),
  );

  const data: PaneChipItem[] = CHIPS.map((chip) => ({
    key: chip.key,
    label: t(chip.langKey, { defaultValue: chip.label }),
    icon: chip.icon,
    active: specificMatch
      ? specificMatch.key === chip.key
      : location.pathname.startsWith(chip.matchPath ?? chip.path),
    path: chip.path,
  }));

  const handleCallback = ({ data: chip }: PaneChipsAction) => {
    if (chip.path) appNav.to(chip.path as string, { tab: chip.key });
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default VendorPaneChips;
