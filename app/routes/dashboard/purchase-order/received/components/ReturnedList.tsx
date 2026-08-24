import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import type { ReturnedItem } from "../helper";
import ItemAvatar from "./ItemAvatar";

type Props = {
  items: ReturnedItem[];
};

/**
 * Everything the vendor still owes the store: damaged units awaiting a
 * replacement or credit note, and units that never turned up in the box.
 */
const ReturnedList = ({ items }: Props) => {
  const { t } = useTranslation();

  const rtvCount = items.filter((item) => !item.isPending).length;

  return (
    <AppCard className="tw:mb-0" noContentPadding>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-100 tw:px-3 tw:py-2">
        <h3 className="tw:text-[13px] tw:font-semibold tw:text-slate-800">
          {t("returnedPending", { defaultValue: "Returned / Pending" })}
        </h3>
        {rtvCount > 0 && (
          <AppBadge variant="danger" size="sm" className="tw:uppercase">
            {t("rtvCount", { defaultValue: "{{count}} RTVs", count: rtvCount })}
          </AppBadge>
        )}
      </div>

      {items.length === 0 ? (
        <NoData
          title={t("nothingReturned", { defaultValue: "Nothing pending" })}
          description={t("nothingReturnedHint", {
            defaultValue:
              "Every ordered unit was received in good condition.",
          })}
        />
      ) : (
        <div className="tw:max-h-96 tw:overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.key}
              className={`tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-1.5 ${
                index < items.length - 1
                  ? "tw:border-b tw:border-slate-100"
                  : ""
              }`}
            >
              <ItemAvatar seed={item.dealName} isOwn={item.isOwn} />

              <div className="tw:min-w-0 tw:flex-1">
                <h4 className="tw:truncate tw:text-[13px] tw:font-medium tw:leading-tight tw:text-slate-800">
                  {item.dealName}
                </h4>
                <p className="tw:truncate tw:text-[10px] tw:leading-tight tw:text-slate-500">
                  {[item.reference, item.reason].filter(Boolean).join(" · ") ||
                    "-"}
                </p>
              </div>

              {/* Settlement, units and value share one line so a return row is
                  no taller than an inwarded row on the opposite rail. */}
              <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
                {item.settlement ? (
                  <AppBadge
                    variant={item.isPending ? "warning" : "danger"}
                    size="sm"
                    className="tw:uppercase"
                  >
                    {item.settlement}
                  </AppBadge>
                ) : (
                  <span className="tw:text-slate-300">—</span>
                )}
                <span className="tw:text-[10px] tw:text-slate-500">
                  {item.quantity} {t("units", { defaultValue: "units" })}
                </span>
                <span className="tw:text-[13px] tw:font-semibold tw:text-red-600">
                  -
                  <Amount
                    value={item.value}
                    decimalPlaces={0}
                    className="tw:font-semibold"
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default ReturnedList;
