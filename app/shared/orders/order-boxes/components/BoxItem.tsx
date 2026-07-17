import { BoxIcon, EyeIcon, XIcon } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import InvoiceDownload from "~/shared/orders/invoice-download/InvoiceDownload";
import { useTranslation } from "react-i18next";

const BoxItem = ({
  box,
  callback,
  isSelected = false,
  onSelect,
  showCheckbox = true,
  showReceive = true,
  checkboxDisabled = false,
  showRemove = false,
  showView = true,
}: {
  box: any;
  callback: (a: { action: string; data: any }) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean, box?: any) => void;
  showCheckbox?: boolean;
  showReceive?: boolean;
  checkboxDisabled?: boolean;
  showRemove?: boolean;
  showView?: boolean;
}) => {
  const { t } = useTranslation("common");

  return (
    <AppCard
      key={box.refNo}
      className={`tw:relative tw:mb-0 ${isSelected ? "tw:border-2 tw:border-sky-600 tw:bg-sky-50" : ""}`}
      noPadding
      noOverflow
    >
      {showRemove && (
        <button
          onClick={() => callback({ action: "remove", data: box })}
          aria-label={`Cancel box ${box.boxNo}`}
          className="tw:absolute tw:-top-2 tw:-right-2 tw:w-6 tw:h-6 tw:rounded-full tw:bg-red-500 tw:text-white tw:flex tw:items-center tw:justify-center tw:hover:bg-red-600 tw:transition-colors"
        >
          <XIcon size={12} />
        </button>
      )}
      {/* Row 1: checkbox and box no | status */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:p-3">
        <div className="tw:flex tw:items-center tw:gap-3">
          {showCheckbox && !box.isReceived ? (
            <input
              type="checkbox"
              aria-label={`Select box ${box.boxNo}`}
              checked={isSelected}
              disabled={checkboxDisabled}
              onChange={(e) =>
                onSelect && onSelect(box.refNo, e.target.checked, box)
              }
              className={`tw:w-4 tw:h-4 tw:rounded ${
                isSelected ? "tw:accent-sky-600" : "tw:accent-gray-400"
              }`}
            />
          ) : null}

          <div>
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
              {box.refNo}
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {t("box")} #{box.boxNo}
            </div>
          </div>
        </div>

        <div className="tw:text-right">
          <div className="tw:text-xs tw:text-gray-500">{t("status")}</div>
          <div className="tw:text-sm tw:font-medium">
            <AppBadge variant={box.isReceived ? "success" : "danger"}>
              {box.isReceived ? t("received") : t("notReceived")}
            </AppBadge>
          </div>
        </div>
      </div>

      <Divider className="tw:my-0!" />

      {/* Row 2: summary grid - items | units | amount (show received totals when received) */}
      <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:p-3">
        <div className="tw:text-xs">
          {box.isReceived ? (box.totalReceivedItems ?? 0) : box.totalItems || 0}{" "}
          {t("items")}
        </div>
        <div className="tw:text-xs tw:text-center">
          {box.isReceived
            ? (box.totalReceivedQty ?? 0)
            : box.totalQuantity || 0}{" "}
          {t("units")}
        </div>
        <div className="tw:text-xs tw:text-right">
          <div className="tw:font-medium">
            <Amount
              value={
                box.isReceived
                  ? (box.totalReceivedValue ?? 0)
                  : box.totalValue || 0
              }
            />
          </div>
        </div>
      </div>

      <Divider className="tw:!my-0" />

      {/* Row 3: vendor info */}
      <div className="tw:p-3 tw:text-sm">
        <KeyValue label="Vendor" size="sm" valueClassName="tw:text-xs">
          {box?.from?.name ? (
            <>
              <AppLink asLink href={`/dashboard/vendor/view/${box.from.id}`}>
                {box.from.name}
              </AppLink>
              <span className="tw:ml-2">({box.from.refId || "-"})</span>
            </>
          ) : (
            "N/A"
          )}
        </KeyValue>
      </div>

      <Divider className="tw:!my-0" />

      {/* Row 4: invoice | order (2-column grid) */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:text-xs tw:p-3">
        <div>
          <KeyValue label={t("invoice")} size="sm" valueClassName="tw:text-xs">
            <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
              <span>{box?.invoiceData?.refId || "--"}</span>
              <InvoiceDownload
                invoiceNo={box?.invoiceData?.refId}
                invoiceDocumentId={box?.invoiceData?.documentAssetId}
              />
            </div>
          </KeyValue>
        </div>
        <div>
          <KeyValue label={t("order")} size="sm" valueClassName="tw:text-xs">
            {box?.orderData?.refId ? (
              <AppLink asLink href={box.orderLink}>
                {box.orderData.refId}
              </AppLink>
            ) : (
              "--"
            )}
          </KeyValue>
        </div>
      </div>

      <Divider className="tw:!my-0" />

      {/* Row 5: shipped/received on | actions (justify-between) */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:p-3">
        <KeyValue
          label={box.isReceived ? t("receivedOn") : t("shippedOn")}
          size="sm"
          valueClassName="tw:text-xs"
        >
          {box.isReceived ? (
            <>
              {box.receivedOn ? <DateFormat value={box.receivedOn} /> : "--"}
              {box.receivedBy?.name ? (
                <span className="tw:ml-2 tw:text-gray-500">
                  by {box.receivedBy.name}
                </span>
              ) : null}
            </>
          ) : (
            <>{box.createdAt ? <DateFormat value={box.createdAt} /> : "--"}</>
          )}
        </KeyValue>

        <div className="tw:flex tw:items-center tw:gap-2">
          {showView && (
            <AppButton
              color="dark"
              size="small"
              fill="outline"
              onClick={() => callback({ action: "view-items", data: box })}
              aria-label={`View items for box ${box.boxNo}`}
            >
              <EyeIcon />
            </AppButton>
          )}

          {showReceive ? (
            box.isReceived ? (
              <AppBadge variant="success">{t("received")}</AppBadge>
            ) : (
              <AppButton
                color="success"
                size="small"
                fill="outline"
                onClick={() => callback({ action: "receive", data: box })}
              >
                <BoxIcon />
                {t("receive")}
              </AppButton>
            )
          ) : null}
        </div>
      </div>
    </AppCard>
  );
};

export default BoxItem;
