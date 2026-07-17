import SellerCatalogService from "~/services/SellerCatalogService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

// Helper to build location object
function buildLocationObj(formData: any) {
  if (formData.locationDetails && formData.rackDetails && formData.binDetails) {
    return {
      name: formData.locationDetails.name || "",
      rackId: formData.rackDetails?.rackId || "",
      binId: formData.binDetails?.binId || "",
      id: formData.locationDetails?._id || "",
      rackName: formData.rackDetails?.rackName || "",
      binName: formData.binDetails?.name || formData.binDetails?.binName || "",
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

// Helper to validate products
function validateProducts(products: any[]): string {
  let msg = "";

  // Check if at least one product is scanned
  const scannedProducts = products.filter((p) => p._scanned);
  if (scannedProducts.length === 0) {
    msg = "At least one product must be scanned";
    return msg;
  }

  // Check each scanned product for required fields
  for (let index = 0; index < scannedProducts.length; index++) {
    const product = scannedProducts[index];
    const formData = product.formData || {};

    // Validate purchase price
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      msg = `Product ${index + 1}: Purchase price is required`;
      break;
    } else if (
      formData.mrp &&
      Number(formData.purchasePrice) > Number(formData.mrp)
    ) {
      msg = `Product ${index + 1}: Purchase price cannot be greater than MRP`;
      break;
    }

    if (!formData.invoiceQty || Number(formData.invoiceQty) <= 0) {
      msg = `Product ${index + 1}: Invoice quantity is required`;
      break;
    } else if (!formData.receivedQty || Number(formData.receivedQty) <= 0) {
      msg = `Product ${index + 1}: Received quantity is required`;
      break;
    } else if (Number(formData.receivedQty) > Number(formData.invoiceQty)) {
      // Received qty must not exceed invoice qty, but it can be less
      msg = `Product ${
        index + 1
      }: Received quantity cannot be greater than invoice quantity (${
        formData.invoiceQty
      })`;
      break;
    } else if (
      formData.manufactureDate &&
      formData.expiryDate &&
      !validateExpiryDate(formData.manufactureDate, formData.expiryDate)
    ) {
      msg = `Product ${
        index + 1
      }: Manufacture date cannot be greater than expiry date`;
      break;
    } else if (!formData.location) {
      msg = `Product ${index + 1}: Location is required`;
      break;
    } else if (!formData.rack) {
      msg = `Product ${index + 1}: Rack is required`;
      break;
    } else if (!formData.bin) {
      msg = `Product ${index + 1}: Bin is required`;
      break;
    }

    // Validate variation quantities
    const variations = formData.variations || [];
    if (variations.length > 0) {
      const receivedQty = Number(formData.receivedQty) || 0;
      const totalVariationQty = variations.reduce(
        (sum: number, variation: any) => {
          return sum + (variation.formData?.qty || 0);
        },
        0
      );
      if (totalVariationQty > receivedQty) {
        msg = `Product ${
          index + 1
        }: Total variation quantity (${totalVariationQty}) cannot be greater than received quantity (${receivedQty})`;
        break;
      }

      // Validate variations expiry dates
      for (let vIndex = 0; vIndex < variations.length; vIndex++) {
        const variation = variations[vIndex];
        const variationFormData = variation.formData;
        if (
          variationFormData?.manufactureDate &&
          variationFormData?.expiryDate
        ) {
          if (
            !validateExpiryDate(
              variationFormData.manufactureDate,
              variationFormData.expiryDate
            )
          ) {
            msg = `Product ${index + 1}, Variation ${
              vIndex + 1
            }: Manufacture date cannot be greater than expiry date`;
            break;
          }
        }
      }
      if (msg) break;
    }
  }

  return msg;
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
    category: product._raw?.category,
    brand: product._raw?.brand,
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
    allowedUnitTypes: product._raw?.allowedUnitTypes,
    preferredUnitType: "",
    uom: product._raw?.uom,
    packSize: product._raw?.packSize,
    location: isVariation
      ? buildLocationObj({
          locationDetails: variation.formData?.locationDetail,
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
            ? invoice.invoiceUpload.map((file: any) => file.id || file)
            : invoice.invoiceUpload
            ? [invoice.invoiceUpload]
            : [],
          amount: invoice.invoiceValue || invoice.amount || 0,
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
              ? invoice.paymentUpload.map((file: any) => file.id || file)
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
