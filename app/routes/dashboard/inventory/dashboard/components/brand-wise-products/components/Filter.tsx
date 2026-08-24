import { AppInput } from "~/components/core/form";
import { useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";
import Alpha from "~/components/core/alpha/Alpha";

type Props = {
  callback: (args?: { action: string; data?: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { register, getValues, setValue, watch } = useFormContext();

  const alphaValue = watch("alpha") || "";

  const debounceSearch = useDebouncedCallback(() => {
    callback({ action: "search", data: getValues() });
  }, 500);

  const handleSearchChange = () => {
    if (getValues("search")?.trim() && getValues("alpha")) {
      setValue("alpha", "");
    }
    debounceSearch();
  };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    const currentSearch = getValues("search");
    if (value && currentSearch) {
      setValue("search", "");
    }
    callback({
      action: "alpha",
      data: { alpha: value, search: value ? "" : currentSearch },
    });
  };

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:items-center tw:gap-2">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            register={register}
            onChange={handleSearchChange}
            placeholder="Search by name/ID"
            className="tw:w-full"
            leftIcon={<Search size={16} />}
          />
        </div>
      </div>
      <Alpha
        selected={alphaValue}
        callback={handleAlphaChange}
        className="tw:mt-2"
      />
    </div>
  );
};

export default Filter;
