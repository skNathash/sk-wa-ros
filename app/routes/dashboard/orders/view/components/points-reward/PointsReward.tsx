import { Award, Badge } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";

type PointsRewardProps = {
  coinsRewared: number;
};

const PointsReward = ({ coinsRewared }: PointsRewardProps) => {
  if (coinsRewared === 0) return null;

  return (
    <AppCard
      title="King Coins Reward"
      icon={<Award className="tw:text-yellow-500" />}
    >
      <div className="tw:bg-yellow-50 tw:p-4 tw:rounded-lg tw:border tw:border-yellow-200 tw:text-yellow-700">
        <div className="tw:font-medium tw:mb-1 tw:text-sm">Coins Rewarded</div>
        <div className="tw:font-semibold tw:text-lg tw:mb-1 tw:flex tw:items-center tw:gap-2">
          {coinsRewared}{" "}
          <ImgRender src="kingcoins/logo.png" className="tw:h-6" />
        </div>
        <div className="tw:text-xs tw:font-normal">
          Coins will be rewared after the order is delivered.
        </div>
      </div>
    </AppCard>
  );
};

export default PointsReward;
