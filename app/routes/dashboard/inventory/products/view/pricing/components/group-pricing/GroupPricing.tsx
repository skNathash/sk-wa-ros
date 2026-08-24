import clsx from "clsx";
import { ArrowRight, Users } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AuthService from "~/services/AuthService";
import type { NetworkGroupPrice } from "~/types/CommonTypes";
import {
  getAvatarTone,
  getGroupSummary,
  getInitial,
  rbacRoles,
  sortGroups,
} from "./helper";

export interface GroupPricingProps {
  groups: NetworkGroupPrice[];
  /** Roll-up from the deal response (`networkGroupSellingPriceInfo`). */
  info?: { totalGroups?: number; totalSellers?: number };
  /** Opens the price config scoped to the group that was clicked. */
  onEdit?: (group: NetworkGroupPrice) => void;
  className?: string;
}

/**
 * B2B prices by buyer group — one row per seller group with the price this
 * deal carries for it. Groups without a price fall back to the deal's own
 * network price, which is called out on the row.
 */
const GroupPricing = ({
  groups,
  info,
  onEdit,
  className,
}: GroupPricingProps) => {
  const rows = sortGroups(groups || []);
  if (!rows.length) return null;

  const { totalGroups, totalSellers } = getGroupSummary(rows, info);
  const editable =
    !!onEdit && AuthService.isRbacEnabled(rbacRoles.editPrice);

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      <div className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-500">
        {totalGroups} price {totalGroups === 1 ? "group" : "groups"}
        <span className="tw:text-slate-400">
          {" "}
          · {totalSellers} {totalSellers === 1 ? "retailer" : "retailers"}
        </span>
      </div>

      <div className="tw:mt-2 tw:overflow-x-auto">
        <table className="tw:w-full tw:text-sm">
          <thead>
            <tr className="tw:text-left tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              <th className="tw:py-1 tw:font-semibold">Group</th>
              <th className="tw:py-1 tw:font-semibold">Retailers</th>
              <th className="tw:py-1 tw:font-semibold">B2B price</th>
              <th className="tw:py-1" />
            </tr>
          </thead>
          <tbody className="tw:divide-y tw:divide-slate-100">
            {rows.map((group) => (
              <tr key={group.id} className="tw:align-middle">
                <td className="tw:py-2 tw:pr-3">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span
                      className={clsx(
                        "tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-sm tw:font-bold tw:text-white",
                        getAvatarTone(group.name),
                      )}
                    >
                      {getInitial(group.name)}
                    </span>
                    <div className="tw:min-w-0">
                      <div className="tw:truncate tw:font-semibold tw:text-slate-800">
                        {group.name}
                      </div>
                      {(!group.isActive || !group.isSynced) && (
                        <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-amber-600">
                          {!group.isActive ? "Inactive" : "Not synced"}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="tw:py-2 tw:pr-3 tw:whitespace-nowrap tw:text-slate-500">
                  <span className="tw:inline-flex tw:items-center tw:gap-1">
                    <Users size={12} className="tw:text-slate-400" />
                    {group.sellersCount}
                  </span>
                </td>

                <td className="tw:py-2 tw:pr-3 tw:whitespace-nowrap">
                  {group.price ? (
                    <span className="tw:font-bold tw:text-slate-900">
                      <Amount
                        value={group.price}
                        decimalPlaces={group.price % 1 ? 2 : 0}
                      />
                    </span>
                  ) : (
                    <span className="tw:text-xs tw:text-slate-400">
                      Deal price
                    </span>
                  )}
                </td>

                <td className="tw:py-2 tw:text-right tw:whitespace-nowrap">
                  {editable && (
                    <button
                      type="button"
                      onClick={() => onEdit?.(group)}
                      className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-primary"
                    >
                      {group.price ? "Edit price" : "Set price"}
                      <ArrowRight size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default GroupPricing;
