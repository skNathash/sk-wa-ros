import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import { useTranslation } from "react-i18next";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import { Controller } from "react-hook-form";

type Props = {
  show: boolean;
  callback: (data: any) => void;
  data: any;
  retailerId: string;
};

type FormData = {
  menu: any[];
  category: any[];
  brand: any[];
  showOnlySchemes: boolean;
};

const defaultValues: FormData = {
  menu: [],
  category: [],
  brand: [],
  showOnlySchemes: false,
};

const commonFilterParams = {
  filter: {
    // availableQuantity: { $gt: 0 },
    status: "Active",
  },
};

const FilterModal = ({ show, callback, data, retailerId }: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<FormData>({
      defaultValues: { ...defaultValues },
    });

  const [menu, category, brand] = useWatch({
    control: control,
    name: ["menu", "category", "brand"],
  });

  const menuParams = useMemo(() => {
    return {
      sellerId: retailerId,
      filter: {
        ...commonFilterParams.filter,
      },
    };
  }, [retailerId]);

  const categoryParams = useMemo(() => {
    let params: Record<string, any> = {
      sellerId: retailerId,
    };
    if (menu?.length > 0) {
      params.filter = {
        "applicableMenu.menuId": menu[0].value.id,
      };
    }
    return {
      ...params,
      filter: {
        ...params.filter,
        ...commonFilterParams.filter,
      },
    };
  }, [retailerId, menu]);

  const brandParams = useMemo(() => {
    let params: Record<string, any> = {
      sellerId: retailerId,
    };
    if (category?.length > 0) {
      params.filter = {
        "applicableCategory.categoryId": category[0].value.id,
      };
    }
    return {
      ...params,
      filter: {
        ...params.filter,
        ...commonFilterParams.filter,
      },
    };
  }, [retailerId, category]);

  useEffect(() => {
    if (show) {
      reset(data);
    }
  }, [show, reset, data]);

  const handleMenuChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menu", [item]);
    } else {
      setValue("menu", []);
    }

    setValue("category", []);
    setValue("brand", []);
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", [item]);
    } else {
      setValue("category", []);
    }

    setValue("brand", []);
  };

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brand", [item]);
    } else {
      setValue("brand", []);
    }
  };

  const applyFilter = () => {
    callback({ formData: getValues(), action: "apply" });
  };

  const handleClear = () => {
    reset();
    callback({ formData: { ...defaultValues }, action: "reset" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={callback}>
        <div className="tw:text-lg tw:font-medium">Filter</div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:grid tw:grid-cols-1 tw:gap-4">
          <MenuSearchInput
            callback={handleMenuChange}
            values={menu}
            params={menuParams}
            feature="pos"
            label={t("menu")}
            size="sm"
          />

          <CategorySearchInput
            callback={handleCategoryChange}
            values={category}
            params={categoryParams}
            feature="pos"
            label={t("category")}
            size="sm"
          />

          <BrandSearchInput
            callback={handleBrandChange}
            values={brand}
            params={brandParams}
            feature="pos"
            label={t("brand")}
            size="sm"
          />

          <Controller
            control={control}
            name="showOnlySchemes"
            render={({ field }) => (
              <AppCheckbox
                label="Show only Schemes"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={handleClear}
          >
            Reset
          </AppButton>
          <AppButton color="primary" size="small" onClick={applyFilter}>
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
