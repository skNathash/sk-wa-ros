import debounce from "lodash/debounce";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
// Note: category/brand search inputs are handled inside the modal now
import { Filter as FilterIcon, Search } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import FilterModal from "../modals/FilterModal";

interface FilterProps {
  callback?: (filters: any) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, setValue } = useFormContext();

  const [filterModal, setFilterModal] = useState<{ show: boolean; data?: any }>(
    {
      show: false,
      data: {},
    }
  );

  // Create debounced search function
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };
  const openFilterModal = () => {
    setFilterModal({ show: true, data: getValues() });
  };

  const handleModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    setFilterModal({ show: false, data: undefined });

    if (action === "close") return;

    setValue("menu", data.menu || []);
    setValue("category", data.category || []);
    setValue("brand", data.brand || []);
    setValue("gst", data.gst || "all");

    // Trigger parent callback with the updated form values
    triggerCallback();
  };

  const triggerCallback = () => {
    const formValues = getValues();
    callback?.({ formData: formValues });
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2">
        <AppInput
          name="search"
          placeholder={t("searchProductsPlaceholder")}
          register={register}
          className="tw:w-full tw:flex-1"
          onChange={handleSearchChange}
          size="sm"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />
        <AppButton
          type="button"
          onClick={openFilterModal}
          fill="outline"
          color="light"
          size="small"
        >
          <FilterIcon />
        </AppButton>
      </div>

      <FilterModal
        show={filterModal.show}
        callback={handleModalCallback}
        initialValues={filterModal.data}
      />
    </>
  );
};

export default Filter;
