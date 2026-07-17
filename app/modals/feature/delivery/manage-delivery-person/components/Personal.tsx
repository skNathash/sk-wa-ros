import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";

const Personal: React.FC = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      {/* Full Name */}
      <AppInput
        name="fullName"
        label="Full Name"
        type="text"
        placeholder="Enter full name"
        register={register}
        rules={{ required: "Full name is required" }}
        error={errors.fullName?.message as string}
        isRequired
      />

      {/* Email */}
      <AppInput
        name="email"
        label="Email"
        type="email"
        placeholder="Enter email address"
        register={register}
        rules={{
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address",
          },
        }}
        error={errors.email?.message as string}
        isRequired
      />

      {/* Phone Number */}
      <AppInput
        name="phoneNumber"
        label="Phone Number"
        type="tel"
        placeholder="Enter phone number"
        register={register}
        rules={{
          required: "Phone number is required",
          pattern: {
            value: /^[0-9]{10}$/,
            message: "Please enter a valid 10-digit phone number",
          },
        }}
        error={errors.phoneNumber?.message as string}
        isRequired
      />

      {/* License Number */}
      <AppInput
        name="licenseNo"
        label="License Number"
        type="text"
        placeholder="Enter license number"
        register={register}
        rules={{ required: "License number is required" }}
        error={errors.licenseNo?.message as string}
        isRequired
      />

      {/* Status Dropdown */}
      <Controller
        name="status"
        control={control}
        rules={{ required: "Status is required" }}
        render={({ field }) => (
          <AppSelect
            label="Status"
            options={statusOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.status?.message as string}
            isRequired
            placeholder="Select status"
          />
        )}
      />
    </div>
  );
};

export default Personal;
