import React, { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { useTranslation } from "react-i18next";
import BrandSearch from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearch from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  show: boolean;
  vendorId: string;
  callback: (args: { formData: any; action: string }) => void;
  data?: Record<string, any>;
};

const defaultValues = {
  category: [],
  brand: [],
};

const FilterModal = ({ show, vendorId, callback, data }: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, reset, getValues, setValue } = useForm<{
    category: any[];
    brand: any[];
  }>({
    defaultValues: { ...defaultValues, ...(data || {}) },
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultValues, ...(data || {}) });
    }
  }, [show, data, reset]);

  const handleCategoryChange = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") setValue("category", [item]);
      else setValue("category", []);
    },
    [setValue]
  );

  const handleBrandChange = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") setValue("brand", [item]);
      else setValue("brand", []);
    },
    [setValue]
  );

  const handleApply = useCallback(() => {
    const formData = getValues();
    callback && callback({ formData, action: "apply" });
  }, [callback, getValues]);

  const handleReset = useCallback(() => {
    reset({ ...defaultValues });
    const formData = { ...defaultValues };
    callback && callback({ formData, action: "reset" });
  }, [reset, callback]);

  const handleClose = useCallback(() => {
    const formData = getValues();
    callback && callback({ formData, action: "close" });
  }, [callback, getValues]);

  return (
    <AppModal
      show={show}
      callback={callback as any}
      className="tw:max-w-[700px] tw:w-full"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
          <div className="tw:text-lg tw:font-medium">{t("filters")}</div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:grid tw:grid-cols-1 tw:gap-4">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CategorySearch
                callback={(item: any, action: "add" | "remove") => {
                  handleCategoryChange(item, action);
                }}
                values={field.value}
                vendorId={vendorId}
                feature="vendor"
                placeholder={t("searchCategory")}
                size="sm"
                label={t("category")}
              />
            )}
          />

          <Controller
            control={control}
            name="brand"
            render={({ field }) => (
              <BrandSearch
                callback={(item: any, action: "add" | "remove") => {
                  handleBrandChange(item, action);
                }}
                values={field.value}
                vendorId={vendorId}
                feature="vendor"
                placeholder={t("searchBrand")}
                size="sm"
                label={t("brand")}
              />
            )}
          />
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            {t("reset")}
          </AppButton>
          <AppButton onClick={handleApply} color="primary" size="small">
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
