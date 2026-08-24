import SellerCatalogService from "~/services/SellerCatalogService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

// Helper to build location object
function buildLocationObj(formData: any) {
  const locationDetails = formData.locationDetails || null;
  if (locationDetails && formData.rackDetails && formData.binDetails) {
    return {
      name: locationDetails.name || "",
      rackId: formData.rackDetails?.rackId || "",
      binId: formData.binDetails?.binId || "",
      id: locationDetails.id || "",
      rackName: formData.rackDetails?.rackName || "",
      binName: formData.binDetails?.binName || "",
      binCode: formData.binDetails?.binCode || "",
    };
  }
  return null;
}

export const loadDetails = async (id: string) => {
  const response = await PurchaseOrderService.getDetails(id);
  if (!(response && response.data?.data)) return {};
  const poData = response.data.data;
  const formattedPO = PurchaseOrderService.formatPurchaseOrderData(poData);

  // Collect all dealIds from items
  const dealIds = (poData.items || [])
    .map((item: any) => item.dealId)
    .filter(Boolean);
  let catalogProducts: any[] = [];
  if (dealIds.length > 0) {
    const catalogResp = await SellerCatalogService.getProducts({
      filter: { dealId: { $in: dealIds } },
    });
    catalogProducts = catalogResp?.data?.data || [];
  }

  // Attach _locationDetails to each item by matching dealId and _id
  formattedPO.items = (formattedPO.items || []).map((item: any) => {
    const match = catalogProducts.find(
      (prod: any) => prod.dealId === item.dealId
    );
    let locationDetails = null;
    if (match?.locations?.length) {
      // Use first location and prepare structure matching ProductItemForm
      const loc = match.locations[0];
      locationDetails = {
        location: loc.location.id,
        locationDetail: {
          id: loc.location.id,
          name: loc.location.name,
        },
        rack: loc.location.rackId,
        rackDetails: {
          rackId: loc.location.rackId,
          rackName: loc.location.rackName,
        },
        bin: loc.location.binId,
        binDetails: {
          binId: loc.location.binId,
          binName: loc.location.binName,
        },
      };
    }
    return {
      ...item,
      _locationDetails: locationDetails,
    };
  });

  return formattedPO;
};

// Helper to validate expiry date is greater than manufacture date
function validateExpiryDate(
  manufactureDate: string | Date,
  expiryDate: string | Date
): boolean {
  if (!manufactureDate || !expiryDate) return true; // Skip validation if either date is missing

  const mfgDate = new Date(manufactureDate);
  const expDate = new Date(expiryDate);

  return expDate >= mfgDate;
}

// Prefer an explicit purchase price; fall back to MRP when missing/zero.
export function resolvePurchasePrice(product: any): number | string {
  const fromForm = Number(product?.formData?.purchasePrice);
  if (fromForm > 0) return fromForm;

  const fromProduct = Number(product?.purchasePrice);
  if (fromProduct > 0) return fromProduct;

  const mrpFromForm = Number(product?.formData?.mrp);
  if (mrpFromForm > 0) return mrpFromForm;

  const mrpFromProduct = Number(product?.mrp);
  if (mrpFromProduct > 0) return mrpFromProduct;

  return product?.formData?.purchasePrice || product?.purchasePrice || "";
}

export type ProductValidationIssue = {
  field?:
    | "purchasePrice"
    | "invoiceQty"
    | "receivedQty"
    | "damageQty"
    | "location"
    | "rack"
    | "bin"
    | "manufactureDate"
    | "expiryDate"
    | "variations";
  message: string;
};

/** Validate a single product's receive formData. Returns null when valid. */
export function validateProduct(
  product: any,
  label = "Product",
): ProductValidationIssue | null {
  const formData = product?.formData || {};

  if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
    return {
      field: "purchasePrice",
      message: `${label}: Purchase price is required`,
    };
  }

  if (formData.mrp && Number(formData.purchasePrice) > Number(formData.mrp)) {
    return {
      field: "purchasePrice",
      message: `${label}: Purchase price cannot be greater than MRP`,
    };
  }

  if (!formData.invoiceQty || Number(formData.invoiceQty) <= 0) {
    return {
      field: "invoiceQty",
      message: `${label}: Invoice quantity is required`,
    };
  }

  if (
    (Number(formData.receivedQty) || 0) <= 0 &&
    (Number(formData.damageQty) || 0) <= 0
  ) {
    return {
      field: "receivedQty",
      message: `${label}: Received or damage quantity is required`,
    };
  }

  if (Number(formData.receivedQty) > Number(formData.invoiceQty)) {
    return {
      field: "receivedQty",
      message: `${label}: Received quantity cannot be greater than invoice quantity (${formData.invoiceQty})`,
    };
  }

  if (
    (Number(formData.receivedQty) || 0) + (Number(formData.damageQty) || 0) >
    Number(formData.invoiceQty)
  ) {
    return {
      field: "damageQty",
      message: `${label}: Received + damage quantity cannot be greater than invoice quantity (${formData.invoiceQty})`,
    };
  }

  if (
    formData.manufactureDate &&
    formData.expiryDate &&
    !validateExpiryDate(formData.manufactureDate, formData.expiryDate)
  ) {
    return {
      field: "expiryDate",
      message: `${label}: Manufacture date cannot be greater than expiry date`,
    };
  }

  if (!formData.location) {
    return { field: "location", message: `${label}: Location is required` };
  }
  if (!formData.rack) {
    return { field: "rack", message: `${label}: Rack is required` };
  }
  if (!formData.bin) {
    return { field: "bin", message: `${label}: Bin is required` };
  }

  const variations = formData.variations || [];
  if (variations.length > 0) {
    const receivedQty = Number(formData.receivedQty) || 0;
    const totalVariationQty = variations.reduce(
      (sum: number, variation: any) => sum + (variation.formData?.qty || 0),
      0,
    );
    if (totalVariationQty > receivedQty) {
      return {
        field: "variations",
        message: `${label}: Total variation quantity (${totalVariationQty}) cannot be greater than received quantity (${receivedQty})`,
      };
    }

    for (let vIndex = 0; vIndex < variations.length; vIndex++) {
      const variationFormData = variations[vIndex]?.formData;
      if (
        variationFormData?.manufactureDate &&
        variationFormData?.expiryDate &&
        !validateExpiryDate(
          variationFormData.manufactureDate,
          variationFormData.expiryDate,
        )
      ) {
        return {
          field: "variations",
          message: `${label}, Variation ${vIndex + 1}: Manufacture date cannot be greater than expiry date`,
        };
      }
    }
  }

  return null;
}

// Helper to validate products
function validateProducts(products: any[]): string {
  const scannedProducts = products.filter((p) => p._scanned);
  if (scannedProducts.length === 0) {
    return "At least one product must be scanned";
  }

  for (let index = 0; index < scannedProducts.length; index++) {
    const issue = validateProduct(
      scannedProducts[index],
      `Product ${index + 1}`,
    );
    if (issue) return issue.message;
  }

  return "";
}

// Helper to build product/variation payload
function buildProductPayload({
  product,
  isVariation = false,
  variation = {},
  invoice = {},
}: {
  product: any;
  isVariation?: boolean;
  variation?: any;
  invoice?: any;
}) {
  // Get MRP and purchase price
  const mrp = isVariation ? variation.formData?.mrp : product.formData.mrp;
  const purchasePrice = isVariation
    ? variation.formData?.purchasePrice
    : product.formData.purchasePrice;

  // Calculate discount based on MRP and purchase price
  const discount =
    mrp && purchasePrice ? ((mrp - purchasePrice) / mrp) * 100 : 0;

  // Calculate value (purchase price * received quantity)
  const receivedQuantity = Number(
    isVariation
      ? variation.formData?.qty || 0
      : product.formData.receivedQty || 0
  );

  const requestedQuantity = product.quantity || 0;
  const damageQuantity = isVariation ? 0 : product.formData.damageQty || 0;
  // Include quantities consumed by variations when calculating shortage for main products
  let variationDoneQty = 0;
  if (!isVariation) {
    const variationsList = product.formData?.variations || [];
    variationDoneQty = variationsList.reduce((sum: number, v: any) => {
      return sum + (Number(v.formData?.qty) || 0);
    }, 0);
  } else {
    // For a variation itself, its own shortage is based on its qty vs parent requested (handled when building parent)
    variationDoneQty = 0;
  }

  const shortageQuantity = Math.max(
    0,
    requestedQuantity - receivedQuantity - damageQuantity - variationDoneQty
  );

  return {
    dealId: product.dealId || "",
    dealName: product.dealName || "",
    purchasePrice: purchasePrice,
    mrp: mrp,
    discount: discount,
    barcode: isVariation ? variation.formData?.barcode : product.barcode,
    hsn: product.hsn,
    expiry: isVariation
      ? variation.formData?.expiryDate || ""
      : product.formData.expiryDate || "",
    receivedQuantity: receivedQuantity,
    status: "Completed",
    category: product.category,
    brand: product.brand,
    damagedQuantity: damageQuantity,
    damagedImages: isVariation
      ? []
      : (product.formData.damageDocs || []).map((doc: any) => doc.id),
    shortageQuantity: isVariation ? 0 : shortageQuantity,
    damagedReason: isVariation ? "" : product.formData.damageRemarks || "",
    manufactureDate: isVariation
      ? variation.formData?.manufactureDate ||
        product.formData.manufactureDate ||
        ""
      : product.formData.manufactureDate || "",
    remarks: isVariation
      ? variation.formData?.notes || ""
      : product.formData.notes || "",
    preferredUnitType: "",
    uom: product.uom,
    location: isVariation
      ? buildLocationObj({
          locationDetails: variation.formData?.locationDetails,
          rackDetails: variation.formData?.rackDetails,
          binDetails: variation.formData?.binDetails,
        })
      : buildLocationObj(product.formData),
    invoicedQuantity: product.formData.invoiceQty || 0,
    invoiceQuantity: product.formData.invoiceQty || 0,
    ...(isVariation
      ? {
          parentId: variation.parentDealId || "",
          parentItemId: product.itemId || "",
        }
      : {}),
    ...(product.itemId && !isVariation ? { itemId: product.itemId } : {}),
  };
}

const preparePayload = (products: any[], remarks: any, invoice: any) => {
  // Process products and their variations
  const processedProductList: any[] = [];

  products.forEach((product) => {
    const formData = product.formData || {};
    const variations = formData.variations || [];

    // Push main product
    processedProductList.push(buildProductPayload({ product, invoice }));

    // Push variations if any
    if (variations.length > 0) {
      variations.forEach((variation: any) => {
        processedProductList.push(
          buildProductPayload({
            product,
            isVariation: true,
            variation,
            invoice,
          })
        );
      });
    }
  });

  // Invoice Details
  const invoiceDetails = invoice.invoiceNumber
    ? [
        {
          refno: invoice.invoiceNumber || "",
          remarks: invoice.remarks || "",
          invoiceDate: invoice.invoiceDate || "",
          documentAssetIds: Array.isArray(invoice.invoiceUpload)
            ? invoice.invoiceUpload.map((file: any) => file.id)
            : invoice.invoiceUpload
            ? [invoice.invoiceUpload]
            : [],
          amount: invoice.amount || 0,
        },
      ]
    : undefined;

  // Payment Settlement
  const paymentSettlement =
    invoice.paymentStatus === "Paid"
      ? [
          {
            refNo: invoice.referenceNumber || "",
            remarks: invoice.paymentRemarks || "",
            paymentDate: invoice.paymentDate || "",
            paymentMode: invoice.paymentMode || "",
            proofs: Array.isArray(invoice.paymentUpload)
              ? invoice.paymentUpload.map((file: any) => file.id)
              : invoice.paymentUpload
              ? [invoice.paymentUpload]
              : [],
            amount: invoice.amount || 0,
            orderAmount: invoice.amount || 0,
            // invoiceNo: invoice.invoiceNumber || "",
          },
        ]
      : [];

  let payload: any = {
    remarks: remarks,
    paymentStatus:
      invoice.paymentStatus == "UnPaid" ? "Pending" : invoice.paymentStatus,
    ...(invoiceDetails ? { invoiceDetails } : {}),
    items: processedProductList,
  };

  // Only include paymentSettlement if payment status is "Paid"
  if (invoice.paymentStatus === "Paid") {
    payload.paymentSettlement = paymentSettlement;
    payload.paymentSummary = paymentSettlement;
  }

  return payload;
};

export { preparePayload, validateProducts };
