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
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import CommonService from "~/services/CommonService";
import SchemePopover from "~/shared/catalog/components/SchemePopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import {
  colorFor,
  Monogram,
} from "~/shared/catalog/components/competitor-price/CompetitorPrice";
import MarketVerdict from "~/shared/catalog/components/competitor-price/MarketVerdict";
import OtherCompetitorsPopover from "~/shared/catalog/components/competitor-price/OtherCompetitorsPopover";
import type {
  SellerDeal,
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";

// DesktopView component with LoadMoreButton integration

export interface DesktopViewProps {
  loading?: boolean;
  data: (SellerDeal & { _priceSlab?: any })[];
  callback?: (args: { action: string; data?: SellerDeal }) => void;
  sortKey?: string;
  onSort?: (sort: SortProps) => void;
  sortValue?: SortValue;
  type?: "network" | "customer";
  showOnlinePrices?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: (event?: any) => void;
  totalCount?: number;
  loadedCount: number;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

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
  sortKey = "",
  onSort = () => {},
  sortValue = "asc",
  type = "customer",
  showOnlinePrices = true,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

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
          width: "8%",
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
          width: "8%",
        },
      ]
    : [];

  const tableHeaders: TableHeaderItem[] = [
    { label: "#", key: "sl", width: "3%" },
    { label: t("product"), key: "dealName", enableSort: true, width: "18%" },
    {
      label: t("category"),
      key: "applicableCategory.categoryName",
      enableSort: false,
      width: "8%",
    },
    {
      label: t("mrp"),
      key: "mrp",
      enableSort: false,
      isCentered: true,
      width: "8%",
    },
    {
      label: t("purchasePrice"),
      key: "purchasePrice",
      enableSort: false,
      isCentered: true,
      width: "8%",
    },
    {
      label: type === "network" ? t("b2bPrice") : t("b2cPrice"),
      key: "price",
      enableSort: true,
      isCentered: true,
      width: "12%",
    },
    {
      label: type === "network" ? t("margin") : t("discount"),
      key: "margin",
      enableSort: false,
      isCentered: true,
      width: "6%",
    },
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
      width: "9%",
    },
    {
      label: t("stockVelocity"),
      key: "movementType",
      enableSort: false,
      isCentered: true,
      width: "10%",
    },
  ];

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      minWidth="1600px"
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
                    href={`/dashboard/inventory/products/view/${deal._id}`}
                    className="tw:font-medium tw:flex-1"
                  >
                    {deal.name}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:my-1.5 tw:flex tw:items-center tw:gap-2">
                  <code className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-md tw:text-slate-600">
                    {deal.id}
                  </code>

                  <span className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-md tw:text-slate-600">
                    {deal.brand?.name}
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-xs">
                {deal.category?.name || "-"}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <DisplayPrice
                  price={deal.mrp}
                  uom={(deal as any).selectedStockUom}
                  decimalPlaces={2}
                  className="tw:font-semibold tw:whitespace-nowrap"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <DisplayPrice
                  price={deal.purchasePrice || 0}
                  uom={(deal as any).selectedStockUom}
                  decimalPlaces={2}
                  className="tw:text-amber-600 tw:font-semibold tw:whitespace-nowrap"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center tw:bg-blue-50">
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-2">
                  <DisplayPrice
                    price={
                      type === "network"
                        ? deal.b2bPrice || 0
                        : deal.b2cPrice || 0
                    }
                    uom={(deal as any).selectedStockUom}
                    decimalPlaces={2}
                    className="tw:font-bold tw:text-lg tw:text-slate-900 tw:whitespace-nowrap"
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
                ) : type === "network" ? (
                  <span
                    className={clsx(
                      deal.b2bDiscount > 0
                        ? "tw:text-green-600"
                        : "tw:text-red-600",
                    )}
                  >
                    {CommonService.roundedByDecimalPlace(
                      deal.b2bDiscount || 0,
                      2,
                    )}
                    %
                  </span>
                ) : (
                  <span
                    className={clsx(
                      deal.b2cDiscount > 0
                        ? "tw:text-green-600"
                        : "tw:text-red-600",
                    )}
                  >
                    {CommonService.roundedByDecimalPlace(
                      deal.b2cDiscount || 0,
                      2,
                    )}
                    %
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
