import { Star } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppProgress from "~/components/core/progress/AppProgress";
import { getRating, getRatingBreakdown, type Retailer } from "../../helper";

type RatingBreakdownProps = {
  data: Retailer;
};

const RatingStars = ({ value }: { value: number }) => {
  const fullStars = Math.min(5, Math.max(0, Math.floor(value)));
  return (
    <span className="tw:inline-flex tw:items-center tw:gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < fullStars
              ? "tw:fill-amber-400 tw:text-amber-400"
              : "tw:text-slate-200"
          }
        />
      ))}
    </span>
  );
};

const RatingBreakdown = ({ data }: RatingBreakdownProps) => {
  const rating = getRating(data);
  const breakdown = getRatingBreakdown(data);

  return (
    <AppCard
      title="Rating breakdown"
      subtitle={`${rating.totalReviews} orders rated`}
    >
      <div className="tw:flex tw:items-end tw:gap-3 tw:mb-5">
        <div className="tw:text-5xl tw:font-bold tw:text-slate-900 tw:leading-none">
          {rating.value.toFixed(1)}
        </div>
        <div className="tw:pb-1">
          <RatingStars value={rating.value} />
          <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
            Based on {rating.totalReviews} verified orders
          </div>
        </div>
      </div>

      <div className="tw:space-y-3">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
              <span className="tw:text-sm tw:text-slate-700">{item.label}</span>
              <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
                {item.value}%
              </span>
            </div>
            <AppProgress value={item.value} color="success" />
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default RatingBreakdown;
