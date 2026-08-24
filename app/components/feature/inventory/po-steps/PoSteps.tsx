import clsx from "clsx";
import { Check } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import { useTranslation } from "react-i18next";

const PoSteps = ({
  activeStep,
  containerClassName,
  type = "desktop",
}: {
  activeStep: number;
  containerClassName?: string;
  type?: "desktop" | "mobile";
}) => {
  const { t } = useTranslation(["common"]);

  if (type === "mobile") {
    return (
      <div
        className={clsx(
          // `top-15` matches the sticky header's own height (h-15), so the band
          // docks straight onto it instead of leaving a page-bg sliver.
          "tw:bg-primary tw:p-4 tw:flex tw:justify-between app-bleed-x tw:sticky tw:top-15 tw:z-10 tw:self-start",
          containerClassName,
        )}
      >
        {steps.map((step, index) => {
          return (
            <div
              key={step.mobileTitle}
              className="tw:flex tw:items-center tw:gap-2 tw:text-white"
            >
              <span className="tw:bg-white tw:rounded-full tw:w-2 tw:h-2 tw:shrink-0"></span>
              <div>{step.mobileTitle}</div>
              {index !== steps.length - 1 && (
                <span className="tw:border-b tw:border-white tw:w-1/2 tw:shrink-0"></span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="tw:w-full tw:bg-white tw:rounded-2xl tw:shadow-sm tw:border tw:border-gray-100 tw:px-3 tw:py-3 tw:md:px-6 tw:md:py-4">
      <AppSwiper config={swiperOptions}>
        {steps.map((step, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep;

          return (
            <AppSwiper.Slide key={step.titleLangKey} isAutoWidth>
              <div className="tw:flex tw:items-center">
                <div className="tw:flex tw:items-center tw:gap-2 tw:md:gap-3">
                  <div
                    className={clsx(
                      "tw:shrink-0 tw:rounded-full tw:w-8 tw:h-8 tw:md:w-9 tw:md:h-9 tw:flex tw:items-center tw:justify-center tw:text-xs tw:md:text-sm tw:font-semibold tw:transition-colors",
                      isDone || isActive
                        ? "tw:bg-blue-500 tw:text-white"
                        : "tw:bg-gray-100 tw:text-gray-400",
                      isActive && "tw:ring-4 tw:ring-blue-100",
                    )}
                  >
                    {isDone ? (
                      <Check className="tw:w-4 tw:h-4 tw:md:w-5 tw:md:h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="tw:text-left tw:leading-tight">
                    <div
                      className={clsx(
                        "tw:text-xs tw:md:text-sm tw:font-semibold tw:whitespace-nowrap",
                        isActive
                          ? "tw:text-blue-600"
                          : isDone
                            ? "tw:text-gray-900"
                            : "tw:text-gray-500",
                      )}
                    >
                      {t(step.titleLangKey)}
                    </div>
                    {step.descriptionLangKey && (
                      <div className="tw:hidden tw:md:block tw:text-xs tw:text-gray-500 tw:whitespace-nowrap tw:mt-0.5">
                        {t(step.descriptionLangKey)}
                      </div>
                    )}
                  </div>
                </div>

                {index !== steps.length - 1 && (
                  <div
                    className={clsx(
                      "tw:h-px tw:w-6 tw:md:w-12 tw:mx-2 tw:md:mx-5 tw:shrink-0",
                      isDone ? "tw:bg-blue-200" : "tw:bg-gray-200",
                    )}
                  />
                )}
              </div>
            </AppSwiper.Slide>
          );
        })}
      </AppSwiper>
    </div>
  );
};

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 0,
  centerInsufficientSlides: true,
};

const steps = [
  {
    title: "Select Vendor",
    description: "Choose your supplier",
    descriptionLangKey: "chooseYourSupplier",
    titleLangKey: "selectVendor",
    mobileTitle: "Vendor",
  },
  {
    title: "Add Products",
    description: "Select items to purchase",
    descriptionLangKey: "selectItemsToPurchase",
    titleLangKey: "addProducts",
    mobileTitle: "Products",
  },
  {
    title: "Review & Submit",
    description: "Finalize and place order",
    descriptionLangKey: "finalizeAndPlaceOrder",
    titleLangKey: "reviewAndSubmit",
    mobileTitle: "Review",
  },
];

export default PoSteps;
