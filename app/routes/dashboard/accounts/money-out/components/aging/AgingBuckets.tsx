import Amount from "~/components/core/amount/Amount";
import type { AgingBucket } from "./helper";

type AgingBucketsProps = {
  buckets: AgingBucket[];
};

// The same four windows the bar is cut into, spelled out — what each bucket is
// worth and how many vendors are waiting in it. Two up on a phone, all four in
// a row from md up.
const AgingBuckets = ({ buckets }: AgingBucketsProps) => (
  <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:md:grid-cols-4 tw:md:gap-3">
    {buckets.map((bucket) => (
      <div
        key={bucket.key}
        className="tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50/60 tw:px-3 tw:py-2.5 tw:md:px-4 tw:md:py-3"
      >
        {/* The dot carries the bucket's colour back to its segment in the bar. */}
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <span
            className="tw:size-1.5 tw:shrink-0 tw:rounded-full"
            style={{ backgroundColor: bucket.accent }}
          />
          <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            {bucket.label}
          </span>
        </div>

        <div
          className="tw:mt-1 tw:text-lg tw:font-bold tw:md:text-2xl"
          style={{ color: bucket.accent }}
        >
          <Amount value={bucket.amount} decimalPlaces={0} />
        </div>

        <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
          {bucket.meta}
        </div>
      </div>
    ))}
  </div>
);

export default AgingBuckets;
