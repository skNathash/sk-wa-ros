import React from "react";
import clsx from "clsx";
import { Bot } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";

interface TiersRolloverBannerProps {
  className?: string;
  onAskSwa?: () => void;
}

const TiersRolloverBanner: React.FC<TiersRolloverBannerProps> = ({
  className,
  onAskSwa,
}) => {
  return (
    <div
      className={clsx(
        "tw:rounded-2xl tw:border tw:border-dashed tw:border-slate-300 tw:bg-white/80 tw:p-4 tw:shadow-xs",
        className
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-3.5">
        {/* Mascot Avatar */}
        <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-sky-50 tw:overflow-hidden">
          <ImgRender
            src="ai/swa-buddy.png"
            alt="Swa"
            className="tw:h-10 tw:w-10 tw:object-contain"
            fallback={
              <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:bg-sky-100 tw:text-[#2A3B56]">
                <Bot size={20} />
              </div>
            }
          />
        </div>

        {/* Text Content */}
        <div className="tw:min-w-0 tw:flex-1 tw:text-xs sm:tw:text-sm tw:text-slate-700 tw:leading-relaxed">
          <strong className="tw:font-bold tw:text-slate-900">
            Grow into your tier — don&apos;t lose sleep over it.
          </strong>{" "}
          Unused credit rolls over month-to-month. If you burn 100%+ for 2 straight
          months, Swa auto-suggests the next tier. No penalty.{" "}
          <button
            type="button"
            onClick={onAskSwa}
            className="tw:inline tw:font-semibold tw:text-blue-600 tw:underline tw:underline-offset-2 hover:tw:text-blue-800 tw:cursor-pointer"
          >
            Ask Swa
          </button>
        </div>
      </div>
    </div>
  );
};

export default TiersRolloverBanner;
