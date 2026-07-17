import React from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, X } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";

type Props = {
  images: Array<{ id: string }>;
  onPreview: (images: Array<{ id: string }>) => void;
  showCreateProduct: boolean;
  onCreateProduct: () => void;
};

const SearchedViaAI: React.FC<Props> = ({
  images,
  onPreview,
  showCreateProduct,
  onCreateProduct,
}) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);

  if (!images || images.length === 0) return null;

  return (
    <div className="tw:mb-2.5 tw:animate-in tw:fade-in tw:slide-in-from-top-2 tw:duration-300">
      <div className="tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5 tw:bg-purple-50/70 tw:border tw:border-purple-200 tw:rounded-md">
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1">
            <div onClick={() => onPreview(images)}>
              <ImgRender
                assetId={images[0].id}
                alt="AI searched"
                className="tw:w-8 tw:h-8 tw:object-cover"
                size="100"
              />
            </div>
            <div>
              <span className="tw:text-xs tw:font-semibold tw:text-purple-900 tw:truncate">
                {t("search.searchedViaAI")}
              </span>
              {showCreateProduct && (
                <div className="tw:text-[11px] tw:text-gray-600">
                  Not found what you're looking for?{" "}
                  <button
                    className="tw:text-primary tw:font-semibold tw:cursor-pointer"
                    onClick={onCreateProduct}
                  >
                    Create Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchedViaAI;
