import { ChevronRight } from "lucide-react";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import EntityThumb from "~/components/core/img/EntityThumb";

export type MenuItem = {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
};

type Props = {
  items: MenuItem[];
  loading: boolean;
  selectedId?: string;
  onSelect: (item: MenuItem) => void;
};

const MenuColumn = ({ items, loading, selectedId, onSelect }: Props) => {
  return (
    <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-sm tw:flex tw:flex-col tw:h-full tw:overflow-hidden">
      <div className="tw:px-3 tw:py-2 tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100">
        <h3 className="tw:text-[11px] tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          Menus
        </h3>
        {!loading && items.length ? (
          <span className="tw:text-[11px] tw:font-medium tw:text-gray-400">
            {items.length}
          </span>
        ) : null}
      </div>

      <AppScrollArea className="tw:flex-1 tw:min-h-0">
        {loading ? (
          <div className="tw:divide-y tw:divide-gray-50">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5"
              >
                <Skeleton className="tw:h-7 tw:w-7 tw:rounded-md" />
                <Skeleton className="tw:h-3 tw:w-2/5" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <NoData />
        ) : (
          <div className="tw:divide-y tw:divide-gray-50">
            {items.map((it) => {
              const isSelected = it._id === selectedId;
              return (
                <button
                  key={it._id}
                  type="button"
                  onClick={() => onSelect(it)}
                  title={it._displayName || it.name}
                  className={`tw:group tw:relative tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5 tw:w-full tw:text-left tw:cursor-pointer tw:transition-colors ${
                    isSelected ? "tw:bg-primary/5" : "tw:hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`tw:absolute tw:left-0 tw:top-1 tw:bottom-1 tw:w-0.5 tw:rounded-r-full tw:bg-primary tw:transition-opacity ${
                      isSelected
                        ? "tw:opacity-100"
                        : "tw:opacity-0 tw:group-hover:opacity-100"
                    }`}
                  />
                  <EntityThumb
                    assetId={it._displayImg}
                    name={it._displayName || it.name}
                    width={100}
                    boxClassName={`tw:h-7 tw:w-7 tw:shrink-0 tw:rounded-md tw:border ${
                      isSelected
                        ? "tw:border-primary/30"
                        : "tw:border-gray-100 tw:group-hover:border-primary/30"
                    }`}
                  />
                  <span
                    className={`tw:flex-1 tw:min-w-0 tw:text-xs tw:font-medium tw:leading-tight tw:line-clamp-2 ${
                      isSelected
                        ? "tw:text-primary"
                        : "tw:text-gray-800 tw:group-hover:text-primary"
                    }`}
                  >
                    {it._displayName || it.name}
                  </span>
                  <ChevronRight
                    className={`tw:w-3.5 tw:h-3.5 tw:shrink-0 tw:transition-colors ${
                      isSelected
                        ? "tw:text-primary"
                        : "tw:text-gray-300 tw:group-hover:text-primary"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </AppScrollArea>
    </div>
  );
};

export default MenuColumn;
