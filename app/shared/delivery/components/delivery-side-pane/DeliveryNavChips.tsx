import { MapPin, Handshake, Package, User, Check } from "lucide-react";
import { useMemo } from "react";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

const chips: PaneChipItem[] = [
  {
    key: "packages",
    label: "Packages",
    icon: <Package size={16} />,
  },
  {
    key: "handoffs",
    label: "Handoffs",
    icon: <Handshake size={16} />,
  },
  {
    key: "tracker",
    label: "Tracker",
    icon: <MapPin size={16} />,
  },
  {
    key: "runners",
    label: "Runners",
    icon: <User size={16} />,
  },
  {
    key: "reconcile",
    label: "Reconcile",
    icon: <Check size={16} />,
  },
];

interface DeliveryNavChipsProps {
  activeKey?: string;
}

const DeliveryNavChips = ({ activeKey }: DeliveryNavChipsProps) => {
  const appNav = useAppNav();

  const formattedChips = useMemo(() => {
    return chips.map((chip) => {
      return {
        ...chip,
        active: chip.key === activeKey,
      };
    });
  }, [activeKey]);

  const handleChipClick = (chip: PaneChipItem) => {
    const key = chip.key;
    switch (key) {
      case "packages":
        appNav.to("/dashboard/delivery/dispatch");
        break;
      case "handoffs":
        appNav.to("/dashboard/delivery/hand-off");
        break;
      case "tracker":
        appNav.to("/dashboard/delivery/tracker");
        break;
      case "runners":
        appNav.to("/dashboard/delivery/marketplace-runners");
        break;
      case "reconcile":
        appNav.to("/dashboard/delivery/reconcile");
        break;
    }
  };

  return (
    <PaneChips
      data={formattedChips}
      callback={({ data: chip }: PaneChipsAction) => handleChipClick(chip)}
    />
  );
};

export default DeliveryNavChips;
