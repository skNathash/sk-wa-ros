import { FileSpreadsheet } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";

const options = [
  {
    label: "Tally",
    description: "Export for Tally ERP",
    icon: "logo/others/tally.svg",
    value: "tally",
    containerClassName: "tw:bg-orange-500/10 tw:border-orange-200",
    iconClassName: "tw:h-8",
    swiper: {
      iconClassName: "tw:h-6",
    },
  },
  {
    label: "Zoho Books",
    description: "Export for Zoho",
    icon: "logo/others/zoho.svg",
    value: "zoho",
    containerClassName: "tw:bg-blue-500/10 tw:border-blue-200",
    iconClassName: "tw:h-8",
    swiper: {
      iconClassName: "tw:h-6",
    },
  },
  {
    label: "QuickBooks",
    description: "Export for QB",
    icon: "logo/others/qb.svg",
    value: "quickbooks",
    containerClassName: "tw:bg-green-500/30 tw:border-green-200",
    iconClassName: "tw:h-8",
    swiper: {
      iconClassName: "tw:h-6",
    },
  },
  {
    label: "Excel",
    description: "Export as .xlsx file",
    icon: <FileSpreadsheet />,
    value: "excel",
    containerClassName: "tw:bg-emerald-500/10 tw:border-emerald-200",
    swiper: {
      iconClassName: "tw:h-6",
    },
  },
];

type Props = {
  view: "grid" | "swiper";
  callback: (data: { action: string; option?: string }) => void;
  className?: string;
};

const swiperConfig: SwiperOptions = {
  slidesPerView: 3.5,
  spaceBetween: 10,
  breakpoints: {
    640: {
      slidesPerView: 3,
    },
    768: {
      slidesPerView: 4,
    },
    1024: {
      slidesPerView: 5,
    },
  },
};

const ReportDownloadOption = ({ view, callback, className }: Props) => {
  const renderBlock = (
    option: (typeof options)[number],
    iconClassName?: string,
    hideLabel?: boolean,
  ) => {
    return (
      <div
        className={`tw:flex tw:flex-col tw:items-center tw:gap-2 tw:rounded-md tw:p-4 tw:cursor-pointer ${option.containerClassName}`}
        onClick={() => callback({ action: "download", option: option.value })}
      >
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-2">
          {option.value === "excel" ? (
            <FileSpreadsheet size={32} className={iconClassName} />
          ) : (
            <ImgRender
              src={option.icon as string}
              alt={option.label}
              className={iconClassName}
            />
          )}
          {!hideLabel && (
            <div className="tw:text-xs tw:font-semibold">{option.label}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {view === "swiper" && (
        <AppSwiper config={swiperConfig}>
          {options.map((option) => (
            <AppSwiper.Slide key={option.value}>
              {renderBlock(option, option.swiper?.iconClassName, false)}
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
      {view === "grid" && (
        <div className={`tw:grid tw:grid-cols-2 tw:gap-2 ${className}`}>
          {options.map((option) =>
            renderBlock(option, option.iconClassName, false),
          )}
        </div>
      )}
    </>
  );
};

export default ReportDownloadOption;
