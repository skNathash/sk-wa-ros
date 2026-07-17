import { debounce } from "lodash";
import { Barcode, Funnel } from "lucide-react";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import InventoryFilterModal from "~/shared/inventory/modals/inventory-filter/InventoryFilterModal";
import { type FilterFormFields } from "../helper";

interface FilterProps {
  callback: ({ action, data }: { action: string; data?: any }) => void;
  className?: string;
}

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const [filterModal, setFilterModal] = useState<{ show: boolean; data: any }>({
    show: false,
    data: null,
  });

  const { register, setValue, getValues } = useFormContext<FilterFormFields>();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      callback({ action: "search", data: getValues() });
    }, 500),
    [callback, getValues],
  );

  const handleSearchChange = (e: any) => {
    const val = e.target.value;
    setValue("search", val);
    debouncedSearch();
  };

  const openInventoryFilterModal = () => {
    const currentValues = getValues();
    setFilterModal({
      show: true,
      data: {
        ...currentValues,
      },
    });
  };

  const handleInventoryFilterModalCallback = async (payload: {
    data?: any;
    action: string;
  }) => {
    setFilterModal({ show: false, data: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (payload.action === "apply" && payload.data) {
      callback({
        action: "filter",
        data: {
          ...getValues(),
          ...payload.data,
        },
      });
    }
  };

  return (
    <div className={`tw:flex tw:items-center tw:gap-2 ${className || ""}`}>
      <AppInput
        name="search"
        placeholder={t("searchItemsPlaceholder")}
        register={register}
        onChange={handleSearchChange}
        className="tw:flex-1"
        leftIcon={<Barcode className="tw:text-gray-500" size={16} />}
      />
      <AppButton
        fill="outline"
        color="light"
        onClick={openInventoryFilterModal}
      >
        <Funnel size={18} />
      </AppButton>

      <InventoryFilterModal
        show={filterModal.show}
        data={filterModal.data}
        callback={handleInventoryFilterModalCallback}
      />
    </div>
  );
};

export default Filter;
