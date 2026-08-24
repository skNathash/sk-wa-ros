import { DynamicIcon } from "lucide-react/dynamic";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type Swiper from "swiper";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import type { TabItem } from "~/types/CommonTypes";
import AppCard from "../card/AppCard";
import AppSwiper from "../swiper/AppSwiper";
import AuthService from "~/services/AuthService";

interface AppTabProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tab: TabItem) => void;
  variant?: "tabs" | "pills" | "underline" | "chips";
  className?: string;
  wrapWithCard?: boolean;
  cardClassName?: string;
  noShadow?: boolean;
  /** Hide the bottom border on the `underline` variant (only applies when `noShadow` is set). */
  hideBorder?: boolean;
  /**
   * Horizontal inset (in px) applied via the swiper's `slidesOffsetBefore` /
   * `slidesOffsetAfter` instead of container padding, so the first/last tabs
   * keep an edge gap while still scrolling edge to edge under it.
   */
  slideOffset?: number;
  /**
   * Compact mode (only affects the default `tabs` variant): shrinks the
   * segmented control to its content width with tighter padding and smaller
   * text, instead of a full-width bar.
   */
  compact?: boolean;
  /**
   * Scroll the tab track natively (touch/trackpad overflow scrolling) instead
   * of mounting a swiper. Use it where the swiper can't measure its track
   * reliably — inside a sticky full-bleed strip, or a flex row that sizes after
   * mount — and the overflowing tabs end up unreachable.
   */
  scrollable?: boolean;
}

const AppTab: React.FC<AppTabProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "tabs",
  className = "",
  wrapWithCard = false,
  cardClassName = "",
  noShadow = false,
  hideBorder = false,
  slideOffset = 0,
  compact = false,
  scrollable = false,
}) => {
  const { t } = useTranslation(["common"]);

  // Merge the shared swiper config with an optional horizontal inset. Memoized
  // so the identity is stable and doesn't re-init the swiper every render.
  const mergedSwiperConfig = useMemo<SwiperOptions>(
    () =>
      slideOffset
        ? {
            ...swiperConfig,
            slidesOffsetBefore: slideOffset,
            slidesOffsetAfter: slideOffset,
          }
        : swiperConfig,
    [slideOffset],
  );

  // Keep a ref to the underlying Swiper instance provided by AppSwiper via callback
  const swiperRef = useRef<Swiper | null>(null);

  // The native scroll track (`scrollable` mode only).
  const trackRef = useRef<HTMLDivElement>(null);

  // Memoize so the array identity is stable across renders. Without this it's a
  // fresh array every render, which re-fires the scroll-to-active effect below
  // on unrelated re-renders and makes the active tab appear to scroll twice.
  const filteredTabs = useMemo(
    () =>
      tabs.filter((tab) => {
        if (tab.rbac) {
          return AuthService.isRbacEnabled(tab.rbac);
        }
        return true;
      }),
    [tabs],
  );

  // Slide the swiper so the active tab is centered (as far as bounds allow).
  // `slideTo` only aligns to the left edge and its snap grid can be stale with
  // `slidesPerView: "auto"`, so we translate manually to reliably scroll towards
  // the active tab.
  const scrollToActiveTab = useCallback((idx: number, speed: number) => {
    const swiper = swiperRef.current as any;
    if (!swiper || idx < 0) return;
    try {
      // Ensure slide widths / snap grid reflect current layout.
      swiper.updateSize();
      swiper.updateSlides();

      const slideEl = swiper.slides[idx] as HTMLElement | undefined;
      if (!slideEl) return;

      // Center the active slide within the viewport, clamped to bounds.
      const target =
        -(slideEl.offsetLeft + slideEl.offsetWidth / 2) + swiper.size / 2;
      const clamped = Math.max(
        swiper.maxTranslate(),
        Math.min(swiper.minTranslate(), target),
      );

      swiper.setTransition(speed);
      swiper.setTranslate(clamped);
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    } catch (e) {
      // ignore runtime errors from swiper
    }
  }, []);

  // When activeTab changes, slide the swiper to reveal the active tab
  useEffect(() => {
    if (scrollable) return;
    const idx = filteredTabs.findIndex((t) => t.key === activeTab);
    scrollToActiveTab(idx, 300);
  }, [activeTab, filteredTabs, scrollToActiveTab, scrollable]);

  // Same reveal for the native track: centre the active tab as far as the
  // scroll bounds allow. The track is `relative`, so it is the children's
  // offset parent and `offsetLeft` is already a scroll position.
  useEffect(() => {
    if (!scrollable) return;
    const track = trackRef.current;
    if (!track) return;
    const idx = filteredTabs.findIndex((t) => t.key === activeTab);
    const item = track.children[idx] as HTMLElement | undefined;
    if (!item) return;
    track.scrollTo({
      left: item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeTab, filteredTabs, scrollable]);

  // Helper function to render tab name with translation support
  const renderTabName = useCallback(
    (tab: TabItem) => {
      if (tab.langKey) {
        return t(tab.langKey);
      }
      return tab.name;
    },
    [t],
  );

  // Memoize the icon rendering logic to avoid recreating elements on every render
  const renderIcon = useCallback((icon: string | React.ReactNode) => {
    if (!icon) return null;

    if (typeof icon === "string") {
      return <DynamicIcon size={16} name={icon as any} />;
    }

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, { size: 16 } as any);
    }

    return icon;
  }, []);

  const onSwiperCallback = useCallback(
    (data: { swiper: Swiper; action: "init" | "slideChange" }) => {
      if (!data || !data.swiper) return;
      swiperRef.current = data.swiper;

      // On init, center the active tab immediately (in case initial activeTab
      // isn't the first one).
      if (data.action === "init") {
        const idx = filteredTabs.findIndex((t) => t.key === activeTab);
        scrollToActiveTab(idx, 0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, filteredTabs, scrollToActiveTab],
  );

  // Memoize click handlers to prevent unnecessary re-renders
  const handleTabClick = useCallback(
    (tab: TabItem) => {
      onTabChange(tab);
    },
    [onTabChange],
  );

  const renderTabCount = useCallback((tab: TabItem) => {
    if (tab.count) {
      // Only Tailwind classes prefixed with `tw:` are supported for countColor.
      // If none provided, fall back to the existing indigo background.
      const colorClass =
        tab.countColor && tab.countColor.startsWith("tw:")
          ? tab.countColor
          : "tw:bg-indigo-500";

      return (
        <span
          data-slot="app-tab-count"
          className={`tw:inline-flex tw:items-center tw:justify-center tw:min-w-[20px] tw:h-5 tw:text-xs tw:px-0.5 tw:rounded tw:text-white ${colorClass}`}
        >
          {tab.count}
        </span>
      );
    }

    return null;
  }, []);

  const renderTabBadge = useCallback((tab: TabItem) => {
    if (!tab.badge) return null;

    // Only Tailwind classes prefixed with `tw:` are supported for badgeColor.
    // If none provided, fall back to a green background.
    const colorClass =
      tab.badgeColor && tab.badgeColor.startsWith("tw:")
        ? tab.badgeColor
        : "tw:bg-green-500";

    return (
      <span
        data-slot="app-tab-badge"
        className={`tw:inline-flex tw:items-center tw:justify-center tw:h-4 tw:text-[10px] tw:font-medium tw:px-1.5 tw:rounded-full tw:text-white ${colorClass}`}
      >
        {tab.badge}
      </span>
    );
  }, []);

  /**
   * Lays the tab buttons on a track — a swiper by default, a natively scrolling
   * flex row in `scrollable` mode. Every variant renders its buttons through
   * this so the two tracks stay interchangeable.
   */
  const renderTrack = (renderButton: (tab: TabItem) => React.ReactNode) =>
    scrollable ? (
      <div
        ref={trackRef}
        className="hide-scrollbar tw:relative tw:flex tw:w-full tw:flex-nowrap tw:items-center tw:gap-2.5 tw:overflow-x-auto"
        style={
          slideOffset ? { paddingInline: `${slideOffset}px` } : undefined
        }
      >
        {filteredTabs.map((tab) => (
          <div key={tab.key} className="tw:shrink-0">
            {renderButton(tab)}
          </div>
        ))}
      </div>
    ) : (
      <AppSwiper config={mergedSwiperConfig} callback={onSwiperCallback}>
        {filteredTabs.map((tab) => (
          <AppSwiper.Slide key={tab.key} isAutoWidth={true}>
            {renderButton(tab)}
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    );

  const tabContent =
    variant === "underline" ? (
      <div
        data-slot="app-tab"
        data-variant="underline"
        className={`tw:w-full ${
          noShadow
            ? hideBorder
              ? ""
              : "tw:border-b tw:border-gray-200"
            : "tw:bg-white tw:shadow-sm tw:rounded-md"
        } ${className}`}
      >
        {renderTrack((tab) => (
          <button
            type="button"
            className={`tw:relative tw:py-3 tw:px-4 tw:text-sm tw:font-medium tw:transition-all tw:duration-200 tw:whitespace-nowrap tw:cursor-pointer ${
              activeTab === tab.key
                ? "tw:font-semibold tw:text-primary tw:border-primary! tw:border-b-3!"
                : "tw:text-gray-500! tw:border-b-3 tw:border-transparent"
            }`}
            onClick={() => handleTabClick(tab)}
            role="tab"
            aria-selected={activeTab === tab.key}
            tabIndex={activeTab === tab.key ? 0 : -1}
          >
            <span className="tw:inline-flex tw:items-center tw:gap-2">
              {tab.icon && renderIcon(tab.icon)}
              {renderTabName(tab)}
              {renderTabCount(tab)}
              {renderTabBadge(tab)}
            </span>
          </button>
        ))}
      </div>
    ) : variant === "pills" ? (
      /* Free-standing rounded pills on the page background — the active one
         filled in the brand colour. Used where a segmented control would read
         too heavy (e.g. the product detail sub-nav on mobile). */
      <div
        data-slot="app-tab"
        data-variant="pills"
        className={`tw:w-full ${className}`}
      >
        {renderTrack((tab) => (
          <button
            type="button"
            data-slot="app-tab-item"
            aria-selected={activeTab === tab.key}
            className={`tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:rounded-full tw:border tw:px-3.5 tw:py-1.5 tw:text-sm tw:transition-colors ${
              activeTab === tab.key
                ? "tw:border-primary tw:bg-primary tw:font-semibold tw:text-white"
                : "tw:border-slate-200 tw:bg-gray-200/50 tw:font-medium tw:text-gray-600 "
            } ${tab.className ?? ""}`}
            onClick={() => handleTabClick(tab)}
            role="tab"
          >
            {tab.icon && renderIcon(tab.icon)}
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              {renderTabName(tab)}
              {renderTabCount(tab)}
              {renderTabBadge(tab)}
            </span>
          </button>
        ))}
      </div>
    ) : variant === "chips" ? (
      <div
        data-slot="app-tab"
        data-variant="chips"
        className={`app-section-tabs tw:mx-3 tw:rounded-lg ${className}`}
      >
        {renderTrack((tab) => (
          <button
            type="button"
            className={`tw:py-2 tw:px-5 tw:my-0.5 tw:text-sm tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:rounded-md tw:transition-all tw:duration-200 ${
              activeTab === tab.key
                ? "tw:bg-white tw:text-primary tw:font-semibold tw:shadow-sm"
                : "tw:bg-white tw:text-gray-700 tw:font-medium"
            } ${tab.className ?? ""}`}
            onClick={() => handleTabClick(tab)}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.icon && renderIcon(tab.icon)}
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              {renderTabName(tab)}
              {renderTabCount(tab)}
              {renderTabBadge(tab)}
            </span>
          </button>
        ))}
      </div>
    ) : (
      <div
        data-slot="app-tab"
        data-variant="tabs"
        className={`tw:bg-gray-200/50 tw:rounded-md ${
          compact ? "tw:w-auto tw:inline-flex tw:p-0.5" : "tw:w-full tw:p-1"
        } ${className}`}
      >
        {renderTrack((tab) => (
          <button
            type="button"
            data-slot="app-tab-item"
            aria-selected={activeTab === tab.key}
            className={`tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1 ${
              compact
                ? "tw:py-1 tw:px-3 tw:text-xs"
                : "tw:py-2 tw:px-3 tw:md:px-6 tw:text-sm"
            } ${
              activeTab === tab.key
                ? "tw:bg-white tw:text-gray-900 tw:shadow-sm tw:rounded-md tw:font-semibold"
                : "tw:font-medium"
            }`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.icon && renderIcon(tab.icon)}
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              {renderTabName(tab)}
              {renderTabCount(tab)}
              {renderTabBadge(tab)}
            </span>
          </button>
        ))}
      </div>
    );

  if (wrapWithCard) {
    return (
      <AppCard bodyClassName="tw:p-0" className={cardClassName}>
        {tabContent}
      </AppCard>
    );
  }

  return tabContent;
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
  navigation: false,
  pagination: false,
};

export default AppTab;
