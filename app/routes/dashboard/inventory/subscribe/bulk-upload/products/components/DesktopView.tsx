import React from "react";
import { AppTable, TableHeader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AuthService from "~/services/AuthService";

interface DesktopViewProps {
  products: any[];
  mode?: "detailed" | "dealId";
}

const detailedHeaders: TableHeaderItem[] = [
  { label: "Sl No", key: "slNo", isCentered: true },
  { label: "Item Name", key: "name" },
  { label: "Brand", key: "brand" },
  { label: "Category", key: "category" },
  { label: "MRP", key: "mrp", isCentered: true },
  { label: "Price", key: "price", isCentered: true },
  { label: "Unit", key: "unit", isCentered: true },
  { label: "Barcode", key: "barcode" },
  { label: "Qty", key: "qty", isCentered: true },
  { label: "Status", key: "status", isCentered: true },
];

const dealIdHeaders: TableHeaderItem[] = [
  { label: "Sl No", key: "slNo", isCentered: true },
  { label: "Item Name", key: "name" },
  { label: "Deal Ref", key: "dealRef" },
  { label: "Status", key: "status", isCentered: true },
  { label: "Validation Message", key: "validationMessage" },
];

const DesktopView: React.FC<DesktopViewProps> = ({ products, mode = "detailed" }) => {
  const headers = mode === "dealId" ? dealIdHeaders : detailedHeaders;
  const isDealId = mode === "dealId";
  return (
    <div className="tw:w-full">
      <AppTable
        container
        stickyHeader
        responsive
        bordered
        hover
        size="sm"
        className="tw:mt-4"
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products.length > 0 ? (
            products.map((product, index) =>
              isDealId ? (
                <AppTable.Row key={index}>
                  <AppTable.Cell className="tw:text-center tw:text-sm tw:text-gray-500">
                    {index + 1}
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:font-medium">
                    {product.name || "--"}
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:font-mono tw:text-sm">
                    {product.dealRef || product.dealId || "--"}
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-center">
                    <AppBadge
                      variant={product.statusVariant || "default"}
                      className="tw:whitespace-nowrap"
                    >
                      {product.status || "-"}
                    </AppBadge>
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-sm tw:text-gray-600">
                    {product.error || "--"}
                  </AppTable.Cell>
                </AppTable.Row>
              ) : (
              <AppTable.Row key={index}>
                <AppTable.Cell className="tw:text-center tw:text-sm tw:text-gray-500">
                  {index + 1}
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-medium">
                  {product.name}
                </AppTable.Cell>
                <AppTable.Cell>{product.brand?.name || "--"}</AppTable.Cell>
                <AppTable.Cell>{product.category?.name || "--"}</AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount value={Number(product.mrp)} decimalPlaces={2} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount
                    value={
                      AuthService.isMasterLogin()
                        ? Number(product.mrp)
                        : Number(product.price)
                    }
                    decimalPlaces={2}
                  />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {product.unit}
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-mono tw:text-sm">
                  {product.barcode}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {product.qty}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppBadge
                    variant={product.statusVariant || "default"}
                    className="tw:whitespace-nowrap"
                  >
                    {product.status || "-"}
                  </AppBadge>
                </AppTable.Cell>
              </AppTable.Row>
              ),
            )
          ) : (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-8 tw:text-gray-500"
              >
                No products found
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
