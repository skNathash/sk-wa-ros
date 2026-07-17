import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import { AppSelect } from "~/components/core/form";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import AppButton from "~/components/core/button/AppButton";

interface FilterModalProps {
  show: boolean;
  callback: (args: { action: string; data: any }) => void;
}

const priceModeOptions = [
  { value: "all", label: "All", langKey: "all" },
  { value: "fixed", label: "Fixed", langKey: "fixed" },
];

const FilterModal = ({ show, callback }: FilterModalProps) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext();

  const [categories, brands] = useWatch({
    control,
    name: ["categories", "brands"],
  });

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  const handleApply = () => {
    const formValues = getValues();
    callback({ action: "apply", data: formValues });
  };

  const handleCategoryChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setValue("categories", []);
    } else {
      setValue("categories", item ? [item] : []);
    }
  };

  const handleBrandChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setValue("brands", []);
    } else {
      setValue("brands", item ? [item] : []);
    }
  };

  const handleReset = () => {
    setValue("categories", []);
    setValue("brands", []);
    setValue("priceMode", "all");
    handleApply();
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{t("filters")}</div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <div>
            <CategorySearchInput
              placeholder={t("searchByCategory")}
              feature="pos"
              callback={handleCategoryChange}
              values={categories || []}
            />
          </div>

          <div>
            <BrandSearchInput
              placeholder={t("searchByBrand")}
              feature="pos"
              callback={handleBrandChange}
              values={brands || []}
            />
          </div>

          <div>
            <Controller
              control={control}
              name="priceMode"
              render={({ field }) => (
                <AppSelect
                  options={priceModeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  inputClassName="tw:w-full"
                />
              )}
            />
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer className="tw:border-t tw:border-gray-200">
        <div className="tw:flex tw:gap-3 tw:justify-between tw:w-full">
          <AppButton onClick={handleReset} color="light" fill="outline">
            {t("reset")}
          </AppButton>
          <div className="tw:flex tw:gap-3">
            <AppButton onClick={handleApply} color="primary" fill="solid">
              {t("applyFilter")}
            </AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
