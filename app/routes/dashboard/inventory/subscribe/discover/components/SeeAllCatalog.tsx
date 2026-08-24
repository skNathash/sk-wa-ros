import { ArrowRight, LayoutGrid } from "lucide-react";
import React from "react";
import { Link } from "react-router";
import TintTile from "~/components/core/tint/TintTile";
import { CATALOG_SEE_ALL } from "../helper";

interface Props {
  className?: string;
}

/**
 * Closing card for Discover — the rails above are curated slices, so this is
 * the way out into the unfiltered catalog for anyone who did not find what
 * they came for.
 */
const SeeAllCatalog: React.FC<Props> = ({ className = "" }) => (
  <Link
    to={CATALOG_SEE_ALL}
    className={`tw:group tw:flex tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:transition-[transform,box-shadow,border-color] tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:border-primary/40 tw:hover:shadow-md ${className}`}
  >
    <TintTile index={-1} className="tw:size-10 tw:shrink-0 tw:rounded-xl">
      <LayoutGrid size={18} />
    </TintTile>

    <span className="tw:min-w-0 tw:flex-1">
      <span className="tw:block tw:text-sm tw:font-bold tw:text-slate-800">
        See all SK Library Items
      </span>
      <span className="tw:mt-0.5 tw:block tw:text-xs tw:text-slate-400">
        Browse every product you can subscribe to
      </span>
    </span>

    <ArrowRight
      size={18}
      className="tw:shrink-0 tw:text-primary tw:transition-transform tw:duration-200 tw:group-hover:translate-x-0.5"
    />
  </Link>
);

export default SeeAllCatalog;
