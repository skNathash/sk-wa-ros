import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import BankListModal from "~/modals/feature/bank-list/BankListModal";
import PosService from "~/services/PosService";

type Props = {
  show: boolean;
  data: any;
  callback: (payload: { action: string; data?: any }) => void;
};

const UploadDepositModal = ({ show, data, callback }: Props) => {
  const appToast = useAppToast();

  const { register, handleSubmit, control, setValue, getValues } = useForm<{
    bankName: string;
    remarks: string;
    bankId: string;
    bankAccountNumber: string;
    bankAccountHolderName: string;
    bankIfsc: string;
    bankBranch: string;
    receipt: { id: string }[];
  }>({
    defaultValues: {
      bankName: "",
      remarks: "",
      bankId: "",
      bankAccountNumber: "",
      bankAccountHolderName: "",
      bankIfsc: "",
      bankBranch: "",
      receipt: [],
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const [bankListModal, setBankListModal] = useState({
    show: false,
  });

  const [receipt] = useWatch({
    control: control,
    name: ["receipt"],
  });

  useEffect(() => {
    if (show) {
      setValue("bankName", "");
      setValue("remarks", "");
      setValue("receipt", []);
    }
  }, [show]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const openBankListModal = () => {
    setBankListModal({ show: true });
  };

  const bankListModalCallback = (payload: { action: string; data?: any }) => {
    setBankListModal({ show: false });
    if (payload.action === "selected") {
      setValue("bankName", payload.data.name);
      setValue("bankId", payload.data._id);
      setValue("bankAccountNumber", payload.data.accountNumber);
      setValue("bankAccountHolderName", payload.data.accountHolderName);
      setValue("bankIfsc", payload.data.ifsc);
      setValue("bankBranch", payload.data.branch_name);
    }
  };

  const handleFileUpload = (file: any) => {
    setValue("receipt", [...(getValues("receipt") || []), { id: file._id }]);
  };

  const handleFileRemove = (index: number) => {
    setValue(
      "receipt",
      getValues("receipt").filter((item: any, i: number) => i !== index)
    );
  };

  const validate = () => {
    const formData = getValues();
    let msg = "";

    if (!formData.bankName) {
      msg = "Bank Name is required";
    } else if (!formData.receipt.length) {
      msg = "Receipt is required";
    } else {
      msg = "";
    }

    return {
      msg: msg,
      status: !msg,
    };
  };

  const onSubmit = async () => {
    const { msg, status } = validate();
    if (!status) {
      appToast.show({
        msg: msg,
        color: "danger",
      });
      return;
    }

    const f = getValues();

    const bank = {
      bankName: f.bankName,
      bankAccountNo: f.bankAccountNumber || "",
      bankAccountHolderName: f.bankAccountHolderName || "",
      bankBranch: f.bankBranch,
      bankIfsc: f.bankIfsc,
    };

    const payload = {
      ...bank,
      remarks: f.remarks,
      receipts: f.receipt.map((item: any) => ({
        id: item.id,
        status: true,
      })),
    };

    setSubmitting(true);
    try {
      const res = await PosService.updateCashDeposit(data._id, payload);

      if (res.statusCode === 200) {
        appToast.show({
          msg: "Receipt uploaded successfully",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        appToast.show({
          msg: res.data?.message || "Failed to upload receipt",
          color: "danger",
        });
      }

      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="offcanvas-modal">
        <AppModal.Content>
          <AppModal.Title noShadow onClose={onClose}>
            Upload Deposit Receipt
          </AppModal.Title>
          <AppModal.Content className="modal-bg ion-padding">
            <AppCard>
              <div className="tw:flex tw:items-center tw:justify-between">
                <div className="tw:text-base tw:font-medium">Total Amount</div>
                <div className="tw:text-base tw:font-semibold">
                  <Amount
                    value={data?.depositedAmount}
                    decimalPlaces={2}
                    className="tw:text-red-500"
                  />
                </div>
              </div>
            </AppCard>

            <AppCard>
              <div className="tw:text-sm tw:font-medium tw:mb-4 tw:text-gray-700">
                Please upload the deposit receipt
              </div>

              <AppInput
                name="bankName"
                register={register}
                placeholder="Bank Name"
                readOnly
                onClick={openBankListModal}
                className="tw:mb-4"
                label="Bank Name"
                isRequired
              />

              <AppTextarea
                name="remarks"
                register={register}
                placeholder="Remarks"
                className="tw:mb-4"
                label="Remarks"
              />

              <div className="tw:mb-4">
                <div className="tw:mb-4">
                  <FileUpload
                    label="Upload Receipt Image *"
                    onFileUpload={handleFileUpload}
                  />
                </div>

                <FileUploadedSlide
                  images={receipt}
                  onRemove={handleFileRemove}
                />
              </div>

              <div className="tw:text-end">
                <AppButton onClick={onClose} className="tw:mr-2" fill="outline">
                  Cancel
                </AppButton>
                <AppButton
                  color="primary"
                  onClick={onSubmit}
                  isLoading={submitting}
                  noShadow={true}
                >
                  Submit
                </AppButton>
              </div>
            </AppCard>
          </AppModal.Content>
        </AppModal.Content>
      </AppModal>

      <BankListModal
        show={bankListModal.show}
        callback={bankListModalCallback}
        type="skBank"
      />
    </>
  );
};

export default UploadDepositModal;
