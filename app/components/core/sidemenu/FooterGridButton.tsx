import { Link } from "react-router";
import MiscService from "~/services/MiscService";
import type { MenuItem, VariantColor } from "~/types/CommonTypes";

type Props = {
  item: MenuItem;
  tMenu: (k: string) => string;
  setOpenMobile?: (open: boolean) => void;
};

const getColorClasses = (color?: VariantColor) => {
  switch (color) {
    case "primary":
      return {
        icon: "tw:text-blue-600",
        text: "tw:text-blue-700",
        hover: "tw:hover:bg-blue-50",
      };
    case "success":
      return {
        icon: "tw:text-green-600",
        text: "tw:text-green-700",
        hover: "tw:hover:bg-green-50",
      };
    case "warning":
      return {
        icon: "tw:text-orange-600",
        text: "tw:text-orange-700",
        hover: "tw:hover:bg-orange-50",
      };
    case "danger":
      return {
        icon: "tw:text-red-600",
        text: "tw:text-red-700",
        hover: "tw:hover:bg-red-50",
      };
    case "secondary":
      return {
        icon: "tw:text-purple-600",
        text: "tw:text-purple-700",
        hover: "tw:hover:bg-purple-50",
      };
    default:
      return {
        icon: "tw:text-gray-600",
        text: "tw:text-gray-700",
        hover: "tw:hover:bg-gray-50",
      };
  }
};

export default function FooterGridButton({
  item,
  tMenu,
  setOpenMobile,
}: Props) {
  const Icon = item.icon;
  const colorClasses = getColorClasses(item.color);

  const handleClick = () => {
    if (!MiscService.isDesktopView()) {
      const t = setTimeout(() => {
        setOpenMobile?.(false);
        clearTimeout(t);
      }, 300);
    }
  };

  return (
    <div
      className={`tw:flex tw:items-center tw:justify-center tw:p-1 tw:rounded tw:transition-colors tw:cursor-pointer tw:min-h-[28px] ${colorClasses.hover}`}
    >
      {item.path ? (
        <Link
          to={item.path}
          className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:w-full tw:h-full"
          onClick={handleClick}
        >
          {Icon && (
            <Icon
              className={`tw:w-3 tw:h-3 ${colorClasses.icon}`}
              aria-hidden="true"
            />
          )}
          <span
            className={`tw:text-[10px] tw:font-medium tw:leading-none tw:truncate ${colorClasses.text}`}
          >
            {item.langKey ? tMenu(item.langKey) : item.label}
          </span>
        </Link>
      ) : (
        <div className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:w-full tw:h-full">
          {Icon && (
            <Icon
              className={`tw:w-3 tw:h-3 ${colorClasses.icon}`}
              aria-hidden="true"
            />
          )}
          <span
            className={`tw:text-[10px] tw:font-medium tw:leading-none tw:truncate ${colorClasses.text}`}
          >
            {item.langKey ? tMenu(item.langKey) : item.label}
          </span>
        </div>
      )}
    </div>
  );
}
