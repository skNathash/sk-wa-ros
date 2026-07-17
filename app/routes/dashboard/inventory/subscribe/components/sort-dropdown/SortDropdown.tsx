import { AppSelect } from "~/components/core/form";
import InventorySubscribeService from "~/services/InventorySubscribeService";

const sortOptions = InventorySubscribeService.getSortOptions().map(
  (option) => ({
    label: option.label,
    value: option.value,
  })
);

const SortDropdown = ({
  value,
  onChange,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
}) => {
  return (
    <AppSelect
      options={sortOptions}
      value={value}
      onChange={onChange}
      className={className}
      inputClassName={inputClassName}
      size="sm"
    />
  );
};

export default SortDropdown;
