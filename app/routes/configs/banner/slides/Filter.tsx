import { Plus } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import { useCallback, useEffect, useState } from "react";
import useAppToast from "~/hooks/useAppToast";
import BannerService from "~/services/BannerService";

type Props = {
  callback: (payload: { formData: any }) => void;
  onAddSlide?: (params: { configId?: string }) => void;
};

const platformTypeOptions = [
  { label: "Both", value: "BOTH" },
  { label: "B2B", value: "B2B" },
  { label: "B2C", value: "B2C" },
];

const Filter = ({ callback, onAddSlide }: Props) => {
  const { control, getValues, watch } = useFormContext();
  const { show } = useAppToast();
  const platformType = watch("platformType");
  const pageLocation = watch("pageLocation");
  const isPageLocationSelected = !!pageLocation && pageLocation !== "All";

  const handleAddSlide = () => {
    if (!isPageLocationSelected) {
      show({ msg: "Please select a page location first", color: "warning" });
      return;
    }
    const config = pageLocationConfigs.find(
      (c: any) => c.placeholderCode === pageLocation,
    );
    onAddSlide?.({ configId: config?._id });
  };
  const [pageLocationConfigs, setPageLocationConfigs] = useState<any[]>([]);
  const [pageLocationOptions, setPageLocationOptions] = useState<
    { label: string; value: string }[]
  >([{ label: "All", value: "All" }]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const params: Record<string, any> = {
          filter: { isActive: true },
        };
        if (platformType && platformType !== "All") {
          params.filter.type = platformType;
        }
        const res = await BannerService.getPlaceholderConfigs(params);
        if (res?.data?.data) {
          const configs = res.data.data || [];
          setPageLocationConfigs(configs);
          const options = configs.map((item: any) => ({
            label: item.name,
            value: item._id,
          }));
          setPageLocationOptions([{ label: "All", value: "All" }, ...options]);
        }
      } catch {
        // fallback to default
      }
    };
    fetchLocations();
  }, [platformType]);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSelectChange = (ch: (v: string) => void) => (val: string) => {
    ch(val);
    triggerCallback();
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4 tw:items-end">
      <Controller
        control={control}
        name="platformType"
        render={({ field }) => (
          <AppSelect
            label="Platform"
            options={platformTypeOptions}
            value={field.value}
            onChange={handleSelectChange(field.onChange)}
            size="sm"
            placeholder="Select platform type"
            inputClassName="tw:w-full"
            className="tw:bg-white"
          />
        )}
      />

      <div className="tw:flex tw:gap-2 tw:items-end tw:col-span-1 tw:md:col-span-2">
        <div className="tw:flex-1">
          <Controller
            control={control}
            name="pageLocation"
            render={({ field }) => (
              <AppSelect
                label="Page Location"
                options={pageLocationOptions}
                value={field.value}
                onChange={handleSelectChange(field.onChange)}
                size="sm"
                placeholder="Select page location"
                inputClassName="tw:w-full"
                className="tw:bg-white"
              />
            )}
          />
        </div>
        <AppButton onClick={handleAddSlide} size="small" color="primary">
          <Plus className="tw:w-4 tw:h-4" />
          Add Slide
        </AppButton>
      </div>
    </div>
  );
};

export default Filter;
