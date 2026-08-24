import { ExternalLink, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppTimeline from "~/components/core/timeline/AppTimeline";
import useAppNav from "~/hooks/useAppNav";
import Boxes from "./Boxes";
import Invoices from "./Invoices";
import ShipmentDetail from "./ShipmentDetail";
import Pickings from "./Pickings";

type TimelineData = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  statusColor: string;
  remarks: string;
  createdBy?: {
    id: string;
    name: string;
  };
};

const Timeline = ({
  timelineData,
  invoices,
  packages,
  shipmentDetails,
  orderSubType,
  orderId,
  orderStatus,
  canProcess,
  isGuestCustomer,
  orderType,
  quickCheckout,
}: {
  timelineData: TimelineData[];
  invoices: any[];
  packages: any[];
  shipmentDetails: any;
  orderSubType?: string;
  orderId: string;
  orderStatus: string;
  canProcess?: boolean;
  isGuestCustomer?: boolean;
  orderType?: string;
  quickCheckout?: boolean;
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [data, setData] = useState<
    {
      status: string;
      done: boolean;
      createdAt: string;
      remarks: string;
      icon: string;
      createdByName?: string;
      key: string;
    }[]
  >([]);

  useEffect(() => {
    let statuses = [
      { label: t("created"), done: true, key: "Created", icon: "plus" },
      {
        label: t("paymentDone") || "Payment Done",
        done: false,
        key: "Payment Done",
        icon: "credit-card",
      },
      {
        label: t("paymentApproved") || "Payment Approved",
        done: false,
        key: "Payment Approved",
        icon: "badge-check",
      },
      { label: t("picking"), done: false, key: "Picking", icon: "list-check" },
      // {
      //   label: "Processed On",
      //   done: false,
      //   key: "Processing",
      //   icon: "settings",
      // },
      { label: t("packed"), done: false, key: "Packed", icon: "package" },
      { label: t("invoiced"), done: false, key: "Invoiced", icon: "file-text" },
      {
        label: t("awaitingShipment"),
        done: false,
        key: "Pending Shipment",
        icon: "clock",
      },
      { label: t("shipped"), done: false, key: "Shipped", icon: "truck" },
      {
        label: t("delivered"),
        done: false,
        key: "Delivered",
        icon: "check-circle",
      },
    ];

    // Add Payment Approved if present in timeline data
    if (timelineData.some((item) => item.status === "Payment Approved")) {
      statuses.push({
        label: "Payment Approved",
        done: false,
        key: "Payment Approved",
        icon: "check-circle",
      });
    }

    // Add Refunded if present in timeline data
    if (timelineData.some((item) => item.status === "Refunded")) {
      statuses.push({
        label: "Refunded",
        done: false,
        key: "Refunded",
        icon: "undo",
      });
    }

    // Only add Cancelled status if the order status is Cancelled
    if (orderStatus === "Cancelled") {
      statuses.push({
        label: t("cancelled"),
        done: false,
        key: "Cancelled",
        icon: "x-circle",
      });
    }

    // For POS orders, guest customers and quick B2B checkout orders, hide
    // processing/packed/picking steps - those orders never enter those queues.
    if (orderSubType === "POS" || quickCheckout) {
      const ignoreStatuses = ["Processing", "Packed", "Picking", "Picked"];
      statuses = statuses.filter((s) => !ignoreStatuses.includes(s.key));
    }

    // Hide payment steps if no matching timeline entry exists
    const paymentKeys = ["Payment Done", "Payment Approved"];
    statuses = statuses.filter((s) => {
      if (!paymentKeys.includes(s.key)) return true;
      return timelineData.some((item) => item.status === s.key);
    });

    if (orderStatus === "Awaiting Shipment") {
      statuses = statuses.filter((s) => s.key !== "Shipped");
    }

    // Hide "Awaiting Shipment" if there's shipped data
    const hasShippedData = timelineData.some(
      (item) => item.status === "Shipped",
    );
    if (hasShippedData) {
      statuses = statuses.filter((s) => s.key !== "Pending Shipment");
    }

    // but only if those statuses are not already present in timelineData (i.e., not done).
    if (orderStatus === "Cancelled") {
      statuses = statuses.filter((s) => {
        // keep the status if it's already done (present in timelineData), otherwise filter it out
        const done = timelineData.some((item) => item.status === s.key);
        return done;
      });
    }

    const updatedData = statuses.map((status) => {
      const timelineItem = timelineData.find(
        (item) => item.status === status.key,
      );

      return {
        status: status.label,
        done: !!timelineItem,
        createdAt: timelineItem?.createdAt || "",
        remarks: timelineItem?.remarks || "",
        icon: status.icon,
        createdByName: timelineItem?.createdBy?.name || "",
        key: status.key,
      };
    });
    setData(updatedData);
  }, [
    timelineData,
    orderStatus,
    t,
    orderSubType,
    isGuestCustomer,
    quickCheckout,
  ]);

  return (
    <>
      {canProcess ? (
        <div className="tw:border tw:border-blue-500 tw:rounded-lg tw:p-4 tw:mb-4 tw:flex tw:flex-wrap tw:gap-2 tw:items-center tw:justify-between tw:bg-blue-50">
          <div>
            <div className="tw:font-semibold tw:text-base tw:text-blue-900">
              {t("fulfillmentManagement")}
            </div>
            <div className="tw:text-sm tw:text-blue-800 tw:mt-1">
              {t("fulfillmentManagementDescription")}
            </div>
          </div>
          <AppButton
            size="small"
            onClick={() => appNav.to(`/dashboard/orders/process/${orderId}`)}
          >
            <ExternalLink className="tw:text-lg" />
            <span>{t("openFulfillment")}</span>
          </AppButton>
        </div>
      ) : null}
      <AppCard title={t("orderTimeline")}>
        <AppTimeline className="tw:ms-4">
          {data.map((item) => (
            <AppTimeline.Item
              key={item.status}
              icon={item.icon}
              iconClassName={
                item.done ? "tw:bg-blue-700 tw:text-white" : "tw:bg-gray-300"
              }
              className={`${item.done ? "tw:opacity-100" : "tw:opacity-50"}`}
            >
              <div className="tw:flex tw:flex-col tw:w-full">
                <span className="tw:font-medium tw:mb-1">{item.status}</span>

                {item.remarks && (
                  <span className="tw:text-xs tw:text-slate-800 tw:mb-2">
                    "{item.remarks}"
                  </span>
                )}

                {item.done && (
                  <span className="tw:text-xs tw:text-gray-500 tw:mb-1">
                    <DateFormat value={item.createdAt} />
                  </span>
                )}

                {item.done && item.createdByName && (
                  <span className="tw:text-xs tw:text-slate-500 tw:mb-1 tw:flex tw:items-center tw:gap-1 tw:font-semibold tw:mt-1">
                    <User size={14} className="tw-inline" />
                    {item.createdByName}
                  </span>
                )}

                {item.key === "Invoiced" && invoices.length > 0 ? (
                  <Invoices
                    invoices={invoices}
                    className="tw:mt-4"
                    orderType={orderType}
                    orderId={orderId}
                  />
                ) : null}

                {item.key === "Packed" ? (
                  <Boxes orderId={orderId} className="tw:mt-4" />
                ) : null}

                {item.key === "Shipped" && shipmentDetails ? (
                  <ShipmentDetail data={shipmentDetails} className="tw:mt-4" />
                ) : null}

                {item.key === "Picking" ? <Pickings orderId={orderId} /> : null}
              </div>
            </AppTimeline.Item>
          ))}
        </AppTimeline>
      </AppCard>
    </>
  );
};

export default Timeline;
