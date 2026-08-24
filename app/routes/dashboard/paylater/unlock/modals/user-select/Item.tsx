import React from "react";
import { ChevronRight, Hash, MapPin, Phone, Receipt } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import type { UserItem } from "../../helper";

interface Props {
  item: UserItem;
  onSelect: (user: UserItem) => void;
}

/**
 * One selectable user in the picker list. The same row serves mobile and
 * desktop — it wraps its meta line instead of switching to a table, so the
 * modal needs no separate desktop/mobile view.
 */
const Item: React.FC<Props> = ({ item, onSelect }) => {
  const refId = item.franchiseId || item.referenceId || item.refNo || "";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="tw:w-full tw:text-left tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-border tw:bg-card tw:p-3 tw:transition-colors tw:hover:border-primary/40 tw:hover:bg-primary/5"
    >
      <div className="tw:w-10 tw:h-10 tw:shrink-0 tw:rounded-full tw:bg-primary tw:text-primary-foreground tw:flex tw:items-center tw:justify-center tw:text-xs tw:font-bold">
        {item.initials || (item.name || "U")[0]?.toUpperCase()}
      </div>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:font-semibold tw:text-foreground tw:truncate">
            {item.name || "-"}
          </span>
          {!!item.suggestedLimit && (
            <span className="tw:shrink-0 tw:text-[10px] tw:font-semibold tw:rounded tw:border tw:border-violet-200 tw:bg-violet-50 tw:text-violet-700 tw:px-1.5 tw:py-0.5">
              upto <Amount value={item.suggestedLimit} decimalPlaces={0} />
            </span>
          )}
        </div>

        <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-0.5 tw:text-xs tw:text-muted-foreground">
          <span className="tw:inline-flex tw:items-center tw:gap-1">
            <Phone size={11} className="tw:opacity-70" />
            <span className="tw:tabular-nums">{item.mobile || "-"}</span>
          </span>
          {!!refId && (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:min-w-0">
              <Hash size={11} className="tw:opacity-70" />
              <span className="tw:font-mono tw:truncate">{refId}</span>
            </span>
          )}
          {!!item.bills && (
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              <Receipt size={11} className="tw:opacity-70" />
              {item.bills} bills
            </span>
          )}
          {!!item.location && (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:min-w-0">
              <MapPin size={11} className="tw:opacity-70" />
              <span className="tw:truncate">{item.location}</span>
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        size={16}
        className="tw:shrink-0 tw:text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
};

export default Item;
