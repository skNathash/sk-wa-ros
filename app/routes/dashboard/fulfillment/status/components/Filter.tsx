import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";

type Props = {
  callback: (a: { formData: any }) => void;
};

const defaultFilter = {
  search: "",
  orderType: "",
  sortBy: "",
};

const Filter = ({ callback }: Props) => {
  const { register, getValues, control } = useForm({
    defaultValues: { ...defaultFilter },
  });

  const orderTypeOptions = [
    { label: "All Orders", value: "All" },
    { label: "B2B Orders", value: "b2b" },
    { label: "B2C Orders", value: "b2c" },
  ];

  const sortOptions = [
    { label: "Recent Orders", value: "recent" },
    { label: "Oldest Orders", value: "oldest" },
  ];

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleOrderTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleSortChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder="Search Order ID, Customer Name, Product"
        />

        <Controller
          control={control}
          name="orderType"
          render={({ field }) => (
            <AppSelect
              options={orderTypeOptions}
              value={field.value as string}
              onChange={handleOrderTypeChange(field.onChange)}
              size="sm"
              placeholder="Select Order Type"
              inputClassName="tw:w-full"
            />
          )}
        />

        <Controller
          control={control}
          name="sortBy"
          render={({ field }) => (
            <AppSelect
              options={sortOptions}
              value={field.value as string}
              onChange={handleSortChange(field.onChange)}
              size="sm"
              placeholder="Sort By"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </>
  );
};

export default Filter;
