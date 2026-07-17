import clsx from "clsx";
import { Check } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Swiper, SwiperOptions } from "swiper/types";
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

  const activeIndex = steps.findIndex((step) => step.key === activeKey);
  const currentActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  const swiperRef = useRef<Swiper>(null);

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update();
    }
  }, [currentActiveIndex]);

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
                      ? "tw:bg-blue-500 tw:text-white"
                      : currentActiveIndex === index
                      ? "tw:bg-blue-50 tw:text-blue-600 tw:border-2 tw:border-blue-500"
                      : "tw:bg-gray-200 tw:text-gray-500"
                  )}
                >
                  {isCompleted || index < currentActiveIndex ? (
                    <Check className="tw:text-white tw:font-semibold tw:text-xl" />
                  ) : step.icon ? (
                    <DynamicIcon
                      name={step.icon as any}
                      className={clsx(
                        "tw:w-5 tw:h-5",
                        currentActiveIndex === index
                          ? "tw:text-blue-600"
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
                      ? "tw:bg-blue-500"
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
