import { Check } from "lucide-react";
import { Fragment } from "react";

interface OrderStepsProps {
  status?: string;
}

// Order status steps configuration. Short labels fit the compact mobile
// tracker; `desktopLabel` spells the stage out where there is room, and
// `title` keeps the full wording as a tooltip.
const orderSteps = [
  {
    key: "order_placed",
    title: "Order Placed",
    label: "Placed",
    desktopLabel: "Placed",
    stage: "placed",
  },
  {
    key: "picking_items",
    title: "Picking Items",
    label: "Pick",
    desktopLabel: "Pick",
    stage: "pick",
  },
  {
    key: "packing_items",
    title: "Packing Items",
    label: "Pack",
    desktopLabel: "Pack",
    stage: "pack",
  },
  {
    key: "awaiting_shipment",
    title: "Awaiting Shipment",
    label: "Invo",
    desktopLabel: "Invoice",
    stage: "invoice",
  },
  {
    key: "shipped",
    title: "Shipped",
    label: "Hand",
    desktopLabel: "Handed Over",
    stage: "handover",
  },
  {
    key: "delivered",
    title: "Delivered",
    label: "Deli",
    desktopLabel: "Delivered",
    stage: "delivered",
  },
];

const OrderSteps = ({ status }: OrderStepsProps) => {
  // Determine current active step based on order status
  const getCurrentStepKey = () => {
    if (!status) return "order_placed";

    // Map status to step keys
    const statusMapping: Record<string, string> = {
      // Order placed statuses
      Created: "order_placed",
      Confirmed: "order_placed",
      "Order Placed": "order_placed",

      // Picking items statuses
      Processing: "picking_items",
      Picking: "picking_items",
      "Picking Items": "picking_items",

      // Packing items statuses
      Packed: "packing_items",
      Packing: "packing_items",
      "Packing Items": "packing_items",

      // Awaiting shipment statuses
      Invoiced: "awaiting_shipment",
      "Ready to Ship": "awaiting_shipment",
      "Awaiting Shipment": "awaiting_shipment",
      "Pending Shipment": "awaiting_shipment",

      // Shipped statuses
      Shipped: "shipped",
      "Seller Shipped": "shipped",
      Inwarded: "shipped",
      "Partially Shipped": "shipped",

      // Delivered statuses
      Delivered: "delivered",
      "Partially Delivered": "delivered",
    };

    return statusMapping[status] || "order_placed";
  };

  const activeIndex = orderSteps.findIndex(
    (s) => s.key === getCurrentStepKey(),
  );
  const isCompleted = status === "Delivered";

  return (
    <div className="op-steps tw:mb-4">
      {orderSteps.map((step, index) => {
        const done = isCompleted || index < activeIndex;
        const active = !isCompleted && index === activeIndex;
        return (
          <Fragment key={step.key}>
            {index > 0 && (
              <div
                className={`op-step-line op-stage-${step.stage} ${
                  done || active ? "is-done" : ""
                }`}
              />
            )}
            <div
              className={`op-step op-stage-${step.stage} ${
                done ? "is-done" : ""
              } ${active ? "is-active" : ""}`}
              title={step.title}
            >
              <div className="op-step-dot">
                {done ? <Check size={14} /> : index + 1}
              </div>
              <div className="op-step-label">
                <span className="tw:md:hidden">{step.label}</span>
                <span className="tw:hidden tw:md:inline">
                  {step.desktopLabel}
                </span>
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
};

export default OrderSteps;
