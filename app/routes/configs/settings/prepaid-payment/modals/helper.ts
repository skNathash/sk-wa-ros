import AuthService from "~/services/AuthService";
import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (
  params: Record<string, any>,
  type: "B2C" | "B2B",
) => {
  if (type === "B2B") {
    const response = await FranchiseService.getFranchiseNetwork(params);
    const list = response?.data?.data || [];
    return (list || []).map((item: any) => {
      const displayName = (item?.name || item?.ownerDetails?.name || "")
        .toString()
        .trim();
      const mobile =
        item?.ownerDetails?.mobile || item?.mobile || item?.contactMobile || "";
      let addressStr = [item.city || item.town, item.district, item.state]
        .filter(Boolean)
        .join(", ");
      if (item.postcode) addressStr += ` - ${item.postcode}`;

      return {
        _id: item._id,
        name: displayName,
        mobile,
        addressStr,
        _raw: item,
      };
    });
  }

  // default to b2c/customer
  const response = await CustomerService.getCustomerNetwork(params);
  return (response.data?.data || []).map((item: any) => {
    const displayName =
      item.name ||
      [item.firstName, item.lastName].filter(Boolean).join(" ") ||
      "";
    let addressStr = [
      item.address?.city,
      item.address?.district,
      item.address?.state,
    ]
      .filter(Boolean)
      .join(", ");
    if (item.address?.postcode) addressStr += ` - ${item.address?.postcode}`;

    return {
      _id: item._id,
      name: displayName,
      mobile: item.mobile || item.contactMobile || "",
      addressStr,
      _raw: item,
    };
  });
};

export const getCount = async (
  params: Record<string, any>,
  type: "B2C" | "B2B",
) => {
  const p: Record<string, any> = { ...(params || {}) };

  delete p.page;
  delete p.limit;
  delete p.sort;
  delete p.order;

  if (type === "B2B") {
    const response = await FranchiseService.getFranchiseNetworkCount(p);
    return response?.data?.data?.total || 0;
  }

  const response = await CustomerService.getCustomerNetworkCount(p);
  return response?.data?.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
) => {
  let p: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    // sort: { name: 1 },
    sort: "name",
    order: "asc",
  };

  const search = filter.search?.trim() || "";
  if (search) {
    p.search = search;
  }

  const alpha = filter.alpha?.trim() || "";
  if (alpha) {
    p.search = "^" + alpha;
  }

  if (!AuthService.isSkSeller()) {
    p.createdByMe = true;
  }

  return p;
};
