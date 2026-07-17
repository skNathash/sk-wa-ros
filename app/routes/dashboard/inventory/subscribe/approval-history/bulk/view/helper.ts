import InventorySubscribeService from "~/services/InventorySubscribeService";

// Fetch details for a specific bulk approval history by ID
export const getBulkApprovalDetail = async (id: string) => {
  if (!id) return null;
  try {
    const params = { filter: { batchId: id }, groupbycond: "batchId" };
    const response = await InventorySubscribeService.getSellerImportProducts(
      params
    );
    if (
      response.statusCode === 200 &&
      Array.isArray(response.data?.data) &&
      response.data.data.length > 0
    ) {
      const detail = response.data.data[0];
      if (Array.isArray(detail.products)) {
        // Format products using the service format function
        const formattedProducts =
          InventorySubscribeService.formatSellerImportProducts(detail.products);

        detail.products = formattedProducts
          .sort((a: { productName: string }, b: { productName: string }) =>
            a.productName.localeCompare(b.productName)
          )
          .map((product: any) => ({
            ...product,
            originalProduct: {
              name: product.orgData?.productName || product.productName,
              category: product.orgData?.category || product.category,
              brand: product.orgData?.brand || product.brand,
              price: product.orgData?.price || product.price,
              mrp: product.orgData?.mrp || product.mrp,
              barcode: product.orgData?.barcode || product.barcode,
              description: product.orgData?.description || product.description,
              images: product.orgData?.images || product.images,
              unitType: product.orgData?.unitType || product.unitType,
            },
            finalProduct: {
              name: product.productName,
              category: product.category,
              brand: product.brand,
              price: product.price,
              mrp: product.mrp,
              barcode: product.barcode,
              description: product.description,
              images: product.images,
              unitType: product.unitType,
            },
            actionTaken: product.actionTaken || product.status || "--",
            status: product.status || product.actionTaken || "--",
            adminNotes: product.adminNotes || product.notes || "--",
          }));
      }
      return detail;
    }
    return null;
  } catch (error) {
    console.error("Error fetching bulk approval detail:", error);
    return null;
  }
};
