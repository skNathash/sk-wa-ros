import { Clock, PackageCheck } from "lucide-react";
import type { OrderItem } from "../helper";
import ItemRow from "./ItemRow";

interface Props {
  variant: "available" | "delayed";
  items: OrderItem[];
}

const config = {
  available: {
    icon: PackageCheck,
    title: "Ready to deliver",
    subtitle: "In stock with the seller",
    iconColor: "tw:text-green-600",
    labelClass: "tw:bg-green-50 tw:text-green-700",
  },
  delayed: {
    icon: Clock,
    title: "Coming later",
    subtitle: "Will ship when stock arrives",
    iconColor: "tw:text-amber-600",
    labelClass: "tw:bg-amber-50 tw:text-amber-700",
  },
};

// A quiet section label followed by the items it covers. The flat rows keep the
// order summary easy to scan without the chat-style bubbles.
const ItemsSection = ({ variant, items }: Props) => {
  if (items.length === 0) return null;
  const c = config[variant];
  const Icon = c.icon;
  return (
    <div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:pt-3 tw:pb-1">
        <span
          className={`tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold ${c.labelClass}`}
        >
          <Icon size={12} strokeWidth={2.25} className={c.iconColor} />
          {c.title}
        </span>
        <span className="tw:text-[11px] tw:text-gray-400">{c.subtitle}</span>
      </div>
      <div className="tw:divide-y tw:divide-gray-100">
        {items.map((it, idx) => (
          <ItemRow key={idx} item={it} />
        ))}
      </div>
    </div>
  );
};

export default ItemsSection;
