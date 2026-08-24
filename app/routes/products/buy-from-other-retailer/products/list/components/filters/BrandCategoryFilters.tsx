import clsx from "clsx";
import BrandFilter from "./BrandFilter";
import CategoryFilter from "./CategoryFilter";

type Props = {
  menuId?: string;
  /** comma-separated category ids scoping the brand list (cross-filter) */
  categoryScope?: string;
  /** comma-separated brand ids scoping the category list (cross-filter) */
  brandScope?: string;
  selectedBrandIds?: string[];
  selectedCatIds?: string[];
  distance?: number | string;
  className?: string;
  onBrandChange: (args: { action: string; data?: any }) => void;
  onCategoryChange: (args: { action: string; data?: any }) => void;
};

/**
 * Brand + Category facets as one browse rail — two plain sections that read as
 * one list rather than boxed widgets (the list's title lives in the app header
 * above the rail). Each section keeps a fixed share of the rail height and
 * scrolls inside it, so loading more brands never shifts the categories block
 * down the page.
 */
const BrandCategoryFilters = ({
  menuId,
  categoryScope,
  brandScope,
  selectedBrandIds = [],
  selectedCatIds = [],
  distance,
  className,
  onBrandChange,
  onCategoryChange,
}: Props) => (
  <div className={clsx("tw:flex tw:h-full tw:flex-col tw:gap-5", className)}>
    {/* Brands take the larger share — it's the longer, searchable list. */}
    <BrandFilter
      variant="flat"
      className="tw:grow-3 tw:basis-0 tw:min-h-56"
      menuId={menuId}
      categoryId={categoryScope}
      selectedIds={selectedBrandIds}
      distance={distance}
      callback={onBrandChange}
    />

    <CategoryFilter
      variant="flat"
      className="tw:grow-2 tw:basis-0 tw:min-h-40"
      menuId={menuId}
      brandId={brandScope}
      selectedIds={selectedCatIds}
      distance={distance}
      callback={onCategoryChange}
    />
  </div>
);

export default BrandCategoryFilters;
