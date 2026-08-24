// Re-exported so the overview card and the summary tiles keep importing the
// wallet from one place. Source of truth: app/shared/accounts/paylater.
export {
  getMyPaylaterRequest as getMyPaylaterForRetailer,
  getPaylaterWallet,
  utilisationTone,
  type PaylaterWallet,
} from "~/shared/accounts/paylater/my-wallet";
