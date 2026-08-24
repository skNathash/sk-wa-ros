import { ExternalLink } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import type { OrderDetailView } from "../helper";
import ActivitySection from "./ActivitySection";
import DeliverySection from "./DeliverySection";
import OrderSummaryCard from "./OrderSummaryCard";
import PaymentSection from "./PaymentSection";
import ProductsSection from "./ProductsSection";

/** Shimmer stand-in that mirrors the real layout, so nothing jumps on load. */
const LoadingBody = () => (
  <div className="od-shell tw:space-y-3 tw:p-3">
    <div className="od-card tw:p-3.5 tw:space-y-2.5">
      <div className="od-skel tw:h-5 tw:w-40" />
      <div className="od-skel tw:h-3 tw:w-56" />
      <div className="od-skel tw:h-8 tw:w-full" />
    </div>
    <div className="od-card tw:p-3.5 tw:space-y-2.5">
      <div className="od-skel tw:h-3 tw:w-24" />
      <div className="od-skel tw:h-9 tw:w-full" />
      <div className="od-skel tw:h-9 tw:w-full" />
    </div>
    <div className="od-card tw:p-3.5 tw:space-y-2.5">
      <div className="od-skel tw:h-3 tw:w-24" />
      <div className="od-skel tw:h-12 tw:w-full" />
    </div>
  </div>
);

/**
 * The order's body — identical on both breakpoints; only the shell around it
 * changes (right drawer on desktop, bottom sheet on mobile).
 */
const OrderDetailBody = ({
  order,
  loading,
  onDownloadInvoice,
}: {
  order: OrderDetailView | null;
  loading: boolean;
  onDownloadInvoice: () => void;
}) => {
  if (loading) return <LoadingBody />;

  if (!order) {
    return (
      <div className="od-shell tw:py-10">
        <NoData />
      </div>
    );
  }

  return (
    <div className={`od-shell od-accent-${order.accent} tw:space-y-3 tw:p-3`}>
      <OrderSummaryCard order={order} onDownloadInvoice={onDownloadInvoice} />

      <ProductsSection order={order} />

      <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:xl:grid-cols-2">
        <PaymentSection order={order} />
        <DeliverySection order={order} />
      </div>

      <ActivitySection order={order} />

      <AppLink asLink href={order.orderLink} className="od-footer-link">
        View full order details
        <ExternalLink size={12} />
      </AppLink>
    </div>
  );
};

export default OrderDetailBody;
