import * as yup from "yup";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";

export const validationSchema = yup.object({
  price: yup
    .number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .required("Price is required")
    .min(0.01, "Price must be greater than 0"),
  discount: yup
    .number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%"),
  // additional scheme validations removed
});

export const getDetails = async (dealId: string) => {
  const deal = await SellerCatalogService.getProducts({
    filter: {
      dealId,
    },
  });
  return SellerCatalogService.formatProductResponse(deal.data?.data || [])[0];
};

export const updateDiscount = async (payload: Record<string, any>) => {
  const response = await PosService.createRspConfig(payload);
  if (response.statusCode === 200) {
    return {
      status: "success",
      msg: response.data?.message || "Discount updated successfully",
    };
  }
  return { status: "error", msg: response.data?.message || "Failed to update" };
};

export const getPruchasePrice = (
  deal: any,
  type: "network" | "customer" = "customer",
) => {
  if (0 && type === "network") {
    return deal?.basePrice || deal?.mrp || 0;
  } else {
    return deal?.purchasePrice || deal?.mrp || 0;
  }
};
