import VendorService from "~/services/VendorService";

export type TopSkuItem = ReturnType<
  typeof VendorService.formatVendorCatalog
>[number];

const TOP_SKU_LIMIT = 5;

export const getData = async (vendorId: string) => {
  const listResp = await VendorService.getPurchasedDealsByFranchise(vendorId, {
    sortBy: "quantity",
    sortOrder: -1,
    page: 1,
    limit: TOP_SKU_LIMIT,
  });

  const rows = Array.isArray(listResp?.data?.data) ? listResp.data.data : [];

  return VendorService.formatVendorCatalog(rows).slice(0, TOP_SKU_LIMIT);
};
