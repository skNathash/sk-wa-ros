import { useFormContext } from "react-hook-form";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { defaultFormFilter } from "../helper";

const filterMapping: Record<string, AppliedFilterLabel> = {
  menu: {
    label: "Menu",
    resetValue: defaultFormFilter.menu,
    value: {
      isMulti: true,
      path: "label",
    },
  },
  category: {
    label: "Category",
    resetValue: defaultFormFilter.categories,
    value: {
      isMulti: true,
      path: "label",
    },
  },
  brand: {
    label: "Brand",
    resetValue: defaultFormFilter.brands,
    value: {
      isMulti: true,
      path: "label",
    },
  },
  companyName: {
    label: "Company Name",
    resetValue: defaultFormFilter.companyName,
    value: {
      isMulti: true,
      path: "label",
    },
  },
  alpha: {
    label: "Alpha",
    resetValue: defaultFormFilter.alpha,
    ignoreValue: "",
  },
  search: {
    label: "Search",
    resetValue: defaultFormFilter.search,
    ignoreValue: "",
  },
  withoutStock: {
    label: "Without Stock",
    resetValue: defaultFormFilter.withoutStock,
    ignoreValue: false,
  },
  status: {
    label: "Status",
    resetValue: defaultFormFilter.status,
    ignoreValue: "All",
  },
  velocity: {
    label: "Velocity",
    resetValue: defaultFormFilter.velocity,
    ignoreValue: "All",
  },
  stockStatus: {
    label: "Stock Status",
    resetValue: defaultFormFilter.stockStatus,
    ignoreValue: "All",
  },
};

const AppliedFilters = ({
  callback,
}: {
  callback: (result: { action: string; data?: any }) => void;
}) => {
  const { getValues, setValue } = useFormContext();

  const formData = getValues();

  const handleFilterCallback = (result: { action: string; data?: any }) => {
    if (result.action === "remove" && result.data) {
      const { key, config } = result.data;
      setValue(key, config.resetValue);
      callback({ action: "remove", data: { key, config } });
    }
  };

  return (
    <AppliedFilter
      filter={formData}
      callback={handleFilterCallback}
      mapping={filterMapping}
      className="tw:mb-4"
    />
  );
};

export default AppliedFilters;
