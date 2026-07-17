import { Funnel, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import InventoryFilterModal from "~/shared/inventory/modals/inventory-filter/InventoryFilterModal";
import { useSearchParams } from "react-router";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";

type Props = {
  callback: (formData: any) => void;
};

const Filter = ({ callback }: Props) => {
  const { register, getValues, setValue, control } = useFormContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "products";

  const alpha = useWatch({
    control,
    name: "alpha",
  });

  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    data: any | null;
  }>({
    show: false,
    data: null,
  });

  const triggerCallback = useCallback(() => {
    callback(getValues());
  }, [callback, getValues]);

  const debounceSearch = useDebouncedCallback(
    () => {
      triggerCallback();
    },
    500,
    {
      maxWait: 1000,
    },
  );

  const handleSearch = () => {
    setValue("alpha", "");
    debounceSearch();
  };

  const handleFilterModalCallback = (a: { action: string; data?: any }) => {
    setFilterModal({ show: false, data: null });

    const action = a.action;

    if ((action === "apply" || action === "reset") && a.data) {
      const newFormData = { ...getValues(), ...a.data };
      const params =
        InventoryDealFilterService.prepareInventoryFilterQueryParams(
          newFormData,
        );

      const currentFeature = searchParams.get("feature");
      const tab = searchParams.get("tab");

      if (currentFeature) params.set("feature", currentFeature);
      if (tab) params.set("tab", tab);
      if (newFormData.search) params.set("search", newFormData.search);

      setSearchParams(params, { replace: true });
    }
  };

  const openFilterModal = () => {
    const currentValues = getValues();
    setFilterModal({
      show: true,
      data: {
        ...currentValues,
      },
    });
  };

  const handleAlphaChange = (value: string) => {
    setValue("search", "");
    setValue("alpha", value);
    debounceSearch();
  };

  return (
    <>
      <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2">
        <AppInput
          name="search"
          register={register}
          onChange={handleSearch}
          size="sm"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
          placeholder={
            activeTab === "categories"
              ? "Search category name/ID..."
              : activeTab === "brands"
                ? "Search brand name/ID..."
                : "Search product name/ID..."
          }
          className="tw:flex-1"
        />
        {activeTab === "products" && (
          <AppButton
            color="light"
            size="small"
            fill="outline"
            onClick={openFilterModal}
          >
            <Funnel size={16} />
          </AppButton>
        )}
      </div>

      <Alpha
        selected={alpha || ""}
        callback={handleAlphaChange}
        className="tw:mb-4"
      />

      <InventoryFilterModal
        show={filterModal.show}
        data={filterModal.data}
        callback={handleFilterModalCallback}
      />
    </>
  );
};

export default Filter;
