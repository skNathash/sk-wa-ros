import { ArrowRight, Copy, Receipt, Split, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import useAppToast from "~/hooks/useAppToast";
import type { VariantColor } from "~/types/CommonTypes";

type LinkedOrderNoticeProps = {
  order: any;
  linkedOrder: any;
};

const countActive = (items: any[] = []) =>
  items.filter((item: any) => item?.status !== "Cancelled").length;

const PartCard = ({
  inStock,
  refNo,
  statusColor,
  statusLabel,
  itemCount,
  highlight,
  href,
}: {
  inStock: boolean;
  refNo: string;
  statusColor: VariantColor;
  statusLabel: string;
  itemCount: number;
  highlight?: boolean;
  href?: string;
}) => {
  const { t } = useTranslation(["common"]);
  const body = (
    <div
      className={`tw:flex tw:flex-1 tw:min-w-0 tw:flex-col tw:gap-1 tw:rounded-md tw:border tw:px-2.5 tw:py-2 ${
        highlight
          ? "tw:border-gray-200 tw:bg-gray-50"
          : "tw:border-blue-200 tw:bg-blue-50/40 tw:hover:bg-blue-50"
      }`}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-600">
          <span
            className={`tw:h-1.5 tw:w-1.5 tw:rounded-full ${
              inStock ? "tw:bg-green-500" : "tw:bg-gray-400"
            }`}
          />
          {inStock ? "In stock" : "Not in stock"}
        </span>
        {href ? (
          <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[11px] tw:font-semibold tw:text-blue-700">
            Open <ArrowRight size={11} />
          </span>
        ) : null}
      </div>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
        <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:tabular-nums">
          #{refNo}
        </span>
        <AppBadge variant={statusColor}>{statusLabel}</AppBadge>
        <span className="tw:text-xs tw:text-gray-500">
          {t("itemsCount", { count: itemCount })}
        </span>
      </div>
    </div>
  );

  if (!href) return body;

  return (
    <AppLink
      asLink
      href={href}
      noUnderline
      className="tw:flex tw:flex-1 tw:min-w-0 tw:hover:no-underline"
    >
      {body}
    </AppLink>
  );
};

const LinkedOrderNotice = ({ order, linkedOrder }: LinkedOrderNoticeProps) => {
  const appToast = useAppToast();
  const [copied, setCopied] = useState(false);

  if (!order?._id || !linkedOrder?.orderId) return null;

  const currentItems = countActive(order.items);
  const linkedItems = linkedOrder.itemsCount ?? countActive(linkedOrder.items);
  const isBuyer = !order.isMyOrder;

  const heading = isBuyer
    ? "Your order is in 2 parts"
    : "This customer has 2 orders";
  const subheading =
    "Items in stock and items not in stock are kept as separate orders.";
  const paymentNote = isBuyer
    ? "Pay only once for both orders."
    : "Collect payment only once for both orders.";

  const handleCopyRef = async () => {
    if (!order.groupTransactionId) return;
    try {
      await navigator.clipboard.writeText(order.groupTransactionId);
      setCopied(true);
      appToast.show({ msg: "Payment ref copied", color: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      appToast.show({ msg: "Could not copy", color: "danger" });
    }
  };

  return (
    <div className="tw:mb-4 tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-start tw:gap-2 tw:px-3 tw:py-2">
        <span className="tw:mt-0.5 tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-700">
          <Split size={13} />
        </span>
        <div className="tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
            {heading}
          </div>
          <div className="tw:text-xs tw:leading-snug tw:text-gray-600">
            {subheading}
          </div>
        </div>
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-2 tw:sm:flex-row">
        <PartCard
          inStock={!order.isReserveOrder}
          refNo={order.orderRefNo}
          statusColor={order._statusColor}
          statusLabel={order._statusLbl}
          itemCount={currentItems}
          highlight
        />
        <PartCard
          inStock={!linkedOrder.isReserveOrder}
          refNo={linkedOrder.orderRefNo}
          statusColor={linkedOrder._statusColor}
          statusLabel={linkedOrder._statusLbl}
          itemCount={linkedItems}
          href={`/dashboard/orders/view/${linkedOrder.orderId}`}
        />
      </div>

      <div className="tw:flex tw:items-center tw:gap-1.5 tw:border-t tw:border-gray-200 tw:bg-gray-50 tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-gray-700">
        <Wallet size={12} />
        {paymentNote}
      </div>

      {order.groupTransactionId ? (
        <div className="tw:flex tw:items-start tw:gap-2 tw:border-t tw:border-dashed tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2">
          <span className="tw:mt-0.5 tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-600">
            <Receipt size={13} />
          </span>
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
              Payment Number
            </div>
            <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <span className="tw:break-all tw:font-mono tw:text-sm tw:font-semibold tw:tracking-wide tw:text-gray-900 tw:uppercase">
                {order.groupTransactionId}
              </span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:border tw:border-gray-200 tw:bg-white tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-gray-600 tw:hover:bg-gray-100"
              >
                <Copy size={11} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="tw:mt-1 tw:text-[11px] tw:leading-snug tw:text-gray-500">
              Share this number with StoreKing support for any payment issue.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LinkedOrderNotice;
