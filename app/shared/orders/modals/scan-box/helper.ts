import PurchaseOrderService from "~/services/PurchaseOrderService";

export const getScanData = async (barcode: string) => {
  let result: Record<string, any> = {
    response: null,
    overview: null,
    type: "",
  };

  const skResponse = await PurchaseOrderService.getPoPackages(barcode);
  if (skResponse.statusCode === 200 && skResponse.data?.data) {
    const data = skResponse.data.data;
    const pkg = Array.isArray(data) ? data[0] || {} : data || {};
    const items = Array.isArray(pkg.items) ? pkg.items : [];
    result.response = pkg;
    result.overview = {
      packageRefNo: pkg.packageId || pkg.packageRefNo || "",
      totalQty: items?.reduce(
        (acc: number, curr: any) => acc + Number(curr.quantity || 0),
        0
      ),
      totalItems: items?.length || 0,
    };
    result.type = "sk";
  }

  // const boxResponse = await OmsService.getShippedPackagesFromSKDetails(barcode);
  // if (boxResponse.statusCode === 200 && boxResponse.data?.data) {
  //   result.response = boxResponse.data.data;
  //   result.type = "box";
  // }

  return result;
};
