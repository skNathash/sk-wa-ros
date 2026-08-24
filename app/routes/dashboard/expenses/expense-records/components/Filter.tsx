import { debounce } from "lodash";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";

type FormData = {
  search?: string;
};

type FilterProps = {
  callback: (payload: { formData: FormData }) => void;
};

const Filter = ({ callback }: FilterProps) => {
  const { register, getValues } = useForm<FormData>({
    defaultValues: {
      search: "",
    },
  });

  // Trigger callback with current form values
  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 300),
    [triggerCallback]
  );

  return (
    <div className="tw:mb-3">
      <AppInput
        name="search"
        register={register}
        placeholder="Search by Title"
        onChange={debouncedSearch}
      />
    </div>
  );
};

export default Filter;
