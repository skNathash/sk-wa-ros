import { endOfDay, startOfDay } from "date-fns";
import WhatsappTemplateRequestService from "~/services/WhatsappTemplateRequestService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  tab = "All",
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  if (filter?.search) {
    params.filter["$or"] = [
      { remarks: { $regex: filter.search, $options: "i" } },
      { referenceId: { $regex: filter.search, $options: "i" } },
    ];
  }

  // status filter
  if (filter?.status && filter.status !== "all") {
    params.filter.status = filter.status;
  }

  // created on date range filter (range picker: [from, to])
  if (filter?.createdDateRange?.[0]) {
    params.filter.createdAt = {
      ...params.filter.createdAt,
      $gte: startOfDay(new Date(filter.createdDateRange[0])).toISOString(),
    };
  }
  if (filter?.createdDateRange?.[1]) {
    params.filter.createdAt = {
      ...params.filter.createdAt,
      $lte: endOfDay(new Date(filter.createdDateRange[1])).toISOString(),
    };
  }

  // tab based status scoping
  if (tab !== "All") {
    params.filter.status = tab;
  }

  return params;
};

// A request has an approved/linked WhatsApp template. Backend may embed the
// full template object or just an id under templateInfo/whatsappTemplate.
export const getLinkedRef = (item: Record<string, any>) =>
  item?.templateInfo || item?.whatsappTemplate || null;

export const isTemplateLinked = (item: Record<string, any>) => {
  const ref = getLinkedRef(item);
  return Boolean(ref?._id || ref?.id || item?.templateId);
};

export const getLinkedTemplateName = (item: Record<string, any>) => {
  const ref = getLinkedRef(item);
  return ref?.name || "";
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await WhatsappTemplateRequestService.list(params);
    const list = response.data?.data || [];
    return list.map((item: Record<string, any>) => ({
      ...item,
      _statusColor: WhatsappTemplateRequestService.getStatusBadgeColor(
        item.status,
      ),
    }));
  } catch (err) {
    console.error("Error fetching whatsapp template requests:", err);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = { ...(params || {}), outputType: "count" };
    delete p.page;
    delete p.count;
    delete p.sort;

    const response = await WhatsappTemplateRequestService.list(p);
    return response.data?.data?.count || 0;
  } catch (err) {
    console.error("Error fetching whatsapp template request count:", err);
    return 0;
  }
};

export const getSummary = async (filter: Record<string, any>) => {
  // prepare params for the base count (pagination values are removed inside getCount)
  const params = prepareParams(filter || {}, {
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // four counts: total, pending, approved, rejected
  const promises = [
    getCount(params),
    getCount({ ...params, filter: { ...params.filter, status: "Pending" } }),
    getCount({ ...params, filter: { ...params.filter, status: "Approved" } }),
    getCount({ ...params, filter: { ...params.filter, status: "Rejected" } }),
  ];

  const [total, pending, approved, rejected] = await Promise.all(promises);

  return {
    total: total || 0,
    pending: pending || 0,
    approved: approved || 0,
    rejected: rejected || 0,
  };
};
