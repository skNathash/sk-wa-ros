import { ArrowRight, ChevronDown, Eye } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

type PoSummaryCardProps = {
  item: Record<string, any>;
  /** Emits row actions ("inward", "view") back to the parent list. */
  callback?: (a: { action: string; data: Record<string, any> }) => void;
};

/**
 * Shared purchase-order summary row (mobile / card view).
 *
 * Three tight lines, each with one left-aligned identity column and one
 * right-aligned figure, so the eye can run straight down either edge:
 *
 *   PO ID                                              ₹ amount
 *   Vendor name        n items · n units · ordered date, time
 *   [TYPE] ● status                          [Inward] Details ⌄
 *
 * The amount column is the scan anchor on the right; status is a dot plus
 * label rather than a filled pill so a long list stays quiet. Line 3 is kept
 * to status plus actions only — with the counts on it, a row carrying both a
 * vendor-type badge and the Inward button overflowed and truncated. Only the
 * vendor name flexes; the counts and timestamp hold their width. Everything
 * the table carries that the row doesn't (received date/items, unit counts,
 * vendor ref, source) lives in the collapsible "Details" section, so no data
 * point is dropped.
 */

// Raw PO statuses that still accept stock — drives the Inward action.
const RECEIVABLE_STATUSES = ["Approved", "Partially Received"];

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

const PoSummaryCard: React.FC<PoSummaryCardProps> = ({ item, callback }) => {
  const { t } = useTranslation(["common"]);
  const [expanded, setExpanded] = useState(false);

  const vendorName = item.vendorInfo?.name;
  const canInward = RECEIVABLE_STATUSES.includes(item.status);
  const tone = toneOf(item.status);

  return (
    <div className="tw:px-4 tw:py-2.5 tw:transition-colors tw:hover:bg-muted/40 tw:md:rounded-2xl tw:md:bg-card tw:md:px-4 tw:md:py-3 tw:md:shadow-sm">
      {/* PO id … amount */}
      <div className="tw:flex tw:items-baseline tw:gap-2">
        <AppLink
          asLink
          href={item.orderLink}
          showLinkColor={true}
          className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[14px] tw:font-semibold tw:leading-snug tw:no-underline"
        >
          {item.orderId}
        </AppLink>
        <Amount
          value={item.totalAmount ?? 0}
          decimalPlaces={2}
          className="tw:shrink-0 tw:text-[14px] tw:font-bold tw:leading-snug tw:text-foreground tw:tabular-nums"
        />
      </div>

      {/* Vendor · counts … ordered date + time */}
      <div className="tw:flex tw:items-baseline tw:gap-1.5">
        {item.vendorLink ? (
          <AppLink
            asLink
            href={item.vendorLink}
            showLinkColor={false}
            className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:leading-snug tw:text-muted-foreground tw:no-underline"
          >
            {vendorName || "--"}
          </AppLink>
        ) : (
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:leading-snug tw:text-muted-foreground">
            {vendorName || "--"}
          </span>
        )}
        <span className="tw:shrink-0 tw:text-[11px] tw:leading-snug tw:text-muted-foreground tw:tabular-nums">
          {item.orderedItemCount ?? 0} {t("items")}
          <span className="tw:mx-1 tw:text-border">·</span>
          {item.orderedUnitCount ?? 0} {t("units")}
        </span>
        {item.createdAt && (
          <span className="tw:shrink-0 tw:text-[11px] tw:leading-snug tw:text-muted-foreground tw:tabular-nums">
            <span className="tw:mx-1 tw:text-border">·</span>
            <DateFormat value={item.createdAt} formatStr="dd MMM yy, hh:mm a" />
          </span>
        )}
      </div>

      {/* Type · status … actions */}
      <div className="tw:mt-1.5 tw:flex tw:min-h-7 tw:items-center tw:gap-2">
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1.5">
          {item._vendorType && (
            <VendorTypeBadge
              type={item._vendorType}
              color={item._vendorTypeColor}
              description={item._vendorTypeInfo}
              size="sm"
            />
          )}
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
          {canInward && (
            <AppButton
              size="small"
              color="primary"
              fill="solid"
              onClick={() => callback?.({ action: "inward", data: item })}
            >
              {t("inward")}
              <ArrowRight size={14} />
            </AppButton>
          )}
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
                    <DateFormat
                      value={item.createdAt}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                  </div>
                </div>
              ) : (
                <div className="tw:text-sm">--</div>
              )}
            </KeyValue>

            <KeyValue label={t("orderedItems")} size="sm">
              <div className="tw:font-medium">
                {item.orderedItemCount ?? 0} {t("items")}{" "}
                <span className="tw:text-xs tw:font-normal tw:text-gray-500">
                  ({item.orderedUnitCount ?? 0} {t("units")})
                </span>
              </div>
              <div className="tw:text-xs tw:font-medium">
                <Amount
                  value={item.totalAmount ?? 0}
                  decimalPlaces={2}
                  className="tw:text-emerald-600"
                />
              </div>
            </KeyValue>

            <KeyValue label={t("receivedDate")} size="sm">
              {item.receivedDate ? (
                <div>
                  <div className="tw:font-medium">
                    <DateFormat
                      value={item.receivedDate}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={item.receivedDate} formatStr="hh:mm a" />
                  </div>
                </div>
              ) : (
                <div className="tw:text-sm tw:text-gray-400">--</div>
              )}
            </KeyValue>

            <KeyValue label={t("receivedItems")} size="sm">
              {item.receivedDate ? (
                <div>
                  <div className="tw:font-medium">
                    {item.receivedPOCount ?? 0} {t("items")}{" "}
                    <span className="tw:text-xs tw:font-normal tw:text-gray-500">
                      ({item.receivedUnits ?? 0} {t("units")})
                    </span>
                  </div>
                  <div className="tw:text-xs tw:font-medium">
                    <Amount
                      value={item.receivedPOValue ?? 0}
                      decimalPlaces={2}
                      className="tw:text-emerald-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="tw:text-sm tw:text-gray-400">--</div>
              )}
            </KeyValue>

            <KeyValue label={t("id")} size="sm">
              <span className="tw:text-sm">
                {item.vendorInfo?.refId ?? "--"}
              </span>
            </KeyValue>

            {item._sourceType && (
              <KeyValue label={t("source")} size="sm">
                <AppBadge variant={item._sourceType.color as any} size="sm">
                  {item._sourceType.name}
                </AppBadge>
              </KeyValue>
            )}
          </div>

          {/* Secondary action kept from the previous card */}
          <div className="tw:mt-3 tw:flex tw:justify-end">
            <AppLink asLink href={item.orderLink}>
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

export default PoSummaryCard;
