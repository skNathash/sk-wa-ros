import { isToday, isValid, isYesterday, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";

type Props = {
  poDetails: Record<string, any>;
  className?: string;
};

const toDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
};

/**
 * What was ordered, in one plate — the band that opens the receive screen.
 *
 *   PO NO · TODAY · 11:32 AM                                   VALUE
 *   n items · n units                                        ₹ amount
 *
 * Wears the shared `.app-pnl-hero` surface (deep `--primary`, light ink) and
 * the theme's serif headline, so it reads as the same family as the other
 * headline plates instead of a one-off gradient.
 *
 * Deliberately says nothing about receiving: it is the order as it was raised,
 * so the counters below (ordered / received / damaged …) always have a fixed
 * reference to be read against.
 */
const OrderSnapshotCard = ({ poDetails, className = "" }: Props) => {
  const { t } = useTranslation();

  const items = Array.isArray(poDetails.items) ? poDetails.items : [];
  const units =
    Number(poDetails._totalQuantity) ||
    items.reduce(
      (sum: number, item: any) => sum + (Number(item.quantity) || 0),
      0,
    );
  const value = Number(poDetails._totalValue) || 0;
  const orderedOn = toDate(poDetails.createdAt);

  return (
    /* `rounded-tr-sm` gives the plate the geometry of an outgoing chat bubble —
       the corner where the tail would sit is squared off. */
    <div
      className={`app-pnl-hero tw:mb-4 tw:rounded-2xl tw:rounded-tr-sm tw:p-4 tw:shadow-sm ${className}`}
    >
      <div className="tw:flex tw:items-end tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          {/* PO no · when it was raised */}
          <div className="tw:flex tw:flex-wrap tw:items-center tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
            <span>{poDetails.orderId || "--"}</span>
            {orderedOn && (
              <>
                <span className="tw:mx-1.5 tw:opacity-60" aria-hidden>
                  ·
                </span>
                {isToday(orderedOn) ? (
                  <span>{t("today", { defaultValue: "Today" })}</span>
                ) : isYesterday(orderedOn) ? (
                  <span>{t("yesterday", { defaultValue: "Yesterday" })}</span>
                ) : (
                  <DateFormat value={orderedOn} formatStr="dd MMM" />
                )}
                <span className="tw:mx-1.5 tw:opacity-60" aria-hidden>
                  ·
                </span>
                <DateFormat value={orderedOn} formatStr="hh:mm a" />
              </>
            )}
          </div>

          {/* What was ordered */}
          <div className="app-heading-serif tw:mt-1 tw:text-xl tw:font-bold tw:leading-tight tw:text-white tw:md:text-2xl">
            {t("itemsCount", {
              defaultValue: "{{count}} items",
              count: items.length,
            })}
            <span className="tw:mx-1.5 tw:opacity-60" aria-hidden>
              ·
            </span>
            {t("unitsCount", {
              defaultValue: "{{count}} units",
              count: units,
            })}
          </div>
        </div>

        <div className="tw:shrink-0 tw:text-right">
          <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-widest tw:text-white/60">
            {t("value", { defaultValue: "Value" })}
          </div>
          <div className="tw:mt-0.5 tw:text-xl tw:font-bold tw:leading-tight tw:text-white">
            <Amount value={value} decimalPlaces={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSnapshotCard;
