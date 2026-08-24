import clsx from "clsx";
import {
  Barcode,
  ChevronRight,
  Layers,
  Search,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import SimilarDeals from "./SimilarDeals";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

const CART_PATH = "/dashboard/inventory/subscribe/cart";
const SEARCH_PATH = "/dashboard/inventory/subscribe/search";
const BARCODE_SCAN_PATH = "/dashboard/inventory/barcode-scan";

export interface SubscribeDetailSidePaneProps {
  /** Formatted subscribe deal (see InventorySubscribeService.formatDealResponse). */
  deal: any;
  /** Opens the catalog filtered by the product's brand / category / menu. */
  onFilter?: (type: "brand" | "category" | "menu" | "company") => void;
  className?: string;
}

interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  /** Top row of the group — skips the divider above it. */
  first?: boolean;
  onClick: () => void;
}

/**
 * One quick-action row inside the grouped card, shaped like a WhatsApp settings
 * entry: teal icon in a fixed left gutter, label, and a chevron on the right.
 * The divider is drawn on the row's content so it starts after the icon.
 */
const ActionRow = ({ icon: Icon, label, first, onClick }: ActionRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:pl-3 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
  >
    <Icon size={18} className="tw:shrink-0 tw:text-primary" />
    <span
      className={clsx(
        "tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:py-2.5 tw:pr-3",
        !first && "tw:border-t tw:border-slate-100",
      )}
    >
      <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:font-medium tw:text-slate-700">
        {label}
      </span>
      <ChevronRight size={15} className="tw:shrink-0 tw:text-slate-300" />
    </span>
  </button>
);

/**
 * Side-pane contents for the subscribe detail page in theme-2 desktop: the
 * product's category peers ("Similar in category") followed by the ways to keep
 * browsing from here — the same shape the item page's ProductSidePane has.
 */
const SubscribeDetailSidePane = ({
  deal,
  onFilter,
  className,
}: SubscribeDetailSidePaneProps) => {
  const appNav = useAppNav();

  if (!deal?._id) return null;

  const categoryName = deal.category?.name || "";

  // Built as a list so the group's dividers land between whichever rows the
  // deal actually carries.
  const actions: Omit<ActionRowProps, "first">[] = [
    {
      icon: ShoppingCart,
      label: "View catalog cart",
      onClick: () => appNav.to(CART_PATH),
    },
    ...(deal.brand?.name
      ? [
          {
            icon: Tag,
            label: `More from ${deal.brand.name}`,
            onClick: () => onFilter?.("brand"),
          },
        ]
      : []),
    ...(deal.category?.name
      ? [
          {
            icon: Layers,
            label: `Browse ${deal.category.name}`,
            onClick: () => onFilter?.("category"),
          },
        ]
      : []),
    {
      icon: Barcode,
      label: "Scan a barcode",
      onClick: () => appNav.to(BARCODE_SCAN_PATH),
    },
    {
      icon: Search,
      label: "Search the catalog",
      onClick: () => appNav.to(SEARCH_PATH, { tab: "search" }),
    },
  ];

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + the product's category as scope. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title="Product" />
        {/* Scope label removed — the pane header carries the title alone.
        {categoryName && (
          <span className="tw:truncate tw:text-sm tw:text-slate-400">
            {categoryName}
          </span>
        )}
        */}
      </div>

      {/* Other subscribable products from the same category. */}
      <SimilarDeals
        categoryId={deal.category?.id || ""}
        excludeDealId={deal._id}
      />

      <section className="tw:px-1">
        <h3 className="app-section-label tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
          Quick actions
        </h3>

        {/* One grouped card rather than separate tiles — the WhatsApp settings
            menu shape. */}
        <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
          {actions.map((action, idx) => (
            <ActionRow key={action.label} {...action} first={idx === 0} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default SubscribeDetailSidePane;
