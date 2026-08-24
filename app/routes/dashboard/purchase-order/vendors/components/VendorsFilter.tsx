import debounce from "lodash/debounce";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import { useTranslation } from "react-i18next";

interface VendorsFilterProps {
  callback: (a: { formData: any; action: string }) => void;
}

const VendorsFilter = ({ callback }: VendorsFilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue, control } = useForm({
    defaultValues: {
      search: "",
      brand: [] as any[],
      category: [] as any[],
      alpha: "",
    },
  });

  const alpha = useWatch({
    control: control,
    name: "alpha",
  });

  const handleSearch = debounce((e: any) => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  const triggerCallback = () => {
    callback({ formData: getValues(), action: "filter" });
  };

  // const handleFilterCallback = (a: { formData: any; action: string }) => {
  //   if (a.action === "filter" || a.action === "clear") {
  //     setValue("brand", a.formData.brand);
  //     setValue("category", a.formData.category);
  //     setFilterModal({ show: false, data: { ...getValues() } });
  //     callback(a);
  //   } else {
  //     setFilterModal({ show: false, data: {} });
  //   }
  // };

  const handleBrandCallback = (item: any, action: "add" | "remove") => {
    let newValue = Array.isArray(getValues("brand"))
      ? [...getValues("brand")]
      : [];
    if (action === "add") {
      newValue.push(item);
    } else {
      newValue = newValue.filter((v: any) => v._id !== item._id);
    }
    setValue("brand", newValue);
    triggerCallback();
  };

  const handleAlphaClick = (letter: string) => {
    setValue("alpha", letter);
    triggerCallback();
  };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-2">
        <AppInput
          name="search"
          placeholder={t("searchByVendorNameIdOrMobile")}
          register={register}
          onChange={handleSearch}
          size="sm"
          className="tw:flex-1 tw:md:col-span-2"
        />

        <Controller
          control={control}
          name="brand"
          render={({ field }) => (
            <BrandSearchInput
              size="sm"
              multiSelect={true}
              values={field.value}
              callback={handleBrandCallback}
              placeholder={t("selectBrand")}
              className="tw:w-full"
            />
          )}
        />
      </div>

      <Alpha selected={alpha} callback={handleAlphaClick} className="tw:mb-2" />

      {/* <VendorFilterModal
        show={filterModal.show}
        callback={handleFilterCallback}
        data={filterModal.data}
      /> */}
    </>
  );
};

export default VendorsFilter;
