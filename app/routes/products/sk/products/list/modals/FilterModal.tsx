import type { FC } from "react";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";

type FilterFormData = {
  category: any[];
  brand: any[];
};

const DEFAULT_VALUES: FilterFormData = {
  category: [],
  brand: [],
};

type FilterModalProps = {
  show: boolean;
  initialValues?: Partial<FilterFormData>;
  callback: (data: {
    action: "apply" | "cancel" | "clear";
    data?: Partial<FilterFormData>;
  }) => void;
};

export const FilterModal: FC<FilterModalProps> = ({
  show,
  initialValues = {},
  callback,
}) => {
  const { control, handleSubmit, reset, setValue } = useForm<FilterFormData>({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...initialValues,
    },
  });

  const categoryValue = useWatch({ control, name: "category" });

  // Scope brands by the selected category, when one is chosen.
  const brandFilterParams = useMemo(() => {
    const params: any = {};
    const categoryId = categoryValue?.[0]?.value?.id || categoryValue?.[0]?.id;
    if (categoryId) {
      params.filter = { category: [categoryId] };
    }
    return params;
  }, [categoryValue]);

  const handleApply = (data: FilterFormData) => {
    callback({ action: "apply", data });
  };

  const handleCancel = () => {
    reset(initialValues);
    callback({ action: "cancel" });
  };

  const handleClear = () => {
    reset(DEFAULT_VALUES);
    callback({ action: "clear" });
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", [item]);
      // Clear brand when category changes
      setValue("brand", []);
    } else {
      setValue("category", []);
      setValue("brand", []);
    }
  };

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") setValue("brand", [item]);
    else setValue("brand", []);
  };

  return (
    <AppModal show={show} callback={handleCancel}>
      <AppModal.Title onClose={handleCancel}>
        <div className="tw:text-lg tw:font-bold">Filter Products</div>
      </AppModal.Title>
      <form onSubmit={handleSubmit(handleApply)}>
        <AppModal.Content>
          <div className="tw:space-y-4">
            <div>
              <Controller
                name="category"
                control={control}
                render={({ field: { value } }) => (
                  <CategorySearchInput
                    size="sm"
                    feature="product"
                    values={value || []}
                    label="Category"
                    callback={(item, action) => {
                      handleCategoryChange(item, action);
                    }}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                name="brand"
                control={control}
                render={({ field: { value } }) => (
                  <BrandSearchInput
                    size="sm"
                    feature="product"
                    values={value || []}
                    label="Brand"
                    params={brandFilterParams}
                    callback={(item, action) => {
                      handleBrandChange(item, action);
                    }}
                  />
                )}
              />
            </div>
          </div>
        </AppModal.Content>
        <AppModal.Footer>
          <div className="tw:flex tw:justify-between tw:w-full">
            <AppButton
              type="button"
              onClick={handleClear}
              color="light"
              fill="outline"
              size="small"
            >
              Clear All
            </AppButton>
            <div className="tw:space-x-2">
              <AppButton
                type="button"
                onClick={handleCancel}
                color="light"
                fill="outline"
                size="small"
              >
                Cancel
              </AppButton>
              <AppButton type="submit" color="primary" size="small">
                Apply
              </AppButton>
            </div>
          </div>
        </AppModal.Footer>
      </form>
    </AppModal>
  );
};
