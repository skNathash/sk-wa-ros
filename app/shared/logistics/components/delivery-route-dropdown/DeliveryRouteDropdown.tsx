import { useCallback, useEffect, useState } from "react";
import AppSelect from "~/components/core/form/AppSelect";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";

interface DeliveryRouteDropdownProps {
  size?: "sm" | "lg";
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isRequired?: boolean;
  value?: string | number;
  params?: Record<string, any>;
  includeSelectAllOption?: boolean;
  onChange?: (route: any | null) => void;
}

const DeliveryRouteDropdown = ({
  size = "lg",
  label,
  placeholder,
  className,
  disabled,
  isRequired,
  value,
  params,
  includeSelectAllOption = false,
  onChange,
}: DeliveryRouteDropdownProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const resp: any = await DeliveryRoutesService.getRoutesList(params);
      const list = resp?.data?.data ?? [];
      const mapped = list.map((r: any) => ({
        value: r._id?.toString(),
        label: r.description ?? "",
        actualData: r,
      }));
      if (includeSelectAllOption) {
        mapped.unshift({
          value: "all",
          label: "All",
          actualData: { id: "all", name: "All" },
        });
      }
      setOptions(mapped);
    } catch (e) {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [params, includeSelectAllOption]);

  useEffect(() => {
    void fetchRoutes();
  }, [fetchRoutes]);

  const handleChange = useCallback(
    (val: string) => {
      const item =
        options.find((o) => o.value?.toString() === val)?.actualData ?? null;
      onChange?.(item);
    },
    [options, onChange],
  );

  return (
    <AppSelect
      options={options}
      value={value?.toString() ?? ""}
      onChange={handleChange}
      isRequired={isRequired}
      className={className}
      inputClassName="tw:w-full"
      label={label}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      loading={loading}
    />
  );
};

export default DeliveryRouteDropdown;
