import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import { tintAt } from "~/components/core/tint/tints";
import SeeAllLink from "../SeeAllLink";
import SectionHeading from "../SectionHeading";
import { BRANDS_SEE_ALL } from "../../helper";
import { BRANDS_LIMIT, fetchTopBrands, type DiscoverBrand } from "./helper";

const isAbortError = (error: any) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

interface Props {
  className?: string;
}

/**
 * "Shop by brand" — the brands with the most unsubscribed deals, shown as a
 * 3-up wordmark grid. Each card deep-links into the search page already
 * filtered to that brand.
 */
const Brands: React.FC<Props> = ({ className = "" }) => {
  const [items, setItems] = useState<DiscoverBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetchTopBrands(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setItems(data);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        console.error("Failed to load discover brands", error);
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
        title="Shop by brand"
        subtitle={`${
          isLoading ? "Loading brands" : `${items.length} brands`
        } · drill into any card`}
        action={<SeeAllLink to={BRANDS_SEE_ALL} />}
      />

      <div className="tw:grid tw:grid-cols-3 tw:gap-3">
        {isLoading
          ? Array.from({ length: BRANDS_LIMIT }, (_, i) => (
              <div key={i}>
                <div className="skeleton-loader tw:aspect-square tw:w-full tw:rounded-2xl" />
                <div className="skeleton-loader tw:mx-auto tw:mt-2 tw:h-3 tw:w-2/3 tw:rounded" />
                <div className="skeleton-loader tw:mx-auto tw:mt-1.5 tw:h-2.5 tw:w-1/2 tw:rounded" />
              </div>
            ))
          : items.map((brand) => {
              // Stands in for the logo both when there is none and when the
              // asset fails to load.
              const wordmark = (
                <span className="tw:line-clamp-1 tw:text-center tw:text-sm tw:font-bold tw:break-words tw:text-[color:var(--tint-ink)]">
                  {brand._label}
                </span>
              );

              const tint = tintAt(brand._tintIndex);

              return (
                <Link
                  key={brand._id}
                  to={brand._link}
                  className="tw:group tw:block"
                >
                  {/* Phones: a white card carrying a round wordmark badge. */}
                  <div
                    className="tw:flex tw:flex-col tw:items-center tw:gap-1 tw:rounded-xl tw:border tw:bg-white tw:px-2 tw:py-3 tw:shadow-sm tw:sm:hidden"
                    style={{ borderColor: tint.ring }}
                  >
                    <span
                      className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-white"
                      style={{ background: tint.ink }}
                    >
                      {brand.assetId ? (
                        <ImgRender
                          assetId={brand.assetId}
                          alt={brand._label}
                          size="200"
                          className="tw:h-full tw:w-full tw:object-cover"
                          fallback={brand._short}
                        />
                      ) : (
                        brand._short
                      )}
                    </span>

                    <div
                      className="tw:mt-1 tw:w-full tw:truncate tw:text-center tw:text-xs tw:font-semibold tw:text-slate-800"
                      title={brand._label}
                    >
                      {brand._label}
                    </div>
                    <div className="tw:text-[11px] tw:text-slate-400">
                      {brand.totalDeals.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Tablet and up: the tinted plate, unchanged. */}
                  <div className="tw:hidden tw:sm:block">
                    <TintTile
                      index={brand._tintIndex}
                      className="tw:aspect-square tw:w-full tw:rounded-2xl tw:p-2 tw:transition-[transform,box-shadow] tw:duration-200 tw:group-hover:-translate-y-0.5 tw:group-hover:shadow-md"
                    >
                      {brand.assetId ? (
                        <ImgRender
                          assetId={brand.assetId}
                          alt={brand._label}
                          size="200"
                          className="tw:max-h-full tw:max-w-full tw:object-contain"
                          fallback={wordmark}
                        />
                      ) : (
                        wordmark
                      )}
                    </TintTile>

                    <div
                      className="tw:mt-2 tw:truncate tw:text-center tw:text-xs tw:font-semibold tw:text-slate-800"
                      title={brand._label}
                    >
                      {brand._label}
                    </div>
                    <div className="tw:mt-0.5 tw:text-center tw:text-[11px] tw:text-slate-400">
                      {brand.totalDeals.toLocaleString("en-IN")} SKUs
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
};

export default Brands;
