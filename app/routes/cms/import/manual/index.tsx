import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";

const brandOptions = [
  { value: "brand1", label: "Brand 1" },
  { value: "brand2", label: "Brand 2" },
];
const categoryOptions = [
  { value: "cat1", label: "Category 1" },
  { value: "cat2", label: "Category 2" },
];
const vendorOptions = [
  { value: "vendor1", label: "Vendor 1" },
  { value: "vendor2", label: "Vendor 2" },
];

export default function ManualImportForm() {
  const { register, handleSubmit, setValue, watch, control } = useForm();

  const onSubmit = (data: any) => {
    // handle form submission
  };

  return (
    <AppCard
      title="Create a Single Product"
      subtitle="Fill out the form below to add one product to your catalog."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="tw:grid tw:gap-4 tw:grid-cols-1 tw:md:grid-cols-2"
      >
        <AppInput name="name" label="Name" register={register} className="" />
        <AppInput name="sku" label="SKU" register={register} className="" />
        <Controller
          name="brand"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="Brand"
              options={brandOptions}
              value={field.value}
              onChange={field.onChange}
              className=""
              inputClassName="tw:w-full"
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="Category"
              options={categoryOptions}
              value={field.value}
              onChange={field.onChange}
              className=""
              inputClassName="tw:w-full"
            />
          )}
        />
        <AppTextarea
          name="description"
          label="Description"
          register={register}
          className="tw:md:col-span-2"
        />
        <AppInput
          name="b2cPrice"
          label="B2C Price"
          type="number"
          register={register}
          className=""
        />
        <AppInput
          name="b2bPrice"
          label="B2B Price"
          type="number"
          register={register}
          className=""
        />
        <AppInput
          name="purchasePrice"
          label="Purchase Price"
          type="number"
          register={register}
          className=""
        />
        <AppInput
          name="stockQty"
          label="Stock Qty"
          type="number"
          register={register}
          className=""
        />
        <AppInput
          name="minStockLevel"
          label="Min Stock Level"
          type="number"
          register={register}
          className=""
        />
        <AppInput
          name="maxStockLevel"
          label="Max Stock Level"
          type="number"
          register={register}
          className=""
        />
        <Controller
          name="vendorName"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="Vendor Name"
              options={vendorOptions}
              value={field.value}
              onChange={field.onChange}
              className=""
              inputClassName="tw:w-full"
            />
          )}
        />
        <div className="md:tw:col-span-2 tw:flex tw:justify-end">
          <AppButton type="submit">Submit</AppButton>
        </div>
      </form>
    </AppCard>
  );
}
