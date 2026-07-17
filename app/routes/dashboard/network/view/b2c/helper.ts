import CustomerService from "~/services/CustomerService";
import LoyaltyPointService from "~/services/LoyaltyPointService";

export async function getDetails(id: string) {
  const response = await CustomerService.getCustomer(id);
  const customer = response?.data?.data;

  if (customer) {
    // Resolve holder id from common fields used across the codebase
    const holderId = customer._id || null;
    if (holderId) {
      try {
        const ptsResp = await LoyaltyPointService.getHolderPoints(
          "Customer",
          holderId
        );
        customer.points = ptsResp?.available;
      } catch (err) {
        customer.points = 0;
      }
    } else {
      customer.points = 0;
    }
  }

  return customer;
}
