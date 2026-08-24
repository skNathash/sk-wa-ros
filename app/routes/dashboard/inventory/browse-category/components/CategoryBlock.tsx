import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import EntityThumb from "~/components/core/img/EntityThumb";
import type { SellerDeal } from "~/types/CommonTypes";
import CategoryDeals from "./CategoryDeals";

interface CategoryBlockProps {
  category: any;
  defaultExpanded?: boolean;
  onDealAction?: (args: { action: string; data: SellerDeal }) => void;
}

/**
 * A single category row in the browse-by-category accordion. Collapsed it shows
 * the category thumb, name + SKU count and (once expanded) its top-brand names;
 * expanding reveals the category's top deals via <CategoryDeals>.
 */
const CategoryBlock = ({
  category,
  defaultExpanded = false,
  onDealAction,
}: CategoryBlockProps) => {
  const { t } = useTranslation(["common"]);
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Deals mount on first expand and stay mounted so collapse can animate.
  const [hasOpened, setHasOpened] = useState(defaultExpanded);

  const name = category._displayName || category.name || "";
  const dealsCount = category.dealsCount || 0;

  const toggle = () => {
    setExpanded((v) => {
      if (!v) setHasOpened(true);
      return !v;
    });
  };

  const subtitle = `${dealsCount} ${t("skus", { defaultValue: "SKUs" })}`;

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:bg-white tw:transition-colors tw:duration-200",
        expanded
          ? "tw:border-[color-mix(in_srgb,var(--primary)_35%,transparent)]"
          : "tw:border-slate-200 tw:hover:border-slate-300",
      )}
    >
      {/* Header — tap to toggle. */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className={clsx(
          "tw:flex tw:w-full tw:items-center tw:gap-3 tw:p-3 tw:text-left tw:transition-colors",
          "tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-inset tw:focus-visible:ring-[color-mix(in_srgb,var(--primary)_45%,transparent)]",
          expanded
            ? "tw:bg-[color-mix(in_srgb,var(--primary)_4%,#fff)]"
            : "tw:active:bg-slate-50",
        )}
      >
        {/* Expand-state rail: muted at rest, primary when open. */}
        <span
          className={clsx(
            "tw:shrink-0 tw:rounded-full tw:transition-all tw:duration-200 tw:ease-out",
            expanded
              ? "tw:h-11 tw:w-1.5 tw:bg-[color:var(--primary)]"
              : "tw:h-8 tw:w-1 tw:bg-slate-200",
          )}
        />

        <EntityThumb
          assetId={category._displayImg}
          name={name}
          size="120"
          fit="cover"
          boxClassName={clsx(
            "tw:h-11 tw:w-11 tw:shrink-0 tw:rounded-lg tw:bg-slate-100 tw:transition-shadow",
            expanded &&
              "tw:ring-2 tw:ring-[color-mix(in_srgb,var(--primary)_18%,transparent)]",
          )}
          initialClassName="tw:text-sm"
        />

        <div className="tw:min-w-0 tw:flex-1">
          <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
            {name}
          </span>
          <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
            {subtitle}
          </div>
        </div>

        <span
          className={clsx(
            "tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:transition-colors",
            expanded
              ? "tw:bg-[color-mix(in_srgb,var(--primary)_12%,#fff)] tw:text-[color:var(--primary)]"
              : "tw:bg-slate-50 tw:text-slate-400",
          )}
        >
          <ChevronDown
            size={18}
            className={clsx(
              "tw:transition-transform tw:duration-200",
              expanded && "tw:rotate-180",
            )}
          />
        </span>
      </button>

      {/* Body — lazily mounted on first expand, then height-animated open/closed. */}
      {hasOpened && category._id ? (
        <div
          className={clsx(
            "tw:grid tw:transition-[grid-template-rows] tw:duration-200 tw:ease-out",
            expanded ? "tw:grid-rows-[1fr]" : "tw:grid-rows-[0fr]",
          )}
        >
          <div className="tw:overflow-hidden">
            <CategoryDeals
              categoryId={category._id}
              categoryName={name}
              totalDeals={dealsCount}
              onDealAction={onDealAction}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CategoryBlock;
