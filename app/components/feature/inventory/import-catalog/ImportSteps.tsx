import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper";
import clsx from "clsx";
import { CheckCircle, ChevronRight } from "lucide-react";

const ImportSteps = ({ activeStep }: { activeStep: number }) => {
  return (
    <AppCard>
      <AppSwiper config={swiperOptions}>
        {steps.map((step, index) => (
          <AppSwiper.Slide key={index} isAutoWidth>
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-x-2">
                <div
                  className={clsx(
                    "tw:rounded-full tw:w-8 tw:h-8 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:mb-1 tw:shadow-sm",
                    activeStep === index ? "tw:bg-primary tw:text-white" : "",
                    index < activeStep
                      ? "tw:bg-green-500 tw:text-white"
                      : "tw:bg-gray-200 tw:text-gray-500"
                  )}
                >
                  {index < activeStep ? (
                    <CheckCircle size={18} className="tw:text-white" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div
                  className={clsx(
                    "tw:text-sm tw:font-semibold",
                    activeStep === index ? "tw:text-primary" : "",
                    index < activeStep ? "tw:text-primary" : "tw:text-gray-400"
                  )}
                >
                  {step.title}
                </div>
              </div>
              {index !== steps.length - 1 && (
                <div>
                  <ChevronRight
                    size={18}
                    className="tw:text-gray-400 tw:md:mx-8"
                  />
                </div>
              )}
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </AppCard>
  );
};

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

const steps = [
  {
    title: "Vendor",
  },
  {
    title: "Method",
  },
  {
    title: "Upload",
  },
  {
    title: "Preview",
  },
  {
    title: "Import",
  },
];

export default ImportSteps;
