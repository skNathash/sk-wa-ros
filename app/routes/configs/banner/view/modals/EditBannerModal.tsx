import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { startOfDay, endOfDay, addYears } from "date-fns";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppSelect from "~/components/core/form/AppSelect";
import { AppInput } from "~/components/core/form/AppInput";
import AppCard from "~/components/core/card/AppCard";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import BannerService from "~/services/BannerService";
import Redirection from "~/shared/banners/redirection/Redirection";
import { Calendar, Navigation } from "lucide-react";

type Props = {
  show: boolean;
  callback: (result: { action: string; data: any }) => void;
  bannerId: string;
  initialData?: {
    validityFrom?: string | Date | null;
    validityTo?: string | Date | null;
    priority?: number;
    type?: string;
    placeholderId?: string;
    bannerType?: string;
    redirectionType?: string;
    brands?: any[];
    categories?: any[];
    products?: any[];
    menus?: any[];
    keywords?: string;
  };
};

type FormData = {
  validityFrom: Date | undefined;
  validityTo: Date | undefined;
  priority: string;
  type: string;
  placeholderId: string;
  redirectionType: string;
  brands: any[];
  categories: any[];
  products: any[];
  menus: any[];
  keywords: string;
};

const typeOptions = [
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
];

const EditBannerModal = ({ show, callback, bannerId, initialData }: Props) => {
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderOptions, setPlaceholderOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const methods = useForm<FormData>({
    defaultValues: {
      validityFrom: undefined,
      validityTo: undefined,
      priority: "",
      type: "",
      placeholderId: "",
      redirectionType: "",
      brands: [],
      categories: [],
      products: [],
      menus: [],
      keywords: "",
    },
  });

  const {
    control,
    register,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  const [validityFrom, watchedType] = useWatch({
    control,
    name: ["validityFrom", "type"],
  });

  const fetchPlaceholders = useCallback(
    async (type: string) => {
      try {
        const params: Record<string, any> = {
          filter: { isActive: true },
        };
        if (type !== "BOTH") {
          params.filter.type = type;
        }
        const res = await BannerService.getPlaceholderConfigs(params);
        const options = (res?.data?.data || []).map((item: any) => ({
          label: item.name,
          value: item._id,
        }));
        setPlaceholderOptions(options);
        // Clear selection if current placeholder doesn't belong to the new type
        const current = getValues("placeholderId");
        if (current && !options.some((o: any) => o.value === current)) {
          setValue("placeholderId", "");
        }
      } catch {
        setPlaceholderOptions([]);
      }
    },
    [getValues, setValue],
  );

  useEffect(() => {
    if (show && watchedType) {
      fetchPlaceholders(watchedType);
    } else {
      setPlaceholderOptions([]);
    }
  }, [show, watchedType, fetchPlaceholders]);

  useEffect(() => {
    if (show && initialData) {
      reset({
        validityFrom: initialData.validityFrom
          ? new Date(initialData.validityFrom)
          : undefined,
        validityTo: initialData.validityTo
          ? new Date(initialData.validityTo)
          : undefined,
        priority:
          initialData.priority != null ? String(initialData.priority) : "",
        type: initialData.type || "",
        placeholderId: initialData.placeholderId || "",
        redirectionType: initialData.redirectionType || "",
        brands: initialData.brands || [],
        categories: initialData.categories || [],
        products: initialData.products || [],
        menus: initialData.menus || [],
        keywords: initialData.keywords || "",
      });
    }
  }, [show, initialData, reset]);

  // Reset end date when start date changes and end date is before start date
  useEffect(() => {
    if (validityFrom) {
      const currentEnd = getValues("validityTo");
      if (currentEnd && new Date(currentEnd) < new Date(validityFrom)) {
        setValue("validityTo", undefined);
      }
    }
  }, [validityFrom, getValues, setValue]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDateConfig = useMemo(
    () => ({
      disabled: { before: today },
      startMonth: today,
      endMonth: addYears(today, 2),
    }),
    [],
  );

  const endDateConfig = useMemo(() => {
    const minDate = validityFrom ? new Date(validityFrom) : today;
    return {
      disabled: { before: minDate },
      startMonth: minDate,
      endMonth: addYears(today, 2),
      defaultMonth: minDate,
    };
  }, [validityFrom]);

  const handleSubmit = async () => {
    const data = getValues();

    if (!data.validityFrom) {
      toast.show({ msg: "Start date is required", color: "error" });
      return;
    }
    if (!data.validityTo) {
      toast.show({ msg: "End date is required", color: "error" });
      return;
    }
    if (!data.priority && data.priority !== "0") {
      toast.show({ msg: "Priority is required", color: "error" });
      return;
    }

    const priorityNum = Number(data.priority);
    if (isNaN(priorityNum) || priorityNum < 0) {
      toast.show({
        msg: "Priority must be a valid number (0 or above)",
        color: "error",
      });
      return;
    }

    if (!data.type) {
      toast.show({ msg: "Platform type is required", color: "error" });
      return;
    }

    if (!data.placeholderId) {
      toast.show({ msg: "Placeholder is required", color: "error" });
      return;
    }

    if (!data.redirectionType) {
      toast.show({ msg: "Redirection type is required", color: "error" });
      return;
    }

    if (data.redirectionType === "brand" && !data.brands?.length) {
      toast.show({ msg: "Please select at least one brand", color: "error" });
      return;
    }

    if (data.redirectionType === "category" && !data.categories?.length) {
      toast.show({
        msg: "Please select at least one category",
        color: "error",
      });
      return;
    }

    if (data.redirectionType === "product" && !data.products?.length) {
      toast.show({
        msg: "Please select at least one product",
        color: "error",
      });
      return;
    }

    if (data.redirectionType === "brand_category") {
      if (!data.brands?.length) {
        toast.show({ msg: "Please select at least one brand", color: "error" });
        return;
      }
      if (!data.categories?.length) {
        toast.show({
          msg: "Please select at least one category",
          color: "error",
        });
        return;
      }
    }

    if (data.redirectionType === "keywords" && !data.keywords?.trim()) {
      toast.show({ msg: "Keywords are required", color: "error" });
      return;
    }

    if (data.redirectionType === "menu" && !data.menus?.length) {
      toast.show({ msg: "Please select at least one menu", color: "error" });
      return;
    }

    try {
      setIsSubmitting(true);

      const redirectionTypeToBannerType: Record<string, string> = {
        no_action: "NoAction",
        brand: "Brand",
        category: "Category",
        product: "Product",
        brand_category: "BrandCategory",
        keywords: "Keywords",
        menu: "Menu",
      };

      const payload: Record<string, any> = {
        validFrom: startOfDay(new Date(data.validityFrom)).toISOString(),
        validTo: endOfDay(new Date(data.validityTo)).toISOString(),
        priority: priorityNum,
        type: data.type,
        placeholderId: data.placeholderId,
      };

      payload.bannerType =
        redirectionTypeToBannerType[data.redirectionType] || "NoAction";

      const condition: Record<string, any> = {};
      if (data.brands?.length) {
        condition.brands = data.brands.map((b: any) => ({
          id: b.value?.id || b.value?._id || "",
          brandId: b.value?.brandId || "",
          name: b.label || b.value?.name || "",
        }));
      }
      if (data.categories?.length) {
        condition.categories = data.categories.map((c: any) => ({
          id: c.value?.id || c.value?._id || "",
          name: c.label || c.value?.name || "",
        }));
      }
      if (data.products?.length) {
        condition.deals = data.products.map((p: any) => ({
          id: p.value?.id || p.value?._id || "",
          name: p.label || p.value?.name || "",
        }));
      }
      if (data.menus?.length) {
        condition.menus = data.menus.map((m: any) => ({
          id: m.value?.id || m.value?._id || "",
          name: m.label || m.value?.name || "",
        }));
      }
      if (data.keywords?.trim()) {
        condition.keyword = data.keywords.trim();
      }
      if (Object.keys(condition).length) {
        payload.bannerForCondition = condition;
      }

      const res = await BannerService.update(bannerId, payload);
      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        toast.show({ msg: "Banner updated successfully", color: "success" });
        callback({ action: "success", data: payload });
      } else {
        toast.show({
          msg: res?.data?.message || "Something went wrong",
          color: "error",
        });
      }
    } catch {
      toast.show({ msg: "Something went wrong", color: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 0) {
      setValue("priority", value);
    }
  };

  return (
    <>
      <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
        <AppModal.Title onClose={handleClose}>
          <h3 className="tw:text-base tw:font-semibold">Edit Banner</h3>
        </AppModal.Title>

        <AppModal.Content className="tw:h-[90vh]">
          <FormProvider {...methods}>
            <div className="tw:space-y-4 tw:mt-2">
              <AppCard
                title="Platform, Validity & Priority"
                icon={<Calendar size={16} />}
                noShadow
                bordered
              >
                <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <AppSelect
                        label="Platform Type"
                        options={typeOptions}
                        value={field.value}
                        onChange={(value: string) => field.onChange(value)}
                        placeholder="Select platform"
                        isRequired={true}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="placeholderId"
                    render={({ field }) => (
                      <AppSelect
                        label="Placeholder"
                        options={placeholderOptions}
                        value={field.value}
                        onChange={(value: string) => field.onChange(value)}
                        placeholder="Select placeholder"
                        isRequired={true}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="validityFrom"
                    render={({ field }) => (
                      <AppDateInput
                        label="Start Date"
                        value={field.value ?? undefined}
                        callback={(dt: any) => field.onChange(dt)}
                        isRequired={true}
                        dateConfig={startDateConfig}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="validityTo"
                    render={({ field }) => (
                      <AppDateInput
                        label="End Date"
                        value={field.value ?? undefined}
                        callback={(dt: any) => field.onChange(dt)}
                        isRequired={true}
                        dateConfig={endDateConfig}
                      />
                    )}
                  />

                  <AppInput
                    name="priority"
                    label="Display Priority"
                    placeholder="e.g. 1 (lower = first)"
                    type="number"
                    min={0}
                    register={register}
                    error={errors.priority?.message}
                    isRequired={true}
                    onChange={handlePriorityChange}
                  />
                </div>
              </AppCard>

              <AppCard
                title="Redirection Config"
                icon={<Navigation size={16} />}
                noShadow
                bordered
              >
                <Redirection />
              </AppCard>
            </div>
          </FormProvider>
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full">
            <AppButton fill="outline" color="secondary" onClick={handleClose}>
              Cancel
            </AppButton>
            <AppButton
              color="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Update
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      <BusyLoader show={isSubmitting} />
    </>
  );
};

export default EditBannerModal;
