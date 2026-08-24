import clsx from "clsx";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";

import { FilterIcon, SearchIcon } from "lucide-react";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import OrderFilterModal from "~/shared/orders/modals/order-filter/OrderFilterModal";
import {
  defaultFilter,
  prepareFilterQueryParams,
  type FilterFormData,
} from "../helper";

interface FilterProps {
  /**
   * Render the search field. Off where the page's top bar already carries the
   * search — only the filter button is left, to sit alongside it.
   */
  showSearch?: boolean;
  className?: string;
}

const Filter = ({ showSearch = true, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const [searchParams, setSearchParams] = useSearchParams();

  const { register, getValues, setValue } = useFormContext();

  const [filterModal, setFilterModal] = useState({
    show: false,
    data: {},
  });

  const handleFilterChange = () => {
    const formData = getValues();
    const currentTab = searchParams.get("tab");
    const params = prepareFilterQueryParams(
      formData as FilterFormData,
      currentTab,
    );
    setSearchParams(params);
  };

  // `useDebouncedCallback` keeps the latest callback internally, so the fire
  // always uses the current `handleFilterChange` (and its live `searchParams`)
  // instead of the first render's frozen closure.
  const debounceSearch = useDebouncedCallback(() => {
    handleFilterChange();
  }, 500);

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const hidePaymentStatus =
    (searchParams.get("tab") || "") === "payment-approval";

  const handleFilterModalCallback = useCallback(
    (data: any) => {
      setFilterModal({ show: false, data: defaultFilter });
      if (data.action === "apply") {
        setValue("dateRange", data.data.dateRange);
        setValue("status", data.data.status);
        setValue("paymentMethod", data.data.paymentMethod);
        setValue(
          "paymentStatus",
          data.data.paymentStatus || defaultFilter.paymentStatus,
        );
        setValue(
          "orderSubType",
          data.data.orderSubType || defaultFilter.orderSubType,
        );
        handleFilterChange();
      }
    },
    [handleFilterChange],
  );

  return (
    <>
      <div
        className={clsx(
          "tw:flex tw:items-center tw:gap-2",
          className ?? "tw:mb-4",
        )}
      >
        {showSearch && (
          <div className="tw:flex-1">
            <AppInput
              name="search"
              register={register}
              onChange={debounceSearch}
              placeholder={t("searchIdNameProduct")}
              className="tw:bg-white"
              leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
              inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
            />
          </div>
        )}

        <div>
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={openFilterModal}
          >
            <FilterIcon size={16} />
          </AppButton>
        </div>
      </div>

      <OrderFilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        data={filterModal.data}
        hidePaymentStatus={hidePaymentStatus}
      />
    </>
  );
};

export default Filter;
