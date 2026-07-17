import React from "react";
import ImgRender from "~/components/core/img/ImgRender";

type Props = {
  body: string;
  imgUrl?: string;
  isAssetFeatureImage?: boolean;
};

const WhatsappTemplatePreview: React.FC<Props> = ({
  body,
  imgUrl,
  isAssetFeatureImage,
}) => {
  return (
    <div className="tw:w-full">
      {/* WhatsApp-style chat background */}
      <div className="wa-chat-bg tw:p-4 tw:rounded-xl tw:min-h-[200px] tw:flex tw:flex-col tw:justify-end">
        <div className="tw:flex tw:justify-end">
          {/* Outgoing message bubble with tail */}
          <div className="wa-bubble-out tw:relative tw:max-w-[85%] tw:shadow-sm">
            {imgUrl && (
              <div className="tw:rounded-t-lg tw:overflow-hidden tw:-mx-1.5 tw:-mt-1 tw:mb-1.5">
                <ImgRender
                  {...(isAssetFeatureImage
                    ? { assetId: imgUrl }
                    : { src: imgUrl, isAbsolute: true })}
                  alt="Template Image"
                  className="tw:object-cover tw:w-full"
                  width={600}
                  height={720}
                />
              </div>
            )}
            <div className="tw:text-[13px] tw:leading-snug tw:whitespace-pre-wrap tw:text-gray-900">
              {body}
            </div>
            {/* Timestamp area */}
            <div className="tw:flex tw:justify-end tw:mt-1">
              <span className="tw:text-[10px] tw:text-gray-500">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappTemplatePreview;
