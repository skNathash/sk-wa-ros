import clsx from "clsx";
import { ChevronRight, Layers, Plus, Sparkles } from "lucide-react";
import React, { useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import PriceGroupConfigModal from "~/shared/catalog/modals/price-group-config/PriceGroupConfigModal";
import type { PriceGroupColumn } from "../helper";
import { groupTone } from "./GroupPriceCell";

/** "Every group" — the sheet then carries one price column per group. */
export const ALL_GROUPS = "all";

export interface B2BPriceToolsProps {
  /** Buyer groups configured by this franchise, in list order. */
  groups: PriceGroupColumn[];
  /** Group the sheet is narrowed to, or {@link ALL_GROUPS}. */
  activeGroupId: string;
  onGroupChange: (groupId: string) => void;
  /** A group was created or edited — the host re-reads its group list. */
  onGroupsChange: () => void;
  className?: string;
}

/**
 * The B2B row of the pricing command bar: the two B2B-only screens (Scheme,
 * Price Slab), the buyer-group filter and the way to add a group.
 *
 * The group filter is a view filter, not a query one — the API returns every
 * group price on a deal, so picking a group narrows the sheet to that group's
 * price column (mobile: that group's card) and "All groups" puts them all back.
 * Nothing is refetched, so switching groups is instant.
 *
 * Tapping the already-active group opens its config, which is also how a group
 * gets renamed or has retailers moved in and out of it.
 *
 * The row is surface-less — the host block owns the background — and scrolls
 * sideways rather than wrapping, so it reads the same on a phone.
 */
const B2BPriceTools: React.FC<B2BPriceToolsProps> = ({
  groups,
  activeGroupId,
  onGroupChange,
  onGroupsChange,
  className,
}) => {
  const appNav = useAppNav();
  const [modal, setModal] = useState<{ show: boolean; editId?: string }>({
    show: false,
  });

  const handleGroupClick = (group: PriceGroupColumn) => {
    if (group.id === activeGroupId) {
      setModal({ show: true, editId: group.id });
      return;
    }
    onGroupChange(group.id);
  };

  const handleModalCallback = ({ action }: { action: string; data?: any }) => {
    if (action === "save") {
      onGroupsChange();
    }
    setModal({ show: false });
  };

  return (
    <>
      <div className={clsx("tw:overflow-x-auto hide-scrollbar", className)}>
        <div className="tw:flex tw:min-w-max tw:items-center tw:gap-2">
          <button
            type="button"
            onClick={() => appNav.to("/configs/schemes")}
            className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-violet-200 tw:bg-violet-50 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-violet-700"
          >
            <Sparkles size={12} />
            B2B Scheme
            <ChevronRight size={12} />
          </button>

          <button
            type="button"
            onClick={() => appNav.to("/configs/price-slab")}
            className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-sky-200 tw:bg-sky-50 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-sky-700"
          >
            <Layers size={12} />
            Price Slab
            <ChevronRight size={12} />
          </button>

          {/* Divider — the pills to the left navigate away, everything to the
              right filters the sheet in place. */}
          <span className="tw:mx-0.5 tw:h-5 tw:w-px tw:shrink-0 tw:bg-slate-200" />

          <button
            type="button"
            onClick={() => onGroupChange(ALL_GROUPS)}
            aria-pressed={activeGroupId === ALL_GROUPS}
            className={clsx(
              "tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:border tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
              activeGroupId === ALL_GROUPS
                ? "tw:border-slate-800 tw:bg-slate-800 tw:text-white"
                : "tw:border-slate-200 tw:bg-white tw:text-slate-600 tw:hover:bg-slate-50",
            )}
          >
            All groups
            <span
              className={clsx(
                "tw:text-[11px] tw:font-bold tw:tabular-nums",
                activeGroupId === ALL_GROUPS
                  ? "tw:text-white/70"
                  : "tw:text-slate-400",
              )}
            >
              {groups.length}
            </span>
          </button>

          {groups.map((group) => {
            const tone = groupTone(group.toneIndex);
            const isActive = group.id === activeGroupId;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleGroupClick(group)}
                aria-pressed={isActive}
                title={
                  isActive
                    ? `Edit ${group.name}`
                    : `Show only ${group.name} prices`
                }
                className={clsx(
                  "tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
                  isActive
                    ? tone.chip
                    : "tw:border-slate-200 tw:bg-white tw:text-slate-600 tw:hover:bg-slate-50",
                )}
              >
                <span
                  className={clsx("tw:size-2 tw:rounded-full", tone.dot)}
                  aria-hidden
                />
                {group.name}
                {group.sellersCount > 0 && (
                  <span
                    className={clsx(
                      "tw:text-[11px] tw:font-bold tw:tabular-nums",
                      isActive ? "" : "tw:text-slate-400",
                    )}
                  >
                    {group.sellersCount}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setModal({ show: true })}
            className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-dashed tw:border-slate-300 tw:bg-white tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-slate-700 tw:transition-colors tw:hover:bg-slate-50"
          >
            <Plus size={12} />
            Add group
          </button>
        </div>
      </div>

      <PriceGroupConfigModal
        show={modal.show}
        editId={modal.editId}
        callback={handleModalCallback}
      />
    </>
  );
};

export default B2BPriceTools;
