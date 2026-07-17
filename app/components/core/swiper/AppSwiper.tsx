import React, { useEffect, useRef, useState } from "react";
import Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";
import {
  Mousewheel,
  Navigation,
  Pagination,
  Autoplay,
  FreeMode,
} from "swiper/modules";

interface AppSwiperProps {
  children: React.ReactNode;
  config?: SwiperOptions;
  className?: string;
  callback?: (data: { swiper: Swiper; action: "init" | "slideChange" }) => void;
}

interface AppSwiperComposition {
  Slide: React.FC<{
    children: React.ReactNode;
    className?: string;
    isAutoWidth?: boolean;
    isAutoHeight?: boolean;
  }>;
}

const AppSwiper: React.FC<AppSwiperProps> & AppSwiperComposition = ({
  children,
  config = {},
  className = "",
  callback,
}) => {
  const swiperContainerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<Swiper | null>(null);
  const callbackRef = useRef<typeof callback | null>(callback ?? null);

  const [showNavigation, setShowNavigation] = useState(false);

  // keep latest callback in a ref so effect below doesn't re-run when callback identity changes
  useEffect(() => {
    callbackRef.current = callback ?? null;
  }, [callback]);

  useEffect(() => {
    if (swiperContainerRef.current) {
      // Prepare default options
      const defaultOptions: SwiperOptions = {
        modules: [Mousewheel, Navigation, Pagination, Autoplay, FreeMode],
        slidesPerView: 1,
        spaceBetween: 10,
        navigation: false,
        pagination: false,
        mousewheel: {
          enabled: true,
          forceToAxis: true,
        },
        // we'll merge user-provided `on` handlers with our internal handlers below
        on: {},
      };

      // Merge user event handlers with internal handlers so both run
      const userOn = (config && (config as any).on) || {};
      const mergedOn: Record<string, any> = {
        ...userOn,
        init: function (this: Swiper, swiper?: Swiper) {
          const s = (swiper ?? (this as Swiper)) as Swiper;
          if (callbackRef.current) {
            callbackRef.current({ swiper: s, action: "init" });
          }
          if (typeof userOn.init === "function") {
            userOn.init.call(this, s);
          }
        },
        slideChange: function (this: Swiper, ...args: any[]) {
          const s = this as Swiper as Swiper;
          if (callbackRef.current) {
            callbackRef.current({ swiper: s, action: "slideChange" });
          }
          if (typeof userOn.slideChange === "function") {
            userOn.slideChange.apply(this, args);
          }
        },
      };

      // Initialize Swiper with proper config merging
      const finalConfig = {
        ...defaultOptions,
        ...config,
        // Ensure navigation and pagination use default values when enabled
        navigation: config.navigation
          ? {
              enabled: true,
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
              ...(typeof config.navigation === "object"
                ? config.navigation
                : {}), // Allow user to override specific navigation properties
            }
          : false,
        pagination: config.pagination
          ? {
              enabled: true,
              el: ".swiper-pagination",
              clickable: true,
              ...(typeof config.pagination === "object"
                ? config.pagination
                : {}), // Allow user to override specific pagination properties
            }
          : false,
        on: mergedOn,
      };

      swiperInstanceRef.current = new Swiper(
        swiperContainerRef.current,
        finalConfig,
      );

      setShowNavigation(!!config.navigation);
    }

    // Cleanup
    return () => {
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy();
        swiperInstanceRef.current = null;
      }
    };
  }, [config]);

  return (
    <div
      className={`swiper swiper-container ${className}`}
      ref={swiperContainerRef}
    >
      <div className="swiper-wrapper">{children}</div>
      <div className="swiper-pagination"></div>

      {config?.navigation && (
        <>
          <div className="swiper-button-prev"></div>
          <div className="swiper-button-next"></div>
        </>
      )}
    </div>
  );
};

const Slide: React.FC<{
  children: React.ReactNode;
  className?: string;
  isAutoWidth?: boolean;
  isAutoHeight?: boolean;
}> = ({
  children,
  className = "",
  isAutoWidth = false,
  isAutoHeight = false,
}) => {
  return (
    <div
      className={`swiper-slide ${className} ${
        isAutoWidth ? "tw:!w-auto" : ""
      } ${isAutoHeight ? "tw:!h-auto" : ""}`}
    >
      {children}
    </div>
  );
};

AppSwiper.Slide = Slide;

export default AppSwiper;
