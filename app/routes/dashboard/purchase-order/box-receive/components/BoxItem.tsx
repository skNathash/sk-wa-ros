import { BoxIcon, CheckCircleIcon, EyeIcon, Trash2 } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";

const BoxItem = ({
  box,
  callback,
  isSelected = false,
  onSelect,
  showCheckbox = true,
  showReceive = true,
  checkboxDisabled = false,
}: {
  box: any;
  callback: (a: { action: string; data: any }) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean, box?: any) => void;
  showCheckbox?: boolean;
  showReceive?: boolean;
  checkboxDisabled?: boolean;
}) => {
  return (
    <AppCard
      key={box._id}
      className={isSelected ? "tw:border-2 tw:border-sky-600" : ""}
    >
      {/* Row 1: checkbox and box no */}
      <div className="tw:flex-row tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <div className="tw:flex tw:items-center tw:gap-2">
          {showCheckbox ? (
            <input
              type="checkbox"
              aria-label={`Select box ${box.boxNo}`}
              checked={isSelected}
              disabled={checkboxDisabled}
              onChange={(e) =>
                onSelect && onSelect(box._id, e.target.checked, box)
              }
              className={`tw:w-4 tw:h-4 tw:border-gray-300 tw:rounded ${
                isSelected ? "tw:accent-sky-600" : "tw:accent-gray-400"
              }`}
            />
          ) : null}

          <span className="tw:font-semibold tw:text-base tw:text-gray-900">
            {box.boxNo}
          </span>
        </div>
      </div>

      {/* Row 2: items, units, value in a single flex row */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2">
        <div className="tw:text-xs tw:text-gray-600">
          {box.totalItems || 0} items
        </div>
        <div className="tw:text-xs tw:text-gray-600">
          {box.totalUnits || 0} units
        </div>
        <div className="tw:text-xs tw:text-gray-700">
          <span className="tw:text-xs tw:text-gray-500">Value: </span>
          <Amount value={box?.totalValue} />
        </div>
      </div>

      {/* Row 3: vendor info */}
      <div className="tw:mb-2 tw:text-xs tw:text-gray-600">
        {box?.from?.name ? (
          <>
            Vendor:{" "}
            <AppLink asLink href={box.vendorLink}>
              {box.from.name}
            </AppLink>
            <span className="tw:text-xs tw:text-gray-500 tw:ml-2">
              ({box.from.refId || "-"})
            </span>
          </>
        ) : (
          <>Vendor: N/A</>
        )}
      </div>

      {/* Row 4: two-column grid for invoice no and order id */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:text-xs tw:text-gray-500 tw:mb-2">
        <div>
          <div className="tw:font-medium tw:text-gray-700">Invoice</div>
          <div>{box?.invoiceData?.refId || "--"}</div>
        </div>
        <div>
          <div className="tw:font-medium tw:text-gray-700">Order</div>
          <div>
            {box?.orderData?.refId ? (
              <AppLink asLink href={box.orderLink}>
                {box.orderData.refId}
              </AppLink>
            ) : (
              "--"
            )}
          </div>
        </div>
      </div>

      {/* Row 5: shipped on date - always show createdAt */}
      <div className="tw:text-xs tw:text-gray-500 tw:mb-3">
        Shipped on:{" "}
        {box.createdAt ? <DateFormat value={box.createdAt} /> : "--"}
      </div>

      {/* Actions row */}
      <div className="tw:flex tw:justify-between tw:items-center">
        <div className="tw:flex tw:items-center">
          <AppButton
            color="dark"
            size="small"
            fill="outline"
            onClick={() => callback({ action: "view-items", data: box })}
            aria-label={`View items for box ${box.boxNo}`}
          >
            <EyeIcon />
            View Items
          </AppButton>
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          {showReceive ? (
            box.isReceived ? (
              <AppBadge variant="success">
                <CheckCircleIcon /> RECEIVED
              </AppBadge>
            ) : (
              <AppButton
                color="success"
                size="small"
                fill="outline"
                onClick={() => callback({ action: "receive", data: box })}
              >
                <BoxIcon />
                Receive
              </AppButton>
            )
          ) : null}

          <AppButton
            color="danger"
            size="small"
            fill="outline"
            onClick={() => callback({ action: "remove", data: box })}
            aria-label={`Remove box ${box.boxNo}`}
          >
            <Trash2 />
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default BoxItem;
