import AuthService from "~/services/AuthService";
import UserBadgeType from "./UserBadgeType";
import UserBadgeForItem from "./UserBadgeForItem";

const UserBadge = () => {
  const user = AuthService.getLoggedInUser();
  const isManpowerLoggedIn = AuthService.isManpowerLoggedIn();

  let typeLabel = user?.subType || "N/A";

  if (!isManpowerLoggedIn) {
    try {
      typeLabel = user?.networkType || "";
      // if (AuthService.isSkSeller()) {
      //   typeLabel = "SK Seller";
      // } else if (AuthService.isSkBuyer()) {
      //   typeLabel = "SK Buyer";
      // } else if (AuthService.isSfSeller()) {
      //   // Treat SF Seller as SK Retailer for display
      //   typeLabel = "SK Retailer";
      // } else if (AuthService.isBuyerUser()) {
      //   // Treat SF Buyer as SK Retailer for display
      //   typeLabel = "SK Retailer";
      // } else {
      //   // Fallback: show subtype as-is
      //   typeLabel = user?.subType || "N/A";
      // }
    } catch (e) {
      // In case of any unexpected errors, fall back gracefully
      typeLabel = user?.subType || "N/A";
    }
  }

  return (
    <UserBadgeForItem networkType={user?.networkType} subType={user?.subType} />
  );
};

export default UserBadge;
