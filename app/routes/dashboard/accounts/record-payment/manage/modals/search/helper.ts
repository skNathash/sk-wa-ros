import RecordPaymentService from "~/services/RecordPaymentService";
import type { PaginationState } from "~/types/CommonTypes";

export const formatAddress = (
  city?: string | null,
  district?: string | null,
  state?: string | null,
  pincode?: string | number | null
) => {
  const parts: string[] = [city, district, state].filter(
    (part) => part?.trim()?.length
  ) as string[];

  const addr = parts.join(", ");

  if (pincode !== undefined && pincode !== null && String(pincode).trim()) {
    return addr
      ? `${addr} - ${String(pincode).trim()}`
      : String(pincode).trim();
  }

  return addr;
};

export const prepareParams = (
  type: string,
  params: Record<string, any>,
  pagination: PaginationState
) => {
  let p: Record<string, any> = {
    page: pagination.activePage || 1,
    limit: pagination.rowsPerPage || 10,
    filter: {},
  };

  const search = params.search?.trim() || "";

  if (type === "franchise") {
    delete p.filter;
    if (search) {
      p.search = search;
    }
  } else if (type === "customer") {
    delete p.filter;
    if (search) {
      p.search = search;
    }
  } else if (type === "vendor") {
    p.filter.status = "Active";
    p.filter.vendorType = "Wholesaler";
    p.sort = { name: 1 };
    if (search) {
      p.filter.$or = [
        {
          name: { $regex: search, $options: "i" },
        },
        {
          vendorId: search,
        },
      ];
      if (!isNaN(Number(search))) {
        p.filter.$or.push({
          mobile: { $regex: search, $options: "i" },
        });
      }
    }
  }

  return p;
};

export const getData = async (type: string, params: Record<string, any>) => {
  return RecordPaymentService.getEntityData(type, params || {});
};

export const getCount = async (type: string, params: Record<string, any>) => {
  return RecordPaymentService.getEntityCount(type, params || {});
};
