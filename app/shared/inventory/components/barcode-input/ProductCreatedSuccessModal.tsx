import { CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

type ProductCreatedSuccessModalProps = {
  show: boolean;
  productName?: string;
  callback: (params: { action: string }) => void;
};

const ProductCreatedSuccessModal = ({
  show,
  productName,
  callback,
}: ProductCreatedSuccessModalProps) => {
  const { t } = useTranslation(["common"]);

  const onClose = () => callback({ action: "close" });

  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:h-auto tw:w-full tw:max-w-md"
      isAutoHeight
    >
      <AppModal.Title onClose={onClose}>
        <span className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-semibold">
          <CheckCircle2 className="tw:h-5 tw:w-5 tw:text-emerald-600" />
          {t("productCreatedTitle", { defaultValue: "Product Created" })}
        </span>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          <div className="tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:bg-emerald-50 tw:p-4">
            <CheckCircle2 className="tw:h-6 tw:w-6 tw:shrink-0 tw:text-emerald-600" />
            <p className="tw:text-sm tw:font-semibold tw:text-emerald-900 tw:leading-relaxed">
              {productName
                ? t("productCreatedSuccess", {
                    name: productName,
                    defaultValue: "{{name}} has been created successfully.",
                  })
                : t("productCreatedSuccessGeneric", {
                    defaultValue: "Your product has been created successfully.",
                  })}
            </p>
          </div>

          <div className="tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:bg-gray-50 tw:p-4">
            <Clock className="tw:h-5 tw:w-5 tw:shrink-0 tw:text-gray-500" />
            <p className="tw:text-sm tw:text-gray-600 tw:leading-relaxed">
              {t("productSentForReview", {
                defaultValue:
                  "It has been sent to StoreKing for review and will be available in your store once approved.",
              })}
            </p>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:justify-end!">
        <AppButton className="tw:w-full tw:sm:w-auto" onClick={onClose}>
          {t("gotIt", { defaultValue: "Got it!" })}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ProductCreatedSuccessModal;
