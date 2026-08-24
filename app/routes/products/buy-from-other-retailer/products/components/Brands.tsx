import { useEffect, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import { withTileDecor, type TileDecor } from "~/components/core/tint/tints";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import SellerCatalogService from "~/services/SellerCatalogService";

/** Label, ink and initial are attached to the list as it comes back. */
type Brand = TileDecor & {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
  /** network deals available under this brand */
  dealsCount?: number;
};

type Props = {
  distance?: number | string;
  /** Outer spacing — the callers that grid this beside Menus clear it. */
  className?: string;
};

/** Tiles per row: four across a full-width block, three inside a grid column. */
const TILE_GRID = "tw:grid tw:grid-cols-4 tw:lg:grid-cols-3 tw:gap-3 tw:md:gap-4";

const Brands = ({
  distance = DEFAULT_BROWSE_DISTANCE,
  className = "tw:mb-6",
}: Props) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const [brands, setBrands] = useState<Brand[]>([]);
  // Network-wide brand count — the rail only carries the busiest 20.
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setBrands([]);
    setTotal(0);

    const fetchBrands = async () => {
      try {
        // The count must not hold back the rail, so both go out together.
        const [response, countResponse] = await Promise.all([
          SellerCatalogService.getNetworkBrands(
            {
              page: 1,
              limit: 20,
            },
            distance,
          ),
          SellerCatalogService.getNetworkBrands(
            { outputType: "count" },
            distance,
          ),
        ]);
        // Label, ink and initial are resolved here, once, so the tiles below
        // have nothing left to compute per render.
        const formatted: Brand[] = withTileDecor(
          SellerCatalogService.formatBrandResponse(response.data?.data || []),
        );
        // Busiest brands first — they are the ones worth the leading slides.
        setBrands(
          [...formatted].sort(
            (a, b) => (b.dealsCount || 0) - (a.dealsCount || 0),
          ),
        );
        setTotal(countResponse.data?.count || formatted.length);
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [distance]);

  const handleBrandClick = (brand: Brand) => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      brandId: brand._id,
      brandName: brand.name,
      distance,
    });
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
          <Skeleton className="tw:h-3 tw:w-28" />
        </div>
        <div className={TILE_GRID}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="tw:aspect-square tw:w-full tw:rounded-2xl" />
              <Skeleton className="tw:mx-auto tw:mt-2 tw:h-3 tw:w-3/4" />
              <Skeleton className="tw:mx-auto tw:mt-1.5 tw:h-2.5 tw:w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!brands || brands.length === 0) return null;

  // Two full rows either way — 8 across four mobile columns, 6 across three
  // desktop ones. The rest are reachable via "See all".
  const visibleBrands = isMobile ? brands.slice(0, 8) : brands.slice(0, 6);

  return (
    <div className={className}>
      <div className="tw:mb-3 tw:flex tw:items-baseline tw:justify-between tw:gap-2">
        <div className="tw:flex tw:items-baseline tw:gap-2">
          <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
            Shop by Brands
          </h2>
          {total > 0 && (
            <span className="tw:text-xs tw:text-slate-400">
              {total} {total === 1 ? "brand" : "brands"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            appNav.to("/products/buy-from-other-retailer/products/brands", {
              distance,
            })
          }
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          See all <span aria-hidden>→</span>
        </button>
      </div>

      {/* Always a wrapping grid — no slider. */}
      <div className={TILE_GRID}>
        {visibleBrands.map((brand) => {
          // A logo-less brand falls back to its own name as a tinted wordmark.
          const wordmark = (
            <span
              className="tw:line-clamp-2 tw:px-2 tw:font-serif tw:text-base tw:md:text-xl tw:font-bold tw:leading-tight tw:select-none"
              style={{ color: brand._ink }}
            >
              {brand._label}
            </span>
          );

          return (
            <button
              key={brand._id}
              type="button"
              onClick={() => handleBrandClick(brand)}
              title={brand._label}
              aria-label={brand._label}
              className="tw:group tw:block tw:w-full tw:cursor-pointer tw:text-center focus:tw:outline-none"
            >
              <div className="tw:flex tw:aspect-square tw:w-full tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:p-3 tw:shadow-sm tw:transition tw:duration-200 tw:group-hover:shadow-md">
                {brand._displayImg ? (
                  <ImgRender
                    assetId={brand._displayImg}
                    alt={brand._label}
                    width={200}
                    className="tw:max-h-full tw:max-w-full tw:object-contain"
                    fallback={wordmark}
                  />
                ) : (
                  wordmark
                )}
              </div>

              <div className="tw:mt-2 tw:line-clamp-1 tw:text-xs tw:md:text-[13px] tw:font-medium tw:text-slate-700 tw:transition-colors tw:group-hover:text-primary">
                {brand._label}
              </div>
              {brand.dealsCount ? (
                <div className="tw:mt-0.5 tw:text-[11px] tw:text-slate-400">
                  {brand.dealsCount} SKUs
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Brands;
