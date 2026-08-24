import FacetFilter from "./FacetFilter";

type Props = {
  menuId?: string;
  /** comma-separated category ids to scope brands by (cross-filter) */
  categoryId?: string;
  selectedIds?: string[];
  distance?: number | string;
  variant?: "boxed" | "flat";
  showSearch?: boolean;
  className?: string;
  callback: (args: { action: string; data?: any }) => void;
};

/** Brand facet — thin wrapper over the shared {@link FacetFilter}. */
const BrandFilter = ({ categoryId, ...rest }: Props) => (
  <FacetFilter type="brand" scopeId={categoryId} {...rest} />
);

export default BrandFilter;
