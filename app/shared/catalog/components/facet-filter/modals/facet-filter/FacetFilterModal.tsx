import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox } from "~/components/core/form";
import NoData from "~/components/core/no-data/NoData";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import type { FacetItem, Facets } from "../../helper";

type FacetGroup = "menus" | "categories" | "brands";

export type FacetSelection = {
  menus: FacetItem[];
  categories: FacetItem[];
  brands: FacetItem[];
};

type Props = {
  show: boolean;
  facets: Facets;
  selected?: FacetSelection;
  callback: (a: { action: string; data?: any }) => void;
};

const GROUPS: Array<{ key: FacetGroup; label: string }> = [
  { key: "menus", label: "Menus" },
  { key: "categories", label: "Categories" },
  { key: "brands", label: "Brands" },
];

const toIdSet = (items: FacetItem[] = []) =>
  new Set(items.map((i) => i.id));

const FacetFilterModal = ({ show, facets, selected, callback }: Props) => {
  const [activeGroup, setActiveGroup] = useState<FacetGroup>("menus");
  const [picked, setPicked] = useState<Record<FacetGroup, Set<string>>>({
    menus: new Set(),
    categories: new Set(),
    brands: new Set(),
  });

  // Sync local selection from props whenever the modal is (re)opened.
  useEffect(() => {
    if (!show) return;
    setPicked({
      menus: toIdSet(selected?.menus),
      categories: toIdSet(selected?.categories),
      brands: toIdSet(selected?.brands),
    });
    setActiveGroup("menus");
  }, [show, selected]);

  const activeItems = facets[activeGroup] || [];

  const selectedCount = useMemo(
    () =>
      picked.menus.size + picked.categories.size + picked.brands.size,
    [picked],
  );

  const handleClose = () => callback({ action: "close" });

  const toggle = (group: FacetGroup, id: string, checked: boolean) => {
    setPicked((prev) => {
      const next = new Set(prev[group]);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return { ...prev, [group]: next };
    });
  };

  const handleClear = () => {
    setPicked({ menus: new Set(), categories: new Set(), brands: new Set() });
  };

  const handleApply = () => {
    const collect = (group: FacetGroup): FacetItem[] =>
      (facets[group] || []).filter((item) => picked[group].has(item.id));

    const data: FacetSelection = {
      menus: collect("menus"),
      categories: collect("categories"),
      brands: collect("brands"),
    };
    callback({ action: "apply", data });
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-3xl tw:h-[70vh]"
      noPadding
      overFlowHidden
    >
      <AppModal.Title onClose={handleClose}>
        <span className="tw:text-base tw:font-semibold">Filters</span>
      </AppModal.Title>

      <AppModal.Content noPadding className="tw:flex-1">
        {/* Fixed height = modal 70vh minus title + footer chrome, so the
            left rail (and its border) fills while the right panel scrolls. */}
        <div className="tw:flex tw:h-[calc(70vh-9rem)] tw:min-h-0">
          {/* Left rail: group labels */}
          <div className="tw:w-32 tw:md:w-40 tw:shrink-0 tw:border-r tw:border-gray-200">
            {GROUPS.map((g) => {
              const count = picked[g.key].size;
              const isActive = activeGroup === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveGroup(g.key)}
                  className={clsx(
                    "tw:w-full tw:text-left tw:px-4 tw:py-3 tw:text-sm tw:flex tw:items-center tw:justify-between tw:cursor-pointer tw:border-l-2",
                    isActive
                      ? "tw:bg-white tw:border-blue-600 tw:font-medium tw:text-gray-900"
                      : "tw:border-transparent tw:text-gray-600 hover:tw:bg-white",
                  )}
                >
                  <span>{g.label}</span>
                  {count > 0 && (
                    <span className="tw:ml-2 tw:inline-flex tw:items-center tw:justify-center tw:text-[10px] tw:bg-blue-600 tw:text-white tw:rounded-full tw:h-4 tw:min-w-4 tw:px-1">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right panel: items of the active group */}
          <AppScrollArea className="tw:flex-1 tw:min-w-0 tw:h-full">
            <div className="tw:p-4">
              {activeItems.length === 0 ? (
                <NoData />
              ) : (
                <div className="tw:flex tw:flex-col tw:gap-3">
                  {activeItems.map((item) => (
                    <AppCheckbox
                      key={item.id}
                      className="tw:cursor-pointer"
                      label={
                        <span className="tw:text-sm tw:text-gray-700">
                          {item.name}
                        </span>
                      }
                      value={picked[activeGroup].has(item.id)}
                      onChange={(checked) =>
                        toggle(activeGroup, item.id, checked)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </AppScrollArea>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:justify-between tw:border-t tw:border-gray-200">
        <AppButton fill="outline" color="secondary" onClick={handleClear}>
          Clear all
        </AppButton>
        <AppButton color="primary" onClick={handleApply}>
          {selectedCount > 0 ? `Apply (${selectedCount})` : "Apply"}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FacetFilterModal;
