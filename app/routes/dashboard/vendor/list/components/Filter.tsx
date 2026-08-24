import React from "react";
import debounce from "lodash/debounce";
import { useFormContext, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import { Filter as FilterIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import FilterModal from "../modals/FilterModal";
import useScreenView from "~/hooks/useScreenView";

interface FilterProps {
  callback: (value: any) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control, setValue } = useFormContext();

  const { isMobile } = useScreenView();

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
      <div className="tw:flex tw:flex-col tw:gap-2 tw:mb-3">
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
      {/* Horizontal A–Z strip — desktop only. Mobile uses a sticky vertical
          alpha rail beside the card list (see index.tsx). */}
      <Alpha
        callback={onAlphaChange}
        selected={alpha}
        className="tw:hidden md:tw:block tw:mb-3 tw:[&_span]:my-0"
      />

      <FilterModal
        show={filterModal.show}
        callback={closeModal}
        data={filterModal.data}
      />
    </>
  );
};

export default Filter;
