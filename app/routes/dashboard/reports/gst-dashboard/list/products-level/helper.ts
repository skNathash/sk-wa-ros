import { format } from "date-fns";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";
import SellerCatalogService from "~/services/SellerCatalogService";

export const SORT_OPTIONS = SellerCatalogService.getGlobalSortOptions();

const keys: Record<string, string> = {
  name: "ProductName",
  dealName: "ProductName",
  hsnCode: "HSNCode",
  gstRate: "GSTRate",
  gstCollected: "GSTCollected",
  gstInward: "GSTInward",
  netGstPayable: "NetGSTPayable",
};

// Prepare params for GST product-level listing.
export const prepareParams = (
  filter: Record<string, any> = {},
  pagination: Record<string, any> = {},
  sort: Record<string, any> | undefined = undefined,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage || 1,
    count: pagination.rowsPerPage || 10,
    filter: {},
  };

  if (sort?.key && sort?.value) {
    params.sortBy = keys[sort.key] || sort.key;
    params.sortOrder = sort.value;
  }

  // date-range: support `startDate`/`endDate`, `dateFrom`/`dateTo`, or `dateRange` array
  // API expects top-level `startDate`/`endDate` as `yyyy-MM-dd` strings.
  if (filter?.startDate) {
    params.startDate = format(filter.startDate, "yyyy-MM-dd");
  }
  if (filter?.endDate) {
    params.endDate = format(filter.endDate, "yyyy-MM-dd");
  }

  // form uses `dateFrom`/`dateTo` keys — support those as well
  if (filter?.dateFrom) {
    params.startDate = format(filter.dateFrom, "yyyy-MM-dd");
  }
  if (filter?.dateTo) {
    params.endDate = format(filter.dateTo, "yyyy-MM-dd");
  }

  // support dateRange arrays [start, end]
  if (Array.isArray(filter.dateRange) && filter.dateRange.length === 2) {
    params.startDate = format(filter.dateRange[0], "yyyy-MM-dd");
    params.endDate = format(filter.dateRange[1], "yyyy-MM-dd");
  }

  // Search term (searches in: dealId, dealName, barcode, product name, HSN, category name, brand name)
  if (filter.search && filter.search.trim()) {
    params.search = filter.search.trim();
  }

  // Menu filter
  if (filter?.menu && Array.isArray(filter.menu) && filter.menu.length > 0) {
    params.menuId = filter.menu[0]?.value?.id;
  }

  // Category filter
  if (
    filter?.category &&
    Array.isArray(filter.category) &&
    filter.category.length > 0
  ) {
    params.categoryId = filter.category[0]?.value?.id;
  }

  // Brand filter
  if (filter?.brand && Array.isArray(filter.brand) && filter.brand.length > 0) {
    params.brandId = filter.brand[0]?.value?.id;
  }

  // Parent category filter (if provided)
  if (filter?.parentCategoryId) {
    params.parentCategoryId = filter.parentCategoryId;
  }

  // GST filter
  if (filter?.gst && filter.gst !== "all") {
    params.gstRate = filter.gst;
  }

  return params;
};

// Fetch product-level data. We currently reuse SellerCatalogService as other product lists do.
export const getData = async (params: Record<string, any>) => {
  try {
    const fid = AuthService.getLoggedInUserId();
    const r = await ReportService.getGstDashboardProductLevel(fid, params);

    // Attach GST related keys if present, else defaults
    return (r.data.data || []).map((p: any, index: number) => ({
      _id: p.DealId,
      refId: p.DealRefId,
      name: p.ProductName,
      productName: p.ProductName || "",
      hsnCode: p.HSNCode || "",
      gstRate: p.GSTRate || 0,
      gstCollected: p.GSTCollected || 0,
      gstInward: p.GSTInward || 0,
      netGstPayable: p.NetGSTPayable || 0,
      brandId: p.BrandId || "",
      categoryId: p.CategoryId || "",
      brandName: p.BrandName || "",
      categoryName: p.CategoryName || "",
      // Menu related keys: try multiple possible response shapes
      menuId: p.MenuId || "",
      menuName: p.MenuName || "",

      raw: p,
    }));
  } catch (error) {
    console.error("Error fetching GST product-level data:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const fid = AuthService.getLoggedInUserId();
    const r = await ReportService.getGstDashboardProductLevel(fid, {
      outputType: "count",
      ...params,
    });

    return r.data?.count || 0;
  } catch (error) {
    console.error("Error fetching GST product-level count:", error);
    return 0;
  }
};
