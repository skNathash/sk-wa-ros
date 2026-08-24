import type { AgingBucket } from "./helper";

type AgingBarProps = {
  buckets: AgingBucket[];
};

// The whole payable as one rail, cut by how old the money is — the bar is read
// left to right, from bills still within terms to the ones long past due.
const AgingBar = ({ buckets }: AgingBarProps) => {
  const segments = buckets.filter((bucket) => bucket.share > 0);

  if (segments.length === 0) return null;

  return (
    <div className="tw:flex tw:h-2.5 tw:w-full tw:gap-1 tw:overflow-hidden">
      {segments.map((bucket) => (
        <div
          key={bucket.key}
          title={`${bucket.label} · ${Math.round(bucket.share)}%`}
          className="tw:h-full tw:rounded-full"
          style={{
            width: `${bucket.share}%`,
            backgroundColor: bucket.accent,
          }}
        />
      ))}
    </div>
  );
};

export default AgingBar;
