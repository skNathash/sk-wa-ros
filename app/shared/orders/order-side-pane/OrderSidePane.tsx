import clsx from "clsx";
import PaneChipGroups, {
  type PaneChipGroup,
} from "~/shared/navigation/pane-chips/PaneChipGroups";
import OrderSearchInput from "../order-search/OrderSearchInput";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

/** A labelled strip of chips in the pane (e.g. "Views", "Channel"). */
export type OrderPaneChipGroup = PaneChipGroup;

export interface OrderSidePaneProps {
  /** Pane header title. Defaults to "Orders". */
  title?: string;
  /** Small scope line beside the title (e.g. "128 orders"). */
  subtitle?: string;

  /** Search box value + handler. The box is dropped without a handler. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Chip strips rendered under the search, in order. */
  groups?: OrderPaneChipGroup[];

  /** Anything else the page wants at the bottom of the pane. */
  children?: React.ReactNode;

  className?: string;
}

/**
 * Side-pane contents for the order views in theme-2 desktop — the pane header,
 * the order search and however many chip strips the page needs (channel,
 * status, sub-view). Sibling of `FulfillmentSidePane`, which carries the
 * pipeline stage list the board needs; pages without stages use this one.
 *
 * The pane owns no data: the page passes the current values and gets the
 * selection back, and every section is dropped when no handler is given.
 */
const OrderSidePane = ({
  title = "Orders",
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  groups,
  children,
  className,
}: OrderSidePaneProps) => (
  <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
    {/* Pane header — section title + how much sits behind the current view. */}
    <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
      <PaneTitle title={title} />
      {/* Subtitle removed — the pane header carries the title alone.
      {subtitle && (
        <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">
          {subtitle}
        </span>
      )}
      */}
    </div>

    {onSearchChange && (
      <OrderSearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />
    )}

    <PaneChipGroups groups={groups} />

    {children}
  </div>
);

export default OrderSidePane;
