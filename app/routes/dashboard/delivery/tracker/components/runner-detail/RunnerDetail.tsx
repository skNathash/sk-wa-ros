import { useEffect, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import { MapPin, Phone } from "lucide-react";

/** One shipment a runner is carrying, surfaced in the detail pane. */
export interface RunnerShipment extends Record<string, any> {
  _id: string;
  orderRefNo?: string;
  status?: string;
  customerInfo?: {
    name?: string;
    mobile?: string;
    address?: { town?: string };
  };
  items?: {
    dealName?: string;
    quantity?: number;
    weight?: number;
    netWeight?: number;
  }[];
  payableAmount?: number;
  paymentType?: string;
  deliveryDistance?: number;
  /** Display fields derived once in {@link formatShipment}. */
  _customerName: string;
  _locality: string;
  _amountLbl: string;
  _paymentLbl: string;
  _itemCount: number;
  _weightLbl: string;
  _etaLbl: string;
}

/**
 * The tracked runner's detail — the runner card plus a step-by-step journey of
 * the shipments they are carrying. The pane watches the `runner` query param
 * and re-fetches the runner's shipments whenever it changes.
 */
const RunnerDetail = ({ runnerId }: { runnerId?: string }) => {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<RunnerShipment[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!runnerId) {
      setShipments([]);
      return;
    }

    setLoading(true);

    const loadShipments = async () => {
      try {
        const response = await MarketplaceRunnerService.getShipmentsByRunner({
          filter: { deliveryAgentId: runnerId },
        });
        if (cancelled) return;
        const groups: Record<string, any>[] =
          response?.data?.data?.groups || [];
        const raw = groups.flatMap((g) => g?.shipments || []);
        setShipments(raw.map(formatShipment));
      } catch (e) {
        if (!cancelled) setShipments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadShipments();

    return () => {
      cancelled = true;
    };
  }, [runnerId]);

  const shipment = shipments[0];

  if (loading) {
    return (
      <AppCard
        noPadding
        className="tw:border tw:border-gray-200 tw:h-full"
        bodyClassName="tw:h-full tw:flex tw:flex-col"
      >
        <div className="tw:flex tw:flex-col tw:gap-3 tw:p-4">
          <div className="skeleton-loader tw:h-16 tw:w-full tw:rounded-xl" />
          <div className="skeleton-loader tw:h-24 tw:w-full tw:rounded-xl" />
          <div className="skeleton-loader tw:h-24 tw:w-full tw:rounded-xl" />
        </div>
      </AppCard>
    );
  }

  if (!shipment) {
    return (
      <AppCard
        noPadding
        className="tw:border tw:border-gray-200 tw:h-full"
        bodyClassName="tw:h-full tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:p-6 tw:text-center"
      >
        <div className="tw:text-sm tw:font-semibold tw:text-slate-600">
          {runnerId ? "No live shipments" : "Select a runner"}
        </div>
        <p className="tw:max-w-xs tw:text-xs tw:text-slate-400">
          {runnerId
            ? "This runner is not carrying any shipment right now."
            : "Pick a runner from the live shipments pane to see their route and journey."}
        </p>
      </AppCard>
    );
  }

  const metaBits = [
    shipment._locality,
    shipment.deliveryDistance != null
      ? `${shipment.deliveryDistance.toFixed(1)} km`
      : "",
    shipment._itemCount ? `${shipment._itemCount} items` : "",
    shipment._weightLbl,
  ].filter(Boolean);

  return (
    <AppCard
      noPadding
      className="tw:border tw:border-gray-200 tw:h-full"
      bodyClassName="tw:h-full tw:flex tw:flex-col"
    >
      {/* Header */}
      <div className="tw:bg-blue-50 tw:p-4 tw:shrink-0">
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
          <AppBadge variant="primary" size="sm">
            ON ROUTE
          </AppBadge>
          <span className="tw:text-sm tw:text-gray-500">
            {shipment.orderRefNo || "#CLB-0000"}
          </span>
        </div>

        <div className="tw:text-xl tw:font-bold tw:text-gray-900">
          {shipment._customerName}
        </div>

        <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-500 tw:text-sm tw:mt-1">
          {metaBits.map((bit, index) => (
            <span key={`${bit}-${index}`}>
              {index > 0 && <span className="tw:mx-1 tw:text-gray-300">·</span>}
              {bit}
            </span>
          ))}
        </div>
      </div>

      {/* Runner info */}
      <div className="tw:p-4 tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 tw:shrink-0">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:w-11 tw:h-11 tw:rounded-full tw:bg-red-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:font-semibold tw:text-sm">
            {CommonService.prepareInitials(shipment.deliveryAgent?.name)}
          </div>
          <div>
            <div className="tw:text-base tw:font-semibold tw:text-gray-900">
              {shipment.deliveryAgent?.name || "Runner"}
            </div>
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:text-gray-500">
              <span>{shipment.vehicleNumber || "—"}</span>
              <span>·</span>
              <span>{shipment.vehicleType || "vehicle"}</span>
            </div>
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          <AppButton
            type="button"
            size="icon"
            fill="outline"
            color="secondary"
            className="tw:w-9 tw:h-9 tw:rounded-lg tw:text-emerald-600"
          >
            <Phone className="tw:w-4 tw:h-4" />
          </AppButton>
        </div>
      </div>

      {/* Shipments */}
      <div className="tw:p-4 tw:border-b tw:border-gray-100 tw:flex-1 tw:flex tw:flex-col">
        <div className="tw:text-xs tw:font-bold tw:tracking-wider tw:text-gray-500 tw:uppercase tw:mb-4">
          Shipments · {shipments.length}
        </div>

        <div className="tw:flex tw:flex-col tw:gap-3">
          {shipments.map((item, index) => (
            <div
              key={item._id || index}
              className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50 tw:p-3"
            >
              <div className="tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {item._customerName}
                </div>
                <div className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                  {item.orderRefNo || "—"} · {item._locality || "—"}
                </div>
                <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                  {item._itemCount} items · {item._weightLbl || "—"} ·{" "}
                  {item._etaLbl}
                </div>
              </div>
              <AppBadge variant="success" size="sm" className="tw:shrink-0">
                {item._paymentLbl} {item._amountLbl}
              </AppBadge>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="tw:bg-gray-50 tw:p-4 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:shrink-0 tw:mt-auto">
        <div>
          <div className="tw:text-xs tw:font-bold tw:tracking-wider tw:text-gray-500 tw:uppercase">
            Collect on delivery
          </div>
          <div className="tw:text-xl tw:font-bold tw:text-emerald-600">
            {shipment._amountLbl}
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          <AppButton fill="outline" color="secondary" size="small">
            Share tracker
          </AppButton>
          <AppButton
            fill="solid"
            color="success"
            size="small"
            className="tw:inline-flex tw:items-center tw:gap-1.5"
          >
            <MapPin className="tw:w-4 tw:h-4" />
            Center on runner
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

/** Derive the display fields a shipment renders. */
function formatShipment(order: Record<string, any>): RunnerShipment {
  const isCod = order.paymentType === "COD";

  const items = Array.isArray(order.items)
    ? order.items.filter(
        (i: any) => i?.status !== "Cancelled" && i?.status !== "Returned",
      )
    : [];

  const itemCount = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0,
  );

  const weight = items.reduce(
    (sum, i) => sum + (Number(i.weight) || Number(i.netWeight) || 0),
    0,
  );

  return {
    ...order,
    _id: order._id || order.shipmentId,
    _customerName: order.customerInfo?.name || "Customer",
    _locality: order.customerInfo?.address?.town || "",
    _amountLbl: `₹${CommonService.formattedAmount(order.payableAmount)}`,
    _paymentLbl: isCod ? "COD" : "Prepaid",
    _itemCount: itemCount || items.length,
    _weightLbl: weight
      ? `${CommonService.roundedByDecimalPlace(weight, 2)} kg`
      : "",
    _etaLbl: order._etaLbl || "ETA 5 min",
  } as RunnerShipment;
}

export default RunnerDetail;
