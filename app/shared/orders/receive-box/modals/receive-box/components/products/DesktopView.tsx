import { Package } from "lucide-react";
import React from "react";
import { AppTable, TableHeader } from "~/components/core/table";
import { Input } from "~/components/ui/input";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";

interface DesktopViewProps {
  products: any[];
  callback: (a: { action: string; data?: any }) => void;
}

const headers = [
  { label: "Product", key: "product", width: "25%" },
  {
    label: "Ordered",
    key: "ordered",
    width: "10%",
    isCentered: true,
  },
  {
    label: "Received",
    key: "received",
    width: "15%",
    isCentered: true,
  },
  {
    label: "Damaged",
    key: "damaged",
    width: "15%",
    isCentered: true,
  },
  { label: "Notes", key: "notes", width: "35%" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  products = [],
  callback,
}) => {
  const handleInputChange = (
    id: string,
    field: "received" | "damaged" | "notes",
    value: string | number,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        _id: id,
        field,
        value,
        index,
      },
    });
  };

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
            <AppTable.Row key={product._id || product.dealId}>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col">
                  <span className="tw:font-medium tw:text-gray-900">
                    {product.dealName}
                  </span>
                  <div className="tw:text-xs tw:text-gray-500">
                    {product.dealRefId}
                  </div>
                  <div className="tw:mt-2">
                    <LocationsBlock locations={product.locations} />
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {product.packageQuantity ?? product.packages?.quantity}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Input
                  type="number"
                  min={0}
                  value={product.receivedQty}
                  onChange={(e) =>
                    handleInputChange(
                      product._id || product.dealId,
                      "received",
                      e.target.value,
                      index
                    )
                  }
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Input
                  type="number"
                  min={0}
                  value={product.damagedQty}
                  onChange={(e) =>
                    handleInputChange(
                      product._id || product.dealId,
                      "damaged",
                      e.target.value,
                      index
                    )
                  }
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <Input
                  type="text"
                  value={product.notes || ""}
                  onChange={(e) =>
                    handleInputChange(
                      product._id || product.dealId,
                      "notes",
                      e.target.value,
                      index
                    )
                  }
                />
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </>
  );
};

export default DesktopView;
