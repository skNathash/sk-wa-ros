import clsx from "clsx";
import { useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import type { SellerDeal } from "~/types/CommonTypes";

export interface ProductSpecificationsProps {
  /** Formatted seller deal (see SellerCatalogService.formatProductResponse). */
  deal: SellerDeal;
  /** Block heading. */
  title?: string;
  className?: string;
}

interface SpecRow {
  label: string;
  value: React.ReactNode;
}

/** Pack-config entry for a given pack type, e.g. the case the deal ships in. */
const findPack = (deal: any, packType: string) =>
  (deal?._raw?.packConfig || []).find(
    (pack: any) => pack?.packType === packType,
  );

/**
 * "Specifications" — the deal's fixed attributes as a label/value table: pack,
 * tax identity, shelf life, and the buying constraints StoreKing enforces
 * (minimum order quantity, case pack). Rows without data are dropped, and the
 * block hides itself when the deal carries none of them.
 */
const ProductSpecifications = ({
  deal,
  title = "Specifications",
  className,
}: ProductSpecificationsProps) => {
  // Long catalog copy is collapsed to a few lines until the user opens it.
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!deal?._id) return null;

  const raw = (deal as any)?._raw || {};
  const uom = deal.selectedStockUom || "";
  const packageQty = deal.packageQty || 1;
  const casePack = findPack(deal, "Case");
  const innerCasePack = findPack(deal, "InnerCase");

  // Pack size — net weight when the catalog carries it, else the pack config.
  const packSize =
    deal.netWeight ||
    (packageQty > 1 ? `${packageQty} ${uom || "units"}` : uom) ||
    "";

  // Shelf life — days remaining, with the expiry of the oldest lot as context.
  const shelfLifeDays = deal.shelfLifeInfo?.remainingShelfLifeDays;
  const expiryDate = deal.shelfLifeInfo?.expiryDate;

  // Minimum order — the B2B minimum StoreKing sells this deal in.
  const moq = deal.minQty || 0;
  const moqValue = moq * (deal.b2bPrice || deal.price || 0);

  const isVeg = raw.isVeg ?? raw.isVegetarian;
  const storage = raw.storageInstructions || raw.storageCondition || "";

  const rows: SpecRow[] = [
    { label: "Deal ID", value: deal.id || "" },
    { label: "Pack size", value: packSize },
    { label: "HSN code", value: deal.hsn || "" },
    {
      label: "GST rate",
      value: deal.gst
        ? `${deal.gst}%${
            deal.additionalCess ? ` + ${deal.additionalCess}% cess` : ""
          }`
        : "",
    },
    {
      label: "Shelf life",
      value:
        typeof shelfLifeDays === "number" && shelfLifeDays > 0 ? (
          <>
            {shelfLifeDays} days left
            {expiryDate ? (
              <>
                {" · expires "}
                <DateFormat value={expiryDate} />
              </>
            ) : null}
          </>
        ) : (
          ""
        ),
    },
    { label: "Storage", value: storage },
    {
      label: "Vegetarian",
      value: typeof isVeg === "boolean" ? (isVeg ? "Yes" : "No") : "",
    },
    {
      label: "MOQ from SK",
      value: moq ? (
        <>
          {moq} {uom || "units"}
          {moqValue > 0 ? (
            <>
              {" ("}
              <Amount value={moqValue} />
              {" subtotal)"}
            </>
          ) : null}
        </>
      ) : (
        ""
      ),
    },
    {
      label: "Order multiples",
      value: deal.incrQty > 1 ? `${deal.incrQty} ${uom || "units"}` : "",
    },
    {
      label: "Case pack",
      value: casePack?.quantity
        ? `${casePack.quantity} ${uom || "units"} per case`
        : "",
    },
    {
      label: "Inner case",
      value: innerCasePack?.quantity
        ? `${innerCasePack.quantity} ${uom || "units"} per inner case`
        : "",
    },
  ].filter((row) => row.value !== "" && row.value != null);

  const description = String(deal.description || "").trim();
  // Rough "does this overflow three lines" test — cheap enough to avoid
  // measuring the node just to decide whether the toggle is worth showing.
  const isLongDescription =
    description.length > 180 || description.split("\n").length > 3;

  if (rows.length === 0 && !description) return null;

  return (
    <section className={className}>
      <h3 className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
        {rows.map((row, idx) => (
          <div
            key={row.label}
            className={clsx(
              "tw:flex tw:flex-col tw:gap-0.5 tw:px-4 tw:py-3 tw:sm:flex-row tw:sm:items-center tw:sm:gap-4",
              idx > 0 && "tw:border-t tw:border-slate-100",
            )}
          >
            <span className="tw:text-sm tw:text-slate-500 tw:sm:w-40 tw:sm:shrink-0">
              {row.label}
            </span>
            <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Description sits last — it's the longest, least scannable field, so it
          stays clamped to three lines until the user opens it. */}
      {description && (
        <div className="tw:mt-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3">
          <div className="tw:mb-1 tw:text-sm tw:text-slate-500">
            Description
          </div>
          <p
            className={clsx(
              "tw:whitespace-pre-line tw:text-sm tw:leading-relaxed tw:text-slate-900",
              !showFullDescription && isLongDescription && "tw:line-clamp-3",
            )}
          >
            {description}
          </p>
          {isLongDescription && (
            <button
              type="button"
              onClick={() => setShowFullDescription((prev) => !prev)}
              className="tw:mt-1.5 tw:cursor-pointer tw:text-sm tw:font-semibold tw:text-primary"
            >
              {showFullDescription ? "View less" : "View more"}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default ProductSpecifications;
