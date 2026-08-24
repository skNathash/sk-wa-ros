import { ArrowRight, ExternalLink, Link2, Store } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";

type Props = {
  /** what the retailer sent in */
  submittedName: string;
  submittedBrand?: string;
  /** the catalog item it was matched to */
  dealName: string;
  dealRefId: string;
  dealImage?: string;
  onViewDeal?: () => void;
};

const LinkedDealBanner = ({
  submittedName,
  submittedBrand,
  dealName,
  dealRefId,
  dealImage,
  onViewDeal,
}: Props) => {
  return (
    <div className="tw:border tw:border-blue-200 tw:bg-blue-50/50 tw:rounded-lg tw:p-3 tw:mb-4">
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-3">
        <Link2 size={14} className="tw:text-blue-600" />
        <span className="tw:text-sm tw:font-semibold tw:text-blue-900">
          Matched to an existing catalog item
        </span>
      </div>

      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-stretch tw:gap-2">
        {/* Retailer submission */}
        <div className="tw:flex-1 tw:min-w-0 tw:bg-white tw:border tw:border-gray-200 tw:rounded-md tw:p-2.5">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase tw:mb-1">
            <Store size={12} />
            You submitted
          </div>
          <div className="tw:text-sm tw:text-gray-700 tw:line-clamp-2">
            {submittedName || "--"}
          </div>
          {submittedBrand ? (
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              {submittedBrand}
            </div>
          ) : null}
        </div>

        {/* Merge arrow */}
        <div className="tw:flex tw:items-center tw:justify-center tw:shrink-0">
          <div className="tw:w-6 tw:h-6 tw:rounded-full tw:bg-blue-100 tw:text-blue-600 tw:flex tw:items-center tw:justify-center">
            <ArrowRight size={14} className="tw:rotate-90 tw:sm:rotate-0" />
          </div>
        </div>

        {/* Linked catalog item */}
        <div className="tw:flex-1 tw:min-w-0 tw:bg-white tw:border tw:border-blue-300 tw:rounded-md tw:p-2.5">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-blue-600 tw:uppercase tw:mb-1">
            <Link2 size={12} />
            Linked catalog item
          </div>
          <div className="tw:flex tw:gap-2">
            {dealImage ? (
              <ImgRender
                assetId={dealImage}
                className="tw:w-10 tw:h-10 tw:object-cover tw:rounded tw:border tw:border-gray-200 tw:shrink-0"
              />
            ) : null}
            <div className="tw:min-w-0">
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
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
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:text-blue-600 tw:hover:underline"
                  >
                    View item
                    <ExternalLink size={10} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="tw:text-xs tw:text-gray-600 tw:mt-2.5">
        No new product was created. Your submitted details were used to find this
        catalog item — its catalog values apply, as compared below.
      </p>
    </div>
  );
};

export default LinkedDealBanner;
