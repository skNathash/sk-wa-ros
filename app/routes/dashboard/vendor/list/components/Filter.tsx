import React from "react";
import debounce from "lodash/debounce";
import { useFormContext, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import { Filter as FilterIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import FilterModal from "../modals/FilterModal";

interface FilterProps {
  callback: (value: any) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control, setValue } = useFormContext();

  const [filterModal, setFilterModal] = React.useState({
    show: false,
    data: {},
  });

  const [alpha] = useWatch({ control, name: ["alpha"] });

  // Debounced search
  const debouncedSearch = debounce(() => {
    triggerCallback({});
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const triggerCallback = (data: Record<string, any>) => {
    const vals = getValues();
    callback({ formData: { ...vals, ...data } });
  };

  const onAlphaChange = (value: string) => {
    triggerCallback({ alpha: value });
  };

  const closeModal = (r?: { action: string; data?: any }) => {
    setFilterModal({ data: {}, show: false });
    if (r?.action === "apply") {
      triggerCallback(r.data);
    }
  };

  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-4 tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <AppInput
            name="search"
            placeholder={t("searchByNameMobileEmail")}
            register={register}
            onChange={handleSearchChange}
            size="sm"
            className="tw:flex-1"
          />

          <div className="tw:flex">
            <AppButton
              type="button"
              size="small"
              onClick={() => setFilterModal({ data: getValues(), show: true })}
              title={t("filters")}
              fill="outline"
              color="dark"
            >
              <FilterIcon size={16} />
            </AppButton>
          </div>
        </div>
      </div>
      <Alpha callback={onAlphaChange} selected={alpha} className="tw:mb-4" />

      <FilterModal
        show={filterModal.show}
        callback={closeModal}
        data={filterModal.data}
      />
    </>
  );
};

export default Filter;
