import { Compass, FileText, Layers } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

export type PlatformFeeChipKey = "discover" | "tiers" | "statement";

const BENEFITS_PATH = "/dashboard/accounts/platform-fee/benefits";
const TIERS_PATH = "/dashboard/accounts/platform-fee/tiers";
const PLANS_PATH = "/dashboard/accounts/platform-fee";
const STATEMENT_PATH = "/dashboard/accounts/platform-fee/statement";

interface PlatformFeeChip {
  key: PlatformFeeChipKey;
  label: string;
  path: string;
  icon: ReactNode;
  params?: Record<string, string>;
}

const CHIPS: PlatformFeeChip[] = [
  {
    key: "discover",
    label: "Discover",
    path: BENEFITS_PATH,
    icon: <Compass size={16} />,
  },
  {
    key: "tiers",
    label: "Tiers",
    path: TIERS_PATH,
    icon: <Layers size={16} />,
  },
  {
    key: "statement",
    label: "Statement",
    path: STATEMENT_PATH,
    params: { tab: "commission-invoices", subtab: "history" },
    icon: <FileText size={16} />,
  },
];

interface PlatformFeePaneChipsProps {
  className?: string;
  /** Overrides the chip derived from the URL. */
  activeKey?: PlatformFeeChipKey;
  /** Handle the tap in the host instead of navigating. */
  onSelect?: (key: PlatformFeeChipKey) => void;
}

/** Which chip the current URL is sitting on — statement first, since its path
 * is a prefix match away from the plans path. */
const resolveActiveKey = (pathname: string): PlatformFeeChipKey | undefined => {
  if (pathname.startsWith(STATEMENT_PATH)) return "statement";
  if (pathname.startsWith(BENEFITS_PATH)) return "discover";
  if (pathname.startsWith(TIERS_PATH) || pathname === PLANS_PATH) return "tiers";
  return undefined;
};

/**
 * Quick-nav chips for the Platform Fee side pane — the three screens the offer
 * lives across: the benefits carousel (Discover), the priced tiers, and the
 * billing history (Statement). Built on the generic {@link PaneChips}.
 */
const PlatformFeePaneChips = ({
  className,
  activeKey,
  onSelect,
}: PlatformFeePaneChipsProps) => {
  const appNav = useAppNav();
  const { pathname } = useLocation();

  const resolvedActiveKey = activeKey ?? resolveActiveKey(pathname);

  const data: PaneChipItem[] = CHIPS.map((chip) => ({
    key: chip.key,
    label: chip.label,
    icon: chip.icon,
    active: chip.key === resolvedActiveKey,
    chip,
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    const chip = item.chip as PlatformFeeChip;
    if (onSelect) {
      onSelect(chip.key);
      return;
    }
    appNav.to(chip.path, chip.params || {});
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default PlatformFeePaneChips;
