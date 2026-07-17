import {
  CheckCheck,
  ImageIcon,
  Images,
  Info,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import BannerService from "~/services/BannerService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SuccessModal from "./modals/SuccessModal";
import SampleImageModal from "./modals/SampleImageModal";
import Redirection from "./components/redirection/Redirection";
import {
  defaultFormData,
  prepareSlidePayload,
  validateSlideForm,
} from "./helper";
import type { SlideFormData } from "./helper";
import PageAccessService from "~/services/PageAccessService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([
    "BANNER.BANNER-CREATE",
    "BANNER.BANNER-UPDATE",
  ]);
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Banner Config", redirect: { path: "/configs/banner" } },
  { label: "Create Banner" },
];

const typeOptions = [
  // { value: "BOTH", label: "Both" },
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const allowedExtensions = ["jpg", "jpeg", "png"];

const ManageSlide = () => {
  const toast = useAppToast();
  const nav = useAppNav();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderOptions, setPlaceholderOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [placeholderData, setPlaceholderData] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  const formMethods = useForm<SlideFormData>({
    defaultValues: {
      ...defaultFormData,
    },
  });

  const { register, control, setValue, getValues } = formMethods;

  const [image, validityFrom, watchedType, watchedPlaceholderId] = useWatch({
    control,
    name: ["image", "validityFrom", "type", "placeholderId"],
  });

  const selectedPlaceholder = placeholderData.find(
    (item: any) => item._id === watchedPlaceholderId
  );
  const dimensions = selectedPlaceholder?.dimensions;

  const fetchPlaceholders = useCallback(async (type?: string) => {
    try {
      const params: Record<string, any> = {
        filter: { isActive: true },
      };
      if (type && type !== "BOTH") {
        params.filter.type = type;
      }
      const res = await BannerService.getPlaceholderConfigs(params);
      if (res?.data?.data) {
        const options = res.data.data.map((item: any) => ({
          label: item.name,
          value: item._id,
        }));
        setPlaceholderOptions(options);
        setPlaceholderData(res.data.data);
      }
    } catch {
      setPlaceholderOptions([]);
      setPlaceholderData([]);
    }
  }, []);

  useEffect(() => {
    if (watchedType) {
      fetchPlaceholders(watchedType);
    } else {
      setPlaceholderOptions([]);
    }
  }, [watchedType, fetchPlaceholders]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDateConfig = {
    disabled: { before: today },
  };

  const endDateConfig = {
    disabled: {
      before: validityFrom
        ? new Date(Array.isArray(validityFrom) ? validityFrom[0] : validityFrom)
        : today,
    },
  };

  const handleImageUpload = (res: any) => {
    setValue("image", { id: res._id });
  };

  const handleImageRemove = () => {
    setValue("image", null);
  };

  const onSubmit = async () => {
    const data = getValues();
    const validation = validateSlideForm(data);
    if (!validation.status) {
      toast.show({ msg: validation.msg, color: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = prepareSlidePayload(data);
      const response = await BannerService.create(payload);

      if (
        response &&
        (response.statusCode === 200 || response.statusCode === 201)
      ) {
        const bannerId = response.data?.data?._id;
        if (bannerId) {
          setTimeout(async () => {
            try {
              await BannerService.submit(bannerId);
            } catch (err) {
              console.error("Failed to submit banner for review", err);
            }
          }, 1000);
        }
        setShowSuccessModal(true);
      } else {
        toast.show({
          msg: response?.data?.message || "Something went wrong",
          color: "error",
        });
      }
    } catch (err) {
      console.error(err);
      toast.show({ msg: "Something went wrong", color: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title="Create Banner" />

      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {/* Info Block */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-600 tw:mb-4">
            <Info size={14} className="tw:text-slate-400 tw:shrink-0" />
            <span>
              Banner goes live on Club &amp; ROS after approval, for the
              platform and dates you set below.
            </span>
          </div>

          <FormProvider {...formMethods}>
            <div className="tw:space-y-4">
              {/* Section 1: Basic Information */}
              <AppCard>
                <div className="tw:mb-4">
                  <h3 className="tw:text-sm tw:font-semibold tw:text-slate-800">
                    Basics
                  </h3>
                  <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                    Name it, pick where it shows, set display order.
                  </p>
                </div>
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4">
                  <AppInput
                    name="title"
                    label="Title"
                    placeholder="e.g. Summer Sale Banner"
                    register={register}
                    isRequired={true}
                    autoComplete="on"
                  />

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

                  <AppInput
                    name="sliderPriority"
                    label="Display Priority"
                    placeholder="e.g. 1 (lower = first)"
                    register={register}
                    type="number"
                    min={0}
                    isRequired={true}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (e.target.value !== "" && num < 0) {
                        e.target.value = "0";
                        setValue("sliderPriority", 0);
                      }
                    }}
                  />
                </div>
              </AppCard>

              {/* Section 2: Banner Image */}
              <AppCard>
                <div className="tw:flex tw:flex-col tw:gap-2 tw:mb-4 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
                  <div className="tw:min-w-0">
                    <h3 className="tw:text-sm tw:font-semibold tw:text-slate-800">
                      Banner Image
                      <span className="tw:text-xs tw:text-red-500">*</span>
                    </h3>
                    <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                      Upload the image shown in the carousel.
                    </p>
                  </div>
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                    <span className="tw:inline-flex tw:items-center tw:rounded-md tw:bg-slate-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-slate-600">
                      JPG · PNG
                    </span>
                    {dimensions && (
                      <span className="tw:inline-flex tw:items-center tw:rounded-md tw:bg-slate-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-slate-600 tw:tabular-nums">
                        {dimensions.width} × {dimensions.height} px
                      </span>
                    )}
                    <span className="tw:inline-flex tw:items-center tw:rounded-md tw:bg-slate-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-slate-600 tw:tabular-nums">
                      Max {dimensions?.maxFileSize || 10} MB
                    </span>
                  </div>
                </div>

                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:items-start">
                  {/* Upload controls */}
                  <div className="tw:flex tw:flex-col">
                    <FileUpload
                      label="Upload Image"
                      onFileUpload={handleImageUpload}
                      maxSizeMB={dimensions?.maxFileSize || 10}
                      allowedExtensions={allowedExtensions}
                    >
                      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:text-center tw:border tw:border-dashed tw:border-slate-300 tw:rounded-lg tw:px-4 tw:py-5 tw:bg-slate-50/60 tw:hover:border-blue-400 tw:hover:bg-blue-50/40 tw:transition-colors">
                        <UploadCloud size={22} className="tw:text-blue-500" />
                        <span className="tw:text-sm tw:font-medium tw:text-slate-700">
                          Upload image
                        </span>
                        <span className="tw:text-xs tw:text-slate-400">
                          Click to browse
                        </span>
                      </div>
                    </FileUpload>

                    <button
                      type="button"
                      onClick={() => setShowSampleModal(true)}
                      className="tw:mt-2.5 tw:inline-flex tw:items-center tw:gap-1.5 tw:self-start tw:text-xs tw:font-medium tw:text-blue-600 tw:hover:text-blue-700 tw:hover:underline"
                    >
                      <Images size={14} />
                      View sample banners
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:min-h-[140px] tw:rounded-lg tw:border tw:border-slate-200 tw:bg-slate-50 tw:overflow-hidden">
                    {image ? (
                      <>
                        <ImgRender
                          assetId={image.id}
                          width={dimensions?.width || 300}
                          height={dimensions?.height || 150}
                          alt="Banner preview"
                          className="tw:max-h-[200px] tw:max-w-full tw:w-auto tw:object-contain"
                        />
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="tw:absolute tw:top-2 tw:right-2 tw:bg-red-500 tw:text-white tw:rounded-full tw:p-1.5 tw:shadow-md tw:hover:bg-red-600 tw:transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="tw:flex tw:flex-col tw:items-center tw:gap-1.5 tw:text-slate-300">
                        <ImageIcon size={26} />
                        <span className="tw:text-xs tw:text-slate-400">
                          Preview appears here
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </AppCard>

              {/* Section 3: Click Redirection */}
              <AppCard>
                <div className="tw:mb-4">
                  <h3 className="tw:text-sm tw:font-semibold tw:text-slate-800">
                    Click Action
                  </h3>
                  <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                    Where should the user go when they tap this banner?
                  </p>
                </div>
                <Redirection />
              </AppCard>

              {/* Section 4: Validity & Status */}
              <AppCard>
                <div className="tw:mb-4">
                  <h3 className="tw:text-sm tw:font-semibold tw:text-slate-800">
                    Validity & Status
                  </h3>
                  <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                    Pick the date range. Only Active banners in range show up.
                  </p>
                </div>
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
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

                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <AppSelect
                        label="Status"
                        options={statusOptions}
                        value={field.value}
                        onChange={(value: string) => field.onChange(value)}
                        placeholder="Select status"
                        isRequired={true}
                      />
                    )}
                  />
                </div>
              </AppCard>
            </div>

            {/* Action Buttons */}
            <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4">
              <AppButton
                fill="outline"
                color="secondary"
                onClick={() => window.history.back()}
              >
                Cancel
              </AppButton>

              <AppButton
                color="primary"
                onClick={onSubmit}
                isLoading={isSubmitting}
              >
                <CheckCheck />
                Save
              </AppButton>
            </div>
          </FormProvider>
        </div>
      </div>

      <BusyLoader show={isSubmitting} />

      <SampleImageModal
        show={showSampleModal}
        onClose={() => setShowSampleModal(false)}
      />

      <SuccessModal
        show={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          nav.replace("/configs/banner");
        }}
      />
    </>
  );
};

export default ManageSlide;
