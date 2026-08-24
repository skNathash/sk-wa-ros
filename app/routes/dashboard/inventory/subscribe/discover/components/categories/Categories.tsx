import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import SeeAllLink from "../SeeAllLink";
import SectionHeading from "../SectionHeading";
import { CATEGORIES_SEE_ALL } from "../../helper";
import {
  CATEGORIES_LIMIT,
  fetchTopCategories,
  type DiscoverCategory,
} from "./helper";

const isAbortError = (error: any) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

interface Props {
  className?: string;
}

/**
 * "Shop by category" — the catalog heads with the most unsubscribed deals,
 * shown as a 3-up tile grid. Each tile deep-links into the search page already
 * filtered to that category. The busiest head carries a "HOT" flag.
 */
const Categories: React.FC<Props> = ({ className = "" }) => {
  const [items, setItems] = useState<DiscoverCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetchTopCategories(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setItems(data);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        console.error("Failed to load discover categories", error);
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Nothing to show — drop the block rather than leave an empty shelf.
  if (!isLoading && items.length === 0) return null;

  return (
    <section className={className}>
      <SectionHeading
        title="Shop by category"
        subtitle={`${
          isLoading ? "Loading categories" : `${items.length} categories`
        } · drill into any tile`}
        action={<SeeAllLink to={CATEGORIES_SEE_ALL} />}
      />

      <div className="tw:grid tw:grid-cols-3 tw:gap-3">
        {isLoading
          ? Array.from({ length: CATEGORIES_LIMIT }, (_, i) => (
              <div key={i}>
                <div className="skeleton-loader tw:aspect-square tw:w-full tw:rounded-2xl" />
                <div className="skeleton-loader tw:mx-auto tw:mt-2 tw:h-3 tw:w-2/3 tw:rounded" />
                <div className="skeleton-loader tw:mx-auto tw:mt-1.5 tw:h-2.5 tw:w-1/2 tw:rounded" />
              </div>
            ))
          : items.map((category, index) => {
              // Stands in for the image both when there is none and when the
              // asset fails to load.
              const monogram = (
                <span className="tw:flex tw:size-16 tw:sm:size-20 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white tw:text-2xl tw:font-bold tw:text-[color:var(--tint-ink)] tw:shadow-sm">
                  {category._initial}
                </span>
              );

              return (
                <Link
                  key={category._id}
                  to={category._link}
                  className="tw:group tw:block"
                >
                  <TintTile
                    index={category._tintIndex}
                    className="tw:aspect-square tw:w-full tw:rounded-2xl tw:transition-[transform,box-shadow] tw:duration-200 tw:group-hover:-translate-y-0.5 tw:group-hover:shadow-md"
                  >
                    {index === 0 ? (
                      <span className="tw:absolute tw:top-1.5 tw:right-1.5 tw:rounded-md tw:bg-white/80 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:tracking-wider tw:text-[color:var(--tint-ink)] tw:uppercase">
                        Hot
                      </span>
                    ) : null}

                    {category.assetId ? (
                      <ImgRender
                        assetId={category.assetId}
                        alt={category._label}
                        size="200"
                        className="tw:size-16 tw:sm:size-20 tw:rounded-xl tw:bg-white tw:object-contain tw:p-1 tw:shadow-sm"
                        fallback={monogram}
                      />
                    ) : (
                      monogram
                    )}
                  </TintTile>

                  <div className="tw:mt-2 tw:truncate tw:text-center tw:text-xs tw:font-semibold tw:text-slate-800">
                    {category._label}
                  </div>
                  <div className="tw:mt-0.5 tw:text-center tw:text-[11px] tw:text-slate-400">
                    {category.totalDeals.toLocaleString("en-IN")} SKUs
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
};

export default Categories;
