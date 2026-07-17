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

const Nominee: React.FC = () => {
  const { control, register, setValue } = useFormContext();
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
    <div className="tw:space-y-3">
      {/* Header */}
      <div className="tw:bg-linear-to-r tw:from-violet-50 tw:to-purple-50 tw:border tw:border-violet-100 tw:rounded-lg tw:px-3 tw:py-2.5 tw:flex tw:items-start tw:gap-2">
        <div className="tw:w-7 tw:h-7 tw:bg-violet-500 tw:text-white tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
          <Users size={14} />
        </div>
        <div className="tw:flex-1">
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:text-xs tw:font-bold tw:text-violet-900">
              Nominee Details
            </div>
            <span className="tw:text-[10px] tw:font-semibold tw:text-violet-700 tw:bg-violet-100 tw:px-1.5 tw:py-0.5 tw:rounded">
              Optional
            </span>
          </div>
          <p className="tw:text-[11px] tw:text-violet-700 tw:mt-0.5">
            Add emergency contacts who vouch for this customer. You may skip this step.
          </p>
        </div>
      </div>

      <div className="tw:space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-white"
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-2.5 tw:pb-2 tw:border-b tw:border-gray-100">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:w-6 tw:h-6 tw:bg-violet-100 tw:text-violet-700 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-[10px] tw:font-bold">
                  {index + 1}
                </div>
                <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
                  Nominee {index + 1}
                </span>
              </div>
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
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setValue(`nominees.${index}.name`, filtered);
                }}
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

      <div>
        <AppButton
          onClick={() => append({ name: "", mobile: "", relationship: "" })}
          size="small"
          color="primary"
          fill="outline"
          type="button"
          className="tw:h-9 tw:w-full tw:justify-center tw:border-dashed"
        >
          <Plus size={14} className="tw:mr-1" />
          Add Another Nominee
        </AppButton>
      </div>
    </div>
  );
};

export default Nominee;
