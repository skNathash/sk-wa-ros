import React from "react";
import { Eye, Edit, MessageCircle } from "lucide-react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { TableSkeletonLoader } from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface TicketData {
  _id: string;
  ticketId: string;
  title: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignedTo?: {
    name: string;
    id: string;
  };
  createdAt: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

interface DesktopViewProps {
  data: TicketData[];
  loading: boolean;
  callback?: (args: { action: string; data?: TicketData }) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Ticket ID", key: "ticketId", enableSort: true, width: "12%" },
  { label: "Title", key: "title", enableSort: true, width: "25%" },
  { label: "Status", key: "status", enableSort: true, width: "12%" },
  { label: "Priority", key: "priority", enableSort: true, width: "12%" },
  { label: "Assigned To", key: "assignedTo", enableSort: false, width: "15%" },
  { label: "Created", key: "createdAt", enableSort: true, width: "12%" },
  { label: "Action", key: "action", enableSort: false, width: "12%" },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Open":
      return "primary";
    case "In Progress":
      return "warning";
    case "Resolved":
      return "success";
    case "Closed":
      return "light";
    default:
      return "default";
  }
};

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "Low":
      return "light";
    case "Medium":
      return "primary";
    case "High":
      return "warning";
    case "Urgent":
      return "danger";
    default:
      return "default";
  }
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  callback,
}) => {
  const handleAction = (action: string, ticket: TicketData) => {
    callback?.({ action, data: ticket });
  };

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      condensed
      minWidth="1200px"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : data && data.length > 0 ? (
          data.map((ticket, idx) => (
            <AppTable.Row key={ticket._id || idx}>
              <AppTable.Cell>
                <div className="tw:font-medium tw:text-sm">
                  {ticket.ticketId || ticket._id}
                </div>
                {ticket.category && (
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    {ticket.category}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:font-medium tw:text-sm">{ticket.title}</div>
                {ticket.description && (
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:line-clamp-2">
                    {ticket.description}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={getStatusVariant(ticket.status)}>
                  {ticket.status}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={getPriorityVariant(ticket.priority)}>
                  {ticket.priority}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {ticket.assignedTo ? (
                  <div className="tw:font-medium tw:text-sm">
                    {ticket.assignedTo.name}
                  </div>
                ) : (
                  <span className="tw:text-gray-400 tw:text-sm">
                    Unassigned
                  </span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat
                  value={ticket.createdAt}
                  formatStr="dd MMM yyyy"
                  className="tw:text-sm"
                />
                <DateFormat
                  value={ticket.createdAt}
                  formatStr="hh:mm a"
                  className="tw:text-xs tw:text-gray-500 tw:block"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:gap-2">
                  <AppButton
                    size="small"
                    fill="outline"
                    color="primary"
                    onClick={() => handleAction("view", ticket)}
                  >
                    <Eye size={14} />
                  </AppButton>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="secondary"
                    onClick={() => handleAction("edit", ticket)}
                  >
                    <Edit size={14} />
                  </AppButton>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="success"
                    onClick={() => handleAction("reply", ticket)}
                  >
                    <MessageCircle size={14} />
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No tickets found
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
