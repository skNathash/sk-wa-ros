import { useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppSelect from "~/components/core/form/AppSelect";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import DealSearchInput from "~/shared/catalog/components/search-input/deal/DealSearchInput";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import type { SlideFormData } from "../../helper";

const redirectionOptions = [
  { value: "no_action", label: "No Action" },
  { value: "brand", label: "Brand" },
  { value: "category", label: "Category" },
  { value: "product", label: "Product" },
  { value: "brand_category", label: "Brand & Category" },
  { value: "keywords", label: "Keywords" },
  { value: "menu", label: "Menu" },
];

const Redirection = () => {
  const { register, setValue, control } = useFormContext<SlideFormData>();

  const [redirectionType, brands, categories, products, menus] = useWatch({
    control,
    name: ["redirectionType", "brands", "categories", "products", "menus"],
  });

  const handleRedirectionChange = (value: string) => {
    setValue("redirectionType", value);
    // Reset all selection fields when type changes
    setValue("brands", []);
    setValue("categories", []);
    setValue("products", []);
    setValue("menus", []);
    setValue("keywords", "");
  };

  const handleBrandSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") {
        const alreadySelected = brands?.some(
          (b: any) => b.value?.id === item.value?.id,
        );
        if (alreadySelected) return;
        setValue("brands", [...(brands || []), item]);
      } else {
        setValue(
          "brands",
          (brands || []).filter((b: any) => b.value?.id !== item.value?.id),
        );
      }
      setValue("categories", []);
    },
    [brands, setValue],
  );

  const categoryParamsByBrand = useMemo(() => {
    if (brands && brands.length > 0) {
      return {
        filter: {
          "applicableBrand.brandId": { $in: brands.map((b: any) => b.value?.id) },
        },
      };
    }
    return {};
  }, [brands]);

  const handleCategorySelect = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") {
        const alreadySelected = categories?.some(
          (c: any) => c.value?.id === item.value?.id,
        );
        if (alreadySelected) return;
        setValue("categories", [...(categories || []), item]);
      } else {
        setValue(
          "categories",
          (categories || []).filter((c: any) => c.value?.id !== item.value?.id),
        );
      }
    },
    [categories, setValue],
  );

  const handleProductSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") {
        const alreadySelected = products?.some(
          (p: any) => p.value?.id === item.value?.id,
        );
        if (alreadySelected) return;
        setValue("products", [...(products || []), item]);
      } else {
        setValue(
          "products",
          (products || []).filter((p: any) => p.value?.id !== item.value?.id),
        );
      }
    },
    [products, setValue],
  );

  const handleMenuSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      if (action === "add") {
        const alreadySelected = menus?.some(
          (m: any) => m.value?.id === item.value?.id,
        );
        if (alreadySelected) return;
        setValue("menus", [...(menus || []), item]);
      } else {
        setValue(
          "menus",
          (menus || []).filter((m: any) => m.value?.id !== item.value?.id),
        );
      }
    },
    [menus, setValue],
  );

  return (
    <div className="tw:space-y-4">
      <AppSelect
        label="Redirection"
        options={redirectionOptions}
        value={redirectionType || ""}
        onChange={handleRedirectionChange}
        placeholder="Select Redirection"
        isRequired={true}
      />

      {redirectionType === "brand" && (
        <BrandSearchInput
          label="Select Brand"
          placeholder="Search brand"
          callback={handleBrandSelect}
          values={brands}
          multiSelect={true}
          feature="pos"
          isRequired={true}
        />
      )}

      {redirectionType === "category" && (
        <CategorySearchInput
          label="Select Category"
          placeholder="Search category"
          callback={handleCategorySelect}
          values={categories}
          multiSelect={true}
          feature="pos"
          isRequired={true}
        />
      )}

      {redirectionType === "product" && (
        <DealSearchInput
          label="Select Product"
          placeholder="Search product"
          callback={handleProductSelect}
          values={products}
          multiSelect={true}
          feature="pos"
          isRequired={true}
        />
      )}

      {redirectionType === "brand_category" && (
        <>
          <BrandSearchInput
            label="Select Brand"
            placeholder="Search brand"
            callback={handleBrandSelect}
            values={brands}
            multiSelect={true}
            feature="pos"
            isRequired={true}
          />
          <CategorySearchInput
            label="Select Category"
            placeholder="Search category"
            callback={handleCategorySelect}
            values={categories}
            multiSelect={true}
            feature="pos"
            isRequired={true}
            params={categoryParamsByBrand}
          />
        </>
      )}

      {redirectionType === "keywords" && (
        <AppInput
          name="keywords"
          label="Keywords"
          placeholder="Enter keywords"
          register={register}
          isRequired={true}
        />
      )}

      {redirectionType === "menu" && (
        <MenuSearchInput
          label="Select Menu"
          placeholder="Search menu"
          callback={handleMenuSelect}
          values={menus}
          multiSelect={true}
          feature="pos"
          isRequired={true}
        />
      )}
    </div>
  );
};

export default Redirection;
