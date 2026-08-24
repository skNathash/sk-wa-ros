import {
  Inbox,
  Network,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";
import AuthService from "~/services/AuthService";
import useAppNav from "~/hooks/useAppNav";

interface SectionItem {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  accent: string;
  gated?: boolean;
}

const SECTIONS: SectionItem[] = [
  {
    key: "vendor-purchase",
    icon: PackageSearch,
    title: "Vendor Purchase",
    description: "Orders placed with your vendors",
    path: "/dashboard/purchase-order/summary",
    accent:
      "tw:text-emerald-700 tw:bg-emerald-50 tw:group-hover:bg-emerald-100",
  },
  {
    key: "network-purchase",
    icon: Network,
    title: "Network Purchase",
    description: "Orders from the StoreKing network",
    path: "/dashboard/purchase-order/seller-summary",
    accent: "tw:text-blue-700 tw:bg-blue-50 tw:group-hover:bg-blue-100",
    gated: true,
  },
  {
    key: "inward",
    icon: Inbox,
    title: "Inward",
    description: "Orders yet to be received",
    path: "/dashboard/purchase-order/not-received",
    accent:
      "tw:text-orange-700 tw:bg-orange-50 tw:group-hover:bg-orange-100",
  },
];

interface PurchaseOrderSectionsProps {
  className?: string;
}

/**
 * Quick section links in the purchase-order side pane — vendor purchase,
 * network purchase (B2B only), and inward (not-received).
 */
const PurchaseOrderSections = ({ className }: PurchaseOrderSectionsProps) => {
  const appNav = useAppNav();
  const canHandleB2B = AuthService.canHandleB2B();

  return (
    <div className={className}>
      <div className="tw:flex tw:items-center tw:gap-3 tw:mb-2 tw:px-1">
        <h3 className="app-label tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          Sections
        </h3>
        <div className="tw:flex-1 tw:h-px tw:bg-linear-to-r tw:from-slate-200 tw:to-transparent" />
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2">
        {SECTIONS.filter((section) => !section.gated || canHandleB2B).map(
          ({ key, icon: Icon, title, description, path, accent }) => (
            <button
              key={key}
              type="button"
              onClick={() => appNav.to(path)}
              aria-label={title}
              className="tw:group tw:flex tw:w-full tw:items-center tw:gap-3 tw:cursor-pointer tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:text-left tw:transition-all tw:hover:border-slate-300 tw:hover:shadow-sm"
            >
              <span
                className={`tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:transition-colors ${accent}`}
              >
                <Icon className="tw:w-4 tw:h-4" />
              </span>
              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-800 tw:leading-tight">
                  {title}
                </span>
                <span className="tw:mt-0.5 tw:block tw:text-xs tw:text-slate-500 tw:leading-tight">
                  {description}
                </span>
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderSections;
