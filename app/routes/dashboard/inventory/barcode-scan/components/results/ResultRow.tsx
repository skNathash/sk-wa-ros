import {
  ArrowRight,
  Box,
  CheckCircle2,
  PlusCircle,
  ShoppingCart,
  Tag,
} from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
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
  row: ScanResultRow;
  onAdded?: () => void;
  onCreateFromAi?: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * A single row of the desktop results table. It carries its own cart state so
 * subscribing one product never re-renders the rest of the list.
 */
const ResultRow: React.FC<Props> = ({
  row,
  onAdded,
  onCreateFromAi,
  onImagePreview,
}) => {
  const { deal, ai } = row;
  const { qty, setQty, inCart, addedQty, onSubscribed } = useResultCart(row);
  const appNav = useAppNav();

  return (
    <AppTable.Row>
      <AppTable.Cell>
        <div className="tw:flex tw:items-start tw:gap-2.5">
          {row.image ? (
            <button
              type="button"
              onClick={() =>
                onImagePreview?.(row.images, row.image, row.useProxy)
              }
              className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:rounded-md tw:w-11 tw:h-11 tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
            >
              <ImgRender
                {...BarcodeScanBulkService.dealImageProps(row.image)}
                alt={row.name}
                useProxy={row.useProxy}
                className="tw:max-h-11 tw:max-w-11 tw:object-contain"
              />
            </button>
          ) : (
            <div className="tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:rounded-md tw:w-11 tw:h-11 tw:shrink-0">
              <Box size={18} className="tw:text-gray-300" />
            </div>
          )}

          <div className="tw:flex tw:flex-col tw:gap-1 tw:min-w-0">
            <div
              title={row.name}
              className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2"
            >
              {deal ? (
                <AppLink
                  asLink
                  href={row.href}
                  className="tw:text-blue-600 hover:tw:text-blue-800"
                >
                  {row.name}
                </AppLink>
              ) : (
                row.name
              )}
            </div>
            {row.dealId && (
              <div className="tw:text-[10px] tw:font-mono tw:text-gray-500 tw:truncate">
                {row.dealId}
              </div>
            )}
            <div className="tw:flex tw:flex-wrap tw:gap-1">
              {row.brandName && (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  <Tag className="tw:w-2.5 tw:h-2.5" />
                  {row.brandName}
                </span>
              )}
              {row.categoryName && (
                <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  {row.categoryName}
                </span>
              )}
              {row.packing && (
                <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:font-medium tw:text-blue-700 tw:bg-blue-50 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  {row.packing}
                </span>
              )}
            </div>
          </div>
        </div>
      </AppTable.Cell>

      <AppTable.Cell>
        <SourceBadge row={row} />
      </AppTable.Cell>

      <AppTable.Cell className="tw:text-right">
        {row.mrp ? (
          <Amount
            value={row.mrp}
            className="tw:text-sm tw:font-bold tw:text-blue-700"
          />
        ) : (
          <span className="tw:text-xs tw:text-gray-400">—</span>
        )}
      </AppTable.Cell>

      <AppTable.Cell>
        {/* Quantity only applies to a fresh SK deal being put in the cart —
            AI rows go through create-and-approve, and owned items are done. */}
        {!deal || row.mine ? (
          <div className="tw:flex tw:justify-center">
            <span className="tw:text-xs tw:text-gray-400">—</span>
          </div>
        ) : inCart ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-emerald-700">
            <CheckCircle2 className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
            <span className="tw:text-xs tw:font-semibold">
              Added{addedQty ? ` ${addedQty}` : ""}
            </span>
          </div>
        ) : (
          <div className="tw:flex tw:justify-center">
            <QtyStepper value={qty} onChange={setQty} />
          </div>
        )}
      </AppTable.Cell>

      <AppTable.Cell>
        {row.mine && deal ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-emerald-700">
            <CheckCircle2 className="tw:w-4 tw:h-4 tw:shrink-0" />
            <AppLink
              asLink
              href={row.href}
              className="tw:text-xs tw:font-semibold tw:text-emerald-800 hover:tw:text-emerald-900 tw:cursor-pointer"
            >
              Subscribed
            </AppLink>
          </div>
        ) : ai ? (
          <div className="tw:flex tw:justify-center">
            <AppButton
              size="small"
              color="success"
              onClick={() => onCreateFromAi?.(ai)}
              className="tw:font-semibold"
            >
              <PlusCircle className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
              Create item
            </AppButton>
          </div>
        ) : inCart ? (
          <div className="tw:flex tw:justify-center">
            <AppButton
              size="small"
              fill="outline"
              color="primary"
              onClick={() =>
                appNav.to("/dashboard/inventory/subscribe/cart?from=barcode-scan")
              }
              className="tw:font-semibold"
            >
              View cart
              <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:ml-1" />
            </AppButton>
          </div>
        ) : (
          deal && (
            <div className="tw:flex tw:justify-center">
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
            </div>
          )
        )}
      </AppTable.Cell>
    </AppTable.Row>
  );
};

export default ResultRow;
