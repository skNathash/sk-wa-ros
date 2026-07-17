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
    subtitle: "Seller has these items in stock",
    iconBg: "tw:bg-green-50",
    iconColor: "tw:text-green-600",
  },
  delayed: {
    icon: Clock,
    title: "Coming later",
    subtitle: "Seller will deliver when stock comes",
    iconBg: "tw:bg-amber-50",
    iconColor: "tw:text-amber-700",
  },
};

const ItemsSection = ({ variant, items }: Props) => {
  if (items.length === 0) return null;
  const c = config[variant];
  const Icon = c.icon;
  return (
    <div className="tw:mt-3 first:tw:mt-0">
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <div
          className={`tw:w-6 tw:h-6 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shrink-0 ${c.iconBg}`}
        >
          <Icon className={`tw:w-3.5 tw:h-3.5 ${c.iconColor}`} />
        </div>
        <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
          {c.title}
        </div>
        <span className="tw:text-xs tw:text-gray-500 tw:truncate">
          · {c.subtitle}
        </span>
      </div>
      <div className="tw:bg-gray-50 tw:rounded-lg tw:px-3 tw:py-1 tw:divide-y tw:divide-gray-200">
        {items.map((it, idx) => (
          <ItemRow key={idx} item={it} />
        ))}
      </div>
    </div>
  );
};

export default ItemsSection;
