import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { Building2, Calendar } from "lucide-react";

const tableHeaders = [
  { label: "PO ID", key: "poId", width: "22%" },
  { label: "Vendor", key: "vendor", width: "28%" },
  { label: "Order Date", key: "orderDate", width: "20%", isCentered: true },
  { label: "Quantity", key: "quantity", width: "15%", isCentered: true },
  { label: "Status", key: "status", width: "15%", isCentered: true },
];

const mockData = [
  {
    poId: "PO-1751097725745-CV2P",
    vendor: "Bakery Supply Co",
    orderDate: "2025-06-28",
    quantity: 2,
    status: "Placed",
  },
];

interface PendingPoModalProps {
  show: boolean;
  dealId: string;
  callback: (a: { action: string; data: any }) => void;
}

const PendingPoModal: React.FC<PendingPoModalProps> = ({
  show,
  dealId,
  callback,
}) => {
  return (
    <AppModal show={show} callback={callback} className="tw:max-w-3xl">
      <AppModal.Title onClose={() => callback({ action: "close", data: {} })}>
        <span className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-blue-700 tw:text-xl">
            <Building2 size={22} strokeWidth={2} />
          </span>
          <span className="tw:font-semibold tw:text-lg">
            Open Purchase Orders for:{" "}
            <span className="tw:font-bold">Bagels 6-Pack</span>
          </span>
        </span>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:mb-4 tw:text-gray-600 tw:text-sm">
          This list shows all pending purchase orders for this product that have
          not yet been fully received.
        </div>
        <AppTable container size="md" minWidth="700px">
          <AppTable.Header>
            <TableHeader headers={tableHeaders} />
          </AppTable.Header>
          <AppTable.Body>
            {mockData.map((row, idx) => (
              <AppTable.Row key={row.poId}>
                <AppTable.Cell>
                  <a
                    href="#"
                    className="tw:text-blue-700 tw:font-medium hover:tw:underline"
                  >
                    {row.poId}
                  </a>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:flex tw:items-center tw:gap-1">
                    <Building2 size={16} className="tw-text-gray-500" />
                    {row.vendor}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:flex tw:items-center tw:justify-center tw:gap-1">
                    <Calendar size={15} className="tw-text-gray-500" />
                    <DateFormat
                      value={row.orderDate}
                      formatStr="MMM dd, yyyy"
                    />
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:font-semibold">{row.quantity}</span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppBadge variant="warning">Placed</AppBadge>
                </AppTable.Cell>
              </AppTable.Row>
            ))}
          </AppTable.Body>
        </AppTable>
      </AppModal.Content>
      <AppModal.Footer>
        <button
          className="tw:bg-blue-600 tw:text-white tw:px-4 tw:py-2 tw:rounded"
          onClick={() => callback({ action: "close", data: {} })}
        >
          Close
        </button>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PendingPoModal;
