import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
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
    width: "18%",
    key: "name",
  },
  {
    label: "MRP",
    width: "6%",
    key: "mrp",
  },
  {
    label: "Purchase Price",
    width: "6%",
    key: "purchasePrice",
  },
  {
    label: "Current Stock",
    width: "6%",
    key: "currentStock",
    isCentered: true,
  },
  {
    label: "New Stock",
    width: "6%",
    key: "newStock",
    isCentered: true,
  },
  {
    label: "Actions",
    width: "6%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 300px)",
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
                  <AppBadge
                    variant={product.status === "VALID" ? "success" : "danger"}
                  >
                    {product.status}
                  </AppBadge>
                  <div className="tw:text-xs tw:text-gray-500">
                    {product.dealRefId}
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <Amount value={product.mrp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={product.purchasePrice} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-orange-600 tw:text-center">
                {product.oldQuantity}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-green-800 tw:font-semibold tw:text-center">
                {product.qty}
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
