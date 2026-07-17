import clsx from "clsx";
import { Check, ChevronRight } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import { useTranslation } from "react-i18next";

const PoSteps = ({ activeStep }: { activeStep: number }) => {
  const { t } = useTranslation(["common"]);
  return (
    <AppSwiper config={swiperOptions}>
      {steps.map((step, index) => (
        <AppSwiper.Slide key={index} isAutoWidth>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:flex tw:flex-col tw:items-center tw:gap-x-2">
              <div
                className={clsx(
                  "tw:rounded-full tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:mb-1 tw:shadow-sm",

                  index < activeStep
                    ? "tw:bg-blue-500 tw:text-white"
                    : activeStep === index
                    ? "tw:bg-blue-500 tw:text-white"
                    : "tw:bg-gray-200 tw:text-gray-500"
                )}
              >
                {index < activeStep ? (
                  <Check className="tw:text-white tw:font-semibold tw:text-xl" />
                ) : (
                  index + 1
                )}
              </div>
              <div
                className={clsx(
                  "tw:text-sm tw:font-medium",
                  activeStep === index ? "tw:text-primary" : "",
                  index < activeStep ? "tw:text-primary" : ""
                )}
              >
                {t(step.titleLangKey)}
              </div>
              {step.description && (
                <div className="tw:text-xs tw:text-gray-500 tw:md:block tw:hidden">
                  {t(step.descriptionLangKey)}
                </div>
              )}
            </div>
            {index !== steps.length - 1 && (
              <div>
                <ChevronRight className="tw:text-gray-400 tw:md:mx-8" />
              </div>
            )}
          </div>
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

const steps = [
  {
    title: "Select Vendor",
    description: "Choose your supplier",
    descriptionLangKey: "chooseYourSupplier",
    titleLangKey: "selectVendor",
  },
  {
    title: "Add Products",
    description: "Select items to purchase",
    descriptionLangKey: "selectItemsToPurchase",
    titleLangKey: "addProducts",
  },
  {
    title: "Review & Submit",
    description: "Finalize and place order",
    descriptionLangKey: "finalizeAndPlaceOrder",
    titleLangKey: "reviewAndSubmit",
  },
];

export default PoSteps;
