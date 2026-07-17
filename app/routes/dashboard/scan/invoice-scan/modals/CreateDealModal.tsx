import { useEffect } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";

interface CreateDealFormData {
  name: string;
  hsn: string;
  barcode: string;
  mrp: number;
  price: number;
  qty: number;
  discount: number;
  tax: number;
}

interface CreateDealModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  initialData?: Partial<CreateDealFormData>;
}

const CreateDealModal = ({
  show,
  callback,
  initialData,
}: CreateDealModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateDealFormData>({
    defaultValues: {
      name: "",
      hsn: "",
      barcode: "",
      mrp: 0,
      price: 0,
      qty: 0,
      discount: 0,
      tax: 0,
    },
  });

  useEffect(() => {
    if (show) {
      reset({
        name: initialData?.name || "",
        hsn: initialData?.hsn || "",
        barcode: initialData?.barcode || "",
        mrp: initialData?.mrp || 0,
        price: initialData?.price || 0,
        qty: initialData?.qty || 0,
        discount: initialData?.discount || 0,
        tax: initialData?.tax || 0,
      });
    }
  }, [show, initialData, reset]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const preventNegative =
    (field: keyof CreateDealFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (val < 0) setValue(field, 0);
    };

  const onSubmit = (data: CreateDealFormData) => {
    callback({ action: "submit", data });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-lg">
      <AppModal.Title onClose={handleClose}>Create Deal</AppModal.Title>
      <AppModal.Content>
        <form
          id="create-deal-form"
          onSubmit={handleSubmit(onSubmit)}
          className="tw:space-y-3"
        >
          <AppInput
            name="name"
            label="Name"
            register={register}
            rules={{ required: "Name is required" }}
            error={errors.name?.message}
            isRequired
          />
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppInput
              name="hsn"
              label="HSN"
              register={register}
              error={errors.hsn?.message}
            />
            <AppInput
              name="barcode"
              label="Barcode"
              register={register}
              error={errors.barcode?.message}
            />
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppInput
              name="mrp"
              label="MRP"
              type="number"
              step="any"
              register={register}
              rules={{ required: "MRP is required" }}
              error={errors.mrp?.message}
              onChange={preventNegative("mrp")}
              isRequired
            />
            <AppInput
              name="price"
              label="Price"
              type="number"
              step="any"
              register={register}
              rules={{ required: "Price is required" }}
              error={errors.price?.message}
              onChange={preventNegative("price")}
              isRequired
            />
          </div>
          <div className="tw:grid tw:grid-cols-3 tw:gap-3">
            <AppInput
              name="qty"
              label="Quantity"
              type="number"
              register={register}
              rules={{ required: "Qty is required" }}
              error={errors.qty?.message}
              onChange={preventNegative("qty")}
              isRequired
            />
            <AppInput
              name="discount"
              label="Discount"
              type="number"
              step="any"
              register={register}
              error={errors.discount?.message}
              onChange={preventNegative("discount")}
            />
            <AppInput
              name="tax"
              label="Tax %"
              type="number"
              step="any"
              register={register}
              error={errors.tax?.message}
              onChange={preventNegative("tax")}
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton size="small" color="light" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            type="submit"
            form="create-deal-form"
          >
            Create
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CreateDealModal;
