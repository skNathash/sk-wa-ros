import SellerCatalogService from "~/services/SellerCatalogService";

/** Condition the pre-owned unit is being taken in as. */
export const CONDITION_TYPES = [
  { value: "Refurbished", label: "Refurbished" },
  { value: "Used", label: "Used" },
  { value: "Open Box", label: "Open Box" },
  { value: "Damaged", label: "Damaged" },
];

/** Cosmetic/functional grade of the unit — sold alongside the condition. */
export const PRODUCT_GRADES = [
  { value: "A", label: "Grade A — Like new, minimal signs of use" },
  { value: "B", label: "Grade B — Light wear, fully functional" },
  { value: "C", label: "Grade C — Visible wear, fully functional" },
  { value: "D", label: "Grade D — Heavy wear or partial defects" },
];

/**
 * Source deal the pre-owned unit is cloned from. Same lookup the product view
 * uses — the list endpoint filtered by `dealId`, run through the shared
 * formatter so the fields line up with the rest of the catalog screens.
 */
export const getDealDetails = async (dealId: string) => {
  const response = await SellerCatalogService.getProducts(
    {
      filter: { dealId },
      showAllDeals: true,
    },
    { showOutOfStock: true },
  );
  const deal = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  )[0];
  return deal || null;
};

export interface PreOwnedPayload {
  productCondtionType: string;
  dealName: string;
  description: string;
  images: string[];
  quantity: number;
  mrp: number;
  productGrade: string;
}

/**
 * Create the pre-owned deal. Cloning is keyed off the seller-deal document id
 * (`sellerDealObjId`), not the catalog `dealId`, in line with the rest of the
 * `catalog/seller-deals/{id}/…` endpoints. Returns the cloned deal in a shape
 * the add-stock modal can consume directly (`dealId` is the mongo _id,
 * `dealRefId` the catalog reference).
 */
export const createPreOwnedDeal = async (
  sellerDealObjId: string,
  payload: PreOwnedPayload,
): Promise<{
  status: "success" | "error";
  msg: string;
  data?: { dealId: string; dealRefId: string; dealName: string };
}> => {
  try {
    const response = await SellerCatalogService.cloneDeal(
      sellerDealObjId,
      payload,
    );
    if (response?.statusCode === 200 || response?.statusCode === 201) {
      const created = response.data?.data || response.data || {};
      return {
        status: "success",
        msg: response.data?.message || "Pre-owned unit created successfully",
        data: {
          dealId: created.dealId || created._id || "",
          dealRefId: created.dealRefId || created.id || "",
          dealName: created.dealName || payload.dealName,
        },
      };
    }
    return {
      status: "error",
      msg: response?.data?.message || "Failed to create the pre-owned unit",
    };
  } catch (error: any) {
    return {
      status: "error",
      msg:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create the pre-owned unit",
    };
  }
};

/** Strip HTML so the rich-text description can be validated on real content. */
export const stripHtml = (html?: string): string => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
};
