import {
  ArrowRight,
  Barcode,
  Box,
  CheckCircle2,
  PlusCircle,
  ShoppingCart,
} from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import BarcodeScanBulkService from "~/services/BarcodeScanBulkService";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

import type { AiSuggestedProduct } from "../../helper";
import QtyStepper from "./QtyStepper";
import SourceBadge from "./SourceBadge";
import useResultCart from "./useResultCart";
import type { ScanResultRow } from "./helper";

interface Props {
  rows: ScanResultRow[];
  onAdded?: () => void;
  onCreateFromAi?: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/** Accent rail down the left edge — the card's at-a-glance source cue. */
const ACCENT: Record<string, string> = {
  mine: "tw:bg-slate-300",
  ai: "tw:bg-violet-400",
  sk: "tw:bg-emerald-500",
};

const ResultCard: React.FC<{
  row: ScanResultRow;
  onAdded?: () => void;
  onCreateFromAi?: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}> = ({ row, onAdded, onCreateFromAi, onImagePreview }) => {
  const { deal, ai } = row;
  const { qty, setQty, inCart, addedQty, onSubscribed } = useResultCart(row);
  const appNav = useAppNav();

  const subline = [row.brandName, row.categoryName].filter(Boolean).join(" · ");
  const hasOffer = !!row.price && !!row.mrp && row.price < row.mrp;

  return (
    <div className="tw:flex tw:mb-0 tw:overflow-hidden tw:border-b tw:border-gray-200 tw:bg-white">
      <div
        className={`tw:w-1 tw:shrink-0 ${ACCENT[row.mine ? "mine" : row.source]}`}
      />

      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-2.5 tw:p-3">
        <div className="tw:flex tw:items-start tw:gap-3">
          {row.image ? (
            <button
              type="button"
              onClick={() =>
                onImagePreview?.(row.images, row.image, row.useProxy)
              }
              className="tw:cursor-pointer tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-gray-50 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
            >
              <ImgRender
                {...BarcodeScanBulkService.dealImageProps(row.image)}
                alt={row.name}
                useProxy={row.useProxy}
                className="tw:max-h-14 tw:max-w-14 tw:object-contain"
              />
            </button>
          ) : (
            <div className="tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-gray-50">
              <Box size={22} className="tw:text-gray-300" />
            </div>
          )}

          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
            <div
              title={row.name}
              className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900 tw:line-clamp-2"
            >
              {deal ? (
                <AppLink asLink href={row.href} className="tw:text-gray-900">
                  {row.name}
                </AppLink>
              ) : (
                row.name
              )}
            </div>

            {subline && (
              <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                {subline}
              </div>
            )}

            {row.dealId && (
              <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-mono tw:text-gray-500">
                <Barcode className="tw:w-3 tw:h-3 tw:shrink-0" />
                <span className="tw:truncate">{row.dealId}</span>
              </div>
            )}

            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:pt-0.5">
              <SourceBadge row={row} />
              {row.packing && (
                <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-blue-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-blue-700">
                  {row.packing}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex tw:min-w-0 tw:items-baseline tw:gap-1.5">
            {hasOffer ? (
              <>
                <Amount
                  value={row.price!}
                  className="tw:text-base tw:font-bold tw:text-emerald-700"
                />
                <span className="tw:text-[11px] tw:text-gray-400 tw:line-through">
                  MRP <Amount value={row.mrp!} />
                </span>
              </>
            ) : row.mrp ? (
              <>
                <span className="tw:text-[10px] tw:uppercase tw:text-gray-500">
                  MRP
                </span>
                <Amount
                  value={row.mrp}
                  className="tw:text-base tw:font-bold tw:text-blue-700"
                />
              </>
            ) : (
              <span className="tw:text-xs tw:text-gray-400">
                No price on record
              </span>
            )}
          </div>

          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
            {/* Quantity only applies to a fresh SK deal being put in the cart —
                AI rows go through create-and-approve, owned items are done. */}
            {deal && !row.mine && !inCart && (
              <QtyStepper value={qty} onChange={setQty} size="md" />
            )}

            {row.mine && deal ? (
              <AppLink
                asLink
                href={row.href}
                className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-emerald-800 hover:tw:text-emerald-900"
              >
                <CheckCircle2 className="tw:w-4 tw:h-4 tw:shrink-0" />
                Subscribed
              </AppLink>
            ) : ai ? (
              <AppButton
                size="small"
                color="success"
                onClick={() => onCreateFromAi?.(ai)}
                className="tw:font-semibold"
              >
                <PlusCircle className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
                Create item
              </AppButton>
            ) : inCart ? (
              <div className="tw:flex tw:flex-col tw:items-end tw:gap-1">
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700">
                  <CheckCircle2 className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
                  Added{addedQty ? ` ${addedQty}` : ""}
                </span>
                <AppButton
                  size="small"
                  fill="outline"
                  color="primary"
                  onClick={() =>
                    appNav.to(
                      "/dashboard/inventory/subscribe/cart?from=barcode-scan",
                    )
                  }
                  className="tw:font-semibold"
                >
                  View cart
                  <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:ml-1" />
                </AppButton>
              </div>
            ) : (
              deal && (
                <SubscribeBtn
                  dealId={deal._id}
                  dealName={deal.name}
                  mrp={deal.mrp}
                  price={deal.price}
                  images={deal.images || []}
                  quantity={qty}
                  size="small"
                  className="tw:font-semibold"
                  callback={(r) => {
                    if (r.action === "subscribed") {
                      onSubscribed();
                      onAdded?.();
                    }
                  }}
                >
                  <ShoppingCart className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
                  Subscribe
                </SubscribeBtn>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Phone display of the scan results — the same rows the desktop table shows,
 * one card each, already filtered by the chips above. The cards run edge to
 * edge (the parent bleeds out of the page gutter) and stack flush with no gap
 * between them, so a hairline below each row is the only separator.
 */
const MobileView: React.FC<Props> = ({
  rows,
  onAdded,
  onCreateFromAi,
  onImagePreview,
}) => {
  if (rows.length === 0)
    return (
      <div className="tw:px-3 tw:py-8 tw:text-center tw:text-xs tw:text-gray-400">
        Nothing in this bucket for the scanned code
      </div>
    );

  return (
    <div className="tw:flex tw:flex-col tw:bg-gray-50">
      {rows.map((row) => (
        <ResultCard
          key={row.key}
          row={row}
          onAdded={onAdded}
          onCreateFromAi={onCreateFromAi}
          onImagePreview={onImagePreview}
        />
      ))}
    </div>
  );
};

export default MobileView;
