import CustomerService from "~/services/CustomerService";
import VendorService from "~/services/VendorService";
import FranchiseService from "~/services/FranchiseService";
import type { PayableReceivableEntityType } from "~/types/CommonTypes";

export async function getData(
  entityType: PayableReceivableEntityType,
  entityId: string
) {
  if (!entityType || !entityId) {
    return null;
  }

  switch (entityType) {
    case "customer": {
      const response = await CustomerService.getCustomer(entityId);
      const data = response.data?.data || null;
      if (!data) {
        return null;
      }

      const state = data?.address?.state;
      const district = data?.address?.district;
      const city = data?.address?.city;
      const town = data?.address?.town;
      const postcode = data?.address?.postcode;

      let formattedAddress = [city, district, state].filter(Boolean).join(", ");
      if (postcode) {
        formattedAddress += ` - ${postcode}`;
      }

      return {
        name: data.name,
        mobile: data?.mobile,
        state: state,
        district: district,
        city: city,
        town: town,
        pincode: postcode,
        formattedAddress: formattedAddress,
        refId: data?.referenceId,
      };
    }

    case "vendor": {
      const response = await VendorService.getDetail(entityId);
      const data = response.data?.data || null;
      if (!data) {
        return null;
      }
      return {
        name: data.name,
      };
    }

    case "franchise":
      const response = await FranchiseService.getFranchise(entityId);
      const data = response.data?.data || null;
      if (!data) {
        return null;
      }
      return {
        name: data.name,
      };
    default:
      return null;
  }
}

export default { getData };
