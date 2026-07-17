import { useMemo, useState } from "react";
import { orderBy } from "lodash";
import { Box, Check } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import ImgRender from "~/components/core/img/ImgRender";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

interface Props {
  items: any[];
  activeBrand?: string | null;
  activeCategory?: string | null;
  onSelectBrand?: (brand: string | null) => void;
  onSelectCategory?: (category: string | null) => void;
  onSubscribed?: () => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Sl No", key: "slno", width: "3.5rem", isCentered: true },
  { label: "Product", key: "name", enableSort: true },
  {
    label: "MRP",
    key: "mrp",
    width: "6rem",
    isRightAligned: true,
    enableSort: true,
  },
  { label: "Category", key: "category", width: "8rem", enableSort: true },
  { label: "Brand", key: "brand", width: "8rem", enableSort: true },
  { label: "Weight", key: "weight", width: "6rem" },
  { label: "Action", width: "8rem", isCentered: true },
];

/** Accessor per sortable column — lodash orderBy iteratees. */
const SORT_ACCESSORS: Record<string, (item: any) => string | number> = {
  name: (item) => (item.name || "").toLowerCase(),
  mrp: (item) => Number(item.mrp) || 0,
  category: (item) => (item.category?.name || "").toLowerCase(),
  brand: (item) => (item.brand?.name || "").toLowerCase(),
};

/**
 * Desktop display for skSuggestedDeals — plain AppTable with a sticky
 * header and client-side column sorting.
 * Items arrive already brand-filtered and sorted by SkSuggestedDeals.
 */
const DesktopView: React.FC<Props> = ({
  items,
  activeBrand,
  activeCategory,
  onSelectBrand,
  onSelectCategory,
  onSubscribed,
  onImagePreview,
}) => {
  const [sortKey, setSortKey] = useState<string>("");
  const [sortValue, setSortValue] = useState<SortValue>("asc");

  const sorted = useMemo(() => {
    const accessor = SORT_ACCESSORS[sortKey];
    if (!accessor) return items;
    return orderBy(items, [accessor], [sortValue === "desc" ? "desc" : "asc"]);
  }, [items, sortKey, sortValue]);

  return (
    <AppTable
      container
      responsive
      stickyHeader
      containerStyle={{ maxHeight: "60vh" }}
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          sortValue={sortValue}
          onSort={({ key, value }) => {
            setSortKey(key);
            setSortValue(value);
          }}
        />
      </AppTable.Header>
      <AppTable.Body>
        {sorted.map((item, index) => (
          <DealRow
            key={item._id}
            item={item}
            slNo={index + 1}
            activeBrand={activeBrand}
            activeCategory={activeCategory}
            onSelectBrand={onSelectBrand}
            onSelectCategory={onSelectCategory}
            onSubscribed={onSubscribed}
            onImagePreview={onImagePreview}
          />
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

const DealRow: React.FC<{
  item: any;
  slNo: number;
  activeBrand?: string | null;
  activeCategory?: string | null;
  onSelectBrand?: (brand: string | null) => void;
  onSelectCategory?: (category: string | null) => void;
  onSubscribed?: () => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}> = ({
  item,
  slNo,
  activeBrand,
  activeCategory,
  onSelectBrand,
  onSelectCategory,
  onSubscribed,
  onImagePreview,
}) => {
  const [inCart, setInCart] = useState(!!item.isInCart);

  const categoryName = item.category?.name;
  const brandName = item.brand?.name;
  const isCategoryActive = !!categoryName && categoryName === activeCategory;
  const isBrandActive = !!brandName && brandName === activeBrand;

  return (
    <AppTable.Row>
      <AppTable.Cell className="tw:text-center">
        <span className="tw:text-xs tw:text-gray-600">{slNo}</span>
      </AppTable.Cell>
      <AppTable.Cell>
        <div className="tw:flex tw:items-center tw:gap-2">
          {item.images?.[0] ? (
            <button
              type="button"
              onClick={() => onImagePreview?.(item.images, item.images[0])}
              className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:bg-gray-50 tw:rounded-md tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
            >
              <ImgRender
                assetId={item.images[0]}
                alt={item.name}
                className="tw:max-h-10 tw:max-w-10 tw:object-contain"
              />
            </button>
          ) : (
            <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:bg-gray-50 tw:rounded-md tw:shrink-0">
              <Box size={18} className="tw:text-gray-300" />
            </div>
          )}
          <div className="tw:min-w-0">
            <div
              title={item.name}
              className="tw:text-xs tw:font-medium tw:text-gray-900 tw:line-clamp-2"
            >
              {item.name}
            </div>
            {item.dealId && (
              <div className="tw:text-[10px] tw:font-mono tw:text-gray-500 tw:truncate">
                {item.dealId}
              </div>
            )}
          </div>
        </div>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-right">
        <Amount
          value={item.mrp || 0}
          className="tw:text-sm tw:font-bold tw:text-blue-700"
        />
      </AppTable.Cell>
      <AppTable.Cell>
        {categoryName ? (
          <button
            type="button"
            title={`Filter by ${categoryName}`}
            onClick={() =>
              onSelectCategory?.(isCategoryActive ? null : categoryName)
            }
            className={`tw:cursor-pointer tw:inline-block tw:max-w-full tw:truncate tw:text-[10px] tw:font-medium tw:rounded-full tw:px-1.5 tw:py-0.5 tw:transition-colors ${
              isCategoryActive
                ? "tw:bg-blue-600 tw:text-white"
                : "tw:bg-gray-100 tw:text-gray-600 tw:hover:bg-blue-50 tw:hover:text-blue-700"
            }`}
          >
            {categoryName}
          </button>
        ) : (
          "-"
        )}
      </AppTable.Cell>
      <AppTable.Cell>
        {brandName ? (
          <button
            type="button"
            title={`Filter by ${brandName}`}
            onClick={() => onSelectBrand?.(isBrandActive ? null : brandName)}
            className={`tw:cursor-pointer tw:inline-block tw:max-w-full tw:truncate tw:text-[10px] tw:font-medium tw:rounded-full tw:px-1.5 tw:py-0.5 tw:transition-colors ${
              isBrandActive
                ? "tw:bg-blue-600 tw:text-white"
                : "tw:bg-gray-100 tw:text-gray-600 tw:hover:bg-blue-50 tw:hover:text-blue-700"
            }`}
          >
            {brandName}
          </button>
        ) : (
          "-"
        )}
      </AppTable.Cell>
      <AppTable.Cell>
        <span className="tw:text-xs tw:text-gray-700">
          {item.quantity
            ? `${item.quantity} ${item.unit || ""}`.trim()
            : item.netWeight || "-"}
        </span>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-center">
        {inCart ? (
          <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-semibold tw:text-green-600">
            <Check className="tw:w-3.5 tw:h-3.5" strokeWidth={3} />
            In cart
          </span>
        ) : (
          <SubscribeBtn
            dealId={item._id}
            dealName={item.name}
            mrp={item.mrp}
            price={item.price}
            images={item.images || []}
            size="small"
            color="success"
            className="tw:px-3"
            callback={(r) => {
              if (r.action === "subscribed") {
                setInCart(true);
                onSubscribed?.();
              }
            }}
          >
            Subscribe
          </SubscribeBtn>
        )}
      </AppTable.Cell>
    </AppTable.Row>
  );
};

export default DesktopView;
