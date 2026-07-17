import React, { useEffect } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2, Users } from "lucide-react";
import { AppInput, AppSelect } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";

const relationshipOptions = [
  { label: "Father", value: "father" },
  { label: "Mother", value: "mother" },
  { label: "Spouse", value: "spouse" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Other", value: "other" },
];

const NomineeSection: React.FC = () => {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "nominees",
  });

  useEffect(() => {
    if (fields.length === 0) {
      append({ name: "", mobile: "", relationship: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <Users className="tw:text-gray-600" size={16} />
        <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
          Nominee Details
        </span>
        <span className="tw:text-[10px] tw:text-gray-400 tw:font-normal">
          (Optional)
        </span>
      </div>

      <div className="tw:space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-2 tw:bg-white"
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
              <span className="tw:text-[10px] tw:font-medium tw:text-gray-500 uppercase tracking-wider">
                Nominee {index + 1}
              </span>
              {index > 0 && (
                <AppButton
                  onClick={() => remove(index)}
                  size="small"
                  color="danger"
                  fill="outline"
                  type="button"
                  className="tw:h-6 tw:px-2"
                >
                  <Trash2 size={10} />
                  Remove
                </AppButton>
              )}
            </div>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
              <AppInput
                label="Name"
                name={`nominees.${index}.name`}
                register={register}
                placeholder="Nominee name"
                size="sm"
              />
              <AppInput
                label="Mobile"
                name={`nominees.${index}.mobile`}
                register={register}
                placeholder="Mobile number"
                size="sm"
                type="number"
                maxLength={10}
              />
              <Controller
                control={control}
                name={`nominees.${index}.relationship`}
                render={({ field }) => (
                  <AppSelect
                    label="Relationship"
                    options={relationshipOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select relation"
                    inputClassName="tw:w-full"
                    size="sm"
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="tw:mt-2">
        <AppButton
          onClick={() => append({ name: "", mobile: "", relationship: "" })}
          size="small"
          color="primary"
          fill="outline"
          type="button"
          className="tw:h-8"
        >
          <Plus size={12} />
          Add Nominee
        </AppButton>
      </div>
    </div>
  );
};

export default NomineeSection;
