import { CircleCheck } from "lucide-react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import { validateForm, type PriceFormData } from "../helper";
import PriceForm from "../components/PriceForm";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

type Props = {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  data?: any;
};

const EditModal = ({ show, callback, data }: Props) => {
  const appToast = useAppToast();
  const formMethods = useForm<PriceFormData>({
    defaultValues: {
      price: null,
      type: "fixed",
      discount: 0,
      profit: 0,
    },
  });
  const { reset, getValues } = formMethods;

  useEffect(() => {
    if (show && data) {
      const fd = data.formData || {};
      reset({
        price: fd.price ?? null,
        type: fd.type ?? "fixed",
        discount: fd.discount ?? 0,
        profit: fd.profit ?? 0,
      });
    }
    if (!show) {
      reset();
    }
  }, [show, data, reset]);

  const handleClose = () => {
    callback({ action: "close" });
    reset();
  };

  const onSubmit = () => {
    const values = getValues();
    const validation = validateForm({
      price: values.price ?? 0,
      type: values.type ?? "fixed",
      profit: values.profit ?? 0,
    });

    if (validation) {
      appToast.show({ msg: validation, color: "danger" });
      return;
    }

    callback({ action: "submit", data: { _id: data?._id, ...values } });
    reset();
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-start tw:gap-2">
          <div className="tw:mt-0.5 tw:text-primary-600">
            <CircleCheck size={18} />
          </div>
          <div>
            <div className="tw:font-semibold">Edit Scheme Discount</div>
            <div className="tw:text-xs tw:text-gray-500">
              Edit scheme discount settings for this product.
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        {/* Product Info Section - similar to MobileView */}

        {data?.dealInfo && (
          <>
            <AppCard>
              <div className="tw:flex tw:flex-col tw:gap-3 md:tw:flex-row md:tw:items-start md:tw:justify-between">
                <div className="tw:flex tw:gap-2 tw:items-center md:tw:flex-1">
                  <div className="tw:w-16 tw:h-16 tw:shrink-0">
                    <ImgRender
                      assetId={data.dealInfo.images?.[0]}
                      alt={data.dealInfo.dealName || data.dealInfo.name}
                      className="tw:w-16 tw:h-16 tw:object-contain tw:rounded"
                    />
                  </div>
                  <div>
                    <div className="tw:text-base tw:font-semibold tw:mb-1">
                      {data.dealInfo.dealName || data.dealInfo.name}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      ID: {data.dealInfo.dealRefId}
                    </div>
                  </div>
                </div>

                <div className="md:tw:flex-1">
                  <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-gray-500 tw:mb-1">
                    Deal pricing &amp; tax
                  </div>
                  <div className="tw:grid tw:grid-cols-2 tw:gap-2 sm:tw:grid-cols-4">
                    <div className="tw:bg-gray-50 dark:tw:bg-gray-800/40 tw:rounded-md tw:px-2 tw:py-1.5">
                      <KeyValue label="MRP" size="sm">
                        <Amount
                          value={data.dealInfo.mrp}
                          decimalPlaces={2}
                          className="tw:text-red-500 tw:font-semibold"
                        />
                      </KeyValue>
                    </div>

                    <div className="tw:bg-gray-50 dark:tw:bg-gray-800/40 tw:rounded-md tw:px-2 tw:py-1.5">
                      <KeyValue label="Pur. Price" size="sm">
                        <Amount
                          value={data.dealInfo.purchasePrice}
                          decimalPlaces={2}
                          className="tw:font-semibold"
                        />
                      </KeyValue>
                    </div>

                    <div className="tw:bg-gray-50 dark:tw:bg-gray-800/40 tw:rounded-md tw:px-2 tw:py-1.5">
                      <KeyValue label="B2B Price" size="sm">
                        <Amount
                          value={data.dealInfo.b2bPrice}
                          decimalPlaces={2}
                          className="tw:text-primary tw:font-semibold"
                        />
                      </KeyValue>
                    </div>

                    <div className="tw:bg-gray-50 dark:tw:bg-gray-800/40 tw:rounded-md tw:px-2 tw:py-1.5">
                      <KeyValue label="Tax (GST)" size="sm">
                        <span className="tw:font-semibold">
                          {data.dealInfo.tax || 0}%
                        </span>
                      </KeyValue>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          </>
        )}
        <FormProvider {...formMethods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <PriceForm
              showSchemePrice={true}
              purchasePrice={data?.dealInfo?.purchasePrice}
              tax={data?.dealInfo?.tax}
              b2bPrice={data?.dealInfo?.b2bPrice}
              mrp={data?.dealInfo?.mrp}
              restrictToMrp={true}
            />
          </form>
        </FormProvider>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:p-2 tw:gap-2">
          <AppButton fill="clear" onClick={handleClose} type="button">
            Cancel
          </AppButton>
          <AppButton type="submit" color="primary" onClick={onSubmit}>
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditModal;
