import { ArrowRight } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import { recentPurchaseOrders, type PurchaseOrder } from "../data";

const statusTone: Record<PurchaseOrder["status"], string> = {
  OPEN: "tw:bg-emerald-50 tw:text-emerald-600",
  DRAFT: "tw:bg-slate-100 tw:text-slate-500",
  RECEIVED: "tw:bg-sky-50 tw:text-sky-600",
};

/** "Recent purchase orders" list with seller short-code avatars. */
const RecentPurchaseOrders = () => {
  const appNav = useAppNav();

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:flex tw:items-center tw:justify-between">
        <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
          Recent purchase orders
        </h3>
        <button
          type="button"
          onClick={() => appNav.to("/dashboard/purchase-order/main")}
          className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-emerald-600 tw:hover:underline"
        >
          Open supply
          <ArrowRight className="tw:h-3.5 tw:w-3.5" />
        </button>
      </div>

      <ul className="tw:mt-3 tw:divide-y tw:divide-slate-100">
        {recentPurchaseOrders.map((po) => (
          <li
            key={po.code}
            className="tw:flex tw:items-center tw:gap-3 tw:py-2.5"
          >
            <span
              className={`tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-[10px] tw:font-bold tw:text-white ${po.shortTone}`}
            >
              {po.short}
            </span>
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
                  {po.code}
                </span>
                <span
                  className={`tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide ${statusTone[po.status]}`}
                >
                  {po.status}
                </span>
              </div>
              <p className="tw:truncate tw:text-xs tw:text-slate-500">
                {po.seller} · {po.items} items
              </p>
            </div>
            <span className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-slate-900">
              ₹{po.amount.toLocaleString("en-IN")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentPurchaseOrders;
