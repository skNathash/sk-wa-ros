import clsx from "clsx";
import { Package } from "lucide-react";
import { useMemo, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import useAppToast from "~/hooks/useAppToast";
import SkBulkBoxReceiveModal from "~/shared/orders/modals/bulk-box-receive/sk-bulk-box-receive/SkBulkBoxReceiveModal";

const Boxes = ({
  boxes,
  callback,
}: {
  boxes: any[];
  callback?: (a: { action: string; data?: any }) => void;
}) => {
  const appToast = useAppToast();

  const [bulkProcessModal, setBulkProcessModal] = useState<{
    show: boolean;
    boxes: any[];
  }>({
    show: false,
    boxes: [],
  });

  const selectedBoxes = useMemo(() => {
    return boxes.filter((box: any) => box._selected);
  }, [boxes]);

  const handleReceiveAll = () => {
    if (selectedBoxes.length === 0) {
      appToast.show({
        msg: "Please select at least one box to receive",
        color: "warning",
      });
      return;
    }
    setBulkProcessModal({
      show: true,
      boxes: selectedBoxes,
    });
  };

  const handleBulkProcessModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    setBulkProcessModal({ show: false, boxes: [] });
  };

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
      <AppCard>
        <div className="tw:text-center tw:py-8 tw:text-gray-500">
          <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
          <p>No boxes found</p>
        </div>
      </AppCard>
    );
  }

  return (
    <>
      <AppCard
        title={`Shipment Boxes (${boxes.length})`}
        subtitle="This order was shipped  with the following boxes"
        icon={<Package />}
      >
        <AppScrollArea className="tw:h-[300px]">
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            {boxes.map((box) => {
              const statusInfo = getStatusInfo(box.status);

              return (
                <div
                  key={box._id}
                  className={clsx(
                    "tw:border tw:rounded-lg tw:bg-white tw:p-4",
                    {
                      "tw:border-blue-600 tw:border-2": box._selected,
                      "tw:border-gray-200 tw:border": !box._selected,
                    }
                  )}
                >
                  <div className="tw:flex tw:items-center tw:gap-1 tw:mb-4">
                    <input
                      type="checkbox"
                      onChange={() =>
                        callback?.({ action: "select", data: box })
                      }
                      value={box._selected}
                      className="tw:w-4 tw:h-4 tw:text-blue-600 tw:border-blue-600 tw:border"
                    />
                    <span className="tw:text-sm tw:text-blue-600">
                      Select to Receive
                    </span>
                  </div>
                  {/* Header with Box ID and Status */}
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <Package className="tw:w-4 tw:h-4 tw:text-gray-600" />
                      <span className="tw:font-semibold tw:text-sm tw:text-gray-900">
                        {box.boxNo}
                      </span>
                    </div>
                    <AppBadge variant={statusInfo.color} className="tw:text-xs">
                      {box.status}
                    </AppBadge>
                  </div>

                  {/* Subtitle with item count and package type */}
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                    <span className="tw:text-xs tw:text-gray-600">
                      {box.itemsCount || 0} items, {box.itemsQuantity || 0}{" "}
                      units
                    </span>
                    {/* <span className="tw:w-1 tw:h-1 tw:bg-gray-400 tw:rounded-full"></span>
                <span className="tw:text-xs tw:text-gray-600">
                  {box.packageType} Box
                </span> */}
                  </div>

                  {/* Items list */}
                  <div className="tw:space-y-2">
                    {box.items?.map((item: any) => (
                      <div
                        key={item._id}
                        className="tw:flex tw:justify-between tw:items-center tw:gap-2"
                      >
                        <div className="tw:flex-1 tw:min-w-0">
                          <p className="tw:text-xs tw:text-gray-900 tw:leading-tight tw:truncate">
                            {item.name}
                          </p>
                        </div>
                        <span className="tw:bg-gray-100 tw:text-xs tw:px-2 tw:py-1 tw:rounded-full tw:text-gray-700 tw:font-medium tw:flex-shrink-0">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </AppScrollArea>

        <div className="tw:flex tw:items-center tw:justify-between tw:mt-4">
          <span className="tw:text-sm tw:text-gray-600">
            {selectedBoxes.length} boxes selected
          </span>
          <AppButton color="success" onClick={handleReceiveAll}>
            <Package className="tw:w-4 tw:h-4" />
            Receive Selected Boxes ({selectedBoxes.length})
          </AppButton>
        </div>
      </AppCard>

      <SkBulkBoxReceiveModal
        show={bulkProcessModal.show}
        callback={handleBulkProcessModalCallback}
        boxes={selectedBoxes}
      />
    </>
  );
};

export default Boxes;
