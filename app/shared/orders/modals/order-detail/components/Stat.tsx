/** One label-over-value tile in the summary strip. */
const Stat = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) => (
  <div className="od-stat">
    <div className="od-stat-label">{label}</div>
    <div className="od-stat-value">{children}</div>
    {hint ? <div className="od-stat-hint">{hint}</div> : null}
  </div>
);

export default Stat;
