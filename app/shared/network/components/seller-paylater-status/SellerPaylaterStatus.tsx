import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import CommonService from "~/services/CommonService";

interface SellerPaylaterStatusProps {
  /** Seller row from `getRetailersNearby` / `formatSeller`. */
  seller: any;
  className?: string;
}

/**
 * Right-hand status column for a seller row in the side-pane list.
 *
 * Mirrors the screenshot:
 * - Active paylater → "PayLater" + compact available amount + "left"
 * - Pending paylater → "Pending" + compact payable amount
 * - No paylater → "—" or the seller's SKU count
 */
const SellerPaylaterStatus = ({
  seller,
  className,
}: SellerPaylaterStatusProps) => {
  const paylater = seller?.paylaterInfo;

  if (!paylater) {
    const skuCount = seller?.analytics?.totalSubscribedInStockDeals ?? 0;
    return (
      <div
        className={clsx(
          "tw:flex tw:flex-col tw:items-end tw:text-right",
          className,
        )}
      >
        <span className="app-label tw:text-slate-400">
          {skuCount > 0 ? "SKUs" : "NIL"}
        </span>
        <span className="tw:text-sm tw:font-bold tw:text-slate-400">
          {skuCount > 0 ? skuCount : "--"}
        </span>
      </div>
    );
  }

  const status = (paylater.status || "").toLowerCase();
  const isPending = status === "pending";

  if (isPending) {
    return (
      <div
        className={clsx(
          "tw:flex tw:flex-col tw:items-end tw:text-right",
          className,
        )}
      >
        <span className="app-label tw:text-red-500">Pending</span>
        <Amount
          value={Number(paylater.totalPayableAmount) || 0}
          decimalPlaces={0}
          className="tw:text-sm tw:font-bold tw:text-red-500"
        />
      </div>
    );
  }

  // The rupee sign is its own serif span below, so the figure is formatted
  // without a prefix.
  const availableLabel = CommonService.formatCompact(
    Number(paylater.creditAvailable) || 0,
    { prefix: "", style: "short" },
  );

  return (
    <div
      className={clsx(
        "tw:flex tw:flex-col tw:items-end tw:text-right",
        className,
      )}
    >
      <span className="app-label tw:text-purple-600">PayLater</span>
      <span className="tw:text-sm tw:font-bold tw:text-purple-700">
        <span className="tw:font-serif">₹</span>
        {availableLabel} left
      </span>
    </div>
  );
};

export default SellerPaylaterStatus;
