import { ExternalLink, Sparkles } from "lucide-react";

type Props = {
  dealName: string;
  dealRefId: string;
  onViewDeal?: () => void;
};

/** Shown when StoreKing created a brand new catalog item from the submission. */
const CreatedItemBanner = ({ dealName, dealRefId, onViewDeal }: Props) => (
  <div className="tw:border tw:border-emerald-200 tw:bg-emerald-50/60 tw:rounded-lg tw:p-3 tw:mb-4">
    <div className="tw:flex tw:gap-2">
      <Sparkles size={14} className="tw:text-emerald-600 tw:shrink-0 tw:mt-0.5" />
      <div className="tw:min-w-0">
        <div className="tw:text-sm tw:font-semibold tw:text-emerald-900">
          Created as a new catalog item
        </div>
        <div className="tw:text-sm tw:text-gray-900 tw:mt-1 tw:line-clamp-2">
          {dealName || "--"}
        </div>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mt-0.5">
          <span className="tw:text-[11px] tw:font-mono tw:text-gray-500">
            ID: {dealRefId || "--"}
          </span>
          {onViewDeal ? (
            <button
              type="button"
              onClick={onViewDeal}
              className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:text-emerald-700 tw:hover:underline"
            >
              View item
              <ExternalLink size={10} />
            </button>
          ) : null}
        </div>
        <p className="tw:text-xs tw:text-gray-600 tw:mt-2">
          StoreKing reviewed your submission before publishing it. Any values
          they corrected are highlighted below.
        </p>
      </div>
    </div>
  </div>
);

export default CreatedItemBanner;
