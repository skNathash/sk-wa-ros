import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm, useFormContext, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppSelect } from "~/components/core/form";
import SellerCatalogService from "~/services/SellerCatalogService";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";

import { AppInput } from "~/components/core/form/AppInput";

const sortOptions = SellerCatalogService.getGlobalSortOptions();

interface Props {
  callback: (a: { formData: any }) => void;
}

const Filter = ({ callback }: Props) => {
  const { register, getValues, control, setValue } = useFormContext();

  const [alpha, category] = useWatch({
    control,
    name: ["alpha", "category"],
  });

  const [globalSort] = useWatch({
    control,
    name: ["globalSort"],
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

  const handleCategoryChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setValue("category", [] as any);
    } else {
      // store as array for compatibility with other modules
      setValue("category", (item ? [item] : []) as any);
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

        <CategorySearchInput
          label={undefined}
          placeholder="Search categories"
          callback={handleCategoryChange}
          values={category}
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
