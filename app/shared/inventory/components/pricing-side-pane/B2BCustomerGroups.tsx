import clsx from "clsx";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { tintAt, tintIndexFor } from "~/components/core/tint/tints";
import AuthService from "~/services/AuthService";
import SellerGroupPriceConfigService from "~/services/SellerGroupPriceConfigService";
import { GROUP_TYPE } from "~/shared/catalog/modals/price-group-config/helper";
import PriceGroupConfigModal from "~/shared/catalog/modals/price-group-config/PriceGroupConfigModal";
import { mapGroupResponse, type B2BCustomerGroup } from "./helper";

interface B2BCustomerGroupsProps {
  /** Maximum groups listed. Defaults to 10. */
  limit?: number;
  className?: string;
}

/**
 * "B2B customer groups" list for the Prices & Tax pane — the buyer segments a
 * product can be priced for (kirana partners, wholesale, HoReCa), each with the
 * number of buyers it covers. Reads the seller-group-price-config API for the
 * logged-in franchise and owns the create/edit modal, so tapping a group edits
 * it and "Add group" creates one without the page wiring anything up.
 *
 * The swatch colour is derived from the group name, so a group keeps the same
 * colour wherever it appears instead of shifting when the list re-sorts.
 */
const B2BCustomerGroups = ({ limit = 10, className }: B2BCustomerGroupsProps) => {
  const [groups, setGroups] = useState<B2BCustomerGroup[]>([]);
  const [modal, setModal] = useState<{ show: boolean; editId?: string }>({
    show: false,
  });

  const fetchGroups = useCallback(async () => {
    try {
      const response = await SellerGroupPriceConfigService.getGroups({
        filter: {
          type: GROUP_TYPE,
          "franchiseInfo.id": AuthService.getLoggedInUserId(),
        },
        page: 1,
        count: limit,
      });
      setGroups((response?.data?.data || []).map(mapGroupResponse));
    } catch (error) {
      console.error("Error fetching B2B customer groups:", error);
      setGroups([]);
    }
  }, [limit]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleModalCallback = useCallback(
    ({ action }: { action: string; data?: any }) => {
      // A save changes what the list shows, so re-read before closing.
      if (action === "save") {
        fetchGroups();
      }
      setModal({ show: false });
    },
    [fetchGroups],
  );

  return (
    <>
      <div className={clsx("tw:flex tw:flex-col tw:gap-1.5", className)}>
        {groups.map((group) => {
          const tint = tintAt(tintIndexFor(group.name));

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setModal({ show: true, editId: group.id })}
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-xl tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:text-left tw:transition-colors tw:hover:bg-slate-100"
            >
              <span
                className="tw:size-2.5 tw:shrink-0 tw:rounded-[3px]"
                style={{ background: tint.ink }}
              />

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:truncate tw:text-xs tw:font-semibold tw:text-slate-900">
                  {group.name}
                </p>
                {group.description && (
                  <p className="tw:truncate tw:text-[11px] tw:text-slate-500">
                    {group.description}
                  </p>
                )}
              </div>

              {group.count ? (
                <span
                  className="tw:shrink-0 tw:text-sm tw:font-bold tw:tabular-nums"
                  style={{ color: tint.ink }}
                >
                  {group.count}
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setModal({ show: true })}
          className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-2.5 tw:py-2 tw:text-xs tw:font-semibold tw:text-slate-700 tw:transition-colors tw:hover:bg-slate-50"
        >
          <Plus className="tw:size-3.5" />
          Add group
        </button>
      </div>

      <PriceGroupConfigModal
        show={modal.show}
        editId={modal.editId}
        callback={handleModalCallback}
      />
    </>
  );
};

export default B2BCustomerGroups;
