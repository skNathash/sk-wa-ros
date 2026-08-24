// The wallet this seller has issued to the logged-in retailer lives in
// app/shared/accounts/paylater — the overview card, this tab and the vendor
// detail page all read the same normalised shape.
export {
  getPaylaterWallet,
  utilisationTone,
  type PaylaterWallet,
} from "~/shared/accounts/paylater/my-wallet";
