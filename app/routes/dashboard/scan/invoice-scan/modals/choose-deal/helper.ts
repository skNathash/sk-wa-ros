import axios from "axios";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState } from "~/types/CommonTypes";
import type { SimilarDeal } from "../../types";

const isAbortError = (error: any) =>
  axios.isCancel(error) ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

export type ChooseDealFormValues = {
  hsn: string;
  search: string;
  alpha?: string;
};

export const prepareParams = (
  formData: ChooseDealFormValues,
  pagination: PaginationState,
) => {
  const p: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: "Active",
    },
    groupGroupedDeals: true,
  };

  const search = formData.search.trim();
  if (search) {
    p.search = search;
  }

  const hsn = formData.hsn.trim();
  if (hsn) {
    p.filter.hsn = hsn;
  }

  if (formData.alpha) {
    p.filter["name"] = CommonService.prepareAlphaRegexFilter(formData.alpha);
  }

  p.sort = { name: 1 };

  return p;
};

const formatDeals = (data: any[]): SimilarDeal[] => {
  return data.map((d: any) => ({
    _id: d._id || d.dealId || "",
    dealId: d.dealId || d._id || "",
    dealName: d.name || "",
    hsn: d.hsn || "",
    images: d.images || [],
    barcode: d.barcodes?.[0] || "",
    applicableMenu: d.applicableMenu || { menuName: "", menuId: "" },
    applicableCategory: d.applicableCategory || {
      categoryName: "",
      categoryId: "",
    },
    applicableBrand: d.applicableBrand || { brandName: "", brandId: "" },
    isSubscribed: d.isSubscribed || false,
    isMatched: false,
    subscriptionStatus: d.isSubscribed ? "subscribed" : "not_subscribed",
  }));
};

export const getData = async (
  params: Record<string, any>,
  signal?: AbortSignal,
): Promise<SimilarDeal[]> => {
  try {
    const response = await InventorySubscribeService.getDeals(params, {
      signal,
    });
    return formatDeals(response?.data?.data || []);
  } catch (error) {
    if (isAbortError(error)) throw error;
    return [];
  }
};

export const getCount = async (
  params: Record<string, any>,
  signal?: AbortSignal,
): Promise<number> => {
  try {
    const p = { ...params };
    delete p.page;
    delete p.limit;
    const response = await InventorySubscribeService.getDealsCount(p, {
      signal,
    });
    return response?.data?.data?.totalDeals || 0;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return 0;
  }
};
