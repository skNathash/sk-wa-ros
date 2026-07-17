import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppSelect } from "~/components/core/form";
import SellerCatalogService from "~/services/SellerCatalogService";

import { AppInput } from "~/components/core/form/AppInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";

const sortOptions = SellerCatalogService.getGlobalSortOptions();

interface Props {
  callback: (a: { formData: any }) => void;
}

const Filter = ({ callback }: Props) => {
  const { register, getValues, control, setValue } = useFormContext();

  const [alpha, brand] = useWatch({
    control,
    name: ["alpha", "brand"],
  });

  const handleSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  const handleBrandChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setValue("brand", [] as any);
    } else {
      // store as array for compatibility with other modules
      setValue("brand", (item ? [item] : []) as any);
    }
    triggerCallback();
  };

  const handleSortChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      triggerCallback();
    };

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          onChange={handleSearch}
          size="sm"
          className="tw:w-full"
        />

        <Controller
          control={control}
          name="globalSort"
          render={({ field }) => (
            <AppSelect
              size="sm"
              options={sortOptions}
              value={field.value}
              onChange={handleSortChange(field.onChange)}
              inputClassName="tw:w-full"
            />
          )}
        />

        <BrandSearchInput
          label={undefined}
          placeholder="Search brands"
          callback={handleBrandChange}
          values={brand}
          size="sm"
          className="tw:w-full"
          feature="pos"
        />
      </div>
      <Alpha
        selected={alpha || ""}
        callback={handleAlphaChange}
        className="tw:w-full"
      />
    </div>
  );
};

export default Filter;
