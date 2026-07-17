import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import { Filter as FilterIcon, Search } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import FilterModal from "../modals/FilterModal";

interface Props {
  callback: (args: { action: string; data?: Record<string, any> }) => void;
}

const Filter: React.FC<Props> = ({ callback }) => {
  const { register, getValues, setValue } = useFormContext();
  const [showModal, setShowModal] = useState(false);

  const handleSearchChange = useDebouncedCallback(() => {
    callback({ action: "filter", data: getValues() });
  }, 500);

  const handleModalCallback = (args: { action: string; data: any }) => {
    if (args.action === "apply") {
      // Object.keys(args.data).forEach((key) => {
      //   setValue(key, args.data[key as keyof typeof args.data]);
      // });
      callback({ action: "filter", data: { ...getValues(), ...args.data } });
    }
    setShowModal(false);
  };

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
      <div className="tw:flex-1">
        <AppInput
          name="search"
          placeholder="Search by request, customer"
          register={register}
          onChange={handleSearchChange}
          leftIcon={<Search size={16} />}
          size="sm"
        />
      </div>
      <AppButton
        onClick={() => setShowModal(true)}
        color="light"
        size="small"
        fill="outline"
      >
        <div className="tw:flex tw:items-center tw:gap-1">
          <FilterIcon size={16} />
          Filter
        </div>
      </AppButton>
      <FilterModal
        show={showModal}
        callback={handleModalCallback}
        initialData={getValues()}
      />
    </div>
  );
};

export default Filter;
