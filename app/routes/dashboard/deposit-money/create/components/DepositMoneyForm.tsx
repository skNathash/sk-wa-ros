import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppPincodeInput from "~/components/core/form/AppPincodeInput";
import AppSelect from "~/components/core/form/AppSelect";
// import FileUpload from "~/components/core/form/FileUpload"; // Uncomment if FileUpload exists
import { useState, useCallback } from "react";
import BankListModal from "~/modals/feature/bank-list/BankListModal";
import KeyValue from "~/components/core/key-value/KeyValue";
import Amount from "~/components/core/amount/Amount";
import debounce from "lodash/debounce";
import AccountService from "~/services/AccountService";
import useAppToast from "~/hooks/useAppToast";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import AuthService from "~/services/AuthService";
import AppDateInput from "~/components/core/form/AppDateInput";
import useAppNav from "~/hooks/useAppNav";

const getPaymentModes = (depositVia?: string) => {
  // If no depositVia is selected, show all options
  if (!depositVia) {
    return [
      { value: "cash", label: "Cash" },
      { value: "cheque", label: "Cheque" },
      { value: "imps", label: "IMPS" },
      { value: "neft", label: "NEFT" },
      { value: "rtgs", label: "RTGS" },
    ];
  }

  if (depositVia === "bankDeposit") {
    // For Cash Deposit, show only Cash and Cheque
    return [
      { value: "cash", label: "Cash" },
      { value: "cheque", label: "Cheque" },
    ];
  }

  if (depositVia === "netBanking") {
    // For Online Transfer, show only IMPS, NEFT, and RTGS
    return [
      { value: "imps", label: "IMPS" },
      { value: "neft", label: "NEFT" },
      { value: "rtgs", label: "RTGS" },
    ];
  }

  // For other deposit methods, show all options
  return [
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "imps", label: "IMPS" },
    { value: "neft", label: "NEFT" },
    { value: "rtgs", label: "RTGS" },
  ];
};

const depositViaOptions = [
  { value: "bankDeposit", label: "Cash Deposit" },
  { value: "netBanking", label: "Online Transfer" },
  { value: "pg", label: "Card/Bank" },
];

const DepositMoneyForm = ({ hostData }: { hostData: any }) => {
  const {
    register,
    control,
    setValue,
    formState: { errors },
    getValues,
  } = useFormContext();

  const appNav = useAppNav();

  // Watch relevant fields for conditional rendering
  const [depositVia, paymentMode, bank, selectedBankData, fromBankData, slip] =
    useWatch({
      control,
      name: [
        "depositVia",
        "paymentMode",
        "bank",
        "selectedBankData",
        "fromBankData",
        "slip",
      ],
    });

  // Function to handle deposit via change and update payment mode
  const handleDepositViaChange = useCallback(
    (newDepositVia: string) => {
      let defaultPaymentMode = "";

      if (newDepositVia === "bankDeposit") {
        // For Cash Deposit, default to Cash
        defaultPaymentMode = "cash";
      } else if (newDepositVia === "netBanking") {
        // For Online Transfer, default to IMPS
        defaultPaymentMode = "imps";
      } else if (newDepositVia === "pg") {
        // For Card/Bank, default to Cash
        defaultPaymentMode = "cash";
      }

      // Clear related fields when deposit via changes
      setValue("bank", null);
      setValue("selectedBankData", null);
      setValue("fromBank", null);
      setValue("fromBankData", null);
      setValue("utr", "");
      setValue("chequeNo", "");
      setValue("chequeDt", "");
      setValue("branchName", "");
      setValue("bankPincode", "");
      setValue("amount", null);
      setValue("remarks", "");
      setValue("slip", []);

      // Update payment mode to the default for the selected deposit via
      if (defaultPaymentMode) {
        // Use setTimeout to ensure this happens after other setValue calls
        setTimeout(() => {
          setValue("paymentMode", defaultPaymentMode);
        }, 0);
      }
    },
    [setValue]
  );

  // State for modal (single modal for both banks)
  const [bankModal, setBankModal] = useState({
    show: false,
    type: "all" as "skBank" | "all", // "skBank" or "all"
  });

  const openSkBankModal = useCallback(() => {
    setBankModal({
      show: true,
      type: "skBank",
    });
  }, []);

  const openFromBankModal = useCallback(() => {
    setBankModal({
      show: true,
      type: "all", // type for fromBank
    });
  }, []);

  const handleBankModalCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (bankModal.type === "skBank") {
        setBankModal({ show: false, type: "all" });
        if (payload.action === "selected") {
          setValue("selectedBankData", payload.data || null);
          setValue("bank", payload.data?.name || null);
        }
      } else {
        setBankModal({ show: false, type: "all" });
        if (payload.action === "selected") {
          setValue("fromBankData", payload.data || null);
          setValue("fromBank", payload.data?.name || null);
        }
      }
    },
    [setValue, bankModal.type]
  );

  const handleBankPincodeSelect = (result: any) => {
    if (result.status === "error") {
      setValue("bankPincode", "");
    }

    if (result && result.status === "success" && result.data) {
      setValue("bankTown", result.data.town || "");
      setValue("bankDistrict", result.data.district || "");
      setValue("bankState", result.data.state || "");
    } else {
      setValue("bankTown", "");
      setValue("bankDistrict", "");
      setValue("bankState", "");
    }
  };

  const [charges, setCharges] = useState(0);
  const [amtErrMsg, setAmtErrMsg] = useState("");
  const [validatingAmount, setValidatingAmount] = useState(false);
  const [loadingCharge, setLoadingCharge] = useState(false);

  const toast = useAppToast();

  // Debounced version
  const debouncedValidateAmount = debounce(() => {
    const { amount } = getValues();
    validateAmount(amount, paymentMode, selectedBankData);
  }, 500);

  // Move fetchCharge above validateAmount to fix use-before-assign
  const fetchCharge = useCallback(
    async (amount: number, paymentMode: string, bank: any) => {
      if (paymentMode !== "cash" || !amount) {
        setCharges(0);
        return;
      }
      if (!bank || !bank._id) {
        setCharges(0);
        return;
      }
      setLoadingCharge(true);
      try {
        const data = await AccountService.getDepositMoneyCharges({
          amount,
          bankId: bank._id,
        });
        setCharges(data?.data?.charge || 0);
      } catch {
        setCharges(0);
      } finally {
        setLoadingCharge(false);
      }
    },
    []
  );

  const validateAmount = useCallback(
    async (amount: number, paymentMode: string, bank: any) => {
      if (paymentMode !== "cash" || !amount) {
        setCharges(0);
        setAmtErrMsg("");
        return;
      }

      if (!bank || !bank._id) {
        toast.show({ msg: "Please choose the Bank" });
        setValue("amount", 0);
        setAmtErrMsg("");
        return;
      }
      setValidatingAmount(true);
      try {
        const resp = await AccountService.depositMoneyAmtValidation({
          amount,
          bankId: bank._id,
        });
        const a = resp?.data?.data?.remainingDeposit || 0;
        if (a === 0) {
          setAmtErrMsg("Your quota has been exceeded.");
          setValue("amount", 0);
        } else if (amount > a) {
          setAmtErrMsg(`Your remaining balance to deposit money is Rs.${a}`);
          setValue("amount", a);
        } else {
          setAmtErrMsg("");
        }
        fetchCharge(amount, paymentMode, bank);
      } catch {
        setAmtErrMsg("");
        fetchCharge(amount, paymentMode, bank);
      } finally {
        setValidatingAmount(false);
      }
    },
    [setValue, toast, fetchCharge]
  );

  // Handle file upload callback
  const handleSlipUpload = (data: any) => {
    const newSlips = [...(slip || []), { id: data._id }];
    setValue("slip", newSlips);
  };

  // Handle slip removal
  const handleRemoveSlip = (index: number) => {
    const newSlips = (slip || []).filter((_: any, i: number) => i !== index);
    setValue("slip", newSlips);
  };

  return (
    <>
      {/* Show info for 'pg' */}
      {depositVia === "pg" && (
        <div className="tw:md:text-xs tw:text-sm tw:text-blue-600 tw:bg-blue-50 tw:p-2 tw:rounded tw:mb-4">
          Use RTGS/NEFT services for quicker and instant deposits in your
          SK-Advance Balance
        </div>
      )}

      {/* Show net banking info block */}
      {depositVia === "netBanking" && (
        <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:p-2 tw:rounded tw:mb-3">
          <div className="tw:text-red-800 tw:text-xs tw:mb-1">
            <strong>No Hassles of doing "Making Payment" Now!</strong>
          </div>
          <div className="tw:text-red-700 tw:text-xs tw:mb-2">
            Transfer Fund [IMPS, NEFT, RTGS] to your StoreKing Private Account
            Number and get Instant Credit.
          </div>
          <button
            type="button"
            onClick={() =>
              appNav.to("/dashboard/deposit-money/express-deposit")
            }
            className="tw:text-red-600 tw:text-xs tw:font-medium tw:underline hover:tw:text-red-800 tw:transition-colors"
          >
            View More
          </button>
        </div>
      )}

      <form className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <Controller
          control={control}
          name="depositVia"
          render={({ field }) => (
            <AppSelect
              label="Deposit Via"
              options={depositViaOptions}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                handleDepositViaChange(value);
              }}
              error={
                typeof errors.depositVia?.message === "string"
                  ? errors.depositVia.message
                  : undefined
              }
              isRequired
              inputClassName="tw:w-full"
            />
          )}
        />

        {/* Show paymentMode and bank-related fields only if depositVia is not 'pg' and is selected */}
        {depositVia && depositVia !== "pg" && (
          <>
            <Controller
              control={control}
              name="paymentMode"
              render={({ field }) => (
                <AppSelect
                  label="Payment Mode"
                  options={getPaymentModes(depositVia)}
                  value={field.value}
                  onChange={field.onChange}
                  error={
                    typeof errors.paymentMode?.message === "string"
                      ? errors.paymentMode.message
                      : undefined
                  }
                  isRequired
                  inputClassName="tw:w-full"
                />
              )}
            />

            {/* Info for NEFT/RTGS */}
            {["neft", "rtgs"].includes(paymentMode) && (
              <div className="tw:text-xs tw:text-orange-600 tw:bg-orange-50 tw:p-2 tw:rounded tw:col-span-1 tw:md:col-span-2">
                <Amount value={50} /> charges applicable for{" "}
                {paymentMode.toUpperCase()}
              </div>
            )}
            {/* Info for Cash */}
            {paymentMode === "cash" && (
              <div className="tw:text-xs tw:text-green-700 tw:bg-green-50 tw:p-2 tw:rounded tw:col-span-1 tw:md:col-span-2">
                Daily Cash Deposit limit is
                <Amount value={199999} className="tw:ml-1" /> only
              </div>
            )}

            {/* StoreKing Bank select (shown if paymentMode is selected) */}
            {paymentMode && (
              <div className="tw:col-span-1 tw:md:col-span-2">
                <AppInput
                  name="bank"
                  label="Choose StoreKing Bank"
                  register={register}
                  isRequired={true}
                  error={
                    typeof errors.bank?.message === "string"
                      ? errors.bank.message
                      : undefined
                  }
                  readOnly
                  onClick={openSkBankModal}
                />
                {/* StoreKing Bank details (shown if selectedBankData && selectedBankData.name) */}
                {selectedBankData && selectedBankData.name && (
                  <div className="tw:bg-gray-50 tw:p-2 tw:rounded tw:mb-2 tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-4 tw:gap-2 tw:mt-1">
                    <KeyValue label="Account No." size="sm">
                      {selectedBankData.acNumber}
                    </KeyValue>
                    <KeyValue label="Name" size="sm">
                      {selectedBankData.acName}
                    </KeyValue>
                    <KeyValue label="Branch" size="sm">
                      {selectedBankData.branchName}
                    </KeyValue>
                    <KeyValue label="IFSC" size="sm">
                      {selectedBankData.ifsc}
                    </KeyValue>
                  </div>
                )}
              </div>
            )}

            {/* Cheque/From Bank Name (if bank.name and (paymentMode === 'cheque' || depositVia === 'netBanking')) */}
            {(paymentMode === "cheque" || depositVia === "netBanking") && (
              <div>
                <AppInput
                  name="fromBank"
                  label={
                    paymentMode == "cheque" ? "Cheque From Bank" : "From Bank"
                  }
                  register={register}
                  isRequired={true}
                  placeholder="Select From Bank"
                  error={
                    typeof errors.fromBank?.message === "string"
                      ? errors.fromBank.message
                      : undefined
                  }
                  readOnly
                  onClick={openFromBankModal}
                  className="tw:mb-4"
                />
              </div>
            )}

            {/* UTR Number (if depositVia === 'netBanking') */}
            {depositVia === "netBanking" && (
              <AppInput
                name="utr"
                label="UTR"
                register={register}
                placeholder="eg: 1234567890"
                error={
                  typeof errors.utr?.message === "string"
                    ? errors.utr.message
                    : undefined
                }
                className="tw:mb-4"
              />
            )}

            {/* Cheque No. and Cheque Date (if paymentMode === 'cheque' && bank.name) */}
            {paymentMode === "cheque" && bank && (
              <div className="tw:flex tw:gap-2">
                <AppInput
                  name="chequeNo"
                  label="Cheque No"
                  register={register}
                  isRequired={true}
                  placeholder="eg: 1234567890"
                  error={
                    typeof errors.chequeNo?.message === "string"
                      ? errors.chequeNo.message
                      : undefined
                  }
                  className="tw:mb-4 tw:w-full"
                />
                <Controller
                  control={control}
                  name="chequeDt"
                  render={({ field }) => (
                    <AppDateInput
                      label="Cheque Date"
                      value={field.value}
                      callback={field.onChange}
                      dateConfig={{ mode: "single", toDate: new Date() }}
                      placeholder="Select Cheque Date"
                      error={
                        typeof errors.chequeDt?.message === "string"
                          ? errors.chequeDt.message
                          : undefined
                      }
                      className="tw:mb-4 tw:w-full"
                    />
                  )}
                />
              </div>
            )}

            {/* Deposit Branch Name and Bank Pincode (if paymentMode === 'cash' && bank.name) */}
            {paymentMode === "cash" && bank && (
              <>
                <AppInput
                  name="branchName"
                  label="Deposit Branch Name"
                  register={register}
                  error={
                    typeof errors.branchName?.message === "string"
                      ? errors.branchName.message
                      : undefined
                  }
                  className="tw:mb-4"
                  placeholder="Enter Deposit Branch Name"
                  isRequired
                />
                <AppPincodeInput
                  name="bankPincode"
                  label="Deposit Bank Pincode"
                  register={register}
                  error={
                    typeof errors.bankPincode?.message === "string"
                      ? errors.bankPincode.message
                      : undefined
                  }
                  className="tw:mb-4"
                  onPincodeSelect={handleBankPincodeSelect}
                  isRequired
                />
              </>
            )}
          </>
        )}

        {/* Amount and Remarks (if paymentMode or depositVia === 'pg') */}
        {(paymentMode || depositVia === "pg") && (
          <>
            <div>
              <AppInput
                name="amount"
                register={register}
                label="Amount"
                type="number"
                error={
                  typeof errors.amount?.message === "string"
                    ? errors.amount.message
                    : undefined
                }
                isRequired
                className="tw:mb-4"
                onChange={debouncedValidateAmount}
              />
              {/* Show amount error message and charges below the amount input */}
              {(amtErrMsg || (paymentMode === "cash" && charges > 0)) && (
                <div className="tw:text-xs tw:mt-[-12px] tw:mb-2">
                  {amtErrMsg && (
                    <div className="tw:text-red-600">{amtErrMsg}</div>
                  )}
                  {paymentMode === "cash" && charges > 0 && (
                    <span className="tw:text-green-700">
                      Charges applicable: <Amount value={charges} />
                    </span>
                  )}
                </div>
              )}
            </div>
            <AppInput
              name="remarks"
              label="Remarks"
              register={register}
              isRequired
              error={
                typeof errors.remarks?.message === "string"
                  ? errors.remarks.message
                  : undefined
              }
              className="tw:mb-4"
            />
          </>
        )}

        {/* File Upload (if depositVia && depositVia !== 'pg') */}
        {depositVia && depositVia !== "pg" && (
          <div className="tw:mb-4">
            <FileUpload
              label="Upload Slip"
              onFileUpload={handleSlipUpload}
              allowedExtensions={["jpg", "jpeg", "png", "pdf"]}
              maxSizeMB={5}
            />
            {slip && slip.length > 0 && (
              <div className="tw:mt-2">
                <FileUploadedSlide images={slip} onRemove={handleRemoveSlip} />
              </div>
            )}
          </div>
        )}

        {/* Agreement and submit (if depositVia) */}
        {depositVia && depositVia === "bankDeposit" && (
          <div className="tw:flex tw:items-start tw:gap-2 tw:col-span-1 tw:md:col-span-2">
            <input
              type="checkbox"
              {...register("iagree")}
              id="iagree"
              className="tw:mt-4 tw:inline-block"
            />
            <label htmlFor="iagree">
              <span className="tw:md:text-xs tw:text-sm tw:text-gray-500">
                Please ensure that you ask the Bank Clerk to enter the correct
                UTR/Reference number for your deposit.{" "}
                <div>
                  Franchise ID : {AuthService.getLoggedInUserId(true)} Franchise
                  Mobile: {AuthService.getLoggedInUser()?.mobile}
                </div>
              </span>
            </label>
          </div>
        )}
        {/* You can add a submit button here if needed */}
      </form>

      <BankListModal
        show={bankModal.show}
        callback={handleBankModalCallback}
        type={bankModal.type}
      />
    </>
  );
};

export default DepositMoneyForm;
