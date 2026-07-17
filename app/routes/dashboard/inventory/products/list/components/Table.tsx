import React from "react";
import { useTranslation } from "react-i18next";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import { TableSkeletonLoader } from "~/components/core/table";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import { MapPin } from "lucide-react";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";

interface ProductTableProps {
  data: Array<{
    name: string;
    _id: string;
    _qty: number;
    openPOQty: number;
    mrp: number;
    pp: number;
    _finalSellingPrice: number;
    value: number;
    categoryName: string;
    brandName: string;
    shelfLife: string;
    location: string;
    sellInLooseQty: boolean;
    stockMovement: string;
    action?: React.ReactNode;
    stockMovementColor?: string;
    _location?: {
      locationName?: string;
      locationRackName?: string;
      locationBinName?: string;
      locationBinId?: string;
      locationRackId?: string;
      locationId?: string;
    } | null;
  }>;
  onSort?: (data: { key: string; value: "asc" | "desc" }) => void;
  sortKey?: string;
  sortValue?: "asc" | "desc";
  loading?: boolean;
  callback: (a: { action: string; data: any }) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  data,
  onSort,
  sortKey,
  sortValue,
  loading,
  callback,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: t("sNo"), key: "sNo", width: "3%" },
    {
      label: t("product"),
      key: "product",
      enableSort: true,
      width: "15%",
      isSticky: true,
    },
    { label: t("id"), key: "id", width: "8%" },
    {
      label: t("currentStock"),
      key: "currentStock",
      enableSort: true,
      width: "8%",
    },
    {
      label: t("openPOQty"),
      key: "openPOQty",
      width: "6%",
    },
    { label: t("mrp"), key: "mrp", enableSort: true, width: "5%" },
    {
      label: t("purchasePrice"),
      key: "purchasePrice",
      enableSort: true,
      width: "8%",
    },
    {
      label: t("sellingPrice"),
      key: "sellingPrice",
      enableSort: true,
      width: "8%",
    },
    {
      label: t("inventoryValue"),
      key: "value",
      enableSort: true,
      width: "10%",
    },
    { label: t("category"), key: "category", enableSort: true, width: "10%" },
    { label: t("brand"), key: "brand", enableSort: true, width: "10%" },
    { label: t("shelfLife"), key: "shelfLife", enableSort: true, width: "10%" },
    { label: t("location"), key: "location", enableSort: true, width: "12%" },
    { label: t("velocity"), key: "velocity", enableSort: true, width: "10%" },
  ];

  const containerStyle = {
    height: "calc(100vh - 200px)",
  };

  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout
      container
      minWidth="1600px"
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
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell className="tw:sticky tw:left-0 tw:z-10 tw:bg-white">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppLink
                    onClick={() => callback({ action: "view", data: row })}
                  >
                    {row.name}
                  </AppLink>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{row._id}</AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <span className="tw:font-medium">{row._qty}</span>{" "}
                  <span className="tw:text-xs tw:text-gray-500">
                    {row.sellInLooseQty ? "kg" : "units"}
                  </span>
                  {row.isReserve && <ReserveBadge />}
                </div>
              </AppTable.Cell>
              <AppTable.Cell
                className={`$${
                  !row.openPOQty
                    ? "tw:text-gray-500"
                    : "tw:text-blue-500 tw-cursor-pointer hover:tw-underline"
                }`}
              >
                {!row.openPOQty ? (
                  <span
                    className="tw:text-blue-500 tw-cursor-pointer hover:tw-underline"
                    onClick={() => callback({ action: "open-po", data: row })}
                  >
                    {row.openPOQty}
                  </span>
                ) : (
                  row.openPOQty || 0
                )}{" "}
                <span className="tw:text-xs tw:text-gray-500">
                  {row.sellInLooseQty ? "kg" : "units"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.mrp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.pp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                <Amount value={row._finalSellingPrice} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-green-600 tw:font-medium">
                <Amount value={row._finalSellingPrice * row._qty} />
              </AppTable.Cell>
              <AppTable.Cell>{row.categoryName}</AppTable.Cell>
              <AppTable.Cell>{row.brandName}</AppTable.Cell>
              <AppTable.Cell>{row.shelfLife}</AppTable.Cell>
              <AppTable.Cell>
                {row._location?.locationName &&
                row._location?.locationRackName &&
                row._location?.locationBinName ? (
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <MapPin className="tw:text-gray-500" size={12} />
                    <div className="tw:text-xs tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-md tw:inline-block">
                      {row._location.locationName} /{" "}
                      {row._location.locationRackName} /{" "}
                      {row._location.locationBinName}
                    </div>
                  </div>
                ) : (
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    className="tw:h-6 tw:border-gray-300"
                  >
                    <MapPin />
                    Allocate
                  </AppButton>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge
                  variant={(row.stockMovementColor as any) || "default"}
                >
                  {row.stockMovement}
                </AppBadge>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default ProductTable;
