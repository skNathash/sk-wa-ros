import {
  ArrowDownCircle,
  ArrowUpCircle,
  IndianRupee,
  MapPin,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import useAppToast from "~/hooks/useAppToast";
import AccountService from "~/services/AccountService";
import RecordPaymentService from "~/services/RecordPaymentService";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import type { TabItem } from "~/types/CommonTypes";
import type { PayableReceivableEntityType } from "~/types/CommonTypes";
import clsx from "clsx";

const PAYMENT_OPTIONS = AccountService.getRecordPaymentOptions();

const tabs: TabItem[] = [
  {
    name: "Receive Payment",
    key: "receivePayment",
    icon: <ArrowUpCircle className="tw:text-green-600" />,
  },
  {
    name: "Make Payout",
    key: "makePayout",
    icon: <ArrowDownCircle className="tw:text-red-600" />,
  },
];

const getEntityTitle = (entityType: PayableReceivableEntityType) => {
  switch (entityType) {
    case "customer":
      return "Customer";
    case "vendor":
      return "Vendor";
    case "franchise":
      return "Retailer";
    default:
  }
};

const defaultFormValues = {
  paymentFromType: "",
  paymentToType: "",
  entity: null,
  amount: undefined,
  paymentMethod: "",
  referenceId: "",
  notes: "",
};

const RecordPaymentModal = ({
  show,
  callback,
  entityId,
  entityType,
  hideTabs = false,
  paymentType = "receivePayment",
}: {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  entityId: string;
  entityType?: PayableReceivableEntityType;
  hideTabs?: boolean;
  paymentType?: "receivePayment" | "makePayout";
}) => {
  const { t } = useTranslation(["common"]);

  const appToast = useAppToast();

  const methods = useForm({
    defaultValues: defaultFormValues,
  });

  const { register } = methods;

  const [loading, setLoading] = useState(true);

  const [overallAmount, setOverallAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<"receivePayment" | "makePayout">(
    paymentType
  );
  const [submitting, setSubmitting] = useState(false);

  const [entityDetails, setEntityDetails] = useState<any>(null);

  const [amount] = useWatch({ control: methods.control, name: ["amount"] });

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        const type =
          activeTab === "receivePayment" ? "receivables" : "payables";

        let params: Record<string, any> = { type, partyId: entityId };
        // if (activeTab === "receivePayment") {
        //   params.filter = {
        //     "toParty.id": entityId,
        //   };
        // } else {
        //   params.filter = {
        //     "fromParty.id": entityId,
        //   };
        // }

        const response = await AccountService.getPayablesReceiveables(params);
        const value = response?.data?.data?.reduce(
          (acc: number, curr: any) => acc + Number(curr?.outstandingAmount),
          0
        );
        setOverallAmount(value);
      };

      fetchData();
    }
  }, [entityType, activeTab, show]);

  useEffect(() => {
    if (show) {
      methods.reset(defaultFormValues);

      const fetchEntityDetails = async () => {
        try {
          setLoading(true);

          if (entityType && entityId) {
            const res = await RecordPaymentService.getEntityById(
              entityType,
              entityId
            );
            setEntityDetails(res || null);
          } else {
            setEntityDetails(null);
          }
        } catch (err) {
          setEntityDetails(null);
        } finally {
          setLoading(false);
        }
      };

      fetchEntityDetails();
    }
  }, [show, entityId]);

  const onSubmit = async (data: any) => {
    if (!Number(data.amount) || Number(data.amount) <= 0) {
      appToast.show({
        msg: "Please enter a valid amount",
        color: "error",
      });
      return;
    }

    if (!data.paymentMethod) {
      appToast.show({
        msg: "Please select a payment method",
        color: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = AccountService.prepareReceivePaymentPayload(
        data,
        {
          id: entityId,
          type: entityType || "franchise",
          name: entityDetails?.value?.name,
          refId: entityDetails?.value?.refId,
        },
        activeTab
      );
      const resp = await AccountService.submitPayment(payload);
      if (resp?.statusCode === 200) {
        callback({
          action: "success",
          data: {
            name: entityDetails?.value?.name,
            amount: Number(data.amount),
            paymentMethod: data.paymentMethod,
            isPayout: activeTab === "makePayout",
          },
        });
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to record payment.",
          color: "error",
        });
      }
    } catch (err) {
      appToast.show({
        msg: "Error recording payment.",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-lg">{`${
          activeTab === "receivePayment" ? "Receive Payment" : "Make Payout"
        }`}</div>
        <div className="tw:flex tw:items-center tw:gap-1">
          <div className="tw:text-xs tw:text-gray-500">
            {activeTab === "receivePayment"
              ? "Need to receive payment from"
              : "Need to make payout to"}
          </div>
          <div className="tw:text-xs tw:text-gray-500">
            &quot;{entityDetails?.label}&quot;
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && entityDetails ? (
          <>
            <div className=" tw:bg-gray-100/50 tw:rounded-lg tw:p-4 tw:mb-4">
              <div className="tw:text-sm tw:font-semibold tw:mb-2 tw:text-blue-700">
                {`${getEntityTitle(entityType || "franchise")} Details`}
              </div>
              <div className="tw:flex tw:gap-x-2 tw:items-center">
                <span className="tw:text-base tw:font-semibold">
                  {entityDetails?.label}
                </span>
                {entityDetails?.value?._vendorType ? (
                  <VendorTypeBadge
                    type={entityDetails?.value?._vendorType}
                    color={entityDetails?.value?._vendorTypeColor}
                    description={entityDetails?.value?._vendorTypeInfo}
                    hideInfo={true}
                    className="tw:text-[10px]"
                  />
                ) : null}
              </div>
              <div className="tw:flex tw:gap-1 tw:items-center tw:text-xs tw:text-gray-500 tw:mt-1">
                <Phone size={12} /> {entityDetails?.value?.mobile || "-"}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:flex tw:gap-1 tw:items-center">
                <MapPin size={12} />
                {entityDetails?.value?.formattedAddress}
              </div>
            </div>

            {!hideTabs ? (
              <div className="tw:mb-4">
                <AppTab
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={(t: any) => setActiveTab(t.key || t)}
                  className="tw:mb-0"
                />
              </div>
            ) : null}

            <div
              className={clsx(
                "tw:mt-2 tw:rounded-lg tw:p-4 tw:mb-4 tw:flex tw:justify-between tw:items-center",
                {
                  "tw:bg-green-50": activeTab === "receivePayment",
                  "tw:bg-red-50": activeTab === "makePayout",
                }
              )}
            >
              <div className="tw:text-sm tw:font-semibold">
                Total{" "}
                {activeTab === "receivePayment" ? "Receivable" : "Payable"}{" "}
                Amount
              </div>
              <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                <Amount value={overallAmount} decimalPlaces={2} />
              </div>
            </div>

            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <AppCard
                title={
                  <div className="tw:text-sm tw:font-semibold">
                    1. Enter Payment <span className="tw:text-red-500">*</span>{" "}
                  </div>
                }
              >
                <AppInput
                  register={register}
                  name="amount"
                  placeholder="Enter amount"
                  leftIcon={<IndianRupee color="green" />}
                />
                <div>
                  {Number(amount) > Number(overallAmount) ? (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                      Any amount greater than the total amount will be recorded
                      as an advance.
                    </div>
                  ) : null}
                </div>
              </AppCard>

              {/* Transaction Details (inlined from TransactionDetails component) */}
              <AppCard
                title={"2. Transaction Details"}
                className="tw:mb-0"
                subtitle={"Add payment reference and notes"}
              >
                <div className="tw:mt-4">
                  <div className="tw:grid tw:grid-cols-1 tw:gap-4">
                    <Controller
                      control={methods.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <AppSelect
                          label={"Payment Method"}
                          options={PAYMENT_OPTIONS}
                          placeholder={"Select Payment Method"}
                          value={field.value}
                          onChange={field.onChange}
                          inputClassName="tw:w-full"
                          isRequired
                          size="sm"
                        />
                      )}
                    />

                    <AppInput
                      label={"Reference / Transaction Id"}
                      name="referenceId"
                      placeholder={"Enter reference or transaction id"}
                      register={register}
                      className="tw:mt-0 tw:w-full"
                      size="sm"
                    />
                  </div>

                  <div className="tw:mt-3">
                    <AppTextarea
                      label={"Notes"}
                      name="notes"
                      placeholder={"Enter notes"}
                      register={register}
                      rows={3}
                      className="tw:w-full"
                    />
                  </div>
                </div>
              </AppCard>
            </form>
          </>
        ) : null}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:text-end tw:flex tw:items-center tw:gap-x-2">
          <AppButton color="light" fill="outline" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            color="success"
            onClick={methods.handleSubmit(onSubmit)}
            isLoading={submitting}
          >
            {activeTab === "receivePayment" ? "Receive Payment" : "Make Payout"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RecordPaymentModal;
