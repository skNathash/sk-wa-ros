import FacetFilter from "./FacetFilter";

type Props = {
  menuId?: string;
  /** comma-separated brand ids to scope categories by (cross-filter) */
  brandId?: string;
  selectedIds?: string[];
  distance?: number | string;
  variant?: "boxed" | "flat";
  showSearch?: boolean;
  className?: string;
  callback: (args: { action: string; data?: any }) => void;
};

/** Category facet — thin wrapper over the shared {@link FacetFilter}. */
const CategoryFilter = ({ brandId, ...rest }: Props) => (
  <FacetFilter type="category" scopeId={brandId} {...rest} />
);

export default CategoryFilter;
