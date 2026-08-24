import { debounce } from "lodash";
import { FileDown, MessageCircle, Search } from "lucide-react";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AccountService from "~/services/AccountService";
import { defaultFilter, type FilterFormData } from "../helper";

type Props = {
  callback: (a: { formData: FilterFormData }) => void;
  /** Total entry count shown on the "All entries" chip. */
  totalCount?: number;
  onDownload?: () => void;
  onSendWhatsApp?: () => void;
};

const sourceTypeChips = [
  { label: "All entries", value: "All" },
  ...AccountService.getSourceTypeOptions(),
];

const Filter = ({
  callback,
  totalCount = 0,
  onDownload,
  onSendWhatsApp,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue, control, watch } =
    useForm<FilterFormData>({
      defaultValues: defaultFilter,
    });

  const activeSourceType = watch("sourceType") || "All";

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleDateChange = (value: Date | Date[]) => {
    const range = Array.isArray(value) ? value : [value];
    setValue("dateRange", range);
    callback({ formData: { ...getValues(), dateRange: range } });
  };

  const handleSourceTypeChip = (value: string) => {
    setValue("sourceType", value);
    callback({ formData: { ...getValues(), sourceType: value } });
  };

  return (
    <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-center">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          placeholder="Search by reference ID"
          leftIcon={<Search size={16} />}
          className="tw:flex-1"
        />

        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <div className="tw:min-w-0 tw:flex-1 tw:md:w-48 tw:md:flex-none">
            <Controller
              control={control}
              name="dateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={handleDateChange}
                  value={field.value}
                  dateConfig={dateConfig}
                  placeholder="Date range"
                />
              )}
            />
          </div>

          {onDownload ? (
            <AppButton
              size="small"
              color="light"
              fill="outline"
              onClick={onDownload}
              className="tw:shrink-0"
            >
              <FileDown className="tw:size-4" />
              <span className="tw:hidden tw:sm:inline">
                {t("downloadPdf", { defaultValue: "Download PDF" })}
              </span>
            </AppButton>
          ) : null}

          {onSendWhatsApp ? (
            <AppButton
              size="small"
              color="primary"
              onClick={onSendWhatsApp}
              className="tw:shrink-0"
            >
              <MessageCircle className="tw:size-4" />
              <span className="tw:hidden tw:sm:inline">
                {t("sendOnWhatsApp", { defaultValue: "Send on WhatsApp" })}
              </span>
            </AppButton>
          ) : null}
        </div>
      </div>

      {/* Source-type quick-filter chips */}
      <div className="hide-scrollbar tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto">
        {sourceTypeChips.map((chip) => {
          const isActive = activeSourceType === chip.value;
          const label =
            chip.value === "All" && totalCount > 0
              ? `${chip.label} · ${totalCount}`
              : chip.label;

          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleSourceTypeChip(chip.value)}
              className={`tw:shrink-0 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-colors ${
                isActive
                  ? "tw:border-primary tw:bg-primary tw:text-white"
                  : "tw:border-gray-300 tw:bg-white tw:text-gray-600 tw:hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  showOutsideDays: false,
};

export default Filter;
