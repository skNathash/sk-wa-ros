import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface MobileViewTheme2Props {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
  activeTab?: string;
}

/**
 * Theme-2 mobile order list: one white sheet bled to the screen edges
 * (`app-bleed-x`), each order a tappable row divided by a hairline. The row
 * leads with an initials avatar; the ref gets the whole first line to itself
 * (refs run long — "SO26…" — so it truncates instead of fighting the name),
 * the customer + phone sit under it, then the status / type / payment chips.
 * The right rail stacks value, ordered date/time and item count.
 */
const MobileViewTheme2 = ({
  data,
  loading,
  callback,
  activeTab,
}: MobileViewTheme2Props) => {
  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`skeleton-${idx}`} className="tw:animate-pulse tw:px-4 tw:py-3">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full tw:bg-gray-200"></div>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:h-4 tw:w-36 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:mt-2 tw:h-3 tw:w-44 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:mt-2 tw:flex tw:gap-1.5">
                  <div className="tw:h-4 tw:w-14 tw:rounded tw:bg-gray-200"></div>
                  <div className="tw:h-4 tw:w-10 tw:rounded tw:bg-gray-200"></div>
                  <div className="tw:h-4 tw:w-12 tw:rounded tw:bg-gray-200"></div>
                </div>
              </div>
              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:ms-auto tw:h-4 tw:w-16 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:ms-auto tw:mt-2 tw:h-3 tw:w-10 tw:rounded tw:bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="app-bleed-x tw:border-y tw:border-slate-100 tw:bg-white">
        <NoData />
      </div>
    );
  }

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
      {data.map((item) => {
        const name =
          activeTab === "my-orders"
            ? item.sellerInfo?.franchiseName || "-"
            : item.customerInfo?.isGuestCustomer
              ? "Walk-in Customer"
              : item.customerInfo?.name || "-";
        const mobile =
          activeTab === "my-orders" ? "" : item.customerInfo?.mobile || "";

        return (
          <button
            key={item.orderId}
            type="button"
            className="tw:block tw:w-full tw:cursor-pointer tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:active:bg-slate-50"
            onClick={() =>
              callback && callback({ action: "view-order", data: item })
            }
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <InitialsAvatar name={name} />

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                  {item.orderRefNo}
                </p>
                <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
                  {name}
                  {mobile ? ` · ${mobile}` : ""}
                </p>
                <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1">
                  <AppBadge
                    variant={item._statusColor || "default"}
                    className="tw:px-1.5 tw:py-0 tw:text-[10px]"
                  >
                    {item._statusLbl}
                  </AppBadge>
                  <AppBadge
                    variant={item._typeColor}
                    className="tw:px-1.5 tw:py-0 tw:text-[10px]"
                  >
                    {item.orderType}
                  </AppBadge>
                  {(item._paymentStatusLbl || item.paymentMethod) && (
                    <AppBadge
                      variant={item._paymentStatusColor || "default"}
                      className="tw:px-1.5 tw:py-0 tw:text-[10px]"
                    >
                      {item._paymentStatusLbl || item.paymentMethod}
                    </AppBadge>
                  )}
                </div>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <Amount
                  value={item.orderAmount}
                  decimalPlaces={0}
                  className="tw:block tw:text-sm tw:font-bold tw:text-slate-900"
                />
                <span className="tw:mt-0.5 tw:block tw:whitespace-nowrap tw:text-[11px] tw:text-slate-400">
                  <DateFormat
                    value={item.orderedDate}
                    formatStr="dd MMM, hh:mm a"
                  />
                </span>
                {/* Item count as a bubble-green pill — the unread-badge slot
                    in a WhatsApp chat row. */}
                <span
                  className="tw:mt-1 tw:inline-block tw:rounded-full tw:px-2 tw:py-px tw:text-[10px] tw:font-semibold"
                  style={{
                    backgroundColor: "var(--wa-bubble)",
                    color: "var(--wa-bubble-text)",
                  }}
                >
                  {item.itemsCount} items
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MobileViewTheme2;
