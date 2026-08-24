import clsx from "clsx";

interface PageTopBarProps {
  /** Left side of the strip — usually the page's sub-nav (tab / pill row). */
  lead?: React.ReactNode;
  /** Right side of the strip — search field, filter button, view toggle … */
  trail?: React.ReactNode;
  /** Anything that needs its own row under the first one (applied filters, …). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The block a page opens with: its sub-nav and its search/filter controls on
 * one full-bleed white strip pinned under the app header — the same top block
 * the order pages get from {@link OrderTopBar} and the catalog pages from
 * `.catalog-search-sticky`.
 *
 * The strip owns the page's top gutter (see `.app-top-bar`), so it must be the
 * first block in its content column — a breadcrumb row above it would show as a
 * page-bg band between the header and the strip.
 */
const PageTopBar = ({ lead, trail, children, className }: PageTopBarProps) => (
  <div className={clsx("app-top-bar", className)}>
    <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-center tw:md:gap-4">
      {/* The lead track drops the strip's side padding on mobile and runs edge
          to edge (see `.app-top-bar-lead`) — a sub-nav that scrolls should
          scroll out under the gutter, not stop 1rem short of it. Its own
          leading/trailing inset comes from inside the track (`slideOffset` on
          AppTab). */}
      {lead && (
        <div className="app-top-bar-lead tw:min-w-0 tw:md:flex-1">{lead}</div>
      )}

      {trail && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:md:w-80 tw:md:shrink-0">
          {trail}
        </div>
      )}
    </div>

    {children && <div className="tw:mt-6 tw:md:mt-2">{children}</div>}
  </div>
);

export default PageTopBar;
