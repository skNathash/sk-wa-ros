import { useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";

const Overall = () => {
  const { register } = useFormContext();

  return (
    <div>
      <AppInput
        label="New Stock Quantity"
        name="newStockQuantity"
        register={register}
        className="tw:mb-4"
        isRequired
      />
      <AppTextarea
        label="Reason for Adjustment"
        name="reason"
        register={register}
        className="tw:mb-4"
        placeholder="Explain the reason for the adjustment"
      />
    </div>
  );
};

export default Overall;
