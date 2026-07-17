import { debounce } from "lodash";
import { SearchIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";

type Props = {
  retailerId: string;
  callback: (a: { action: string; data?: any }) => void;
};

const Filter = ({ retailerId, callback }: Props) => {
  const { register, getValues, setValue } = useFormContext();

  const [alpha, setAlpha] = useState<string>(getValues().alpha || "");

  const triggerCallback = useCallback(
    (formData: any) => {
      callback({ action: "apply", data: formData });
    },
    [callback],
  );

  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback(getValues());
    }, 500),
    [triggerCallback, getValues],
  );

  const handleSearchChange = () => {
    setValue("alpha", "");
    debouncedSearch();
  };

  const handleAlphaChange = (val: string) => {
    setAlpha(val);
    setValue("search", "");
    triggerCallback({ ...getValues(), alpha: val });
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          onChange={handleSearchChange}
          className="tw:flex-1"
          leftIcon={<SearchIcon size={16} />}
          size="sm"
        />
      </div>

      <Alpha
        selected={alpha}
        callback={handleAlphaChange}
        className="tw:w-full"
      />
    </>
  );
};

export default Filter;
