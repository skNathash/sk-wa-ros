import React from "react";
import ImgRender from "~/components/core/img/ImgRender";
import { MessageSquare, ChevronRight } from "lucide-react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

type Props = {
  templates: any[];
  onSelect: (template: any) => void;
  selectedTemplateId?: string | number;
  loadMore: () => void;
  loading: boolean;
  totalCount: number;
};

const WhatsappTemplateList: React.FC<Props> = ({
  templates,
  onSelect,
  selectedTemplateId,
  loadMore,
  loading,
  totalCount,
}) => {
  return (
    <div className="tw:divide-y tw:divide-gray-100 tw:dark:divide-neutral-800 tw:pr-1">
      {templates.map((t, idx) => (
        <button
          key={t._id || idx}
          onClick={() => onSelect(t)}
          className={`tw:cursor-pointer tw:w-full tw:flex tw:items-start tw:gap-3 tw:py-3 tw:px-2 tw:text-left tw:transition-colors tw:hover:bg-gray-50 dark:hover:tw:bg-neutral-800/50 ${
            selectedTemplateId === t._id
              ? "tw:bg-green-50/50 dark:tw:bg-green-900/10"
              : ""
          }`}
        >
          {/* Left Side: Thumbnail or Icon */}
          <div className="tw:shrink-0 tw:w-16 tw:h-16 tw:rounded-lg tw:overflow-hidden tw:bg-gray-100 dark:tw:bg-neutral-800 tw:flex tw:items-center tw:justify-center">
            {t.featureImage ? (
              <ImgRender
                {...(t.isAssetFeatureImage
                  ? { assetId: t.featureImage }
                  : { src: t.featureImage, isAbsolute: true })}
                alt={t.name}
                className="tw:w-full tw:h-full tw:object-cover"
              />
            ) : (
              <div className="tw:bg-gray-200 dark:tw:bg-neutral-700 tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center">
                <MessageSquare
                  size={20}
                  className="tw:text-gray-400 dark:tw:text-neutral-500"
                />
              </div>
            )}
          </div>

          {/* Right Side: Content */}
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-0.5">
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-green-600 dark:tw:text-green-400">
                  {t.category || "General"}
                </span>
                {t.templateFor && (
                  <span
                    className={`tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wider tw:px-1.5 tw:py-0.5 tw:rounded tw:inline-block ${
                      t.templateFor === "B2B"
                        ? "tw:bg-blue-100 dark:tw:bg-blue-900/40 tw:text-blue-700 dark:tw:text-blue-300"
                        : "tw:bg-purple-100 dark:tw:bg-purple-900/40 tw:text-purple-700 dark:tw:text-purple-300"
                    }`}
                  >
                    {t.templateFor}
                  </span>
                )}
              </div>
            </div>
            <h4 className="tw:text-sm tw:font-semibold tw:text-gray-900 dark:tw:text-gray-100 tw:truncate tw:mb-0.5">
              {t.name}
            </h4>
            <p className="tw:text-xs tw:text-gray-500 dark:tw:text-gray-400 tw:line-clamp-2 tw:leading-relaxed">
              {t.renderedBody || t.body}
            </p>
          </div>

          {/* Chevron Icon */}
          <div className="tw:shrink-0 tw:flex tw:items-center tw:text-gray-400 dark:tw:text-gray-500">
            <ChevronRight size={18} />
          </div>
        </button>
      ))}

      <LoadMoreButton
        loading={loading}
        loadMore={loadMore}
        totalCount={totalCount}
        loadedCount={templates.length}
      />
    </div>
  );
};

export default WhatsappTemplateList;
