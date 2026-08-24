import { debounce } from "lodash";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Filter as FilterIcon, Search } from "lucide-react";
import { AppInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FilterModal from "../modals/FilterModal";

type FilterProps = {
  callback: (a: { action: string; formData: any }) => void;
};

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, handleSubmit, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      type: "All",
      status: "All",
      dateRange: [],
    },
  });

  const [modalState, setModalState] = useState({
    show: false,
    data: {
      type: "All",
      status: "All",
      dateRange: [],
    },
  });

  const debounceSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = () => {
    callback({ action: "filter", formData: getValues() });
  };

  const handleOpenModal = () => {
    setModalState({
      show: true,
      data: {
        type: getValues("type"),
        status: getValues("status"),
        dateRange: getValues("dateRange"),
      },
    });
  };

  const modalCallback = ({ action, data }: { action: string; data?: any }) => {
    if (action === "apply" && data) {
      setValue("type", data.type);
      setValue("status", data.status);
      setValue("dateRange", data.dateRange);
      triggerCallback();
    }
    setModalState({
      show: false,
      data: { type: "All", status: "All", dateRange: [] },
    });
  };

  return (
    <>
      <AppCard noPadding bodyClassName="tw:p-3" className="tw:mb-4">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <div className="tw:min-w-[180px] tw:flex-1">
            <AppInput
              name="search"
              register={register}
              onChange={debounceSearch}
              placeholder={t("searchByOrderNumber")}
              className="tw:w-full"
              leftIcon={<Search size={16} />}
            />
          </div>
          <AppButton
            fill="outline"
            color="light"
            className="tw:shrink-0"
            onClick={handleOpenModal}
          >
            <FilterIcon size={16} />
          </AppButton>
        </div>
      </AppCard>

      <FilterModal
        show={modalState.show}
        callback={modalCallback}
        data={modalState.data}
      />
    </>
  );
};

export default Filter;
