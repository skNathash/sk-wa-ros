import clsx from "clsx";
import { Check } from "lucide-react";
import { Fragment } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";

/**
 * The linear fulfillment pipeline (mirrors OmsService.getOrderStatuses).
 * Statuses outside this sequence (e.g. Cancelled) render no stepper — the
 * status badge and timeline tab already carry those states.
 *
 * Each step names the `op-stage-*` accent it inherits, so the tracker reads in
 * the same colours as the process page's own tracker (see order-process.css) —
 * a picking order is violet on both screens, a delivered one green.
 */
const STEPS: { statuses: string[]; label: string; stage: string }[] = [
  { statuses: ["Pending"], label: "Placed", stage: "placed" },
  { statuses: ["Created", "Approved"], label: "Approved", stage: "placed" },
  { statuses: ["Picking"], label: "Picking", stage: "pick" },
  { statuses: ["Packing", "Packed"], label: "Packing", stage: "pack" },
  { statuses: ["Invoiced"], label: "Invoiced", stage: "invoice" },
  { statuses: ["Shipped"], label: "Shipped", stage: "handover" },
  { statuses: ["Delivered"], label: "Delivered", stage: "delivered" },
];

const FulfillmentStepper = ({ order }: { order: any }) => {
  // Quick B2B checkout bills the counter straight to invoice - the goods never
  // enter a picking or packing queue, so those steps would read as skipped
  // forever. Drop them from the track for those orders.
  const steps = order?.quickCheckout
    ? STEPS.filter((s) => s.stage !== "pick" && s.stage !== "pack")
    : STEPS;

  const status = order?.status || "";
  let currentIdx = steps.findIndex((s) => s.statuses.includes(status));

  // A quick-checkout order that somehow carries a picking/packing status still
  // needs a position on the shortened track: park it on "Approved".
  if (currentIdx === -1 && order?.quickCheckout) {
    const inDropped = STEPS.some(
      (s) =>
        (s.stage === "pick" || s.stage === "pack") &&
        s.statuses.includes(status),
    );
    if (inDropped) {
      currentIdx = steps.findIndex(
        (s) => s.stage === "placed" && s.statuses.includes("Approved"),
      );
    }
  }

  if (currentIdx === -1) return null;

  const isDelivered = order?.status === "Delivered";
  const totalItems = order?.items?.length ?? 0;
  const stage = steps[currentIdx].stage;

  return (
    <div className={`ov-fulfil op-stage-${stage} tw:mb-4`}>
      {/* Where the order stands, in one line: stage name, live status, what
          it's worth and how many lines it carries. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
        <div className="tw:min-w-0">
          <div className="op-eyebrow">Fulfilment</div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1 tw:flex-wrap">
            <AppBadge variant={order._statusColor}>{order._statusLbl}</AppBadge>
            {totalItems > 0 ? (
              <span className="tw:text-xs tw:text-gray-500 tw:tabular-nums">
                {totalItems} item{totalItems > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>
        {order?._payableAmt != null ? (
          <div className="tw:text-right tw:shrink-0">
            <div className="op-banner-amount tw:text-[19px]">
              <Amount value={order._payableAmt} decimalPlaces={2} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="ov-track">
        {steps.map((step, idx) => {
          const done = idx < currentIdx || (isDelivered && idx === currentIdx);
          const current = idx === currentIdx;
          return (
            <Fragment key={step.label}>
              {idx > 0 ? (
                <div
                  className={clsx(
                    `op-step-line op-stage-${step.stage}`,
                    (done || current) && "is-done",
                  )}
                  aria-hidden
                />
              ) : null}
              <div
                className={clsx(
                  `op-step op-stage-${step.stage}`,
                  done && "is-done",
                  current && "is-active",
                )}
                title={step.label}
              >
                <div className="op-step-dot">
                  {done ? <Check size={14} /> : idx + 1}
                </div>
                <div className="op-step-label">{step.label}</div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FulfillmentStepper;
