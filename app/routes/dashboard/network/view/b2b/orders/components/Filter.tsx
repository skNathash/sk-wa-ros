import { debounce, orderBy } from "lodash";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import { FilterIcon, SearchIcon } from "lucide-react";
import SellerService from "~/services/SellerService";
import OrderFilterModal from "~/shared/orders/modals/order-filter/OrderFilterModal";

type Props = {
  callback: (a: { formData: any; modalData?: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { register, getValues } = useFormContext();

  const [filterModal, setFilterModal] = useState<{ show: boolean; data: any }>({
    show: false,
    data: {},
  });

  const statuses = getStatuses();

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);
  const handleFilterModalCallback = useCallback(
    (data: any) => {
      setFilterModal({ show: false, data: {} });
      callback({ formData: getValues(), modalData: data });
    },
    [callback, getValues],
  );

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            register={register}
            onChange={handleInput}
            size="sm"
            placeholder="Search ID, Name, Product"
            leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
            inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
          />
        </div>

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
      />
    </>
  );
};

const getStatuses = () => {
  let statuses = orderBy(SellerService.getOrderStatuses(), "value", "asc").map(
    (e) => ({
      label: e.name,
      value: e.value,
    }),
  );
  statuses.unshift({
    label: "All Statuses",
    value: "All",
  });
  return statuses;
};

export default Filter;
