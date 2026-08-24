/** A titled card wrapper used for each block of the order detail. */
const Section = ({
  title,
  icon,
  count,
  right,
  children,
}: {
  title: string;
  /** Small glyph in the accent chip left of the title. */
  icon?: React.ReactNode;
  /** Pill after the title, e.g. the line-item count. */
  count?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="od-card">
    <div className="od-card-head">
      {icon ? <span className="od-card-icon">{icon}</span> : null}
      <h3 className="od-card-title">{title}</h3>
      {count !== undefined ? <span className="od-count">{count}</span> : null}
      {right ? <span className="tw:ml-auto">{right}</span> : null}
    </div>
    {children}
  </div>
);

export default Section;
