import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  Hash,
  Package,
  Phone,
  Tag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

interface ItemProps {
  item: any;
  callback?: (args: { action: string; data: any }) => void;
}

const RAIL_BY_VARIANT: Record<string, string> = {
  success: "tw:bg-emerald-500",
  warning: "tw:bg-amber-500",
  danger: "tw:bg-rose-500",
  primary: "tw:bg-blue-500",
  info: "tw:bg-sky-500",
  secondary: "tw:bg-slate-400",
  default: "tw:bg-slate-300",
};

interface InlineMetaProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}

const InlineMeta = ({ icon, title, value }: InlineMetaProps) => (
  <div title={title} className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
    <span className="tw:text-slate-400 tw:shrink-0" aria-hidden="true">
      {icon}
    </span>
    <span className="tw:text-[12.5px] tw:text-slate-800 tw:font-medium tw:truncate">
      {value}
    </span>
  </div>
);

const Item = ({ item, callback }: ItemProps) => {
  const { t } = useTranslation(["common"]);

  const isGuest = !!item.customerInfo?.isGuestCustomer;
  const customerName = isGuest
    ? t("walkin-customer")
    : item.customerInfo?.name || "—";
  const customerMobile = !isGuest ? item.customerInfo?.mobile : null;

  const railColor =
    RAIL_BY_VARIANT[item._statusColor as string] || RAIL_BY_VARIANT.default;

  const orderTypeLbl = [item.orderType, item.orderSubType]
    .filter(Boolean)
    .join(" · ");

  return (
    <AppCard noPadding={true}>
      <button
        type="button"
        onClick={() => callback?.({ action: "view-order", data: item })}
        className="tw:group tw:cursor-pointer tw:relative tw:w-full tw:text-left tw:overflow-hidden tw:rounded-md tw:transition-colors tw:duration-150 tw:hover:bg-slate-50/80 tw:focus-visible:bg-slate-50 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-blue-500/30"
      >
        <span
          aria-hidden="true"
          className={`tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-[3px] tw:transition-all tw:duration-150 tw:group-hover:w-[5px] ${railColor}`}
        />

        <div className="tw:pl-4 tw:pr-3 tw:py-3">
          {/* Header: customer + amount */}
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
            <div className="tw:min-w-0 tw:flex-1">
              <div
                className={`tw:text-[15px] tw:leading-tight tw:truncate ${
                  isGuest
                    ? "tw:text-slate-500 tw:italic tw:font-normal"
                    : "tw:text-slate-900 tw:font-semibold"
                }`}
              >
                {customerName}
              </div>
              <div className="tw:mt-1 tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-1 tw:md:gap-2 tw:text-slate-500 tw:min-w-0">
                {customerMobile && (
                  <span className="tw:flex tw:items-center tw:gap-1 tw:shrink-0">
                    <Phone
                      size={11}
                      className="tw:text-slate-400"
                      aria-hidden="true"
                    />
                    <span className="tw:text-[11.5px] tw:tabular-nums tw:text-slate-600">
                      {customerMobile}
                    </span>
                  </span>
                )}
                {customerMobile && (
                  <span
                    aria-hidden="true"
                    className="tw:hidden tw:md:block tw:h-3 tw:w-px tw:bg-slate-200 tw:shrink-0"
                  />
                )}
                <span className="tw:flex tw:items-center tw:gap-1 tw:min-w-0">
                  <Hash
                    size={12}
                    className="tw:shrink-0 tw:text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="tw:font-mono tw:text-[11.5px] tw:tracking-tight tw:break-all">
                    {item.orderRefNo}
                  </span>
                </span>
              </div>
            </div>

            <div className="tw:flex tw:flex-col tw:items-end tw:gap-1.5 tw:shrink-0">
              <Amount
                value={item.orderAmount}
                decimalPlaces={2}
                className="tw:text-[17px] tw:font-bold tw:text-slate-900 tw:leading-none tw:tabular-nums"
              />
              {item._statusLbl && (
                <AppBadge variant={item._statusColor || "default"}>
                  {item._statusLbl}
                </AppBadge>
              )}
            </div>
          </div>

          {/* Meta: date on its own row, secondary facts inline with dividers */}
          <div className="tw:mt-2.5 tw:pt-2.5 tw:border-t tw:border-slate-100 tw:space-y-1.5">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-600">
              <CalendarDays
                size={13}
                className="tw:shrink-0 tw:text-slate-400"
                aria-hidden="true"
              />
              <span className="tw:text-[12.5px] tw:font-medium tw:text-slate-800">
                <DateFormat value={item.orderedDate} />
              </span>
            </div>

            <div className="tw:flex tw:items-center tw:gap-x-3 tw:gap-y-1 tw:flex-wrap tw:divide-x tw:divide-slate-200">
              {item.itemsCount != null && (
                <div className="tw:pr-3">
                  <InlineMeta
                    icon={<Package size={13} />}
                    title={t("totalItems")}
                    value={`${item.itemsCount} ${t("totalItems")}`}
                  />
                </div>
              )}
              {item.paymentMethod && (
                <div className="tw:pr-3">
                  <InlineMeta
                    icon={<CreditCard size={13} />}
                    title={t("payment")}
                    value={item.paymentMethod}
                  />
                </div>
              )}
              {orderTypeLbl && (
                <div className="tw:pr-3">
                  <InlineMeta
                    icon={<Tag size={13} />}
                    title={t("type")}
                    value={orderTypeLbl}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:opacity-0 tw:translate-x-1 tw:transition-all tw:duration-150 tw:group-hover:opacity-100 tw:group-hover:translate-x-0 tw:text-slate-400"
        >
          <ChevronRight size={16} />
        </span>
      </button>
    </AppCard>
  );
};

export default Item;
