import { sub } from "date-fns";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import SalesEmployeeSearchInput from "~/components/feature/search-input/sales-employee/SalesEmployeeSearchInput";
import AuthService from "~/services/AuthService";
import UserService from "~/services/UserService";

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: 2,
};

const orderTypeOptions = [
  { value: "b2b", label: "B2B Orders" },
  { value: "b2c", label: "B2C Orders" },
];

const Filter = ({ callback }: { callback: () => void }) => {
  const { register, control } = useFormContext();
  const [hasSalesEmployees, setHasSalesEmployees] = useState(false);

  const isSalesEmployee = AuthService.isSalesEmployeeLoggedIn();

  useEffect(() => {
    if (isSalesEmployee) return;
    UserService.getUserList({
      page: 1,
      limit: 1,
      filter: { position: "Sales Employee" },
    })
      .then((res: any) => {
        const total = res?.data?.pagination?.total || 0;
        setHasSalesEmployees(total > 0);
      })
      .catch(() => setHasSalesEmployees(false));
  }, [isSalesEmployee]);

  const showSalesEmployeeFilter = !isSalesEmployee && hasSalesEmployees;

  const debounceSearch = useCallback(
    debounce(() => {
      callback();
    }, 500),
    [callback],
  );

  const handleDateChange = (onChange: any) => (value: any) => {
    onChange(value);
    callback();
  };

  return (
    <AppCard noPadding>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:p-3 tw:gap-2">
        {/* <AppInput
          name="search"
          placeholder="Search by Order ID, Customer Name, Product"
          size="sm"
          className="tw:w-full"
          onChange={() => debounceSearch()}
          register={register}
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        /> */}

        {/* date range */}
        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={handleDateChange(field.onChange)}
              value={field.value}
              dateConfig={dateConfig}
              size="sm"
              placeholder="Select date range"
              hideClose={true}
            />
          )}
        />

        {showSalesEmployeeFilter && (
          <Controller
            control={control}
            name="salesEmployee"
            render={({ field }) => (
              <SalesEmployeeSearchInput
                size="sm"
                placeholder="Select sales employee"
                values={field.value ? [field.value] : []}
                callback={(item, action) => {
                  field.onChange(action === "add" ? item : null);
                  callback();
                }}
              />
            )}
          />
        )}
      </div>
    </AppCard>
  );
};

export default Filter;
