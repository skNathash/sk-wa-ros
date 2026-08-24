type Props = {
  msg: string;
  headerImage?: string;
};

const WhatsappPreviewContainer = ({ msg, headerImage }: Props) => {
  return (
    <div className="tw:flex tw:justify-center tw:p-4">
      <div className="tw:w-full tw:max-w-sm tw:rounded-lg tw:overflow-hidden tw:bg-[#e5ddd5] tw:shadow-md">
        {/* Header Bar */}
        <div className="tw:flex tw:items-center tw:gap-2 tw:bg-[#008069] tw:px-3 tw:py-2">
          <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-[#25d366] tw:flex tw:items-center tw:justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="tw:w-4 tw:h-4"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span className="tw:text-white tw:text-sm tw:font-medium">
            WhatsApp Preview
          </span>
        </div>

        {/* Chat Body */}
        <div className="tw:p-3 tw:min-h-[120px]">
          {/* Message Bubble */}
          <div className="tw:max-w-[85%] tw:bg-white tw:rounded-lg tw:shadow-sm tw:overflow-hidden">
            {headerImage && (
              <img
                src={headerImage}
                alt="header"
                className="tw:w-full tw:h-auto tw:object-cover"
              />
            )}
            <p
              className="tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-[#303030] tw:leading-relaxed tw:whitespace-pre-line tw:break-words"
              dangerouslySetInnerHTML={{
                __html: msg.replace(/\n/g, "<br />"),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappPreviewContainer;
