import { ChevronRight } from "lucide-react";
import React from "react";
import { Link } from "react-router";
import Amount from "~/components/core/amount/Amount";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import ImgRender from "~/components/core/img/ImgRender";
import type { SellingAroundYouDeal } from "./helper";

interface Props {
  items: SellingAroundYouDeal[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onProductTap: (id: string) => void;
  radiusKm: number;
  seeAllTo?: string;
}

const SellingAroundYouMobile: React.FC<Props> = ({
  items,
  selectedIds,
  onSelect,
  onProductTap,
  radiusKm,
  seeAllTo,
}) => {
  return (
    <div>
      {items.map((item) => {
        const isSelected = selectedIds.has(item._id);
        const price = item.bestPrice ?? item.mrp;
        const initials = (item.brandName || item.name)
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase();

        return (
          <div
            key={item._id}
            className={`tw:border-b tw:border-slate-200/70 tw:p-3 tw:transition-colors tw:last:border-b-0 ${
              isSelected ? "tw:bg-emerald-50/40" : ""
            }`}
          >
            <div className="tw:flex tw:items-start tw:gap-2.5">
              <AppCheckbox
                size="xs"
                value={isSelected}
                onChange={(checked) => onSelect(item._id, checked)}
                label=""
              />

              <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:bg-indigo-50">
                {item.images.length > 0 ? (
                  <ImgRender
                    assetId={item.images[0]}
                    alt={item.name}
                    className="tw:h-11 tw:w-11 tw:object-contain"
                  />
                ) : (
                  <span className="tw:text-sm tw:font-bold tw:text-indigo-400">
                    {initials}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onProductTap(item._id)}
                className="tw:min-w-0 tw:flex-1 tw:text-left"
              >
                <span className="tw:block tw:line-clamp-2 tw:wrap-break-word tw:text-sm tw:font-bold tw:leading-snug tw:text-slate-800">
                  {item.name}
                </span>
                <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:italic tw:text-slate-500">
                  {item.brandName || "—"}
                  {item.categoryName ? ` · ${item.categoryName}` : ""}
                </p>

                <span className="tw:mt-2 tw:flex tw:items-end tw:justify-between tw:gap-2">
                  <span className="tw:text-xs tw:font-bold tw:text-emerald-700">
                    {item.sellersCount} retailers · {radiusKm}km
                  </span>

                  <span className="tw:shrink-0 tw:text-right">
                    <Amount
                      value={price}
                      className="tw:text-base tw:font-bold tw:text-emerald-700"
                    />
                    <span className="tw:block tw:text-[10px] tw:font-medium tw:text-slate-400">
                      {item.bestPrice === null ? "MRP" : "best price"}
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        );
      })}

      {seeAllTo ? (
        <div className="tw:flex tw:justify-center tw:border-t tw:border-slate-200/70 tw:p-3">
          <Link
            to={seeAllTo}
            className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-semibold tw:text-primary tw:transition-colors tw:hover:text-primary-dark"
          >
            See all
            <ChevronRight size={14} />
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default SellingAroundYouMobile;
