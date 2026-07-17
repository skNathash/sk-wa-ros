import React, { useCallback, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import { AppSelect } from "~/components/core/form/AppSelect";
import { AppCheckbox } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import AppButton from "~/components/core/button/AppButton";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { DayPickerProps } from "react-day-picker";
import { sub } from "date-fns";
import MiscService from "~/services/MiscService";

interface FilterFormData {
  dateRange: Date[] | null;
  status: string;
  isConsumerOffer?: boolean;
  category: any;
  brand: any;
}

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  data: Record<string, any>;
};

const statusOptions = InventorySubscribeService.getStatuses().map((status) => ({
  value: status.value,
  label: status.label,
}));
statusOptions.unshift({ value: "All", label: "All" });

const defaultFilterValues: FilterFormData = {
  dateRange: null,
  status: "",
  isConsumerOffer: false,
  category: null,
  brand: null,
};

const dateConfig: DayPickerProps = {
  mode: "range" as const,
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const FilterModal = ({ show, callback, data }: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<FilterFormData>({
      defaultValues: { ...defaultFilterValues },
    });

  const [category, brand] = useWatch({
    control,
    name: ["category", "brand"],
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilterValues, ...data });
    }
  }, [show, reset, data]);

  // Handle category selection
  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", item);
    } else {
      setValue("category", null);
    }
  };

  // Handle brand selection
  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brand", item);
    } else {
      setValue("brand", null);
    }
  };

  // Handle date range change
  const handleDateRangeChange =
    (chngFn: (value: Date[]) => void) => (dates: Date | Date[]) => {
      if (Array.isArray(dates)) {
        chngFn(dates.length > 0 ? dates : []);
      } else {
        chngFn(dates ? [dates] : []);
      }
    };

  // Handle status change
  const handleStatusChange = (chngFn: any) => (value: string) => {
    chngFn(value);
  };

  const onSubmit = useCallback(
    (formData: FilterFormData) => {
      callback({ data: formData, action: "apply" });
    },
    [callback]
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilterValues });
  }, [reset]);

  const handleClose = () => {
    callback({ data: defaultFilterValues, action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {t("filters", { ns: "common" })}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <div>
              <Controller
                control={control}
                name="dateRange"
                render={({ field }) => (
                  <AppDateInput
                    placeholder={t("selectDateRange")}
                    callback={handleDateRangeChange(field.onChange)}
                    value={field.value || []}
                    dateConfig={dateConfig}
                    size="sm"
                    className="tw:w-full"
                  />
                )}
              />
            </div>

            {/* Status Select */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={statusOptions}
                  placeholder={t("selectStatus")}
                  onChange={handleStatusChange(field.onChange)}
                  value={field.value}
                  inputClassName="tw:w-full"
                />
              )}
            />

            {/* Category Search */}
            <div>
              <CategorySearchInput
                multiSelect={false}
                callback={handleCategoryChange}
                values={category ? [category] : []}
                feature="product"
                placeholder={t("searchCategories")}
                size="sm"
              />
            </div>

            {/* Brand Search */}
            <div>
              <BrandSearchInput
                multiSelect={false}
                callback={handleBrandChange}
                values={brand ? [brand] : []}
                feature="product"
                placeholder={t("searchBrands")}
                size="sm"
              />
            </div>

            {/* Consumer Offer Checkbox */}
            <Controller
              control={control}
              name="isConsumerOffer"
              render={({ field }) => (
                <AppCheckbox
                  size="xs"
                  label="Show consumer offers"
                  value={!!field.value}
                  onChange={(checked) => field.onChange(checked)}
                />
              )}
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            {t("reset", { ns: "common" })}
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            color="primary"
            size="small"
          >
            {t("apply", { ns: "common" })}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
