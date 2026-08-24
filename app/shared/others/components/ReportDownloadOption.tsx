import { FileSpreadsheet } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";

/* Brand identity is carried by the logo itself. The logos are wide wordmarks of
   varying aspect ratios: each gets a fixed-height, full-width strip with the
   image contained inside it, so every button lines up and labels never wrap.
   Each strip carries the background the logo was drawn for — the card color is
   theme-dependent (white in theme-2, dark elsewhere), so relying on it makes
   the logos vanish. Tally/Zoho are dark-on-light artwork → a white chip; the
   QuickBooks wordmark is white → its brand-green chip. */
const LIGHT_STRIP = "tw:bg-white tw:rounded-md tw:px-2 tw:ring-1 tw:ring-black/5";
const options = [
  {
    label: "Tally",
    description: "Export for Tally ERP",
    icon: "logo/others/tally.svg",
    value: "tally",
    stripClassName: LIGHT_STRIP,
  },
  {
    label: "Zoho Books",
    description: "Export for Zoho",
    icon: "logo/others/zoho.svg",
    value: "zoho",
    stripClassName: LIGHT_STRIP,
  },
  {
    label: "QuickBooks",
    description: "Export for QB",
    icon: "logo/others/qb.svg",
    value: "quickbooks",
    /* The QB wordmark is white on transparent — it needs its solid brand-green
       chip behind it or the text vanishes on a white button. */
    stripClassName: "tw:bg-[#2ca01c] tw:rounded-md tw:px-2",
  },
  {
    label: "Excel",
    description: "Export as .xlsx file",
    value: "excel",
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
  const renderOption = (option: (typeof options)[number]) => {
    return (
      <button
        key={option.value}
        type="button"
        title={option.description}
        onClick={() => callback({ action: "download", option: option.value })}
        className="tw:flex tw:h-full tw:w-full tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-border tw:bg-card tw:px-2 tw:py-2.5 tw:cursor-pointer tw:transition-colors tw:hover:border-primary/50 tw:hover:bg-primary/5 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring"
      >
        <span
          className={`tw:flex tw:h-6 tw:max-w-full tw:items-center tw:justify-center ${(option as any).stripClassName ?? ""}`}
        >
          {option.value === "excel" ? (
            <FileSpreadsheet size={20} className="tw:text-emerald-600" />
          ) : (
            <ImgRender
              src={option.icon as string}
              alt={option.label}
              /* zoho.svg / qb.svg have no width/height attributes (viewBox
                 only), so max-* constraints alone size them to 0 — an
                 explicit height is required, max-w only caps wide logos. */
              className="tw:h-5 tw:w-auto tw:max-w-16 tw:object-contain"
            />
          )}
        </span>
        <span className="tw:max-w-full tw:truncate tw:text-xs tw:font-semibold">
          {option.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {view === "swiper" && (
        <AppSwiper config={swiperConfig}>
          {options.map((option) => (
            <AppSwiper.Slide key={option.value}>
              {renderOption(option)}
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
      {view === "grid" && (
        <div className={`tw:grid tw:grid-cols-2 tw:gap-2 ${className ?? ""}`}>
          {options.map((option) => renderOption(option))}
        </div>
      )}
    </>
  );
};

export default ReportDownloadOption;
