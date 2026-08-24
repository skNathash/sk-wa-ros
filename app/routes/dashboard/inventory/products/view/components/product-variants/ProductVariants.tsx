import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import useAppNav from "~/hooks/useAppNav";
import type { SellerDeal } from "~/types/CommonTypes";
import { collectGroupValues, getVariants, type ProductVariant } from "./helper";

export interface ProductVariantsProps {
  /** Formatted seller deal (see SellerCatalogService.formatProductResponse). */
  deal: SellerDeal;
  /** Block heading. */
  title?: string;
  className?: string;
}

/**
 * "Available variants" — the sibling deals this product is grouped with (pack
 * sizes, weights, flavours), each with its buying constraints and B2B price.
 * The variant being viewed is highlighted, variants already in the seller's
 * catalog are flagged, and a row opens either the seller's own item page or the
 * subscribe detail page depending on which side the variant sits on.
 */
const ProductVariants = ({
  deal,
  title = "Available Variants",
  className,
}: ProductVariantsProps) => {
  const appNav = useAppNav();

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const groupCount = collectGroupValues(deal).length;
  /** Catalog object id — what both detail routes are keyed on. */
  const dealId = deal?._id;

  useEffect(() => {
    if (!groupCount) {
      setVariants([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    getVariants(deal, controller.signal)
      .then((rows) => setVariants(rows))
      .finally(() => setLoading(false));

    return () => controller.abort();
    // Group values are fixed for a given deal — refetch only when it changes.
  }, [dealId, groupCount]);

  if (!dealId || groupCount === 0) return null;

  const rows = variants.length
    ? variants
    : // Placeholder rows so the block keeps its shape while detail loads.
      collectGroupValues(deal).map((value: any) => ({
        objId: value._id,
        dealId: value.dealId,
        label: value.csa || value.name || "--",
        groupedOn: value.groupedOn || "",
        meta: "",
        price: 0,
        inCatalog: !!value.isSubscribed,
      }));

  // Both detail routes take the catalog object id: the seller's item page
  // looks the deal up by it (getDetails filters on `dealId`), and the subscribe
  // detail page is keyed on it directly. The readable id is display-only.
  const handleOpen = (variant: ProductVariant) => {
    if (!variant.objId || variant.objId === dealId) return;
    appNav.to(
      variant.inCatalog
        ? `/dashboard/inventory/products/view/${variant.objId}`
        : `/dashboard/inventory/subscribe/product-detail/${variant.objId}`,
    );
  };

  return (
    <section className={className}>
      <h3 className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      <div className="tw:flex tw:flex-col tw:gap-2">
        {rows.map((variant) => {
          const isCurrent = variant.objId === dealId;

          return (
            <button
              key={variant.objId || variant.dealId}
              type="button"
              onClick={() => handleOpen(variant)}
              className={clsx(
                "tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:px-4 tw:py-3 tw:text-left tw:transition-colors",
                isCurrent
                  ? "tw:border-primary tw:bg-[color-mix(in_srgb,var(--primary)_8%,white)]"
                  : "tw:border-slate-200 tw:bg-white hover:tw:border-slate-300 hover:tw:bg-slate-50",
              )}
            >
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                  {variant.label}
                </div>
                {variant.meta ? (
                  <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
                    {variant.meta}
                  </div>
                ) : loading ? (
                  <div className="tw:mt-1 tw:h-3 tw:w-24 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                ) : null}
              </div>

              {variant.inCatalog && (
                <span
                  className={clsx(
                    "tw:shrink-0 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide",
                    isCurrent
                      ? "tw:text-slate-600"
                      : "tw:rounded tw:bg-emerald-50 tw:px-2 tw:py-1 tw:text-emerald-700",
                  )}
                >
                  In your catalog
                </span>
              )}

              {isCurrent && (
                <span className="tw:shrink-0 tw:rounded tw:bg-primary tw:px-2 tw:py-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white">
                  Viewing
                </span>
              )}

              <span className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-slate-900">
                {variant.price > 0 ? (
                  <Amount value={variant.price} decimalPlaces={0} />
                ) : loading ? (
                  <span className="tw:block tw:h-4 tw:w-10 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                ) : (
                  "--"
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProductVariants;
