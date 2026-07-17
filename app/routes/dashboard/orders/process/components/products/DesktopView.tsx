import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  data: any[];
  loading?: boolean;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  callback?: (action: { action: string; data: any }) => void;
}

const headers: TableHeaderItem[] = [
  {
    label: "Product",
    key: "name",
    width: "25%",
    langKey: "product",
  },
  { label: "Location", key: "location", width: "15%", langKey: "location" },
  {
    label: "Quantity",
    key: "quantity",
    width: "10%",
    isCentered: true,
    langKey: "quantity",
  },
  {
    label: "Price",
    key: "price",
    width: "12%",
    isCentered: true,
    langKey: "price",
  },
  {
    label: "MRP",
    key: "mrp",
    width: "10%",
    isCentered: true,
    langKey: "mrp",
  },
  {
    label: "Available Stock",
    key: "availableStock",
    width: "12%",
    isCentered: true,
    langKey: "availableStock",
  },
  {
    label: "Total",
    key: "total",
    width: "14%",
    isCentered: true,
    langKey: "total",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data = [],
  loading = false,
  onSort,
  sortKey,
  sortValue,
  callback,
}) => {
  const { t } = useTranslation();

  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout
      container
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortKey={sortKey}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No data found
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => (
            <AppTable.Row
              key={item.id || idx}
              className="tw:cursor-pointer hover:tw:bg-gray-50"
            >
              <AppTable.Cell className="tw:sticky tw:left-0 tw:bg-white tw:z-10">
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div className="tw:flex-shrink-0">
                    <ImgRender
                      assetId={item.dealDetails?.images?.[0]}
                      alt={item.dealName}
                      className="tw:w-12 tw:h-12 tw:object-contain tw:rounded-md tw:bg-gray-50"
                    />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/products/view/${item.dealId}`}
                      className="tw:font-medium tw:block tw:truncate"
                    >
                      {item.dealName}
                    </AppLink>
                    <div className="tw:text-xs tw:text-gray-500">
                      ID: {item.dealRefId || "--"}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <LocationsBlock
                  locations={item.dealDetails?.locations}
                  dealId={item.dealId}
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:text-xs">
                    <span className="tw:font-medium">{t("ordered")}:</span>{" "}
                    <DisplayQty
                      qty={item.quantity || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </div>
                  {/* {item.remainingQty ? (
                    <div className="tw:text-xs tw:text-orange-500">
                      <span className="tw:font-medium">
                        Pending to Process:
                      </span>{" "}
                      {item.remainingQty || 0}
                    </div>
                  ) : null} */}
                  {item.cancelledQty ? (
                    <div className="tw:text-xs tw:text-red-500">
                      <span className="tw:font-medium">Cancelled:</span>{" "}
                      <DisplayQty
                        qty={item.cancelledQty || 0}
                        isLooseQty={false}
                        uom={item.selectedStockUom}
                      />
                    </div>
                  ) : null}

                  <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap tw:justify-center">
                    {item.packSoldQty > 0 && (
                      <div className="tw:text-primary tw:text-xs tw:flex tw:items-center tw:gap-1">
                        Sold in {item.packSoldQty} {item.packType}
                        <CaseQtyPopover
                          packageQty={item.packQuantity || 0}
                          sellingType={item.packType || "UNIT"}
                        />
                      </div>
                    )}
                    {item.isReserveOrder && <ReserveBadge template={2} />}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={item.price || 0} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={item.mrp || 0} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span
                  className={`tw:font-medium ${
                    item.dealDetails?.maxQty > 0
                      ? "tw:text-green-600"
                      : "tw:text-red-600"
                  }`}
                >
                  <DisplayQty
                    qty={item.dealDetails?.maxQty || 0}
                    isLooseQty={false}
                    uom={item.selectedStockUom}
                  />
                </span>

                {item?.dealDetails?.blockedQty > 0 && (
                  <div className="tw:text-xs tw:text-red-500">
                    {t("blockedQty")}:{" "}
                    <DisplayQty
                      qty={item?.dealDetails?.blockedQty || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={item.finalPrice || 0} decimalPlaces={2} />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
