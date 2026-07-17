import { Package } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableHeader } from "~/components/core/table";

interface Props {
  products: any[];
  showReceived?: boolean;
}

const headers = [
  { label: "Product", key: "product", width: "25%", langKey: "product" },
  {
    label: "MRP",
    key: "mrp",
    width: "10%",
    isCentered: true,
    langKey: "mrp",
  },
  {
    label: "Price",
    key: "price",
    width: "10%",
    isCentered: true,
    langKey: "price",
  },
  {
    label: "Ordered",
    key: "ordered",
    width: "10%",
    langKey: "ordered",
    isCentered: true,
  },
  {
    label: "Received",
    key: "received",
    width: "15%",
    isCentered: true,
    langKey: "received",
  },
  { label: "Notes", key: "notes", width: "35%", langKey: "notes" },
];

const DesktopView: React.FC<Props> = ({
  products = [],
  showReceived = false,
}) => {
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
      <AppTable condensed>
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
                    {product.dealName}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {product.dealRefId}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={product.mrp} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={product.price} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {product.quantity}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {showReceived ? product.fulfilledQty || 0 : "--"}
              </AppTable.Cell>
              <AppTable.Cell>--</AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </>
  );
};

export default DesktopView;
