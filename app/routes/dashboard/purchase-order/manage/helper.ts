import AuthService from "~/services/AuthService";

const preparePayload = (
  products: any[],
  vendor: any,
  formData: Record<string, any>,
) => {
  const user = AuthService.getLoggedInUser();

  const orderAmount = products.reduce(
    (sum, p) =>
      sum + (Number(p.purchasePrice) || 0) * (Number(p.quantity) || 0),
    0,
  );

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

  return {
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
        dealId: p.dealId,
        dealName: p.dealName,
        quantity: p.quantity,
        mrp: p.mrp,
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
};

export { preparePayload };
