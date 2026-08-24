import clsx from "clsx";
import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";

interface FilterProps {
  /** Fired whenever a filter changes; carries the whole form. */
  callback: (payload: { formData: any }) => void;
  className?: string;
}

/**
 * Filter block of the trend picker — the SKU search box.
 *
 * The component is form-context driven — the host wraps it in a `FormProvider`
 * and owns the fetching; every change here is written to the form and handed
 * back through `callback`.
 */
const Filter = ({ callback, className = "" }: FilterProps) => {
  const { register, getValues } = useFormContext();

  // The debounced function is created once, so it must not close over the
  // current `callback` — the ref keeps it pointing at the latest host handler.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncedSearch = useCallback(
    debounce(() => callbackRef.current?.({ formData: getValues() }), 500),
    [getValues],
  );

  // A pending keystroke must not fire after the block is gone.
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  return (
    <div className={clsx("tw:flex tw:flex-col", className)}>
      <AppInput
        name="search"
        register={register}
        onChange={debouncedSearch}
        size="sm"
        placeholder="Search SKU · brand · category"
        leftIcon={<Search size={16} className="tw:text-slate-400" />}
      />
    </div>
  );
};

export default Filter;
