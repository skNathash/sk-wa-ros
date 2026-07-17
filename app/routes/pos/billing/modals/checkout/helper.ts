export const preparePayload = (values: any, finalPrice: number) => {
  const paymentMethod = values.paymentMethod;
  const customer = values["customer"];

  const paymentTypeMap: Record<string, string> = {
    cash: "COD",
    card: "PREPAID",
    gpay: "PREPAID",
    phonepe: "PREPAID",
  };

  const paymentDetails = values.paymentDetails || {};

  const paymentMode = {
    type: paymentMethod,
    refNo: paymentDetails.refNo || "",
    proof: paymentDetails.proof || [],
    amount: finalPrice || 0,
    change: paymentDetails.change || 0,
    // upiPayment: values.upiPayment || "",
  };

  const isWalkin = values.option === "walkin";

  const customerInfo: any = isWalkin
    ? {
        customerType: "Customer",
        customerId: "guest_customer",
        isGuestCustomer: true,
      }
    : {
        customerType: "Customer",
        name: customer?.name || "",
        customerId: customer?._id,
        mobile: customer?.mobile || "",
        isGuestCustomer: false,
      };

  const mobileNo = customer?.mobile || "";
  const addressStr = customer?.address?.city
    ? `${customer.address.city}, ${customer.address.state}`
    : "";

  const billingAddress = {
    mobileNo: mobileNo ? Number(mobileNo) : 0,
    address: addressStr,
  };

  const shippingAddress = {
    mobileNo: mobileNo ? Number(mobileNo) : 0,
    address: addressStr,
  };

  return {
    isWalkin,
    customer,
    customerInfo,
    billingAddress,
    shippingAddress,
    paymentMode,
    paymentType: paymentTypeMap[paymentMethod] || "COD",
  };
};

/**
 * Prepare payload for B2B order placement.
 * Uses retailer details (values.retailer) instead of customer and
 * mirrors the buyer/cart checkout shape where applicable.
 */
export const prepareB2BPayload = (values: any, finalPrice: number) => {
  const paymentMethod = values.paymentMethod;
  const paymentDetails = values.paymentDetails || {};

  const paymentTypeMap: Record<string, string> = {
    cash: "COD",
    card: "PREPAID",
    gpay: "PREPAID",
    phonepe: "PREPAID",
  };

  const paymentMode = {
    type: paymentMethod,
    refNo: paymentDetails.refNo || "",
    proof: paymentDetails.proof || [],
    amount: finalPrice || 0,
    change: paymentDetails.change || 0,
  };

  const retailer = values.retailer;

  const customerInfo: any = retailer
    ? {
        customerType: "Retailer",
        name: retailer?.name || "",
        customerId: retailer?._id,
        mobile: retailer?.mobile || "",
      }
    : {
        customerType: "Retailer",
        customerId: "",
        name: "",
      };

  const addr = retailer?.address || {};

  const address = {
    landmark: addr.landmark || "",
    city: addr.city || addr.town || "",
    district: addr.district || "",
    state: addr.state || "",
    pincode: addr.pincode || "",
    line1: addr.line1 || "",
    line2: addr.line2 || "",
  };

  return {
    customer: retailer,
    customerInfo,
    billingAddress: address,
    shippingAddress: address,
    paymentMode,
    paymentType: paymentTypeMap[paymentMethod] || "COD",
  };
};
