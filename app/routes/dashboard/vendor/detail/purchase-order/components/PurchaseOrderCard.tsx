import { ChevronDown, Eye } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";

type Props = {
  item: Record<string, any>;
};

/**
 * Vendor purchase-order row (mobile / card view).
 *
 * Same three-line shape as the shared PO summary row on the PO summary screen —
 * one left-aligned identity column and one right-aligned figure per line, so
 * the eye can run straight down either edge:
 *
 *   PO ID                                              ₹ amount
 *                      n items · n units · ordered date, time
 *   ● status                                          Details ⌄
 *
 * The vendor name is dropped from line 2 (this list is already scoped to one
 * vendor); everything else the old card carried — full ordered timestamp, item
 * and unit counts, value and the View action — moves into the collapsible
 * "Details" section, so no data point is lost.
 */

type Tone = "blue" | "amber" | "green" | "red" | "gray";

const statusTextCls: Record<Tone, string> = {
  blue: "tw:text-blue-600",
  amber: "tw:text-amber-600",
  green: "tw:text-emerald-600",
  red: "tw:text-red-600",
  gray: "tw:text-gray-500",
};

const statusDotCls: Record<Tone, string> = {
  blue: "tw:bg-blue-500",
  amber: "tw:bg-amber-500",
  green: "tw:bg-emerald-500",
  red: "tw:bg-red-500",
  gray: "tw:bg-gray-400",
};

/** Resolve a PO's raw status into the tone its label is painted with. */
const toneOf = (status: string): Tone => {
  if (status === "Completed") return "green";
  if (status === "Partially Received") return "amber";
  if (status === "Rejected" || status === "Cancelled") return "red";
  if (status === "Approved") return "blue";
  return "gray";
};

const PurchaseOrderCard: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation(["common"]);
  const [expanded, setExpanded] = useState(false);

  const orderLink = `/dashboard/purchase-order/view/${item._id}`;
  const itemCount = item.items?.length ?? 0;
  const tone = toneOf(item.status);

  return (
    <div className="tw:px-4 tw:py-2.5 tw:transition-colors tw:hover:bg-muted/40 tw:md:rounded-2xl tw:md:bg-card tw:md:px-4 tw:md:py-3 tw:md:shadow-sm">
      {/* PO id … amount */}
      <div className="tw:flex tw:items-baseline tw:gap-2">
        <AppLink
          asLink
          href={orderLink}
          showLinkColor={true}
          className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[14px] tw:font-semibold tw:leading-snug tw:no-underline"
        >
          {item.orderId}
        </AppLink>
        <Amount
          value={item._totalValue ?? 0}
          decimalPlaces={2}
          className="tw:shrink-0 tw:text-[14px] tw:font-bold tw:leading-snug tw:text-foreground tw:tabular-nums"
        />
      </div>

      {/* counts … ordered date + time */}
      <div className="tw:flex tw:items-baseline tw:gap-1.5">
        <span className="tw:min-w-0 tw:flex-1" />
        <span className="tw:shrink-0 tw:text-[11px] tw:leading-snug tw:text-muted-foreground tw:tabular-nums">
          {itemCount} {t("items")}
          <span className="tw:mx-1 tw:text-border">·</span>
          {item._totalQuantity ?? 0} {t("units")}
        </span>
        {item.createdAt && (
          <span className="tw:shrink-0 tw:text-[11px] tw:leading-snug tw:text-muted-foreground tw:tabular-nums">
            <span className="tw:mx-1 tw:text-border">·</span>
            <DateFormat value={item.createdAt} formatStr="dd MMM yy, hh:mm a" />
          </span>
        )}
      </div>

      {/* status … actions */}
      <div className="tw:mt-1.5 tw:flex tw:min-h-7 tw:items-center tw:gap-2">
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1.5">
          {item._statusLabel && (
            <span
              className={`tw:flex tw:min-w-0 tw:items-center tw:gap-1 tw:text-[12px] tw:font-medium ${statusTextCls[tone]}`}
            >
              <span
                className={`tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full ${statusDotCls[tone]}`}
              />
              <span className="tw:truncate">{item._statusLabel}</span>
            </span>
          )}
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="tw:flex tw:cursor-pointer tw:items-center tw:gap-0.5 tw:rounded tw:px-1 tw:py-1 tw:text-[12px] tw:font-medium tw:text-muted-foreground tw:transition-colors tw:hover:text-foreground focus-visible:tw:outline focus-visible:tw:outline-2 focus-visible:tw:outline-offset-2 focus-visible:tw:outline-gray-400"
          >
            {t("details")}
            <ChevronDown
              size={14}
              className={`tw:transition-transform ${
                expanded ? "tw:rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible details — every remaining data point lives here */}
      {expanded && (
        <div className="tw:mt-2 tw:border-t tw:border-border/60 tw:pt-3">
          <div className="tw:grid tw:grid-cols-2 tw:gap-x-3 tw:gap-y-3">
            <KeyValue label={t("orderedOn")} size="sm">
              {item.createdAt ? (
                <div>
                  <div className="tw:font-medium">
                    <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                  </div>
                </div>
              ) : (
                <div className="tw:text-sm tw:text-gray-400">--</div>
              )}
            </KeyValue>

            <KeyValue label={t("orderedItems")} size="sm">
              <div className="tw:font-medium">
                {itemCount} {t("products")}{" "}
                <span className="tw:text-xs tw:font-normal tw:text-gray-500">
                  ({item._totalQuantity ?? 0} {t("totalUnits")})
                </span>
              </div>
              <div className="tw:text-xs tw:font-medium">
                <Amount
                  value={item._totalValue ?? 0}
                  decimalPlaces={2}
                  className="tw:text-emerald-600"
                />
              </div>
            </KeyValue>
          </div>

          {/* Secondary action kept from the previous card */}
          <div className="tw:mt-3 tw:flex tw:justify-end">
            <AppLink asLink href={orderLink}>
              <AppButton size="small" color="light" fill="outline">
                <Eye size={14} />
                {t("view")}
              </AppButton>
            </AppLink>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderCard;
