import { debounce } from "lodash";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Search, Settings } from "lucide-react";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import ManageVendorBrandModal from "~/modals/feature/vendor/manage-brand/ManageVendorBrandModal";

interface FilterFormData {
  search: string;
  alpha: string;
}

const defaultFilter: FilterFormData = {
  search: "",
  alpha: "",
};

const Filter = ({
  callback,
  vendorId,
}: {
  callback: (args: { formData: any; action: string }) => void;
  vendorId: string;
}) => {
  const { t } = useTranslation(["common"]);
  const [showManageBrandModal, setShowManageBrandModal] = useState(false);
  const { register, control, getValues, setValue } = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  // useWatch for category, brand, and alpha
  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });
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

  const handleManageBrandModal = (params: { action: string; data?: any }) => {
    if (params.action === "close") {
      setShowManageBrandModal(false);
      // Trigger callback to refresh the brands list when modal is closed
      callback && callback({ formData: getValues(), action: "refresh" });
    } else if (params.action === "success") {
      setShowManageBrandModal(false);
      // Trigger callback to refresh the brands list
      callback && callback({ formData: getValues(), action: "refresh" });
    }
  };

  return (
    <>
      <div className="tw:space-y-4 tw:mb-4">
        {/* Search and Manage Brand Button Row */}
        <div className="tw:flex tw:gap-4 tw:items-center">
          <div className="tw:flex-1">
            <AppInput
              type="text"
              placeholder={t("searchByName")}
              name="search"
              register={register}
              onChange={handleSearch}
              size="sm"
              leftIcon={<Search className="tw:text-gray-500" size={16} />}
            />
          </div>
          <AppButton
            fill="outline"
            color="primary"
            size="small"
            onClick={() => setShowManageBrandModal(true)}
            className="tw:flex-shrink-0"
          >
            <Settings className="tw:w-4 tw:h-4" />
            <span className="tw:hidden tw:md:inline-block">Manage Brands</span>
          </AppButton>
        </div>

        {/* Alpha filter */}
        <Alpha selected={alpha || ""} callback={handleAlphaChange} />
      </div>

      {/* Manage Brand Modal */}
      <ManageVendorBrandModal
        vendorId={vendorId}
        show={showManageBrandModal}
        callback={handleManageBrandModal}
      />
    </>
  );
};

export default Filter;
