import { ChevronRight } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface Props {
  /** Deep-link target for the full listing. */
  to: string;
  className?: string;
}

/**
 * The one "See all" affordance every Discover section hands to
 * `SectionHeading`'s action slot, so the rails and the browse grids offer the
 * same way out into the full listing.
 */
const SeeAllLink: React.FC<Props> = ({ to, className = "" }) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);

  return (
    <Link
      to={to}
      className={`tw:inline-flex tw:items-center tw:gap-0.5 tw:rounded-full tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:text-primary tw:transition-colors tw:hover:bg-primary/8 ${className}`}
    >
      {t("discover.seeAll", { defaultValue: "See all" })}
      <ChevronRight size={14} />
    </Link>
  );
};

export default SeeAllLink;
