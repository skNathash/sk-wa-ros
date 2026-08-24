import type { ReactNode } from "react";

interface RunnerHeaderProps {
  /** Small line above the title — the app's own name, kept for screens that
      are not home and so carry no other reminder of where the runner is. */
  eyebrow?: string;
  /** Shift state beside the eyebrow. Home shows this on its hero instead, so
      the pill is opt-in rather than part of every masthead. */
  statusLbl?: string;
  /** Main line — the greeting on home, the screen's name everywhere else. */
  title: string;
  /** Line under the title: where the runner works, or what the screen holds. */
  subtitle?: string;
  /** Trailing action buttons — the inboxes on home, search on the job list. */
  children?: ReactNode;
}

/**
 * Runner masthead — shared by every runner screen so the brand block reads the
 * same from home to the job list, with each screen naming its own title.
 * Rendered as a direct child of the page rather than inside a hero: a sticky
 * element only rides as far as its own parent's box, so living beside the hero
 * is what lets it hold the top of the screen for the whole feed.
 */
export default function RunnerHeader({
  eyebrow,
  statusLbl,
  title,
  subtitle,
  children,
}: RunnerHeaderProps) {
  return (
    <header className="runner-header">
      <div className="tw:min-w-0 tw:flex-1">
        {(eyebrow || statusLbl) && (
          <p className="tw:mb-1 tw:flex tw:items-center tw:gap-2">
            {eyebrow && <span className="runner-header-eyebrow">{eyebrow}</span>}

            {statusLbl && (
              <span className="runner-header-online">
                <span className="runner-header-online-dot" />
                {statusLbl}
              </span>
            )}
          </p>
        )}

        <h1 className="app-heading-serif tw:truncate tw:text-2xl tw:font-semibold tw:text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="tw:mt-0.5 tw:truncate tw:text-sm tw:text-white/70">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </header>
  );
}
