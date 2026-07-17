import React from "react";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

const NomineeDetails: React.FC = () => {
  const { t } = useTranslation(["applyPaylater"]);

  const relationshipOptions = [
    { label: "Father", value: "father" },
    { label: "Mother", value: "mother" },
    { label: "Spouse", value: "spouse" },
    { label: "Brother", value: "brother" },
    { label: "Sister", value: "sister" },
    { label: "Other", value: "other" },
  ];

  const { control, register, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "nominees",
  });

  // Initialize with one nominee if empty (fallback in case defaultValues aren't set)
  React.useEffect(() => {
    if (fields.length === 0) {
      append({ name: "", mobile: "", relationship: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div>
      <div className="tw:mb-4">
        <h3 className="tw:text-lg tw:font-medium">{t("nominee.title")}</h3>
      </div>

      <div className="tw:space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-white"
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
              <h4 className="tw:text-sm tw:font-medium tw:text-gray-700">
                Nominee {index + 1}
              </h4>
              {index > 0 && (
                <AppButton
                  onClick={() => remove(index)}
                  size="small"
                  color="danger"
                  fill="outline"
                  type="button"
                  className="tw:flex-shrink-0"
                >
                  <Trash2 size={14} />
                  Remove
                </AppButton>
              )}
            </div>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
              <AppInput
                label={t("nominee.name")}
                name={`nominees.${index}.name`}
                register={register}
                placeholder={t("nominee.name")}
                size="sm"
                isRequired
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setValue(`nominees.${index}.name`, filtered);
                }}
              />

              <AppInput
                label={t("nominee.mobile")}
                name={`nominees.${index}.mobile`}
                register={register}
                placeholder={t("nominee.mobile")}
                size="sm"
                isRequired
                type="number"
                maxLength={10}
              />

              <Controller
                control={control}
                name={`nominees.${index}.relationship`}
                render={({ field }) => (
                  <AppSelect
                    label={t("nominee.relationship")}
                    options={relationshipOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("nominee.relationship")}
                    inputClassName="tw:w-full"
                    isRequired
                    size="sm"
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="tw:mt-4 tw:flex tw:justify-start">
        <AppButton
          onClick={() => append({ name: "", mobile: "", relationship: "" })}
          size="small"
          color="primary"
          fill="outline"
          type="button"
        >
          <Plus size={14} />
          Add Nominee
        </AppButton>
      </div>
    </div>
  );
};

export default NomineeDetails;
