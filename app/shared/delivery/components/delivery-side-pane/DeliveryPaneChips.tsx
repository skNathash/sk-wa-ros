import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

export type DeliveryChipKey = "today" | "b2b" | "b2c";

export type DeliveryChipCounts = Partial<Record<DeliveryChipKey, number>>;

interface DeliveryChip {
  key: DeliveryChipKey;
  langKey: string;
  label: string;
  /** Query params the chip writes into the URL when tapped. */
  params: Record<string, string>;
}

const CHIPS: DeliveryChip[] = [
  {
    key: "today",
    langKey: "today",
    label: "Today",
    params: { date: "today" },
  },
  {
    key: "b2b",
    langKey: "b2b",
    label: "B2B",
    params: { type: "B2B" },
  },
  {
    key: "b2c",
    langKey: "b2c",
    label: "B2C",
    params: { type: "B2C" },
  },
];

/**
 * Resolves which chip is active from the current query string.
 * - `date=today` selects the "today" chip.
 * - `type=B2B` / `type=B2C` selects the matching type chip.
 */
const resolveActiveKey = (
  searchParams: URLSearchParams,
): DeliveryChipKey | undefined => {
  const date = searchParams.get("date");
  const type = searchParams.get("type");

  if (date === "today") return "today";
  if (type === "B2B") return "b2b";
  if (type === "B2C") return "b2c";

  return undefined;
};

interface DeliveryPaneChipsProps {
  /** Force which chip reads as active. Defaults to deriving from the URL. */
  activeKey?: DeliveryChipKey;
  /** Trailing count badges per chip. */
  counts?: DeliveryChipCounts;
  /** Intercept chip taps; without it the chip updates the URL query params. */
  onSelect?: (key: DeliveryChipKey) => void;
  className?: string;
}

/**
 * Delivery side-pane filter chips: Today, B2B and B2C.
 *
 * Built on the generic {@link PaneChips}. The active chip is resolved from the
 * URL (`date=today` or `type=B2B|B2C`) and tapping a chip merges its params into
 * the current query string so the page can read them. The host can override
 * this by passing `onSelect`.
 */
const DeliveryPaneChips = ({
  activeKey,
  counts,
  onSelect,
  className,
}: DeliveryPaneChipsProps) => {
  const { t } = useTranslation("common");
  const [searchParams, setSearchParams] = useSearchParams();

  const resolvedActiveKey = activeKey ?? resolveActiveKey(searchParams);

  const data: PaneChipItem[] = CHIPS.map((chip) => ({
    key: chip.key,
    label: t(chip.langKey, { defaultValue: chip.label }),
    active: chip.key === resolvedActiveKey,
    count: counts?.[chip.key],
    chip,
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    const chip = item.chip as DeliveryChip;

    if (onSelect) {
      onSelect(chip.key);
      return;
    }

    const next = new URLSearchParams(searchParams);

    // A chip tap is mutually exclusive within this strip: type chips replace
    // each other, and the today chip toggles itself off when already active.
    if (chip.key === "today") {
      if (next.get("date") === "today") {
        next.delete("date");
      } else {
        next.set("date", "today");
      }
    } else {
      const currentType = next.get("type");
      if (currentType === chip.params.type) {
        next.delete("type");
      } else {
        next.set("type", chip.params.type);
      }
    }

    setSearchParams(next, { replace: true });
  };

  return <PaneChips data={data} callback={handleCallback} className={className} />;
};

export default DeliveryPaneChips;
