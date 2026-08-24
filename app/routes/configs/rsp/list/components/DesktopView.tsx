import clsx from "clsx";
import { CheckCircle, Layers, PencilLine } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { Checkbox } from "~/components/ui/checkbox";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import CommonService from "~/services/CommonService";
import SchemePopover from "~/shared/catalog/components/SchemePopover";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import {
  colorFor,
  Monogram,
} from "~/shared/catalog/components/competitor-price/CompetitorPrice";
import MarketVerdict from "~/shared/catalog/components/competitor-price/MarketVerdict";
import OtherCompetitorsPopover from "~/shared/catalog/components/competitor-price/OtherCompetitorsPopover";
import type {
  NetworkGroupPrice,
  SellerDeal,
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import {
  PRICE_COMPARISON_DISTANCE,
  type PeerRange,
  type PriceGroupColumn,
} from "../helper";
import GroupPriceCell, { groupTone } from "./GroupPriceCell";
import PeerRangeBar from "./PeerRangeBar";

// DesktopView component with LoadMoreButton integration

export interface DesktopViewProps {
  loading?: boolean;
  data: (SellerDeal & { _priceSlab?: any })[];
  callback?: (args: { action: string; data?: SellerDeal }) => void;
  /** Outcome of an inline price edit — the row is patched by the host. */
  onPriceResult?: (result: InlinePriceResult) => void;
  sortKey?: string;
  onSort?: (sort: SortProps) => void;
  sortValue?: SortValue;
  type?: "network" | "customer";
  showOnlinePrices?: boolean;
  /** Buyer groups to render a price column for (B2B only). */
  priceGroups?: PriceGroupColumn[];
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: (event?: any) => void;
  totalCount?: number;
  loadedCount: number;
  /** Deal ids currently picked for the bulk price setter. */
  selectedIds?: Set<string>;
  onSelectChange?: (deal: any, checked: boolean) => void;
  /** Selects / clears every row currently listed. */
  onSelectAllChange?: (checked: boolean) => void;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

type MarginTone = "high" | "mid" | "low";

// Margin badge — healthy / thin / at risk, banded in the row helper.
const MARGIN_TONE: Record<MarginTone, string> = {
  high: "tw:bg-emerald-50 tw:text-emerald-700",
  mid: "tw:bg-amber-50 tw:text-amber-700",
  low: "tw:bg-red-50 tw:text-red-700",
};

// The group price a deal carries for one buyer group, from the deal's
// `networkGroupPrices` (prepared by SellerCatalogService.formatProductResponse).
const findGroupPrice = (
  deal: SellerDeal,
  groupId: string,
): NetworkGroupPrice | undefined =>
  (deal.networkGroupPrices || []).find((group) => group.id === groupId);

// Renders a marketplace (Flipkart/Amazon) price. If the partner carries a
// listing `url` the value becomes a button that opens it; otherwise it's plain.
const CompetitorPriceValue: React.FC<{
  partner: { price: number; isLowest?: boolean; url?: string };
}> = ({ partner }) => {
  const amount = (
    <Amount
      value={partner.price}
      className={clsx(
        "tw:whitespace-nowrap tw:tabular-nums tw:text-sm",
        partner.isLowest
          ? "tw:font-bold tw:text-green-700"
          : "tw:font-medium tw:text-gray-600",
      )}
    />
  );

  if (!partner.url) return amount;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        CommonService.openInNewWindow(partner.url);
      }}
      className="tw:cursor-pointer tw:transition-opacity hover:tw:opacity-70"
    >
      {amount}
    </button>
  );
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading = false,
  data,
  callback,
  onPriceResult,
  sortKey = "",
  onSort = () => {},
  sortValue = "asc",
  type = "customer",
  showOnlinePrices = true,
  priceGroups = [],
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  selectedIds,
  onSelectChange,
  onSelectAllChange,
}) => {
  const { t } = useTranslation(["common"]);

  // Bulk selection is opt-in: without a handler the table renders as before.
  const selectable = !!onSelectChange;
  const allSelected =
    selectable &&
    data.length > 0 &&
    data.every((deal) => selectedIds?.has(deal._id || deal.id));

  // Competitor benchmark columns are driven by the "Show online prices" checkbox.
  const showCompetitorPrice = showOnlinePrices;

  // Flipkart and Amazon are hardcoded marketplace benchmark columns, read
  // directly from each deal's partnerPriceData.
  const competitorHeaders: TableHeaderItem[] = showCompetitorPrice
    ? [
        ...["Flipkart", "Amazon"].map((name) => ({
          label: (
            <span className="tw:inline-flex tw:items-center tw:gap-1.5">
              <Monogram label={name} color={colorFor(name)} />
              {name}
            </span>
          ),
          key: `competitor:${name}`,
          enableSort: false,
          isCentered: true,
          width: "6%",
        })),
        {
          label: (
            <span className="tw:inline-flex tw:items-center tw:gap-1.5">
              <Monogram label="Other" color={colorFor("Other")} />
              Other Online Price
            </span>
          ),
          key: "competitor:Other",
          enableSort: false,
          isCentered: true,
          width: "7%",
        },
      ]
    : [];

  // One column per configured buyer group, next to the deal's own B2B price.
  // Only B2B carries group prices, so the list arrives empty on B2C.
  const groupColumns = priceGroups;

  const groupHeaders: TableHeaderItem[] = groupColumns.map((group, index) => ({
    label: (
      <span className="tw:inline-flex tw:flex-col tw:items-center">
        <span
          className={clsx(
            "tw:whitespace-nowrap tw:font-bold tw:uppercase tw:tracking-wide",
            groupTone(group.toneIndex ?? index).header,
          )}
        >
          {group.name}
        </span>
        {group.sellersCount > 0 && (
          <span className="tw:text-[10px] tw:font-normal tw:text-gray-400">
            {group.sellersCount}{" "}
            {group.sellersCount === 1 ? "retailer" : "retailers"}
          </span>
        )}
      </span>
    ),
    key: `priceGroup:${group.id}`,
    enableSort: false,
    isCentered: true,
    width: "8%",
  }));

  const tableHeaders: TableHeaderItem[] = [
    ...(selectable
      ? [
          {
            label: (
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked: any) =>
                  onSelectAllChange?.(checked === true)
                }
                aria-label="Select all listed products"
                className="tw:border-gray-400"
              />
            ),
            key: "select",
            enableSort: false,
            width: "3%",
          },
        ]
      : []),
    { label: "#", key: "sl", width: "2%" },
    // Category now reads under the product name, so it has no column of its own.
    { label: t("product"), key: "dealName", enableSort: true, width: "22%" },
    {
      label: t("purchasePrice"),
      key: "purchasePrice",
      enableSort: true,
      isCentered: true,
      width: "6%",
    },
    {
      label: t("mrp"),
      key: "mrp",
      enableSort: true,
      isCentered: true,
      width: "6%",
    },
    {
      label: type === "network" ? t("b2bPrice") : t("b2cPrice"),
      key: "price",
      enableSort: true,
      isCentered: true,
      width: "9%",
    },
    {
      label: type === "network" ? t("margin") : t("discount"),
      key: "margin",
      enableSort: false,
      isCentered: true,
      width: "6%",
    },
    {
      label: `Near By Retailers (${PRICE_COMPARISON_DISTANCE}km)`,
      key: "peer",
      enableSort: false,
      isCentered: true,
      width: "10%",
    },
    ...groupHeaders,
    ...competitorHeaders,
    {
      label: t("stock"),
      key: "maxQty",
      enableSort: true,
      isCentered: true,
      width: "6%",
    },
    {
      label: t("inventoryValue"),
      key: "inventoryValue",
      enableSort: false,
      isCentered: true,
      width: "7%",
    },
    {
      label: t("stockVelocity"),
      key: "movementType",
      enableSort: false,
      isCentered: true,
      width: "8%",
    },
  ];

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      minWidth={`${1400 + groupColumns.length * 110}px`}
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader
          headers={tableHeaders}
          sortKey={sortKey}
          onSort={onSort}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={tableHeaders.length} rows={20} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={tableHeaders.length}
              className="tw:text-center"
            >
              No data available
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((deal, index) => (
            <AppTable.Row
              key={deal._id || deal.id || index}
              id={`rsp-row-${deal._id || deal.id || index}`}
              onClick={() => callback?.({ action: "rowClick", data: deal })}
              className={clsx(
                "tw:cursor-pointer",
                (deal as any).priceSlabUpdatedAnimate
                  ? "duplicate-animate"
                  : "",
              )}
            >
              {selectable && (
                <AppTable.Cell>
                  {/* Row clicks open the detail — keep the checkbox its own hit area. */}
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="tw:inline-flex"
                  >
                    <Checkbox
                      checked={selectedIds?.has(
                        deal._id || (deal.id as string),
                      )}
                      onCheckedChange={(checked) =>
                        onSelectChange?.(deal, checked === true)
                      }
                      aria-label={`Select ${deal.name}`}
                      className="tw:border-gray-400"
                    />
                  </span>
                </AppTable.Cell>
              )}
              <AppTable.Cell>{index + 1}</AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-start tw:gap-2">
                  <div
                    className={`tw:w-2 tw:h-2 tw:rounded-full tw:mt-2 ${
                      deal.status === "Active"
                        ? "tw:bg-green-500"
                        : "tw:bg-red-500"
                    }`}
                  ></div>
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${deal._id}/pricing`}
                    className="tw:font-medium tw:flex-1"
                  >
                    {deal.name}
                  </AppLink>
                </div>
                {/* Category reads right under the name — it no longer has a
                    column of its own, which frees the width for group prices. */}
                {deal.category?.name && (
                  <div className="tw:mt-0.5 tw:pl-4 tw:text-xs tw:text-slate-500">
                    {deal.category.name}
                  </div>
                )}
                <div className="tw:text-xs tw:my-1.5 tw:flex tw:items-center tw:gap-2">
                  <code className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-md tw:text-slate-600">
                    {deal.id}
                  </code>

                  <span className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-md tw:text-slate-600">
                    {deal.brand?.name}
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <DisplayPrice
                  price={deal.purchasePrice || 0}
                  uom={(deal as any).selectedStockUom}
                  decimalPlaces={2}
                  className="tw:text-amber-600 tw:font-semibold tw:whitespace-nowrap"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <DisplayPrice
                  price={deal.mrp}
                  uom={(deal as any).selectedStockUom}
                  decimalPlaces={2}
                  className="tw:font-semibold tw:whitespace-nowrap"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center tw:bg-blue-50">
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-2">
                  {/* Price is edited where it is read — the field writes the
                      fixed price itself; the Edit button below still opens the
                      full config modal (margin mode, history, competitors). */}
                  <InlinePriceEdit
                    dealId={deal._id || (deal.id as string)}
                    type={type === "network" ? "b2b" : "b2c"}
                    price={
                      type === "network"
                        ? deal.b2bPrice || 0
                        : deal.b2cPrice || 0
                    }
                    callback={onPriceResult}
                    onEdit={() => callback?.({ action: "edit", data: deal })}
                    aria-label={`${
                      type === "network" ? "B2B" : "B2C"
                    } price for ${deal.name}`}
                    className="tw:w-[130px]"
                    inputClassName="tw:text-center"
                  />
                  {showCompetitorPrice && (
                    <MarketVerdict
                      partnerPriceData={deal.partnerPriceData}
                      price={
                        type === "network"
                          ? deal.b2bPrice || 0
                          : deal.b2cPrice || 0
                      }
                    />
                  )}
                  <div className="tw:inline-flex tw:items-center tw:divide-x tw:divide-gray-200 tw:rounded-md tw:border tw:border-gray-200 tw:bg-white">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback?.({ action: "edit", data: deal });
                      }}
                      className="tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-gray-600 hover:tw:bg-blue-50 hover:tw:text-blue-600 tw:cursor-pointer tw:transition-colors tw:first:rounded-l-md tw:last:rounded-r-md"
                    >
                      <PencilLine size={12} />
                      Edit
                    </button>

                    {type === "network" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback?.({ action: "editPriceSlab", data: deal });
                        }}
                        title={
                          deal?._priceSlab?.isAvailable
                            ? "Price slabs configured"
                            : "No price slabs configured"
                        }
                        className="tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-gray-600 hover:tw:bg-blue-50 hover:tw:text-blue-600 tw:cursor-pointer tw:transition-colors tw:first:rounded-l-md tw:last:rounded-r-md"
                      >
                        <Layers size={12} />
                        Slabs
                        <span
                          className={clsx(
                            "tw:ml-0.5 tw:h-1.5 tw:w-1.5 tw:rounded-full",
                            deal?._priceSlab?.isAvailable
                              ? "tw:bg-green-500"
                              : "tw:bg-gray-300",
                          )}
                        ></span>
                      </button>
                    )}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center tw:font-semibold">
                {(deal as any)._discountType === "Fixed" ? (
                  <AppBadge variant="warning">Fixed</AppBadge>
                ) : (
                  <span
                    className={clsx(
                      "tw:inline-flex tw:rounded-md tw:px-2 tw:py-0.5 tw:text-sm tw:font-bold tw:tabular-nums",
                      MARGIN_TONE[(deal as any)._marginTone as MarginTone] ||
                        MARGIN_TONE.low,
                    )}
                  >
                    {(deal as any)._marginLabel}
                  </span>
                )}

                {deal.b2bScheme?.status === "Running" && (
                  <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
                    <AppBadge variant="success" className="tw:text-green-600">
                      <CheckCircle size={12} />
                      Scheme is Active
                    </AppBadge>
                    <SchemePopover
                      discount={deal.b2bScheme?.offerDiscount || 0}
                      offerStartDate={deal.b2bScheme?.offerStartDate || ""}
                      offerEndDate={deal.b2bScheme?.offerEndDate || ""}
                      status={deal.b2bScheme?.status || ""}
                      statusColor={deal.b2bScheme?.statusColor || "light"}
                    />
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <PeerRangeBar peer={(deal as any)._peer as PeerRange} />
              </AppTable.Cell>
              {groupColumns.map((group, groupIndex) => {
                const groupPrice = findGroupPrice(deal, group.id);
                return (
                  <AppTable.Cell
                    key={group.id}
                    className={clsx(
                      "tw:text-center",
                      // One hairline separates the group block from the rest.
                      groupIndex === 0 && "tw:border-l tw:border-slate-200",
                    )}
                  >
                    <GroupPriceCell
                      dealId={deal._id || (deal.id as string)}
                      sellerDealObjId={(deal as any).sellerDealObjId || ""}
                      group={group}
                      onPriceResult={onPriceResult}
                      price={groupPrice?.price || deal.b2bPrice || 0}
                      configured={!!groupPrice?.price}
                      discountLabel={
                        groupPrice?.discountType === "Fixed"
                          ? "Fixed"
                          : `${CommonService.roundedByDecimalPlace(
                              groupPrice?.discount || 0,
                              2,
                            )}% off`
                      }
                      toneIndex={group.toneIndex ?? groupIndex}
                      onEdit={() =>
                        callback?.({
                          action: "editGroupPrice",
                          data: { ...deal, _group: group } as any,
                        })
                      }
                    />
                  </AppTable.Cell>
                );
              })}
              {showCompetitorPrice && (
                <>
                  <AppTable.Cell className="tw:text-center tw:bg-sky-50">
                    {(deal as any).partnerPriceData?.flipkart?.price ? (
                      <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                        <CompetitorPriceValue
                          partner={(deal as any).partnerPriceData.flipkart}
                        />
                      </div>
                    ) : (
                      <span className="tw:text-gray-300">—</span>
                    )}
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-center tw:bg-amber-50">
                    <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                      {(deal as any).partnerPriceData?.amazon?.price ? (
                        <>
                          <CompetitorPriceValue
                            partner={(deal as any).partnerPriceData.amazon}
                          />
                        </>
                      ) : (
                        <span className="tw:text-gray-300">—</span>
                      )}
                      <OtherCompetitorsPopover
                        others={(deal as any).partnerPriceData?.others}
                      />
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-center tw:bg-orange-50">
                    {(deal as any).partnerPriceData?.other?.price ? (
                      <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                        <CompetitorPriceValue
                          partner={(deal as any).partnerPriceData.other}
                        />
                      </div>
                    ) : (
                      <span className="tw:text-gray-300">—</span>
                    )}
                  </AppTable.Cell>
                </>
              )}
              <AppTable.Cell className="tw:text-center">
                <div className="tw:text-gray-700">
                  <DisplayQty
                    qty={deal.actualMaxQty}
                    isLooseQty={(deal as any).isLooseDeal || false}
                    uom={(deal as any).selectedStockUom}
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={deal.inventoryValue} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <AppBadge variant={deal._movementTypeColor}>
                  {deal.movementType}
                </AppBadge>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row noHover>
            <AppTable.Cell
              className="tw:text-center tw:py-4"
              colSpan={tableHeaders.length}
            >
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
                noMargin
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
