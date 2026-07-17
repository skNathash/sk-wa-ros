import clsx from "clsx";
import { Eye } from "lucide-react";
import React from "react";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import { Progress } from "~/components/ui/progress";
import { useTranslation } from "react-i18next";

// Status color mapping based on rack-bin.css
const STATUS_LABELS: Record<string, string> = {
  empty: "empty",
  low: "low",
  medium: "medium",
  high: "high",
  full: "full",
};
const STATUS_CLASS: Record<string, string> = {
  empty: "bin-empty",
  low: "bin-low",
  medium: "bin-medium",
  high: "bin-high",
  full: "bin-full",
};

interface BinItemProps {
  binName: string;
  binId: string;
  items: { name: string; sku: string; quantity: number; id?: string }[];
  capacity: number;
  used: number;
  status: "empty" | "low" | "medium" | "high" | "full";
  className?: string;
  animate?: boolean;
  callback: (params: { action: string; data: any }) => void;
}

const BinItem: React.FC<BinItemProps> = ({
  binName,
  binId,
  items,
  capacity,
  used,
  status,
  className,
  animate,
  callback,
}) => {
  const { t } = useTranslation();

  const percent = Math.round((used / capacity) * 100);

  if (status === "empty") {
    return (
      <div
        className={clsx(
          "tw:p-3 tw:rounded-lg tw:border tw:shadow-none tw:text-xs tw:flex tw:flex-col tw:items-center tw:justify-center tw:min-h-[120px] tw:cursor-pointer",
          className,
        )}
        onClick={() => {
          callback({ action: "view-bin", data: { binId, items } });
        }}
      >
        <div className="tw:text-center">
          <div className="tw:text-sm tw:text-gray-400 tw:mb-1">
            {t("empty")}
          </div>
          <div className="tw:text-sm tw:text-gray-400">
            {t("bin")} {binName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw:p-3 tw:rounded-lg tw:border tw:shadow-none tw:text-xs tw:cursor-pointer",
        className,
        animate && "tw:animate-pulse tw:!bg-yellow-100",
      )}
      onClick={() => {
        callback({ action: "view-bin", data: { binId, items } });
      }}
    >
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <span className="tw:font-semibold">
          {t("bin")} {binName}
        </span>
        <span className="tw:flex tw:items-center tw:gap-1">
          <span className="tw:bg-gray-50/50 tw:px-2 tw:py-0.5 tw:rounded tw:font-semibold tw:text-gray-900">
            {items?.length} {t("items")}
          </span>

          <Eye
            className="tw:w-4 tw:h-4 tw:text-gray-700 tw:cursor-pointer"
            onClick={() => {
              callback({ action: "view-bin", data: { binId, items } });
            }}
          />
        </span>
      </div>
      <div className="tw:mb-1 tw:flex tw:justify-between tw:items-center tw:font-normal">
        <span>{t("capacity")}</span>
        <span>
          {used}/{capacity}
        </span>
      </div>
      <Progress value={percent} className="tw:h-2 tw:mb-1" />
      <div className="tw:mb-4 tw:font-medium tw:text-center">
        {percent}% {t("used")}
      </div>
      <div className="tw:mb-2">
        {items?.slice(0, 2).map((item, idx) => (
          <div
            key={item.sku + idx}
            className="tw:mb-1 tw:flex tw:justify-between tw:items-start tw:last:mb-0 tw:gap-2"
          >
            <div>
              <div className="tw:font-medium">
                <span className="tw:block" title={item.name}>
                  <AppLink
                    asLink={true}
                    href={`/dashboard/inventory/products/view/${item.id}`}
                    className="tw:inline"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <span className="tw:max-w-[300px] tw:whitespace-normal tw:line-clamp-2">
                      {item.name}
                    </span>
                  </AppLink>
                </span>
              </div>
              <div className="tw:text-gray-500 tw:mb-1">
                {t("id")}: {item.sku}
              </div>
            </div>

            <span className="tw:px-2 tw:py-0.5 tw:rounded-full tw:border tw:border-gray-300 tw:text-gray-900 tw:font-semibold tw:flex tw:items-center tw:justify-center">
              {item.quantity}
            </span>
          </div>
        ))}
        {items?.length > 2 && (
          <div className="tw:mt-2 tw:text-center">
            <button
              className="tw:hovertext-orange-800 tw:text-gray-500"
              onClick={() => {
                callback({ action: "view-bin", data: { binId, items } });
              }}
            >
              +{items?.length - 2} {t("moreItems")}
            </button>
          </div>
        )}
      </div>
      <Divider />
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-2">
        <span className="tw:text-gray-500">{t("status")}:</span>
        <span className={clsx("tw:font-semibold", STATUS_CLASS[status])}>
          {t(STATUS_LABELS[status])}
        </span>
      </div>
    </div>
  );
};

export default BinItem;
