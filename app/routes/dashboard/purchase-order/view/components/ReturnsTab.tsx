import { RefreshCcw } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { AppTable, TableHeader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface ReturnsTabProps {
  returns: any[];
}

const ReturnsTab = ({ returns }: ReturnsTabProps) => {
  if (!returns || returns.length === 0) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
        <RefreshCcw className="tw:text-4xl tw:mb-2" />
        <div>No returns found</div>
        <div className="tw:text-xs tw:mt-1">
          This purchase order doesn't have any returns.
        </div>
      </div>
    );
  }

  return (
    <AppCard>
      <AppTable size="sm">
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {returns.map((returnItem, index) => (
            <tr key={returnItem.id || index}>
              <td>{returnItem.productName || "-"}</td>
              <td>{returnItem.returnQuantity || 0}</td>
              <td>{returnItem.returnReason || "-"}</td>
              <td>{returnItem.returnDate || "-"}</td>
              <td>{returnItem.status || "-"}</td>
            </tr>
          ))}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

const headers: TableHeaderItem[] = [
  {
    label: "Product",
    key: "productName",
  },
  {
    label: "Return Qty",
    key: "returnQuantity",
  },
  {
    label: "Reason",
    key: "returnReason",
  },
  {
    label: "Return Date",
    key: "returnDate",
  },
  {
    label: "Status",
    key: "status",
  },
];

export default ReturnsTab;
