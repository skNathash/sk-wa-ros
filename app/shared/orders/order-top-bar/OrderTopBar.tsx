import clsx from "clsx";
import OrderSearchInput from "../order-search/OrderSearchInput";
import OrderViewTabs, {
  type OrderViewTabKey,
} from "../order-view-tabs/OrderViewTabs";

interface OrderTopBarProps {
  /** Which of the three order views is on screen. */
  activeView?: OrderViewTabKey | "";

  /** Search box value + handler. The box is dropped without a handler. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Fully custom search field (e.g. a register-wired AppInput) — replaces
      the built-in OrderSearchInput. */
  searchInput?: React.ReactNode;

  /** Controls sitting next to the search — filter button, view toggle, … */
  actions?: React.ReactNode;

  /** Anything that needs its own row under the tabs (applied filters, …). */
  children?: React.ReactNode;

  className?: string;
}

/**
 * The block every order page opens with: the view switcher and the search on
 * one full-bleed white strip pinned under the app header, the same way the
 * catalog pages open with their sticky search band.
 *
 * The strip owns the page's top gutter (see `.order-top-bar`), so it must be
 * the first block in its content column — a breadcrumb row above it would show
 * as a page-bg band between the header and the strip.
 */
const OrderTopBar = ({
  activeView = "",
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchInput,
  actions,
  children,
  className,
}: OrderTopBarProps) => (
  <div className={clsx("order-top-bar", className)}>
    <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-center tw:md:gap-4">
      {/* Pills rather than the default chips — the chip variant paints white
          pills, which vanish on this white strip. */}
      <div className="tw:min-w-0 tw:md:flex-1">
        <OrderViewTabs activeTab={activeView} variant="pills" />
      </div>

      {(onSearchChange || searchInput || actions) && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:md:w-80 tw:md:shrink-0">
          {searchInput
            ? searchInput
            : onSearchChange && (
                <OrderSearchInput
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                  className="tw:flex-1"
                />
              )}
          {actions}
        </div>
      )}
    </div>

    {children && <div className="tw:mt-2">{children}</div>}
  </div>
);

export default OrderTopBar;
