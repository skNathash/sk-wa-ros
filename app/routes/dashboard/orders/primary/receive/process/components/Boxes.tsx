import { BoxesIcon, BoxIcon, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";

const Boxes = ({
  boxes,
  onReceive,
}: {
  boxes: any[];
  onReceive?: (box: any) => void;
}) => {
  const { t } = useTranslation();

  // Helper function to get status color and display text
  const getStatusInfo = (status: string) => {
    if (status === "Shipped") {
      return { color: "success" as const, display: "In Transit" };
    } else if (status === "Delivered") {
      return { color: "danger" as const, display: "Delivered" };
    } else {
      return { color: "primary" as const, display: status };
    }
  };

  if (!boxes || boxes.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        No boxes found
      </div>
    );
  }

  return (
    <AppCard
      title={`${t("shipmentBoxes")} (${boxes.length})`}
      subtitle={t("shipmentBoxesSubtitle")}
      icon={<Package />}
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {boxes.map((box) => {
          const statusInfo = getStatusInfo(box.status);

          return (
            <div
              key={box._id}
              className="tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white tw:p-4"
            >
              {/* Header with Box ID and Status */}
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Package className="tw:w-4 tw:h-4 tw:text-gray-600" />
                  <span className="tw:font-semibold tw:text-sm tw:text-gray-900">
                    {box.packageRefNo}
                  </span>
                </div>
                <AppBadge variant={statusInfo.color} className="tw:text-xs">
                  {statusInfo.display}
                </AppBadge>
              </div>

              {/* Subtitle with item count and package type */}
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                <span className="tw:text-xs tw:text-gray-600">
                  {box.totalQty} items
                </span>
                <span className="tw:w-1 tw:h-1 tw:bg-gray-400 tw:rounded-full"></span>
                <span className="tw:text-xs tw:text-gray-600">
                  {box.packageType} Box
                </span>
              </div>

              {/* Items list */}
              <div className="tw:space-y-2">
                {box.items.map((item: any) => (
                  <div
                    key={item._id}
                    className="tw:flex tw:justify-between tw:items-start tw:gap-2"
                  >
                    <div className="tw:flex-1 tw:min-w-0">
                      <p className="tw:text-xs tw:text-gray-900 tw:leading-tight tw:truncate">
                        {item.dealName}
                      </p>
                    </div>
                    <span className="tw:bg-gray-100 tw:text-xs tw:px-2 tw:py-1 tw:rounded-full tw:text-gray-700 tw:font-medium tw:flex-shrink-0">
                      {item.qty}
                    </span>
                  </div>
                ))}
              </div>
              {/* Actions: per-box Receive button */}
              {onReceive && box.status === "Delivered" && (
                <div className="tw:mt-3 tw:flex tw:justify-end">
                  <AppButton
                    color="success"
                    onClick={() => onReceive(box)}
                    className="tw:px-3 tw:py-1 tw:text-sm"
                    size="small"
                  >
                    <BoxIcon />
                    Receive
                  </AppButton>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppCard>
  );
};

export default Boxes;
