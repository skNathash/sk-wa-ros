import clsx from "clsx";
import { Check } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper, SwiperOptions } from "swiper/types";
import useTheme from "~/hooks/useTheme";
import AppScrollArea from "../scroll-area/AppScrollArea";

export interface StepData {
  key: string | number;
  title: string;
  description?: string;
  icon?: string;
  langKey?: string;
}

interface AppStepsProps {
  steps: StepData[];
  activeKey: string | number;
  className?: string;
  borderMinWidth?: number;
  isCompleted?: boolean;
}

const AppSteps = ({
  steps,
  activeKey,
  className,
  borderMinWidth,
  isCompleted,
}: AppStepsProps) => {
  const { t } = useTranslation();
  // theme-2 renders the flat numbered rail (thin connectors, no icon bubbles)
  // instead of the blue circle-and-bar stepper the other themes use.
  const isTheme2 = useTheme() === "theme-2";

  const activeIndex = steps.findIndex((step) => step.key === activeKey);
  const currentActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  const swiperRef = useRef<Swiper>(null);

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update();
    }
  }, [currentActiveIndex]);

  if (isTheme2) {
    return (
      <div
        className={clsx(
          "tw:border-b tw:border-gray-200 tw:bg-white tw:mb-4",
          className,
        )}
      >
        {/* Mobile: the labels would wrap into an unreadable stack, so it
            collapses to the active title plus a progress bar. */}
        <div className="tw:px-4 tw:py-2.5 tw:md:hidden">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
            <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
              {t(
                steps[currentActiveIndex]?.langKey ||
                  steps[currentActiveIndex]?.title ||
                  "",
              )}
            </span>
            <span className="tw:text-[11px] tw:text-gray-500">
              Step {currentActiveIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="tw:flex tw:gap-1">
            {steps.map((step, index) => (
              <span
                key={step.key}
                className={clsx(
                  "tw:h-1 tw:flex-1 tw:rounded-full tw:transition-colors",
                  isCompleted || index <= currentActiveIndex
                    ? "tw:bg-primary"
                    : "tw:bg-gray-200",
                )}
              />
            ))}
          </div>
        </div>

        {/* Desktop: full rail */}
        <div className="tw:hidden tw:md:flex tw:items-center tw:gap-3 tw:px-5 tw:py-3">
          {steps.map((step, index) => {
            const isDone = isCompleted || index < currentActiveIndex;
            const isActive = !isCompleted && index === currentActiveIndex;

            return (
              <div key={step.key} className="tw:flex tw:items-center tw:gap-3">
                {index > 0 && (
                  <span
                    className={clsx(
                      "tw:h-px tw:w-10 tw:lg:w-16",
                      isDone || isActive
                        ? "tw:bg-primary"
                        : "tw:bg-gray-300",
                    )}
                  />
                )}
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span
                    className={clsx(
                      "tw:inline-flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold",
                      isDone && "tw:bg-primary tw:text-white",
                      isActive && "tw:bg-gray-900 tw:text-white",
                      !isDone &&
                        !isActive &&
                        "tw:bg-gray-100 tw:text-gray-500 tw:border tw:border-gray-300",
                    )}
                  >
                    {isDone ? <Check size={13} /> : index + 1}
                  </span>
                  <span
                    className={clsx(
                      "tw:text-sm tw:whitespace-nowrap",
                      isDone && "tw:text-primary tw:font-medium",
                      isActive && "tw:text-gray-900 tw:font-semibold",
                      !isDone && !isActive && "tw:text-gray-500",
                    )}
                  >
                    {t(step.langKey || step.title)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppScrollArea
      className={clsx("tw:mb-6 tw:whitespace-nowrap", className)}
      orientation="horizontal"
    >
      <div className="tw:w-full">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="tw:w-auto tw:inline-block tw:align-middle"
          >
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-x-2">
                <div
                  className={clsx(
                    "tw:rounded-full tw:w-8 tw:h-8 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:mb-1 tw:shadow-sm",

                    isCompleted || index < currentActiveIndex
                      ? "tw:bg-primary/10 tw:text-primary tw:border tw:border-primary"
                      : currentActiveIndex === index
                      ? "tw:bg-primary tw:text-white"
                      : "tw:bg-gray-200 tw:text-gray-500"
                  )}
                >
                  {isCompleted || index < currentActiveIndex ? (
                    <Check className="tw:text-primary tw:font-semibold tw:text-xl" />
                  ) : step.icon ? (
                    <DynamicIcon
                      name={step.icon as any}
                      className={clsx(
                        "tw:w-5 tw:h-5",
                        currentActiveIndex === index
                          ? "tw:text-primary"
                          : "tw:text-gray-500"
                      )}
                    />
                  ) : (
                    index + 1
                  )}
                </div>
                <div
                  className={clsx(
                    "tw:text-xs tw:font-medium tw:min-w-20 tw:text-center tw:line-clamp-2",
                    isCompleted || currentActiveIndex === index
                      ? ""
                      : "tw:text-gray-500",
                    isCompleted || index < currentActiveIndex
                      ? ""
                      : "tw:text-gray-500"
                  )}
                >
                  {t(step.langKey || step.title)}
                </div>
                {step.description && (
                  <div className="tw:text-xs tw:text-gray-500 tw:md:block tw:hidden">
                    {step.description}
                  </div>
                )}
              </div>
              {index !== steps.length - 1 && (
                <div
                  className={clsx(
                    "tw:flex-1 tw:h-1 tw:rounded tw:mx-1",
                    isCompleted || index < currentActiveIndex
                      ? "tw:bg-primary"
                      : "tw:bg-gray-200"
                  )}
                  style={{ minWidth: borderMinWidth || 80 }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </AppScrollArea>
  );
};

export default AppSteps;
