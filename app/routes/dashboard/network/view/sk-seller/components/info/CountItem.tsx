import AppBadge from "~/components/core/badge/AppBadge";

type CountItemVariant = "brand" | "product" | "buyer";

const variantClasses: Record<
  CountItemVariant,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  brand: {
    bg: "tw:bg-purple-50",
    text: "tw:text-purple-800",
    border: "tw:border tw:border-purple-200",
    icon: "tw:text-purple-700",
    label: "tw:text-purple-700",
  },
  product: {
    bg: "tw:bg-amber-50",
    text: "tw:text-amber-800",
    border: "tw:border tw:border-amber-200",
    icon: "tw:text-amber-700",
    label: "tw:text-amber-700",
  },
  buyer: {
    bg: "tw:bg-indigo-50",
    text: "tw:text-indigo-800",
    border: "tw:border tw:border-indigo-200",
    icon: "tw:text-indigo-700",
    label: "tw:text-indigo-700",
  },
};

const CountItem = ({
  count,
  label,
  icon: Icon,
  variant = "brand",
}: {
  count: number;
  label: string;
  icon: React.ElementType;
  variant?: CountItemVariant;
}) => {
  const v = variantClasses[variant];
  return (
    <div className="tw:flex tw:items-center tw:gap-1">
      <AppBadge
        className={`tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:gap-0 tw:md:gap-1 ${v.bg} ${v.text} ${v.border} tw:px-2.5 tw:py-1 tw:text-sm`}
      >
        <div className="tw:flex tw:items-center tw:gap-1">
          <Icon size={14} className={v.icon} />
          <span className={`tw:uppercase tw:text-[11px] ${v.label}`}>
            {label}
          </span>
        </div>
        <span className="tw:font-semibold tw:w-full tw:text-center tw:md:w-auto tw:md:text-inherit tw:md:ml-1">
          {count || 0}
        </span>
      </AppBadge>
    </div>
  );
};

export default CountItem;
