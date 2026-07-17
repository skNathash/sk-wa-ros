import { AppInput } from "~/components/core/form";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";
import Alpha from "~/components/core/alpha/Alpha";

type Props = {
  callback: (args: { action: string; data?: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { register, getValues, control, setValue } = useFormContext();

  const [selectedAlpha] = useWatch({
    control,
    name: ["alpha"],
  });

  const debounceSearch = useDebouncedCallback(() => {
    callback({ action: "search", data: getValues() });
  }, 500);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    callback({ action: "alpha", data: getValues() });
  };

  return (
    <>
      <div className="tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:flex-1">
            <AppInput
              name="search"
              register={register}
              onChange={(e) => debounceSearch()}
              placeholder="Search by name/ID"
              className="tw:w-full"
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Alpha
          selected={selectedAlpha || ""}
          callback={handleAlphaChange}
          className="tw:my-2"
        />
      </div>
    </>
  );
};

export default Filter;
