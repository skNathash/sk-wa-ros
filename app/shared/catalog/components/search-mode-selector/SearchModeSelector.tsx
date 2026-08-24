import { Image, Mic, ScanLine, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SwiperOptions } from "swiper/types";

import AppSwiper from "~/components/core/swiper";

export type SearchMode = "text" | "image" | "barcode" | "voice";

interface SearchModeOption {
  key: SearchMode;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Idle icon-tile classes — each mode carries its own accent. */
  tileClassName: string;
  /** Template 2 — the whole card takes the accent tint. */
  compactClassName: string;
  /** Template 2 — ring colour when the mode is selected. */
  compactSelectedRing: string;
}

const OPTIONS: SearchModeOption[] = [
  {
    key: "text",
    label: "Text",
    description: "Search by name, HSN, brand",
    icon: Search,
    tileClassName: "tw:bg-emerald-50 tw:text-emerald-600",
    compactClassName: "tw:bg-emerald-50 tw:text-emerald-600",
    compactSelectedRing: "tw:ring-emerald-400",
  },
  {
    key: "image",
    label: "Image",
    description: "Upload a photo — we'll match the SKU",
    icon: Image,
    tileClassName: "tw:bg-violet-50 tw:text-violet-600",
    compactClassName: "tw:bg-violet-50 tw:text-violet-600",
    compactSelectedRing: "tw:ring-violet-400",
  },
  {
    key: "barcode",
    label: "Barcode",
    description: "Scan or paste an EAN / UPC",
    icon: ScanLine,
    tileClassName: "tw:bg-amber-50 tw:text-amber-600",
    compactClassName: "tw:bg-amber-50 tw:text-amber-600",
    compactSelectedRing: "tw:ring-amber-400",
  },
  {
    key: "voice",
    label: "Voice",
    description: "Speak in Kannada, Hindi, or English",
    icon: Mic,
    tileClassName: "tw:bg-sky-50 tw:text-sky-600",
    compactClassName: "tw:bg-sky-50 tw:text-sky-600",
    compactSelectedRing: "tw:ring-sky-400",
  },
];

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 12,
  freeMode: true,
};

interface SearchModeSelectorProps {
  /** `null` leaves every mode unselected — for pickers that only launch. */
  value: SearchMode | null;
  onChange: (mode: SearchMode) => void;
  /** Restrict/reorder the modes shown; defaults to all four. */
  modes?: SearchMode[];
  /** Modes that are visible but not selectable (e.g. no mic permission). */
  disabledModes?: SearchMode[];
  /** 1 — descriptive cards (default). 2 — compact icon + label tiles. */
  template?: 1 | 2;
  /** Skip the per-mode accent colours/bg — neutral slate tiles (template 2 only). */
  noColor?: boolean;
  /** Fill the selected tile with the theme primary instead of ringing it (template 2 only). */
  primarySelected?: boolean;
  className?: string;
}

/**
 * Horizontal picker for how the user wants to search the catalog — text, image,
 * barcode or voice.
 *
 * Template 1 (default): descriptive cards, the selected one filled with the
 * theme primary. Template 2: compact accent tiles — icon over label, no
 * description — for tight headers and modals; `primarySelected` gives it the
 * same filled-selection look as template 1.
 */
const SearchModeSelector = ({
  value,
  onChange,
  modes,
  disabledModes = [],
  template = 1,
  noColor = false,
  primarySelected = false,
  className = "",
}: SearchModeSelectorProps) => {
  const options = modes
    ? (modes
        .map((m) => OPTIONS.find((o) => o.key === m))
        .filter(Boolean) as SearchModeOption[])
    : OPTIONS;

  if (template === 2) {
    return (
      <div
        role="radiogroup"
        aria-label="Search mode"
        // Fixed columns rather than a scroll row: the pane is narrow, and all
        // four tiles have to be reachable without a horizontal drag.
        className={`tw:grid tw:grid-cols-4 tw:gap-2 ${className}`}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = option.key === value;
          const isDisabled = disabledModes.includes(option.key);

          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.description}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(option.key)}
              className={`tw:flex tw:min-w-0 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:px-1 tw:py-2 tw:transition-all tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[color-mix(in_srgb,var(--primary)_45%,transparent)] ${
                primarySelected && isSelected
                  ? "tw:bg-primary tw:text-white"
                  : noColor
                    ? "tw:bg-slate-100 tw:text-slate-600"
                    : option.compactClassName
              } ${
                isDisabled
                  ? "tw:cursor-not-allowed tw:opacity-50"
                  : "tw:cursor-pointer hover:tw:brightness-95"
              } ${
                // Inset ring, so selection doesn't add width to a tight grid.
                // The primary fill already reads as selected, so it skips the ring.
                isSelected && !primarySelected
                  ? `tw:ring-2 tw:ring-inset ${
                      noColor ? "tw:ring-slate-400" : option.compactSelectedRing
                    }`
                  : ""
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              <span className="tw:max-w-full tw:truncate tw:text-[10px] tw:font-bold tw:uppercase">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const renderCard = (option: SearchModeOption) => {
    const Icon = option.icon;
    const isSelected = option.key === value;
    const isDisabled = disabledModes.includes(option.key);

    return (
      <button
        key={option.key}
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={isDisabled}
        onClick={() => !isDisabled && onChange(option.key)}
        className={`tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:p-3 tw:text-left tw:transition-all tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[color-mix(in_srgb,var(--primary)_45%,transparent)] ${
              isDisabled
                ? "tw:cursor-not-allowed tw:opacity-50"
                : "tw:cursor-pointer"
            } ${
              isSelected
                ? "tw:border-transparent tw:bg-primary tw:shadow-md"
                : "tw:border-slate-200 tw:bg-white tw:shadow-sm hover:tw:border-slate-300 hover:tw:shadow-md"
        }`}
      >
        <span
          className={`tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl ${
            isSelected ? "tw:bg-white/20 tw:text-white" : option.tileClassName
          }`}
        >
          <Icon size={20} strokeWidth={2} />
        </span>

        <span className="tw:min-w-0">
          <span
            className={`tw:block tw:text-sm tw:font-semibold ${
              isSelected ? "tw:text-white" : "tw:text-slate-900"
            }`}
          >
            {option.label}
          </span>
          <span
            className={`tw:block tw:text-xs ${
              isSelected ? "tw:text-white/80" : "tw:text-slate-500"
            }`}
          >
            {option.description}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div role="radiogroup" aria-label="Search mode" className={className}>
      {/* Mobile — cards keep a readable min width and swipe via AppSwiper
          rather than squeezing descriptions into unreadable columns. */}
      <AppSwiper config={swiperConfig} className="tw:pb-1 tw:md:!hidden">
        {options.map((option) => (
          <AppSwiper.Slide
            key={option.key}
            isAutoWidth
            className="tw:!w-[15rem]"
          >
            {renderCard(option)}
          </AppSwiper.Slide>
        ))}
      </AppSwiper>

      {/* md+ — all four cards in a grid, no scrolling needed. */}
      <div className="tw:hidden tw:md:grid tw:md:grid-cols-4 tw:md:gap-3">
        {options.map((option) => renderCard(option))}
      </div>
    </div>
  );
};

export default SearchModeSelector;
