import { useState } from "react";
import { AppInput } from "~/components/core/form";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Search, SlidersHorizontal } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import Alpha from "~/components/core/alpha/Alpha";
import FilterModal from "../../../modals/FilterModal";

type Props = {
  callback: (args?: { action: string; data?: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { register, getValues, setValue, watch } = useFormContext();
  const [showFilterModal, setShowFilterModal] = useState(false);

  const alphaValue = watch("alpha") || "";

  const debounceSearch = useDebouncedCallback(() => {
    callback({ action: "search", data: getValues() });
  }, 500);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    callback({ action: "alpha", data: { alpha: value } });
  };

  const handleFilterModal = (result: { action: string; data?: any }) => {
    if (result.action === "apply") {
      setShowFilterModal(false);
      setTimeout(() => {
        callback({ action: "filter", data: result.data });
      }, 300);
    } else if (result.action === "reset") {
      setShowFilterModal(false);
      setTimeout(() => {
        callback({ action: "filter", data: result.data });
      }, 300);
    } else if (result.action === "close") {
      setShowFilterModal(false);
    }
  };

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:items-center tw:gap-2">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            register={register}
            onChange={() => debounceSearch()}
            placeholder="Search by name/ID"
            className="tw:w-full"
            leftIcon={<Search size={16} />}
          />
        </div>
        <AppButton
          size="small"
          fill="outline"
          color="primary"
          onClick={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal size={16} className="tw:mr-1" />
          Filter
        </AppButton>
      </div>
      <Alpha
        selected={alphaValue}
        callback={handleAlphaChange}
        className="tw:mt-2"
      />
      <FilterModal
        show={showFilterModal}
        callback={handleFilterModal}
        initialData={{
          menu: getValues("menu"),
          category: getValues("category"),
          brand: getValues("brand"),
        }}
      />
    </div>
  );
};

export default Filter;
