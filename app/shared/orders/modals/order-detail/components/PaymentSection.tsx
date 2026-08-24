import clsx from "clsx";
import { CreditCard, IndianRupee } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import type { OrderDetailView } from "../helper";
import Section from "./Section";

/** Due / paid split, the paid-so-far meter and the payment breakup. */
const PaymentSection = ({ order }: { order: OrderDetailView }) => (
  <Section
    title="Payment"
    icon={<IndianRupee size={13} />}
    right={
      order.paymentStatusLbl ? (
        <AppBadge variant={order.paymentStatusColor} size="sm">
          {order.paymentStatusLbl}
        </AppBadge>
      ) : null
    }
  >
    <div className={clsx(order.isSettled ? "od-pay-settled" : "od-pay-due")}>
      <div className="od-pay-hero">
        <span className="od-pay-glyph">
          <CreditCard size={17} />
        </span>
        <div className="tw:min-w-0">
          <div className="od-pay-amount">
            {order.isSettled ? (
              "Settled"
            ) : (
              <Amount value={order.dueAmount} decimalPlaces={0} />
            )}
          </div>
          <div className="od-pay-sub">
            {order.isSettled ? "Nothing left to collect" : "Still due"}
            {order.paymentTitle ? ` · ${order.paymentTitle}` : ""}
          </div>
        </div>
      </div>

      <div className="od-meter-head">
        <span>Paid so far</span>
        <strong>
          <Amount value={order.paidAmount} decimalPlaces={0} /> of{" "}
          <Amount value={order.total} decimalPlaces={0} />
        </strong>
      </div>
      <div className="od-meter">
        <div
          className="od-meter-fill"
          style={
            {
              "--od-meter-pct": order.paidPercentage / 100,
            } as React.CSSProperties
          }
        />
      </div>

      {order.payments.length > 0 ? (
        <div className="od-pay-list">
          {order.payments.map((payment) => (
            <div key={payment.key} className="od-pay-row">
              <div className="tw:min-w-0">
                <p className="od-pay-type tw:truncate">{payment.type}</p>
                {payment.via || payment.refNo ? (
                  <p className="od-pay-ref tw:truncate">
                    {payment.via}
                    {payment.via && payment.refNo ? " · " : ""}
                    {payment.refNo}
                  </p>
                ) : null}
              </div>
              <span className="od-pay-value tw:shrink-0">
                <Amount value={payment.amount} decimalPlaces={2} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="tw:h-3" />
      )}
    </div>
  </Section>
);

export default PaymentSection;
