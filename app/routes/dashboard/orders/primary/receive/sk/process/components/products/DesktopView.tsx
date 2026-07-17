import { Package } from "lucide-react";
import React from "react";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableHeader } from "~/components/core/table";

interface Props {
  products: any[];
}

const headers = [
  { label: "Product", key: "product", width: "25%" },
  {
    label: "Ordered",
    key: "ordered",
    width: "8%",
    isCentered: true,
  },
  {
    label: "Received",
    key: "received",
    width: "8%",
    isCentered: true,
  },
  {
    label: "Damaged",
    key: "damaged",
    width: "8%",
    isCentered: true,
  },
  {
    label: "Price",
    key: "price",
    width: "8%",
    isCentered: true,
  },
  {
    label: "Total",
    key: "total",
    width: "8%",
    isCentered: true,
  },
  { label: "Notes", key: "notes", width: "30%" },
];

const DesktopView: React.FC<Props> = ({ products = [] }) => {
  if (!products?.length) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <>
      <AppTable>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products.map((product, index) => (
            <AppTable.Row key={product._id}>
              <AppTable.Cell>
                <div className="tw:font-semibold">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${product.dealId}`}
                  >
                    {product.dealName || product.productName}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {product.productId}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className="tw:text-blue-600 tw:font-medium">
                  {product.packages?.quantity || product.quantity || 0}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className="tw:text-green-600 tw:font-medium">
                  {product.receivedQuantity || 0}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className="tw:text-red-600 tw:font-medium">
                  {product.damagedQuantity || 0}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {product.purchasePrice
                  ? `₹${product.purchasePrice.toFixed(2)}`
                  : "-"}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {product._totalValue
                  ? `₹${product._totalValue.toFixed(2)}`
                  : "-"}
              </AppTable.Cell>
              <AppTable.Cell>
                {product.notes || product.remarks || "-"}
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </>
  );
};

export default DesktopView;
