import { useEffect, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Minus,
  Plus,
  ScanLine,
  ShoppingCart,
  Tag,
} from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

import DealFilters, {
  matchesDealFilter,
  type DealFilterValue,
} from "./DealFilters";
import type { MatchedDealData } from "./MatchedDeal";

interface Props {
  deals: MatchedDealData[];
  onAdded?: () => void;
  onScanNext?: () => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Product", key: "product", width: "52%", enableSort: true },
  {
    label: "MRP",
    key: "mrp",
    width: "14%",
    isRightAligned: true,
    enableSort: true,
  },
  { label: "Quantity", key: "qty", width: "18%", isCentered: true },
  { label: "Action", key: "action", width: "16%", isCentered: true },
];

const containerStyle = {
  maxHeight: "calc(100vh - 260px)",
};

const DealRow: React.FC<{
  deal: MatchedDealData;
  onAdded?: () => void;
  onScanNext?: () => void;
  onImagePreview?: Props["onImagePreview"];
}> = ({ deal, onAdded, onScanNext, onImagePreview }) => {
  const [qty, setQty] = useState<number>(0);
  const [inCart, setInCart] = useState<boolean>(!!deal.isInCart);
  const [addedQty, setAddedQty] = useState<number>(deal.cartQuantity || 0);
  const appNav = useAppNav();

  useEffect(() => {
    setQty(0);
    setInCart(!!deal.isInCart);
    setAddedQty(deal.cartQuantity || 0);
  }, [deal._id, deal.isInCart, deal.cartQuantity]);

  return (
    <AppTable.Row>
      <AppTable.Cell>
        <div className="tw:flex tw:items-center tw:gap-2.5">
          {deal.images?.[0] ? (
            <button
              type="button"
              onClick={() => onImagePreview?.(deal.images, deal.images[0])}
              className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:rounded-md tw:w-12 tw:h-12 tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
            >
              <ImgRender
                assetId={deal.images[0]}
                alt={deal.name}
                className="tw:max-h-12 tw:max-w-12 tw:object-contain"
              />
            </button>
          ) : (
            <div className="tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:rounded-md tw:w-12 tw:h-12 tw:shrink-0">
              <Box size={20} className="tw:text-gray-300" />
            </div>
          )}

          <div className="tw:flex tw:flex-col tw:gap-1 tw:min-w-0">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2">
              <AppLink
                asLink
                href={
                  deal.isSubscribed
                    ? `/dashboard/inventory/products/view/${deal._id}`
                    : `/dashboard/inventory/subscribe/product-detail/${deal._id}`
                }
                className="tw:text-blue-600 hover:tw:text-blue-800"
              >
                {deal.name}
              </AppLink>
            </div>
            {deal.dealId && (
              <div className="tw:text-[10px] tw:font-mono tw:text-gray-500 tw:truncate">
                {deal.dealId}
              </div>
            )}
            <div className="tw:flex tw:flex-wrap tw:gap-1">
              {deal.brand?.name && (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  <Tag className="tw:w-2.5 tw:h-2.5" />
                  {deal.brand.name}
                </span>
              )}
              {deal.category?.name && (
                <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  {deal.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </AppTable.Cell>

      <AppTable.Cell className="tw:text-right">
        <Amount
          value={deal.mrp || 0}
          className="tw:text-sm tw:font-bold tw:text-blue-700"
        />
      </AppTable.Cell>

      <AppTable.Cell>
        {deal.isSubscribed ? (
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
            <div className="tw:flex tw:items-stretch tw:border tw:border-gray-300 tw:rounded-md tw:overflow-hidden tw:bg-white">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((q) => Math.max(0, q - 1))}
                className="tw:px-2 tw:py-1 tw:text-gray-700 hover:tw:bg-gray-100 active:tw:bg-gray-200 disabled:tw:opacity-40 tw:cursor-pointer"
                disabled={qty <= 0}
              >
                <Minus className="tw:w-3.5 tw:h-3.5" />
              </button>
              <input
                type="number"
                min={0}
                value={qty}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setQty(Number.isNaN(n) || n < 0 ? 0 : n);
                }}
                className="tw:w-9 tw:text-center tw:text-sm tw:font-bold tw:bg-white focus:tw:outline-none"
              />
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((q) => q + 1)}
                className="tw:px-2 tw:py-1 tw:text-gray-700 hover:tw:bg-gray-100 active:tw:bg-gray-200 tw:cursor-pointer"
              >
                <Plus className="tw:w-3.5 tw:h-3.5" />
              </button>
            </div>
          </div>
        )}
      </AppTable.Cell>

      <AppTable.Cell>
        {deal.isSubscribed ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-emerald-700">
            <CheckCircle2 className="tw:w-4 tw:h-4 tw:shrink-0" />
            <AppLink
              asLink
              href={`/dashboard/inventory/products/view/${deal._id}`}
              className="tw:text-xs tw:font-semibold tw:text-emerald-800 hover:tw:text-emerald-900 tw:cursor-pointer"
            >
              Subscribed
            </AppLink>
          </div>
        ) : inCart ? (
          <div className="tw:flex tw:justify-center">
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
                  setAddedQty(qty);
                  setInCart(true);
                  onAdded?.();
                }
              }}
            >
              <ShoppingCart className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
              Subscribe
            </SubscribeBtn>
          </div>
        )}
      </AppTable.Cell>
    </AppTable.Row>
  );
};

const DesktopView: React.FC<Props> = ({
  deals,
  onAdded,
  onScanNext,
  onImagePreview,
}) => {
  const [filter, setFilter] = useState<DealFilterValue>({
    brand: null,
    category: null,
  });
  const [sort, setSort] = useState<{ key: string; value: SortValue }>({
    key: "",
    value: undefined,
  });

  const filteredDeals = deals.filter((deal) => matchesDealFilter(deal, filter));

  const visibleDeals =
    sort.value && sort.key
      ? [...filteredDeals].sort((a, b) => {
          const dir = sort.value === "asc" ? 1 : -1;
          if (sort.key === "mrp") {
            return ((a.mrp || 0) - (b.mrp || 0)) * dir;
          }
          // product name
          return (a.name || "").localeCompare(b.name || "") * dir;
        })
      : filteredDeals;

  return (
    <AppCard noPadding className="tw:overflow-hidden">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-2 tw:bg-emerald-50 tw:border-b tw:border-emerald-100">
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <CheckCircle2 className="tw:w-3.5 tw:h-3.5 tw:text-emerald-600" />
          <span className="tw:text-[11px] tw:font-semibold tw:text-emerald-700">
            {visibleDeals.length} of {deals.length} products found in SK Catalog
          </span>
        </div>
        {onScanNext && (
          <AppButton
            size="small"
            fill="outline"
            color="primary"
            onClick={onScanNext}
            className="tw:font-semibold"
          >
            <ScanLine className="tw:w-4 tw:h-4 tw:mr-1" />
            Scan next
          </AppButton>
        )}
      </div>

      <DealFilters deals={deals} value={filter} onChange={setFilter} />

      <AppTable
        size="sm"
        container
        responsive
        fixedLayout
        stickyHeader
        condensed
        minWidth="720px"
        containerStyle={containerStyle}
      >
        <AppTable.Header>
          <TableHeader
            headers={headers}
            sortKey={sort.key}
            sortValue={sort.value}
            onSort={setSort}
          />
        </AppTable.Header>
        <AppTable.Body>
          {visibleDeals.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length} className="tw:text-center">
                <span className="tw:text-xs tw:text-gray-400">
                  No products match the selected filters
                </span>
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            visibleDeals.map((deal) => (
              <DealRow
                key={deal._id}
                deal={deal}
                onAdded={onAdded}
                onScanNext={onScanNext}
                onImagePreview={onImagePreview}
              />
            ))
          )}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default DesktopView;
