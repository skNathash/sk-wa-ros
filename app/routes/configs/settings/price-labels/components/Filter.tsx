import React, { useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import { debounce } from "lodash";
import { ChevronDown, Search } from "lucide-react";

interface FilterProps {
  onFilter: (params: { action: string; data: any }) => void;
}

interface FilterForm {
  search: string;
  brand: any[];
  category: any[];
  dealIds: string;
}

const Filter: React.FC<FilterProps> = ({ onFilter }) => {
  const { register, getValues, setValue, control } = useForm<FilterForm>({
    defaultValues: {
      search: "",
      brand: [],
      category: [],
      dealIds: "",
    },
  });

  const [categoryParams, setCategoryParams] = useState({});
  const [showDealIds, setShowDealIds] = useState(false);

  const debounceSearch = useCallback(
    debounce(() => {
      triggerFilter();
    }, 500),
    [],
  );

  const triggerFilter = () => {
    onFilter({
      action: "filter",
      data: getValues(),
    });
  };

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    let newBrand = [...getValues("brand")];
    if (action === "add") {
      newBrand = [item];
    } else {
      newBrand = [];
    }
    setValue("brand", newBrand);
    setValue("category", []); // Clear category when brand changes
    if (newBrand.length > 0) {
      const brandIds = newBrand.map((b: any) => b.value.id);
      setCategoryParams({
        filter: { "applicableBrand.brandId": { $in: brandIds } },
      });
    } else {
      setCategoryParams({});
    }
    triggerFilter();
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    let newCategory = [...getValues("category")];
    if (action === "add") {
      newCategory = [item];
    } else {
      newCategory = [];
    }
    setValue("category", newCategory);
    triggerFilter();
  };

  const handleDealIdsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerFilter();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <div className="tw:grid tw:grid-cols-3 tw:gap-2">
        <AppInput
          type="text"
          placeholder="Search"
          name="search"
          register={register}
          onChange={debounceSearch}
          size="sm"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />
        <Controller
          name="brand"
          control={control}
          render={({ field }) => (
            <BrandSearchInput
              placeholder="Brand"
              callback={handleBrandChange}
              values={field.value}
              size="sm"
              feature="pos"
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategorySearchInput
              placeholder="Category"
              callback={handleCategoryChange}
              values={field.value}
              size="sm"
              feature="pos"
              params={categoryParams}
            />
          )}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={() => setShowDealIds((prev) => !prev)}
          className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-gray-500 hover:tw:text-gray-700 tw:transition-colors tw:cursor-pointer"
        >
          <ChevronDown
            size={14}
            className={`tw:transition-transform ${
              showDealIds ? "tw:rotate-180" : ""
            }`}
          />
          Search using Bulk deal IDs
        </button>
        {showDealIds && (
          <form
            onSubmit={handleDealIdsSubmit}
            className="tw:flex tw:items-center tw:gap-2 tw:mt-2"
          >
            <div className="tw:flex-1">
              <AppInput
                type="text"
                placeholder="Enter comma separated deal IDs"
                name="dealIds"
                register={register}
                size="sm"
              />
            </div>
            <AppButton type="submit" size="small">
              Apply
            </AppButton>
          </form>
        )}
      </div>
    </div>
  );
};

export default Filter;
