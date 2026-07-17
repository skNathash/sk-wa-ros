import React from "react";
import Chip from "./Chip";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";

interface AppliedFilterProps {
  menuId: string;
  menuName: string;
  categories: { name: string; _id: string }[];
  brands: { name: string; _id: string }[];
  onRemoveCategory: (id: string) => void;
  onRemoveBrand: (id: string) => void;
}

const AppliedFilter: React.FC<AppliedFilterProps> = ({
  menuId,
  menuName,
  categories,
  brands,
  onRemoveCategory,
  onRemoveBrand,
}) => {
  return (
    <AppSwiper config={swiperConfig}>
      {menuId && (
        <AppSwiper.Slide isAutoWidth>
          <Chip label={menuName} onRemove={() => onRemoveCategory(menuId)} />
        </AppSwiper.Slide>
      )}

      {categories.map((category) => (
        <AppSwiper.Slide key={category._id} isAutoWidth>
          <Chip
            label={category.name}
            onRemove={() => onRemoveCategory(category._id)}
          />
        </AppSwiper.Slide>
      ))}

      {brands.map((brand) => (
        <AppSwiper.Slide key={brand._id} isAutoWidth>
          <Chip label={brand.name} onRemove={() => onRemoveBrand(brand._id)} />
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
  navigation: false,
  pagination: false,
};

export default AppliedFilter;
