import RecordPaymentService from "~/services/RecordPaymentService";
import type { PaginationState } from "~/types/CommonTypes";
import type { RecordPaymentEntityType } from "../../types";

export const prepareParams = (
  type: RecordPaymentEntityType | string,
  params: Record<string, any>,
  pagination: PaginationState
) => {
  const p: Record<string, any> = {
    page: pagination.activePage || 1,
    limit: pagination.rowsPerPage || 10,
  };

  const search = params.search?.trim() || "";

  // Franchise and customer endpoints take a plain `search` string; vendor takes
  // a mongo-style filter.
  if (type === "vendor") {
    p.filter = { status: "Active" };
    p.sort = { name: 1 };

    if (search) {
      p.filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { vendorId: search },
      ];
      if (!isNaN(Number(search))) {
        p.filter.$or.push({ mobile: { $regex: search, $options: "i" } });
      }
    }
  } else if (search) {
    p.search = search;
  }

  return p;
};

export const getData = async (type: string, params: Record<string, any>) => {
  return RecordPaymentService.getEntityData(type, params || {});
};

export const getCount = async (type: string, params: Record<string, any>) => {
  return RecordPaymentService.getEntityCount(type, params || {});
};
