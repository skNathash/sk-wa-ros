import clsx from "clsx";
import { Check, Download } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import type { OrderDetailView } from "../helper";
import Stat from "./Stat";

/** Identity, progress steps and the three-up summary strip. */
const OrderSummaryCard = ({
  order,
  onDownloadInvoice,
}: {
  order: OrderDetailView;
  onDownloadInvoice: () => void;
}) => (
  <div className="od-card">
    <div className="od-hero">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
            <span className="od-hero-ref">{order.refNo}</span>
            {order.orderType ? (
              <span className="od-type-pill">{order.orderType}</span>
            ) : null}
          </div>
          <p className="od-hero-note tw:mt-1.5">
            <DateFormat value={order.placedOn} formatStr="dd MMM yyyy" />
            {" · "}
            <DateFormat value={order.placedOn} formatStr="hh:mm a" />
            {order.partyName ? (
              <>
                {` · ${order.partyLabel} `}
                <strong>{order.partyName}</strong>
              </>
            ) : null}
          </p>
        </div>

        <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1.5">
          <span className="od-stage-pill">{order.statusLbl}</span>
          {order.invoiceDocumentId ? (
            <button
              type="button"
              className="od-invoice-btn"
              onClick={onDownloadInvoice}
            >
              <Download size={12} />
              Invoice
            </button>
          ) : null}
        </div>
      </div>

      <p className="od-hero-note tw:mt-2">{order.stageNote}</p>
    </div>

    {order.showSteps ? (
      <div className="od-steps">
        {order.steps.map((step) => (
          <div key={step.key} className="od-step">
            <div className="od-step-rail">
              <span
                className={clsx(
                  "od-step-line",
                  step.index === 0
                    ? "od-step-line-off"
                    : step.state !== "todo" && "od-step-line-on",
                )}
              />
              <span
                className={clsx(
                  "od-step-dot",
                  step.state === "done" && "od-step-done",
                  step.state === "current" && "od-step-current",
                )}
              >
                {step.state === "done" ? <Check size={13} /> : step.index + 1}
              </span>
              <span
                className={clsx(
                  "od-step-line",
                  step.index === order.steps.length - 1
                    ? "od-step-line-off"
                    : step.state === "done" && "od-step-line-on",
                )}
              />
            </div>
            <span
              className={clsx(
                "od-step-label",
                step.state !== "todo" && "od-step-label-on",
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    ) : null}

    <div className="od-stats">
      <Stat
        label="Ordered"
        hint={order.unitCount > 0 ? `${order.unitCount} units` : undefined}
      >
        {order.itemCount} items
      </Stat>
      <Stat
        label="Total"
        hint={
          order.shippingCharges > 0 ? (
            <>
              incl. freight{" "}
              <Amount value={order.shippingCharges} decimalPlaces={0} />
            </>
          ) : undefined
        }
      >
        <Amount value={order.total} decimalPlaces={0} />
      </Stat>
      <Stat
        label="Payment"
        hint={
          order.isPaylater
            ? `${order.paymentStatusLbl} · Paylater`
            : order.paymentStatusLbl
        }
      >
        {order.isSettled ? (
          <span className="tw:text-green-700">Paid</span>
        ) : (
          <span className="tw:text-amber-700">
            <Amount value={order.dueAmount} decimalPlaces={0} /> due
          </span>
        )}
      </Stat>
    </div>
  </div>
);

export default OrderSummaryCard;
