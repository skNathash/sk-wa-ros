import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import type { InwardedItem } from "../helper";
import ItemAvatar from "./ItemAvatar";

type Props = {
  items: InwardedItem[];
};

/** "Sellable · Rack B · Bin B2 · exp 14 Feb 2027" — skips what the item lacks. */
const StorageLine = ({ item }: { item: InwardedItem }) => {
  const parts: React.ReactNode[] = [];

  if (item.locationName) parts.push(<span key="loc">{item.locationName}</span>);
  if (item.rackName) parts.push(<span key="rack">Rack {item.rackName}</span>);
  if (item.binName) parts.push(<span key="bin">Bin {item.binName}</span>);
  if (item.expiry)
    parts.push(
      <span key="exp">
        exp <DateFormat value={item.expiry} formatStr="dd MMM yyyy" />
      </span>,
    );

  if (parts.length === 0) return null;

  return (
    <p className="tw:truncate tw:text-[10px] tw:leading-tight tw:text-slate-500">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="tw:mx-1 tw:text-slate-300">·</span>}
          {part}
        </span>
      ))}
    </p>
  );
};

const InwardedList = ({ items }: Props) => {
  const { t } = useTranslation();

  return (
    <AppCard className="tw:mb-0" noContentPadding>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-100 tw:px-3 tw:py-2">
        <h3 className="tw:text-[13px] tw:font-semibold tw:text-slate-800">
          {t("inwardedToStock", { defaultValue: "Inwarded to stock" })}
        </h3>
        {items.length > 0 && (
          <AppBadge variant="success" size="sm" className="tw:uppercase">
            {t("added", { defaultValue: "Added" })}
          </AppBadge>
        )}
      </div>

      {items.length === 0 ? (
        <NoData
          title={t("nothingInwarded", { defaultValue: "Nothing inwarded" })}
          description={t("nothingInwardedHint", {
            defaultValue: "No units from this order made it into stock.",
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
                  {item.dealId ? (
                    <AppLink
                      asLink={true}
                      href={`/dashboard/inventory/products/view/${item.dealId}`}
                      className="tw:no-underline"
                    >
                      {item.dealName}
                    </AppLink>
                  ) : (
                    item.dealName
                  )}
                </h4>
                <StorageLine item={item} />
              </div>

              <div className="tw:flex tw:shrink-0 tw:items-baseline tw:gap-2.5">
                <span className="tw:text-[13px] tw:font-semibold tw:text-slate-800">
                  {item.quantity}
                </span>
                <Amount
                  value={item.value}
                  decimalPlaces={0}
                  className="tw:text-[13px] tw:font-semibold tw:text-emerald-700"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default InwardedList;
