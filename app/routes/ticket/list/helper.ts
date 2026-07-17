import AuthService from "~/services/AuthService";
import TicketService from "~/services/TicketService";

export const defaultSummary = [
  {
    label: "Open Tickets",
    value: 0,
    icon: "chart-no-axes-column-increasing",
    color: "primary",
  },
  {
    label: "In Progress",
    value: 0,
    icon: "clock",
    color: "warning",
  },
  {
    label: "High Priority",
    value: 0,
    icon: "alert-circle",
    color: "danger",
  },
  {
    label: "Resolved",
    value: 0,
    icon: "check-circle",
    color: "success",
  },
];

export const defaultFilter = {
  search: "",
  status: "All",
  priority: "All",
};

export const getData = async (params: any) => {
  const response = await TicketService.getTicketList(params);
  return response?.data?.data || [];
};

export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params = {
    filter: {
      "createdBy.id": AuthService.getLoggedInTokenId(),
    },
  };
  return params;
};
