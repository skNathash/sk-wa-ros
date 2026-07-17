import AppSteps from "~/components/core/steps/AppSteps";
import useScreenView from "~/hooks/useScreenView";

interface OrderStepsProps {
  status?: string;
}

const OrderSteps = ({ status }: OrderStepsProps) => {
  const { isMobile } = useScreenView();

  // Order status steps configuration
  const orderSteps = [
    {
      key: "order_placed",
      title: "Order Placed",
      icon: "shopping-cart",
      langKey: "orderPlaced",
    },
    {
      key: "picking_items",
      title: "Picking Items",
      icon: "package-search",
      langKey: "pickingItems",
    },
    {
      key: "packing_items",
      title: "Packing Items",
      icon: "package",
      langKey: "packingItems",
    },
    {
      key: "awaiting_shipment",
      title: "Awaiting Shipment",
      icon: "clock",
      langKey: "awaitingShipment",
    },
    {
      key: "shipped",
      title: "Shipped",
      icon: "truck",
      langKey: "shipped",
    },
    {
      key: "delivered",
      title: "Delivered",
      icon: "check-circle",
      langKey: "delivered",
    },
  ];

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

  return (
    <AppSteps
      steps={orderSteps}
      activeKey={getCurrentStepKey()}
      isCompleted={status === "Delivered"}
      borderMinWidth={isMobile ? 30 : 80}
    />
  );
};

export default OrderSteps;
