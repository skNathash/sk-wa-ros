import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import ProductItemForm from "../components/ProductItemForm";
import { validateProduct } from "../helper";

type Props = {
  show: boolean;
  product: any;
  productIndex: number;
  onClose: () => void;
};

const EditProductModal = ({
  show,
  product,
  productIndex,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const toast = useAppToast();
  const { getValues, setError, clearErrors } = useFormContext();

  if (!product || productIndex < 0) return null;

  const fieldPrefix = `products.${productIndex}.formData`;

  // Dismissing (X / backdrop / swipe) is not a submit — it just leaves the row
  // as it stands. Only "Done" claims the row is complete, so only "Done"
  // validates; anything still missing is caught again by Proceed.
  const dismiss = () => {
    clearErrors(fieldPrefix);
    onClose();
  };

  const tryClose = () => {
    const current = getValues(`products.${productIndex}`);
    const label = current?.dealName || t("product");
    const issue = validateProduct(current, label);

    clearErrors(fieldPrefix);

    if (issue) {
      if (issue.field) {
        setError(`${fieldPrefix}.${issue.field}` as any, {
          type: "manual",
          message: issue.message.replace(`${label}: `, ""),
        });
      }
      toast.show({ msg: issue.message, color: "danger" });
      return;
    }

    onClose();
  };

  return (
    <AppModal
      show={show}
      callback={() => dismiss()}
      className="app-drawer-tight tw:w-full tw:sm:max-w-4xl tw:max-h-[90vh]"
      isAutoHeight
    >
      <AppModal.Title onClose={dismiss}>
        <div className="tw:pr-6 tw:min-w-0">
          <div className="tw:text-base tw:font-semibold tw:text-slate-900 tw:line-clamp-2">
            {product.dealName || t("editProduct")}
          </div>
          <div className="tw:text-xs tw:text-slate-500 tw:mt-0.5 tw:break-all">
            {t("ordered")}: {product.quantity || 0}
            {product.dealRefId ? ` · ${t("id")}: ${product.dealRefId}` : null}
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:bg-slate-50/60" noPadding>
        <ProductItemForm
          orderedQty={product.quantity || 0}
          dealName={product.dealName}
          productIndex={productIndex}
        />
      </AppModal.Content>

      <AppModal.Footer className="tw:border-t tw:border-slate-100">
        <AppButton color="primary" expand="block" onClick={tryClose}>
          {t("done", { defaultValue: "Done" })}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditProductModal;
