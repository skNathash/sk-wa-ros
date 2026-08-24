import React from "react";

interface Props {
  /** Uppercase eyebrow that names the section. */
  title: string;
  /** Small caption under the title. */
  subtitle?: React.ReactNode;
  /** Optional right-aligned action, e.g. a "See all" link. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The one heading treatment every Discover section uses — a muted uppercase
 * eyebrow with a caption under it, optionally paired with a right-aligned
 * action. Keeping it here stops each rail from inventing its own title style.
 */
const SectionHeading: React.FC<Props> = ({
  title,
  subtitle,
  action,
  className = "",
}) => (
  <div
    className={`tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-3 ${className}`}
  >
    <div className="tw:min-w-0">
      <h2 className="tw:text-[11px] tw:font-bold tw:tracking-wider tw:text-slate-500 tw:uppercase">
        {title}
      </h2>
      {subtitle ? (
        <p className="tw:mt-0.5 tw:text-xs tw:text-slate-400">{subtitle}</p>
      ) : null}
    </div>

    {action ? <div className="tw:shrink-0">{action}</div> : null}
  </div>
);

export default SectionHeading;
