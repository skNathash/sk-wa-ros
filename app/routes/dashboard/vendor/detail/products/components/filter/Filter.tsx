import { debounce, set } from "lodash";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import { Funnel, Sliders } from "lucide-react";
import { useState } from "react";
import FilterModal from "../../modals/FilterModal";
import AppButton from "~/components/core/button/AppButton";

const Filter = ({
  callback,
  vendorId,
}: {
  callback: (args: { formData: any; action: string }) => void;
  vendorId: string;
}) => {
  const { t } = useTranslation(["common"]);
  const { register, control, getValues, setValue } = useFormContext();

  // useWatch for alpha
  const [alpha] = useWatch({ control, name: ["alpha"] });
  // Callback for Alpha component
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback("alpha");
  };

  const triggerCallback = (action: string) => {
    callback && callback({ formData: getValues(), action });
  };

  const handleSearch = debounce(() => {
    triggerCallback("search");
  }, 500);

  const [filterModal, setFilterModal] = useState<{ show: boolean; data?: any }>(
    { show: false, data: undefined },
  );

  const openFilterModal = () => {
    // set brand and category from form into modal data
    const current = getValues();
    setFilterModal({
      show: true,
      data: { brand: current.brand, category: current.category },
    });
  };

  const closeFilterModal = () =>
    setFilterModal({ show: false, data: undefined });

  const handleModalCallback = (args: { formData: any; action: string }) => {
    if (!args) return;

    setFilterModal({ show: false, data: undefined });

    if (args.action === "apply") {
      const vals = args.formData || {};
      Object.keys(vals).forEach((k) => {
        try {
          setValue(k as any, (vals as any)[k]);
        } catch (e) {}
      });
      // update parent filters
      triggerCallback("filter-modal-apply");
    } else if (args.action === "reset") {
      // modal has already reset, update form accordingly
      const vals = args.formData || {};
      Object.keys(vals).forEach((k) => {
        try {
          setValue(k as any, (vals as any)[k]);
        } catch (e) {}
      });
      triggerCallback("filter-modal-reset");
    }
  };

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:items-center tw:gap-2">
        <div className="tw:flex-1">
          <AppInput
            type="text"
            placeholder={t("search")}
            name="search"
            register={register}
            onChange={handleSearch}
            size="sm"
            className="tw:w-full"
          />
        </div>

        <div>
          <AppButton
            onClick={openFilterModal}
            color="light"
            size="small"
            fill="outline"
          >
            <Funnel size={16} />
          </AppButton>
        </div>
      </div>

      {/* Alpha filter on new line */}
      <div className="tw:mt-3">
        <Alpha
          selected={alpha || ""}
          callback={handleAlphaChange}
          className=""
        />
      </div>

      <FilterModal
        show={filterModal.show}
        vendorId={vendorId}
        callback={handleModalCallback}
        data={filterModal.data}
      />
    </div>
  );
};

export default Filter;
