import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import CommonService from "~/services/CommonService";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  products: any[];
  callback: (a: { action: string; data: any }) => void;
}

const headers: TableHeaderItem[] = [
  {
    label: "#",
    width: "3%",
  },
  {
    label: "Name",
    width: "22%",
    key: "name",
  },
  {
    label: "Applied To",
    width: "10%",
    key: "type",
  },
  {
    label: "MRP",
    width: "12%",
    key: "mrp",
  },
  {
    label: "Selling Price",
    width: "12%",
    key: "price",
  },
  {
    label: "Discount",
    width: "14%",
    key: "discount",
    isCentered: true,
  },
  {
    label: "Actions",
    width: "12%",
  },
];

const containerStyle = {
  height: "calc(100vh - 300px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({ products, callback }) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:w-full tw:mt-2">
      <AppTable
        size="sm"
        fixedLayout
        container
        containerStyle={containerStyle}
        stickyHeader
        bordered
        hover
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products.map((product, index) => (
            <AppTable.Row key={index}>
              <AppTable.Cell>{index + 1}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/dashboard/inventory/products/view/${product.dealId}`}
                  className="tw:font-medium"
                >
                  {product.dealName}
                </AppLink>
                <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                  <div className="tw:text-xs tw:text-gray-500">
                    {product.dealRef}
                  </div>
                  <AppBadge
                    variant={product.status === "VALID" ? "success" : "danger"}
                    className="tw:text-xs"
                  >
                    {product.status}
                  </AppBadge>
                  {product.isDuplicate && (
                    <AppBadge variant="warning" className="tw:text-xs">
                      Duplicate Barcode
                    </AppBadge>
                  )}
                </div>
                {product.barcode && (
                  <div className="tw:mt-1">
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-amber-800 tw:bg-amber-100 tw:border tw:border-amber-200 tw:rounded tw:px-1.5 tw:py-0.5">
                      Barcode: {product.barcode}
                    </span>
                  </div>
                )}
                {product.status === "INVALID" && (
                  <div className="tw:text-xs tw:text-gray-500">
                    {product.validationMessage}
                  </div>
                )}
              </AppTable.Cell>

              <AppTable.Cell>
                <AppBadge variant="primary">{product.type} Price</AppBadge>
              </AppTable.Cell>

              <AppTable.Cell>
                <Amount value={product.mrp} decimalPlaces={2} />
              </AppTable.Cell>

              <AppTable.Cell>
                <Amount value={product.price} decimalPlaces={2} />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:flex-col tw:items-center">
                  <span className="tw:text-blue-600 tw:font-medium">
                    {product.isPercentage ? (
                      `${CommonService.roundedByDecimalPlace(product.discount, 2)}%`
                    ) : (
                      <Amount value={product.fixedPrice} decimalPlaces={2} />
                    )}
                  </span>
                  <span className="tw:text-xs tw:text-gray-500">
                    {product.discountLabel}
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppButton
                  color="danger"
                  size="small"
                  fill="outline"
                  onClick={() => {
                    callback({ action: "remove", data: { index } });
                  }}
                >
                  Remove
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
