import React from "react";
import { useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";

const Address: React.FC = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      {/* Street */}
      <AppInput
        name="street"
        label="Street Address"
        type="text"
        placeholder="Enter street address"
        register={register}
        rules={{ required: "Street address is required" }}
        error={errors.street?.message as string}
        isRequired
      />

      {/* Pincode */}
      <AppInput
        name="pincode"
        label="Pincode"
        type="text"
        placeholder="Enter pincode"
        register={register}
        rules={{
          required: "Pincode is required",
          pattern: {
            value: /^[0-9]{6}$/,
            message: "Please enter a valid 6-digit pincode",
          },
        }}
        error={errors.pincode?.message as string}
        isRequired
      />
    </div>
  );
};

export default Address;
