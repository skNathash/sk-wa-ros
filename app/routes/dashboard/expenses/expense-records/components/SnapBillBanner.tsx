import { Camera } from "lucide-react";

type SnapBillBannerProps = {
  onClick: () => void;
};

/**
 * Promo banner for AI bill capture, shown below the expense summary hero.
 * Tapping it opens the AI bill-scan modal where the receipt can be uploaded.
 */
const SnapBillBanner: React.FC<SnapBillBannerProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:mb-4 tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:bg-linear-to-r tw:from-[#7c3aed] tw:to-[#5b21b6] tw:px-4 tw:py-3.5 tw:text-left tw:shadow-sm tw:transition hover:tw:brightness-110 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-[#7c3aed]/50"
    >
      <span className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white/15 tw:p-2.5 tw:text-white">
        <Camera size={20} />
      </span>
      <span className="tw:min-w-0">
        <span className="tw:block tw:text-sm tw:font-semibold tw:text-white">
          Snap a bill · we do the rest
        </span>
        <span className="tw:mt-0.5 tw:block tw:text-xs tw:text-white/80">
          AI reads amount, category, GST, due date · you tap Save.
        </span>
      </span>
    </button>
  );
};

export default SnapBillBanner;
