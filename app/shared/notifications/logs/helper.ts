import { endOfDay, startOfDay, sub } from "date-fns";
import AuthService from "~/services/AuthService";
import NotificationService from "~/services/NotificationService";
import type { PaginationState } from "~/types/CommonTypes";

export interface FilterForm {
  dateRange: Date[];
  tab: string;
  status: string;
}

export const defaultFilterFormData = {
  dateRange: [sub(new Date(), { days: 30 }), new Date()],
  tab: "whatsappGeneric",
  status: "All",
};

export const getData = async (type: string, params: Record<string, any>) => {
  if (type === "whatsappLocal") {
    const response = await NotificationService.getWhatsAppLocalLogs(params);
    return (response.data?.data || []).map((item: any) => {
      return {
        type: item.template?.category,
        status:
          item.status?.toLowerCase() === "success" || item.status === "true"
            ? "Success"
            : "Failed",
        sentOn: item.createdAt,
        templateName:
          item.template?.category + " - " + (item.content?.title || ""),
        message: item.content?.body,
      };
    });
  }

  const response = await NotificationService.getWhatsAppLogs(params);
  return (response.data || []).map((item: any) => {
    return {
      type: item.type,
      status:
        item.status?.toLowerCase() === "success" || item.status === "true"
          ? "Success"
          : "Failed",
      sentOn: item.createdAt,
      templateName: item.templateId,
      message: item.message,
    };
  });
};

export const getCount = async (type: string, params: Record<string, any>) => {
  if (type === "whatsappLocal") {
    const response = await NotificationService.getWhatsAppLocalLogs({
      ...params,
      outputType: "count",
    });
    return response.data?.data?.count || 0;
  }

  const response = await NotificationService.getWhatsAppLogsCount({
    ...params,
  });

  return response.data || 0;
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (filters.tab === "whatsappGeneric" || filters.tab === "sms") {
    params.filter.recepientNo = filters.mobileNo;
  }

  if (filters.tab === "email") {
    params.filter.recepientNo = filters.email;
  }

  if (filters.tab === "whatsappLocal") {
    params.filter.customerId = filters.userId;
    if (filters.type === "b2c") {
      params.filter.franchiseId = AuthService.getLoggedInUserId();
    }

    if (filters.type === "b2b") {
      params.filter.franchiseId = AuthService.getLoggedInUserId();
    }
  }

  if (filters.tab === "whatsappGeneric") {
    params.filter.type = {
      $in: ["WhatsApp"],
    };
  }

  if (filters.tab === "sms") {
    params.filter.type = "SMS";
  }

  if (filters.tab === "email") {
    params.filter.type = "Email";
  }

  if (filters.status && filters.status !== "All") {
    params.filter.status =
      filters.status === "Success"
        ? { $in: ["Success", "true", "success"] }
        : { $nin: ["Success", "true", "success"] };
  }

  if (filters.dateRange && filters.dateRange.length === 2) {
    params.filter.createdAt = {
      $gte: startOfDay(filters.dateRange[0]).toISOString(),
      $lte: endOfDay(filters.dateRange[1]).toISOString(),
    };
  }

  // params.sort = { createdAt: -1 };

  return params;
};
