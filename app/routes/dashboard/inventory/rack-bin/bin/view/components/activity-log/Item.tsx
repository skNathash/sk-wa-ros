import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";
import { format } from "date-fns";
import type { ActionTone } from "./helper";
import { actionMeta } from "./helper";

interface ItemProps {
  data: any;
  callback: (a: { action: string; data: any }) => void;
}

// One tint per tone, shared by the action tag and the highlight so direction
// reads off colour before any text is parsed.
const TONE: Record<ActionTone, { chip: string; highlight: string }> = {
  in: {
    chip: "tw:bg-emerald-50 tw:text-emerald-700",
    highlight: "tw:text-emerald-600",
  },
  out: {
    chip: "tw:bg-rose-50 tw:text-rose-700",
    highlight: "tw:text-rose-600",
  },
  move: {
    chip: "tw:bg-violet-50 tw:text-violet-700",
    highlight: "tw:text-violet-600",
  },
  price: {
    chip: "tw:bg-amber-50 tw:text-amber-700",
    highlight: "tw:text-amber-600",
  },
  audit: {
    chip: "tw:bg-teal-50 tw:text-teal-700",
    highlight: "tw:text-teal-600",
  },
  warn: {
    chip: "tw:bg-amber-50 tw:text-amber-700",
    highlight: "tw:text-amber-700",
  },
  neutral: {
    chip: "tw:bg-slate-100 tw:text-slate-600",
    highlight: "tw:text-slate-700",
  },
};

/**
 * One row of the bin timeline: when it happened and which action it was on the
 * left, what moved on the right. The action enum decides the tag, the tint and
 * the sign on the quantity — nothing here is inferred from the numbers.
 */
const Item: React.FC<ItemProps> = ({ data, callback }) => {
  const meta = actionMeta(data?.action);
  const tone = TONE[meta.tone];

  const items: any[] = data?.itemsAffected || [];
  const single = items.length === 1 ? items[0] : null;

  const at = data?.createdAt ? new Date(data.createdAt) : null;
  const timeLabel = at && !Number.isNaN(at.getTime()) ? format(at, "h:mm a") : "";

  // A single deal names itself; a bulk row keeps the action as its headline so
  // the count stays the thing you read.
  const title = single
    ? single.dealName || single.dealRefId
    : data?.actionDescription || meta.label;

  // The coloured suffix next to the title — the one number this row is about.
  let highlight = "";
  if (meta.tone === "move" && data?.fromBin?.binCode && data?.toBin?.binCode) {
    highlight = `${data.fromBin.binCode} → ${data.toBin.binCode}`;
  } else if (meta.tone === "price" && data?.newPrice) {
    highlight = data?.oldPrice
      ? `₹${data.oldPrice} → ₹${data.newPrice}`
      : `₹${data.newPrice}`;
  } else if (single?.changeQtyBy) {
    const qty = Math.abs(Number(single.changeQtyBy)) || 0;
    const sign = meta.tone === "out" ? "-" : meta.tone === "in" ? "+" : "";
    highlight = `${sign}${qty} ${qty === 1 ? "unit" : "units"}`;
  } else if (items.length > 1) {
    highlight = `${items.length} SKUs`;
  }

  // `Bill #1042 · Karthik · ₹390`
  const metaLine = [
    data?.reference,
    data?.createdBy?.name,
    data?.note,
    data?.amount ? `₹${data.amount}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const target = data?.toBin?.binId
    ? { action: "view-bin", data: { binId: data.toBin.binId } }
    : single?.dealId
      ? { action: "view-deal", data: { dealId: single.dealId } }
      : null;

  return (
    <div
      role={target ? "button" : undefined}
      tabIndex={target ? 0 : undefined}
      onClick={target ? () => callback(target) : undefined}
      onKeyDown={
        target
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                callback(target);
              }
            }
          : undefined
      }
      className={clsx(
        "tw:flex tw:gap-3 tw:rounded-2xl tw:bg-white tw:p-3 tw:ring-1 tw:ring-slate-100 tw:transition-shadow",
        target && "tw:cursor-pointer tw:hover:shadow-sm"
      )}
    >
      {/* When + which action */}
      <div className="tw:flex tw:w-16 tw:shrink-0 tw:flex-col tw:items-start tw:gap-1.5">
        <span className="tw:text-[11px] tw:font-medium tw:text-slate-500">
          {timeLabel}
        </span>
        <span
          className={clsx(
            "app-label tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-[0.12em]",
            tone.chip
          )}
        >
          {meta.label}
        </span>
      </div>

      {/* What happened */}
      <div className="tw:min-w-0 tw:flex-1">
        <p className="tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-2 tw:gap-y-0.5">
          {title ? (
            <span className="app-heading-serif tw:text-sm tw:font-bold tw:text-slate-800">
              {title}
            </span>
          ) : null}
          {highlight ? (
            <span
              className={clsx("app-amount tw:text-sm tw:font-bold", tone.highlight)}
            >
              {highlight}
            </span>
          ) : null}
        </p>

        {metaLine ? (
          <p className="app-label tw:mt-1 tw:text-xs tw:font-normal tw:normal-case tw:tracking-normal tw:text-slate-500">
            {metaLine}
          </p>
        ) : null}

        {/* A bulk row keeps its deals listed under the roll-up headline. */}
        {!single && items.length ? (
          <ul className="tw:mt-2 tw:space-y-1">
            {items.map((item, idx) => (
              <li
                key={`${item?.dealId || item?.dealRefId}-${idx}`}
                className="tw:flex tw:items-baseline tw:justify-between tw:gap-3"
              >
                <span className="tw:min-w-0 tw:truncate tw:text-xs tw:text-slate-600">
                  {item?.dealName || item?.dealRefId}
                </span>
                {item?.changeQtyBy ? (
                  <span
                    className={clsx(
                      "app-amount tw:shrink-0 tw:text-xs tw:font-semibold",
                      tone.highlight
                    )}
                  >
                    {item.changeQtyBy}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {target ? (
        <ChevronRight
          size={16}
          className="tw:mt-0.5 tw:shrink-0 tw:text-slate-300"
        />
      ) : null}
    </div>
  );
};

export default Item;
