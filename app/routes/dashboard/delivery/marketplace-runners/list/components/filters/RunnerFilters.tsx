import { Search, SlidersHorizontal, Store, UserRoundPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import { AppInput, AppSelect, AppSwitch } from "~/components/core/form";
import { useDebouncedCallback } from "use-debounce";
import {
  DEFAULT_FILTER,
  SORT_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type RunnerFilter,
  type RunnerSort,
} from "../../helper";

interface RunnerFiltersProps {
  /** Runners loaded so far, shown as the badge beside the heading. */
  count: number;
  /** Fired on every filter or sort change; the page reloads page one. */
  callback: (payload: { filter: RunnerFilter; sort: RunnerSort }) => void;
}

/**
 * Marketplace toolbar — the heading with its live count, the sort picker and
 * a "More filters" drawer holding the vehicle and idle-only controls.
 * The form is the single source of truth; every change hands the whole filter
 * and sort back to the page.
 */
export default function RunnerFilters({ count, callback }: RunnerFiltersProps) {
  const appNav = useAppNav();

  const [showMore, setShowMore] = useState(false);
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0].value);

  const { register, control, getValues } = useForm<RunnerFilter>({
    defaultValues: DEFAULT_FILTER,
  });

  const emit = useCallback(
    (nextSortValue: string) => {
      const sort =
        SORT_OPTIONS.find((option) => option.value === nextSortValue) ||
        SORT_OPTIONS[0];

      callback({ filter: getValues(), sort: sort.sort });
    },
    [callback, getValues],
  );

  const handleSearchChange = useDebouncedCallback(() => emit(sortValue), 500);

  const handleSortChange = useCallback(
    (value: string) => {
      setSortValue(value);
      emit(value);
    },
    [emit],
  );

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
        <h2 className="tw:flex tw:items-center tw:gap-2 tw:text-lg tw:font-bold tw:text-slate-900">
          <Store size={18} className="tw:text-emerald-600" />
          Available runners
          <span className="tw:rounded-full tw:bg-slate-100 tw:px-2 tw:py-0.5 tw:text-xs tw:font-bold tw:tabular-nums tw:text-slate-600">
            {count}
          </span>
        </h2>

        <div className="tw:flex tw:items-center tw:gap-2">
          <AppSelect
            size="sm"
            value={sortValue}
            options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
            onChange={handleSortChange}
            className="tw:w-44"
          />

          <AppButton
            size="small"
            fill="clear"
            color="primary"
            onClick={() => setShowMore((prev) => !prev)}
          >
            <SlidersHorizontal size={14} />
            More filters
          </AppButton>

          <AppButton
            size="small"
            onClick={() =>
              appNav.to("/dashboard/delivery/marketplace-runners/register")
            }
          >
            <UserRoundPlus size={14} />
            Register runner
          </AppButton>
        </div>
      </div>

      {showMore && (
        <div className="tw:mt-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:lg:items-end">
          <AppInput
            name="search"
            register={register}
            placeholder="Search runner · vehicle"
            leftIcon={<Search size={16} />}
            onChange={handleSearchChange}
          />

          <Controller
            name="vehicleType"
            control={control}
            render={({ field }) => (
              <AppSelect
                options={VEHICLE_TYPE_OPTIONS}
                value={field.value}
                onChange={(value: string) => {
                  field.onChange(value);
                  emit(sortValue);
                }}
              />
            )}
          />

          <Controller
            name="idle"
            control={control}
            render={({ field }) => (
              <AppSwitch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  emit(sortValue);
                }}
                label="Idle runners only"
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
