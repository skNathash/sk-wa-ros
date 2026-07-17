import React from "react";
import { ScanBarcode } from "lucide-react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppButton from "~/components/core/button/AppButton";

type ScannedItem = { barcode: string; qty: number };

interface DesktopViewProps {
  items: ScannedItem[];
  onEdit: (code: string, qty: number) => void;
  onRemove: (code: string) => void;
}

const headers = [
  { key: "idx", label: "#" },
  { key: "barcode", label: "Barcode" },
  { key: "qty", label: "Qty" },
  { key: "actions", label: "" },
];

const DesktopView: React.FC<DesktopViewProps> = ({ items, onEdit, onRemove }) => {
  return (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-white">
      <AppTable>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {items.map((item, idx) => (
            <AppTable.Row key={item.barcode}>
              <AppTable.Cell>
                <span className="tw:text-xs tw:text-gray-500 tw:tabular-nums">
                  {idx + 1}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-mono tw:font-medium tw:text-gray-800 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:px-1.5 tw:py-0.5">
                  <ScanBarcode className="tw:w-3 tw:h-3 tw:text-gray-400" />
                  {item.barcode}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-8 tw:text-xs tw:font-semibold tw:text-gray-800 tw:bg-gray-100 tw:rounded tw:px-2 tw:py-0.5 tw:tabular-nums">
                  {item.qty}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:gap-2 tw:justify-end">
                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={() => onEdit(item.barcode, item.qty)}
                  >
                    Edit
                  </AppButton>
                  <AppButton
                    fill="outline"
                    color="danger"
                    size="small"
                    onClick={() => onRemove(item.barcode)}
                  >
                    Remove
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
