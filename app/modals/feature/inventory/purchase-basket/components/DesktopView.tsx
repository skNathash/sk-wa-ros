import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

interface PurchaseBasketItem {
  id: string | number;
  product: string;
  stock: number;
  category: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface DesktopViewProps {
  data: PurchaseBasketItem[];
  loading?: boolean;
}

const headers = [
  { label: "Sl No", key: "slno", width: "60px", isCentered: true },
  { label: "Product", key: "product", width: "220px" },
  { label: "Stock", key: "stock", width: "100px", isCentered: true },
  { label: "Category", key: "category", width: "140px" },
  { label: "Qty", key: "qty", width: "80px", isCentered: true },
  { label: "Unit Price", key: "unitPrice", width: "110px", isCentered: true },
  { label: "Total", key: "total", width: "110px", isCentered: true },
];

const DesktopView: React.FC<DesktopViewProps> = ({ data, loading }) => {
  return (
    <AppTable minWidth="800px" container>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              Loading...
            </AppTable.Cell>
          </AppTable.Row>
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No data found
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => (
            <AppTable.Row key={item.id}>
              <AppTable.Cell className="tw:text-center">
                {idx + 1}
              </AppTable.Cell>
              <AppTable.Cell>{item.product}</AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {item.stock}
              </AppTable.Cell>
              <AppTable.Cell>{item.category}</AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {item.qty}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {item.unitPrice}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {item.total}
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
