import clsx from "clsx";
import { InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppPopover from "~/components/core/popover/AppPopover";
import PaymentMethodList from "../payment-method-list/PayamentMethodList";

const statusTone: Record<
  string,
  {
    dot: string;
    text: string;
    softBg: string;
    softText: string;
    softRing: string;
  }
> = {
  primary: {
    dot: "tw:bg-blue-500",
    text: "tw:text-blue-700",
    softBg: "tw:bg-blue-50",
    softText: "tw:text-blue-700",
    softRing: "tw:ring-blue-100",
  },
  info: {
    dot: "tw:bg-blue-500",
    text: "tw:text-blue-700",
    softBg: "tw:bg-blue-50",
    softText: "tw:text-blue-700",
    softRing: "tw:ring-blue-100",
  },
  success: {
    dot: "tw:bg-green-500",
    text: "tw:text-green-700",
    softBg: "tw:bg-green-50",
    softText: "tw:text-green-700",
    softRing: "tw:ring-green-100",
  },
  warning: {
    dot: "tw:bg-orange-500",
    text: "tw:text-orange-700",
    softBg: "tw:bg-orange-50",
    softText: "tw:text-orange-700",
    softRing: "tw:ring-orange-100",
  },
  danger: {
    dot: "tw:bg-red-500",
    text: "tw:text-red-700",
    softBg: "tw:bg-red-50",
    softText: "tw:text-red-700",
    softRing: "tw:ring-red-100",
  },
  secondary: {
    dot: "tw:bg-gray-400",
    text: "tw:text-gray-700",
    softBg: "tw:bg-gray-100",
    softText: "tw:text-gray-700",
    softRing: "tw:ring-gray-200",
  },
};

const tone = (k?: string) =>
  statusTone[k || "secondary"] || statusTone.secondary;

/**
 * One fact about the order, as a contact-info row: label on the left, value
 * on the right, hairline between (see `.ov-row` in order-view.css). Wraps to
 * two lines on narrow screens rather than squeezing the value.
 */
const MetaRow = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="ov-row tw:flex-wrap">
    <dt className="ov-row-label tw:whitespace-nowrap">{label}</dt>
    <dd className="ov-row-value tw:font-normal tw:min-w-0">{children}</dd>
  </div>
);

const StatusSummary = ({
  order,
  callback,
}: {
  order: any;
  callback?: (a: { action: string; data?: any }) => void;
}) => {
  const { t } = useTranslation(["common"]);

  const hasPaymentMode =
    Array.isArray(order.paymentMode) && order.paymentMode.length > 0;

  const orderTone = tone(order._statusColor);
  const payTone = tone(order._paymentStatusColor);

  const totalItems = order.items?.length ?? 0;
  const summary: { color: string; count: number; status: string }[] =
    order?.statusSummary ?? [];

  return (
    <AppCard title={t("statusProgress")}>
      {/* One fact per row, hairline-separated — the page's facts read down a
          single column instead of across a grid of boxed cells. */}
      <dl>
        <MetaRow label={t("orderStatus")}>
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:justify-end">
            <span
              className={clsx(
                "tw:inline-flex tw:w-2 tw:h-2 tw:rounded-full tw:shrink-0",
                orderTone.dot,
              )}
              aria-hidden
            />
            <span
              className={clsx(
                "tw:text-[13px] tw:font-semibold tw:leading-tight",
                orderTone.text,
              )}
            >
              {order._statusLbl}
            </span>
          </div>
        </MetaRow>

        <MetaRow label={t("payment")}>
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:justify-end">
            <span
              className={clsx(
                "tw:inline-flex tw:items-center tw:gap-1 tw:px-1.5 tw:py-0.5 tw:rounded tw:text-[11.5px] tw:font-medium tw:ring-1 tw:ring-inset",
                payTone.softBg,
                payTone.softText,
                payTone.softRing,
              )}
            >
              <span
                className={clsx(
                  "tw:w-1.5 tw:h-1.5 tw:rounded-full",
                  payTone.dot,
                )}
              />
              {order._paymentStatusLbl}
            </span>
            {order.paymentType && (
              <span className="tw:text-gray-600 tw:uppercase tw:text-[10.5px] tw:tracking-wide tw:font-medium">
                {order.paymentType}
              </span>
            )}
            {hasPaymentMode && (
              <AppPopover
                triggerContent={
                  <button
                    type="button"
                    className="tw:inline-flex tw:items-center tw:text-gray-400 tw:hover:text-gray-700"
                    aria-label="Payment details"
                  >
                    <InfoIcon className="tw:w-3.5 tw:h-3.5" />
                  </button>
                }
              >
                <div className="tw:font-semibold tw:text-gray-900 tw:mb-2 tw:text-xs">
                  {t("paymentMode") || "Payment Mode"}
                </div>
                <div className="tw:text-xs tw:space-y-2">
                  {order.paymentMode.map((mode: any, index: number) => (
                    <PaymentMethodList
                      key={index}
                      payment={mode}
                      callback={callback}
                    />
                  ))}
                </div>
              </AppPopover>
            )}
          </div>
        </MetaRow>

        {order.deliveryTimeSlot?.date && (
          <MetaRow label={t("deliverySlot")}>
            <div className="tw:flex tw:items-center tw:gap-x-1.5 tw:gap-y-0.5 tw:flex-wrap tw:justify-end tw:text-[12.5px] tw:text-gray-900">
              <span className="tw:font-medium tw:tabular-nums">
                <DateFormat
                  value={order.deliveryTimeSlot?._from}
                  formatStr="hh:mm a"
                />
                {" – "}
                <DateFormat
                  value={order.deliveryTimeSlot?._to}
                  formatStr="hh:mm a"
                />
              </span>
              <span className="tw:text-gray-300" aria-hidden>
                ·
              </span>
              <span className="tw:text-gray-500">
                <DateFormat
                  value={order.deliveryTimeSlot?.date}
                  formatStr="EEE, dd MMM"
                />
              </span>
              {order.deliveryTimeSlot.isDelayed && (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:text-red-700 tw:uppercase tw:tracking-wide tw:bg-red-50 tw:px-1.5 tw:py-0.5 tw:rounded">
                  <span className="tw:w-1 tw:h-1 tw:rounded-full tw:bg-red-500" />
                  {t("delayed")}
                </span>
              )}
            </div>
          </MetaRow>
        )}

        <MetaRow label={t("items") || "Items"}>
          <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap tw:justify-end">
            <span className="tw:text-[12.5px] tw:tabular-nums tw:text-gray-900 tw:whitespace-nowrap">
              <span className="tw:font-semibold">{totalItems}</span>
              <span className="tw:text-gray-400 tw:ml-1">
                {t("totalItems") || "total"}
              </span>
            </span>
            {summary.length > 0 && (
              <>
                <span className="tw:text-gray-300" aria-hidden>
                  ·
                </span>
                {summary.map((e, i) => (
                  <span
                    key={i}
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12px] tw:text-gray-600"
                  >
                    <span
                      className={clsx(
                        "tw:w-1.5 tw:h-1.5 tw:rounded-full",
                        tone(e.color).dot,
                      )}
                    />
                    <span className="tw:tabular-nums tw:font-medium tw:text-gray-900">
                      {e.count}
                    </span>
                    <span>{e.status}</span>
                  </span>
                ))}
              </>
            )}
          </div>
        </MetaRow>
      </dl>
    </AppCard>
  );
};

export default StatusSummary;
