import AuthService from "~/services/AuthService";
import VendorService from "~/services/VendorService";

const getData = async (vendorId: string, params: Record<string, any>) => {
  // Fetch products
  const response = await VendorService.getProducts(vendorId, params);
  const products = response.data?.data || [];
  return products;
};

const getCount = async (vendorId: string, params: Record<string, any>) => {
  try {
    const response = await VendorService.getProductsCount(vendorId, {
      ...params,
      outputType: "count",
    });
    if (response?.statusCode === 200 && response.data) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching vendor products count:", error);
    return 0;
  }
};

const prepareParams = (
  filter: Record<string, any>,
  pagination: Record<string, any>,
  vendorBrands: string[],
  vendorCategories: string[]
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  let categories = vendorCategories || [];
  let brands = vendorBrands || [];

  if (filter.category) {
    categories = (filter.category || []).map((c: any) => c.value?.id);
  }

  if (filter.brand) {
    brands = (filter.brand || []).map((b: any) => b.value?.id);
  }

  if (categories.length > 0) {
    params.filter.categoryId = categories[0];
  }

  if (brands.length > 0) {
    params.filter.brandId = brands[0];
  }

  if (filter.search) {
    const search = String(filter.search).trim();
    params.search = search;
  }

  if (filter.barcode) {
    params.filter.barcode = filter.barcode;
  }

  if (filter.alpha) {
    params.filter.alphabetical = filter.alpha;
  }

  return params;
};

const mapSelectedProducts = (products: any[], selectedProducts: any[]) => {
  return products.map((p) => {
    const selectedProduct = selectedProducts.find(
      (sp) => sp.dealId === p.dealId
    );

    if (selectedProduct) {
      return {
        ...p,
        purchasePrice: selectedProduct?.purchasePrice || "",
        discount: selectedProduct?.discount || "",
        quantity: selectedProduct?.quantity || "",
        total: selectedProduct?.total || "",
        mrp: selectedProduct?.mrp || "",
      };
    }
    return p;
  });
};

const preparePayload = (
  products: any[],
  vendor: any,
  formData: Record<string, any>
) => {
  const user = AuthService.getLoggedInUser();

  // Calculate orderAmount (sum of all product totals)
  const orderAmount = products.reduce(
    (sum, p) =>
      sum + (Number(p.purchasePrice) || 0) * (Number(p.quantity) || 0),
    0
  );

  // Prepare paymentSummary if payment info is provided
  let paymentSummary: any[] = [];
  if (
    formData.paymentStatus === "Paid" ||
    formData.paymentStatus === "Partially Paid"
  ) {
    paymentSummary.push({
      paymentMode: formData.paymentMethod,
      orderAmount: orderAmount,
      amount: orderAmount,
      referenceNo: formData.paymentReference,
      paymentDate: formData.paymentDate || "",
    });
  }

  let payload = {
    vendorInfo: {
      id: vendor._id,
    },
    purchaseFrom: {
      id: vendor._id,
      type: "Vendor",
      name: vendor.name,
      address: vendor.address,
    },
    franchiseInfo: {
      id: user._id,
    },
    items: products.map((p) => {
      return {
        dealId: p._id,
        dealName: p.name,
        quantity: p.quantity,
        mrp: p.mrp || p.purchasePrice,
        purchasePrice: p.purchasePrice,
        tax: p.tax || 18,
        cgst: p.cgst || 9,
        sgst: p.sgst || 9,
        status: "Pending",
      };
    }),
    status: "Approved",
    remarks: formData.remarks,
    paymentSummary,
    expectedDeliveryDate: formData.expectedDate || "",
  };

  return payload;
};

export {
  getCount,
  getData,
  mapSelectedProducts,
  prepareParams,
  preparePayload,
};
