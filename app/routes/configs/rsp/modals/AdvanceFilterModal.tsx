import type { Options } from "flatpickr/dist/types/options";
import { useCallback, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppModal from "~/components/core/modal/AppModal";
import BrandSearchInput from "~/components/feature/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/components/feature/search-input/category/CategorySearchInput";
import MenuSearchInput from "~/components/feature/search-input/menu/MenuSearchInput";

interface AdvanceFilterModalProps {
  show: boolean;
  callback: (a: { formData: any; action: string }) => void;
  data: any;
}

const AdvanceFilterModal = ({
  show,
  callback,
  data,
}: AdvanceFilterModalProps) => {
  const { control, register, setValue, getValues, reset } = useForm({
    defaultValues: {
      dateRange: [],
      status: "",
      menu: [] as any[],
      categories: [] as any[],
      brands: [] as any[],
    },
  });

  const [categories, brands, menu] = useWatch({
    control: control,
    name: ["categories", "brands", "menu"],
  });

  useEffect(() => {
    if (show) {
      reset(data);
    }
  }, [data, reset, show]);

  const handleMenuSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menu", [item]);
    } else {
      setValue("menu", []);
    }
  };

  const handleCategorySelect = (item: any, action: "add" | "remove") => {
    const currentCategories = getValues("categories");
    if (action === "add") {
      setValue("categories", [...currentCategories, item]);
    } else {
      setValue(
        "categories",
        currentCategories.filter(
          (category: any) => category.value.id !== item.value.id
        )
      );
    }
  };

  const handleBrandSelect = (item: any, action: "add" | "remove") => {
    const currentBrands = getValues("brands");

    if (action === "add") {
      setValue("brands", [...currentBrands, item]);
    } else {
      setValue(
        "brands",
        currentBrands.filter((brand: any) => brand.value.id !== item.value.id)
      );
    }
  };

  const handleClear = useCallback(() => {
    const defaultValues = {
      dateRange: [],
      status: "",
      menu: [] as any[],
      categories: [] as any[],
      brands: [] as any[],
    };
    reset(defaultValues);
    callback({ formData: defaultValues, action: "clear" });
  }, [reset, callback]);

  const handleApply = useCallback(() => {
    callback({ formData: getValues(), action: "filter" });
  }, [getValues, callback]);

  const handleClose = () => {
    callback({ formData: {}, action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="offcanvas-modal">
      <AppModal.Title noShadow={true} onClose={handleClose}>
        Filter
      </AppModal.Title>
      <AppModal.Content className="modal-bg ion-padding">
        <AppCard>
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                callback={field.onChange}
                value={field.value}
                size="sm"
                dateConfig={dateConfig}
                label="Date Range"
                placeholder="Filter by Date Range"
                className="tw:mb-4"
              />
            )}
          />

          <AppSelect
            name="status"
            label="Status"
            placeholder="Filter by Status"
            register={register}
            size="sm"
            options={statusOptions}
            className="tw:mb-4"
          />

          <div className="tw:mb-4">
            <MenuSearchInput
              size="sm"
              callback={handleMenuSelect}
              values={menu}
              feature="pos"
            />
          </div>

          <div className="tw:mb-4">
            <CategorySearchInput
              size="sm"
              multiSelect={true}
              callback={handleCategorySelect}
              values={categories}
              feature="pos"
            />
          </div>

          <div className="tw:mb-4">
            <BrandSearchInput
              size="sm"
              multiSelect={true}
              callback={handleBrandSelect}
              values={brands}
              feature="pos"
            />
          </div>
        </AppCard>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:p-2 tw:gap-2">
          <AppButton color="secondary" fill="outline" onClick={handleClear}>
            Clear
          </AppButton>
          <AppButton color="primary" onClick={handleApply}>
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AdvanceFilterModal;

const dateConfig: Options = {
  mode: "range",
  maxDate: "today",
  dateFormat: "d M Y",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
