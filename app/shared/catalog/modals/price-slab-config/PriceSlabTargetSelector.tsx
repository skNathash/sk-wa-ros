import React, { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import DealSearchInput from "~/shared/catalog/components/search-input/deal/DealSearchInput";

type TargetType = "global" | "menu" | "category" | "brand" | "product";

interface PriceSlabTargetSelectorProps {
  type: TargetType;
  callback?: (item: any | null) => void;
}

const PriceSlabTargetSelector: React.FC<PriceSlabTargetSelectorProps> = ({
  type,
  callback,
}) => {
  const { control } = useFormContext();

  const values = useWatch({ control, name: "target" });

  const handleSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") {
        callback?.(item);
      } else {
        callback?.(null);
      }
    },
    [callback],
  );

  if (type === "global") return null;

  switch (type) {
    case "menu":
      return (
        <MenuSearchInput
          label="Menu"
          placeholder="Search menu"
          callback={handleSelect}
          values={values}
          isRequired={true}
          feature="pos"
        />
      );
    case "brand":
      return (
        <BrandSearchInput
          label="Brand"
          placeholder="Search brand"
          callback={handleSelect}
          values={values}
          isRequired={true}
          feature="pos"
        />
      );
    case "category":
      return (
        <CategorySearchInput
          label="Category"
          placeholder="Search category"
          callback={handleSelect}
          values={values}
          isRequired={true}
          feature="pos"
        />
      );
    case "product":
      return (
        <DealSearchInput
          label="Product"
          placeholder="Search product"
          callback={handleSelect}
          values={values}
          isRequired={true}
          feature="pos"
        />
      );
    default:
      return null;
  }
};

export default PriceSlabTargetSelector;
