import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import type { VariantColor } from "~/types/CommonTypes";

interface TicketData {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Closed";
  category: string;
  assignee: string | null;
  createdAt: string; // ISO string
}

interface MobileViewProps {
  data: TicketData[];
}

const priorityVariantMap: Record<string, string> = {
  Low: "light",
  Medium: "primary",
  High: "danger",
};

const statusVariantMap: Record<string, string> = {
  Open: "success",
  "In Progress": "warning",
  Closed: "danger",
};

const MobileView: React.FC<MobileViewProps> = ({ data }) => {
  return (
    <div className="tw:space-y-4">
      {data.map((ticket) => (
        <div
          key={ticket.id}
          className="tw:bg-white tw:rounded-xl tw:shadow-sm tw:p-4 tw:border tw:border-gray-100 tw:space-y-2"
        >
          <div className="tw:flex tw:items-start tw:justify-between">
            <div>
              <div className="tw:font-bold tw:text-base tw:text-gray-900">
                {ticket.title}
              </div>
              <div className="tw:mt-1">
                <span className="tw:text-xs tw:text-blue-700 tw:bg-blue-50 tw:px-1.5 tw:py-0.5 tw:rounded">
                  {ticket.id}
                </span>
              </div>
            </div>
            <AppBadge
              variant={priorityVariantMap[ticket.priority] as VariantColor}
              className="tw:ml-2 tw:text-xs tw:font-medium"
            >
              {ticket.priority}
            </AppBadge>
          </div>
          <div className="tw:flex tw:items-center tw:space-x-4 tw:mt-2">
            <div className="tw:flex tw:items-center tw:space-x-1">
              <span className="tw-text-xs tw:text-gray-500">Status</span>
              <AppBadge
                variant={statusVariantMap[ticket.status] as VariantColor}
                className="tw:text-xs tw:font-medium"
              >
                {ticket.status}
              </AppBadge>
            </div>
            <div className="tw:flex tw:items-center tw:space-x-1">
              <span className="tw-text-xs tw:text-gray-500">Category</span>
              <span className="tw-text-xs tw:text-gray-900 tw-font-medium">
                {ticket.category}
              </span>
            </div>
            <div className="tw:flex tw:items-center tw:space-x-1">
              <span className="tw-text-xs tw:text-gray-500">Assignee</span>
              <span className="tw-text-xs tw:text-gray-900 tw-font-medium">
                {ticket.assignee ? ticket.assignee : "unassigned"}
              </span>
            </div>
          </div>
          <div className="tw-text-xs tw-text-gray-400 tw-mt-2">
            Created <DateFormat value={ticket.createdAt} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
