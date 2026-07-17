import { useEffect, useState, useRef } from "react";
import { AppSelect, AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import CommonService from "~/services/CommonService";
import { useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import useAppToast from "~/hooks/useAppToast";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import AppButton from "~/components/core/button/AppButton";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";

type Props = {
  show: boolean;
  callback: () => void;
};

const PaymentConfigModal = ({ show, callback }: Props) => {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();
  const { show: showToast } = useAppToast();

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const paymentRawRef = useRef<any[]>([]);
  const acceptingPaymentMethodsRef = useRef<any[]>([]);
  const [inputs, setInputs] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  useEffect(() => {
    const fetchInitialPayments = async () => {
      try {
        const franchiseId = AuthService.getLoggedInUserId();
        if (franchiseId) {
          const res = await FranchiseService.getFranchise(franchiseId, {
            select: "acceptingPaymentMethods",
          });
          acceptingPaymentMethodsRef.current =
            res?.data?.acceptingPaymentMethods || [];
        }
      } catch (e) {
        acceptingPaymentMethodsRef.current = [];
      }
    };
    fetchInitialPayments().then(() => {
      // Now fetch payment methods
      const fetchPaymentMethods = async () => {
        const res = await CommonService.getBuySellPaymentMethodConfig();
        const rawMethods = res?.data?.[0]?.data?.methods || [];
        paymentRawRef.current = rawMethods;
        const paymentMethods = rawMethods.map((e: any) => ({
          label: e.label,
          value: e.type,
        }));
        setPaymentMethods([
          { label: "Select Payment Method", value: "" },
          ...paymentMethods,
        ]);
        setLoading(false);
      };
      fetchPaymentMethods();
    });
  }, []);

  // Handle payment method change
  const onMethodChange = () => {
    const method = getValues("paymentMethod");
    setSelectedMethod(method);
    const selectedMethodObj = paymentRawRef.current.find(
      (m: any) => m.type === method
    );

    setInputs(selectedMethodObj?.attributs || []);
  };

  // Handle file upload and update both setValue and inputs state
  const handleFileUpload = (attrKey: string, data: any) => {
    setValue(attrKey, data._id);
    setInputs((prevInputs: any[]) =>
      prevInputs.map((input) =>
        input.key === attrKey ? { ...input, value: data._id } : input
      )
    );
  };

  // Handle file remove and update both setValue and inputs state
  const handleFileRemove = (attrKey: string) => {
    setValue(attrKey, "");
    setInputs((prevInputs: any[]) =>
      prevInputs.map((input) =>
        input.key === attrKey ? { ...input, value: "" } : input
      )
    );
  };

  // Validation function
  const validateInputs = (data: any) => {
    if (!selectedMethod) {
      return "Please select a payment method.";
    }
    for (const attr of inputs) {
      const value = data[attr.key];
      if (attr.mandatory && (!value || value === "")) {
        return `${attr.label} is required.`;
      }
      if (
        attr.type === "email" &&
        value &&
        !CommonService.isValidEmail(value)
      ) {
        return `Invalid email format for ${attr.label}.`;
      }
      if (attr.type === "number" && value && isNaN(Number(value))) {
        return `${attr.label} must be a number.`;
      }
      // Custom pattern validations
      if (Array.isArray(attr.validations) && value) {
        for (const v of attr.validations) {
          if (v.pattern && !new RegExp(v.pattern).test(value)) {
            return v.errMsg || `Invalid value for ${attr.label}.`;
          }
        }
      }
      // Add more type checks as needed
    }
    return null;
  };

  // Prepare payload for submission
  const preparePayload = (data: any) => {
    // Find the selected method object
    const method = paymentRawRef.current.find(
      (m: any) => m.type === selectedMethod
    );
    if (!method)
      return { acceptingPaymentMethods: acceptingPaymentMethodsRef.current };
    const attributs = method.attributs || [];
    let hasValue = false;
    const methodObj: any = { type: method.type };
    for (const attr of attributs) {
      const val = data[attr.key];
      if (val !== undefined && val !== "") {
        hasValue = true;
        methodObj[attr.key] = val;
      }
    }
    if (method._id) methodObj._id = method._id;
    if (method._img) methodObj._img = method._img;
    // Only push if there is a value
    const acceptingPaymentMethods = hasValue
      ? [...acceptingPaymentMethodsRef.current, methodObj]
      : [...acceptingPaymentMethodsRef.current];
    return { acceptingPaymentMethods };
  };

  // Submit handler
  const onSubmit = async (data: any) => {
    const errorMsg = validateInputs(data);
    if (errorMsg) {
      showToast({ msg: errorMsg });
      return;
    }
    setSubmitting(true);
    try {
      const payload = preparePayload(data);
      const franchiseId = AuthService.getLoggedInUserId();
      if (typeof franchiseId === "string" && franchiseId) {
        const response = await FranchiseService.updateFranchise(
          franchiseId,
          payload
        );
        if (response?.statusCode === 200) {
          showToast({ msg: "Payment config submitted!", color: "success" });
          callback();
        } else {
          const errMsg =
            response?.data?.message || "Failed to update payment config.";
          showToast({ msg: errMsg, color: "danger" });
        }
      } else {
        showToast({ msg: "Franchise ID not found.", color: "danger" });
      }
    } catch (err: any) {
      showToast({
        msg: err?.message || "Failed to update payment config.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={callback} noShadow={true}>
        Payment Config
      </AppModal.Title>
      <AppModal.Content className="ion-padding modal-bg">
        <AppCard>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AppSelect
              name="paymentMethod"
              options={paymentMethods}
              register={register}
              onChange={onMethodChange}
              className="tw:mb-4"
              label="Payment Method"
              isRequired
            />
            {/* Render dynamic inputs */}
            {inputs.map((attr: any) => {
              if (attr.type === "image") {
                // Use value from inputs state for preview
                const imageValue = attr.value;

                return (
                  <div key={attr.key} className="tw:mb-4">
                    <label className="tw:block tw:mb-2 tw:font-medium tw:text-gray-800">
                      {attr.label}
                      {attr.mandatory && (
                        <span className="tw:text-xs tw:text-red-500">*</span>
                      )}
                    </label>
                    {imageValue ? (
                      <FileUploadPreview
                        image={imageValue}
                        onRemove={() => handleFileRemove(attr.key)}
                      />
                    ) : (
                      <FileUpload
                        onFileUpload={(data: any) =>
                          handleFileUpload(attr.key, data)
                        }
                        label={`Upload ${attr.label}`}
                      />
                    )}
                  </div>
                );
              }
              return (
                <AppInput
                  key={attr.key}
                  name={attr.key}
                  label={attr.label}
                  type={attr.type === "number" ? "number" : attr.type || "text"}
                  register={register}
                  isRequired={!!attr.mandatory}
                  className="tw:mb-4"
                />
              );
            })}
            <div className="tw:mt-4 tw:text-right">
              <AppButton
                type="submit"
                className="tw:mt-4 tw:btn tw:btn-primary"
                isLoading={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </AppButton>
            </div>
          </form>
        </AppCard>
      </AppModal.Content>
    </AppModal>
  );
};

export default PaymentConfigModal;
