import {
  AlarmClock,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  FileText,
  LockOpen,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

export type PayLaterChipKey =
  | "analytics"
  | "approvals"
  | "unlock"
  | "overdue"
  | "due-soon"
  | "available"
  | "statements"
  | "my-paylater";

interface PayLaterChip {
  key: PayLaterChipKey;
  langKey: string;
  label: string;
  path: string;
  icon: PaneChipItem["icon"];
  /** Extra query params carried into the destination. */
  params?: Record<string, string>;
  /** Which layout tab the destination belongs to. */
  tab: string;
}

/**
 * The PayLater pane chips: the book overview first, then the two action queues
 * — approvals and the unlock desk — then the three slices of
 * the wallet list worth acting on, then the reference sections. The wallet
 * slices land on the wallet list pre-filtered by status (see the wallets
 * `prepareParams` for what each status resolves to) — all three on the
 * combined B2B + B2C list.
 */
const CHIPS: PayLaterChip[] = [
  {
    key: "analytics",
    langKey: "analytics",
    label: "Analytics",
    path: "/dashboard/paylater/analytics",
    icon: <BarChart3 size={16} />,
    tab: "analytics",
  },
  {
    key: "approvals",
    langKey: "approvals",
    label: "Approvals",
    path: "/dashboard/paylater/approvals",
    icon: <ClipboardCheck size={16} />,
    tab: "approvals",
  },
  {
    key: "unlock",
    langKey: "unlock",
    label: "Unlock",
    path: "/dashboard/paylater/unlock",
    icon: <LockOpen size={16} />,
    tab: "unlock",
  },
  {
    key: "overdue",
    langKey: "overdue",
    label: "Overdue",
    path: "/dashboard/paylater/wallets/all",
    params: { status: "Overdue" },
    icon: <AlertTriangle size={16} />,
    tab: "all-wallets",
  },
  {
    key: "due-soon",
    langKey: "dueSoon",
    label: "Due soon",
    path: "/dashboard/paylater/wallets/all",
    params: { status: "DueSoon" },
    icon: <AlarmClock size={16} />,
    tab: "all-wallets",
  },
  {
    key: "available",
    langKey: "available",
    label: "Available",
    path: "/dashboard/paylater/wallets/all",
    params: { status: "Available" },
    icon: <Wallet size={16} />,
    tab: "all-wallets",
  },
  {
    key: "statements",
    langKey: "statements",
    label: "Statement",
    path: "/dashboard/paylater/statements",
    icon: <FileText size={16} />,
    tab: "statements",
  },
  {
    key: "my-paylater",
    langKey: "myPaylater",
    label: "My PayLater",
    path: "/dashboard/paylater/my-paylater",
    icon: <CreditCard size={16} />,
    tab: "my-paylater",
  },
];

/** Trailing count badges, keyed by chip. */
export type PayLaterChipCounts = Partial<Record<PayLaterChipKey, number>>;

interface PayLaterPaneChipsProps {
  /**
   * Force which chip reads as active. When omitted it is derived from the
   * current route + status query.
   */
  activeKey?: PayLaterChipKey;
  /** Trailing count badges. */
  counts?: PayLaterChipCounts;
  /** Handle the tap yourself; without it the chip navigates. */
  onSelect?: (key: PayLaterChipKey) => void;
  className?: string;
}

// The wallet chips share one route and differ only by the status query, so the
// status decides between them; everything else matches on pathname.
const resolveActiveKey = (
  pathname: string,
  searchParams: URLSearchParams,
): PayLaterChipKey | undefined => {
  if (pathname.startsWith("/dashboard/paylater/wallets")) {
    const status = searchParams.get("status");
    if (status === "Overdue") return "overdue";
    if (status === "DueSoon") return "due-soon";
    if (status === "Available") return "available";
    return undefined;
  }

  const match = CHIPS.find(
    (chip) =>
      !chip.params && pathname.startsWith(chip.path),
  );
  return match?.key;
};

/**
 * PayLater section chips for the layout side pane, built on the generic
 * {@link PaneChips}. The chip set is fixed; the active chip is resolved from
 * the current URL and a tap navigates to that section.
 */
const PayLaterPaneChips = ({
  activeKey,
  counts,
  onSelect,
  className,
}: PayLaterPaneChipsProps) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const resolvedActiveKey =
    activeKey ?? resolveActiveKey(location.pathname, searchParams);

  const data: PaneChipItem[] = CHIPS.map((chip) => ({
    key: chip.key,
    label: t(chip.langKey, { defaultValue: chip.label }),
    icon: chip.icon,
    active: chip.key === resolvedActiveKey,
    count: counts?.[chip.key],
    chip,
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    const chip = item.chip as PayLaterChip;
    if (onSelect) {
      onSelect(chip.key);
      return;
    }
    appNav.to(chip.path, { tab: chip.tab, ...(chip.params || {}) });
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default PayLaterPaneChips;
