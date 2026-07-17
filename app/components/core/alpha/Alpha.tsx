import { useMemo } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "../swiper";
import clsx from "clsx";

const alpha = [
  "123",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const Alpha = ({
  selected,
  callback,
  className,
  orientation = "horizontal",
}: {
  selected: string;
  callback: (value: string) => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) => {
  const config: SwiperOptions = useMemo(() => {
    return {
      ...defaultConfig,
      direction: orientation,
    };
  }, [orientation]);

  return (
    <div className={className}>
      <AppSwiper
        config={config}
        className={orientation === "vertical" ? "tw:h-full" : ""}
      >
        <AppSwiper.Slide
          isAutoWidth={orientation === "horizontal"}
          isAutoHeight={orientation === "vertical"}
        >
          <span
            className={`tw:text-xs tw:border tw:border-gray-200 tw:rounded-md tw:px-2 tw:py-1 tw:font-medium tw:cursor-pointer tw:my-1 tw:inline-block ${
              selected === "" ? "tw:bg-gray-900 tw:text-white" : "tw:bg-white"
            }`}
            onClick={() => callback("")}
          >
            All
          </span>
        </AppSwiper.Slide>
        {alpha.map((item) => (
          <AppSwiper.Slide
            isAutoWidth={orientation === "horizontal"}
            isAutoHeight={orientation === "vertical"}
            key={item}
          >
            <span
              className={`tw:text-xs tw:border tw:border-gray-200 tw:rounded-md tw:px-2 tw:py-1 tw:font-medium tw:cursor-pointer tw:my-1 tw:inline-block ${
                selected === item
                  ? "tw:bg-gray-900 tw:text-white"
                  : "tw:bg-white"
              }`}
              onClick={() => callback(item)}
            >
              {item}
            </span>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

const defaultConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 5,
};

export default Alpha;
