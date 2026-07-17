import React, { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppSelect from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
// AppTab removed as we only support self-shipment for now
import useAppToast from "~/hooks/useAppToast";
import LogisticsService from "~/services/LogisticsService";
import { getData } from "./helper";

type AssignDeliveryPersonModalProps = {
  show: boolean;
  data?: {
    method: string;
    invoiceId: string;
    orderAmount?: number;
    orderId?: string;
    orderType?: string;
  };
  callback: (args: { action: string; data?: any }) => void;
  type: "self-shipment" | "delivery-agent";
};

// Tabs disabled; only self-shipment is available currently

const AssignDeliveryPersonModal: React.FC<AssignDeliveryPersonModalProps> = ({
  show,
  data,
  callback,
  type,
}) => {
  const { t } = useTranslation(["common"]);
  const { control, handleSubmit, reset, register } = useForm({
    defaultValues: {
      teamMember: "",
      courierAgency: "",
      remarks: "",
    },
  });

  const appToast = useAppToast();

  const [activeTab, setActiveTab] = useState<"self-shipment">("self-shipment");

  const [teamMembers, setTeamMembers] = useState<
    Array<{ value: string; label: string; data?: any }>
  >([]);

  const [courierAgencies, setCourierAgencies] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const selectedTeamMember = useWatch({
    control,
    name: "teamMember",
  });

  useEffect(() => {
    if (show) {
      setActiveTab("self-shipment");
    }
  }, [show]);

  // Load data when modal opens or tab changes
  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const type = activeTab === "self-shipment" ? "in-house" : "courier";
          const result = await getData(type);

          if (activeTab === "self-shipment") {
            setTeamMembers(result.data);
          } else {
            setCourierAgencies(result.data);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          if (activeTab === "self-shipment") {
            setTeamMembers([]);
          } else {
            setCourierAgencies([]);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [show, activeTab]);

  // Update selected employee when team member changes
  useEffect(() => {
    if (selectedTeamMember && activeTab === "self-shipment") {
      const employee = teamMembers.find(
        (member) => member.value === selectedTeamMember
      );
      setSelectedEmployee(employee?.data || null);
    } else {
      setSelectedEmployee(null);
    }
  }, [selectedTeamMember, teamMembers, activeTab]);

  // Tab change handler removed as tabs are disabled

  const handleModalClose = () => {
    callback({ action: "close" });
    setSelectedEmployee(null);
    reset();
  };

  const submitForm = async (formData: any) => {
    if (!data?.orderId) {
      appToast.show({
        msg: t("orderIdIsRequiredForAssignment"),
        color: "danger",
      });
      return;
    }

    const selectedAgentId =
      activeTab === "self-shipment"
        ? formData.teamMember
        : formData.courierAgency;

    if (!selectedAgentId) {
      appToast.show({
        msg: t("pleaseSelectADeliveryAgent"),
        color: "warning",
      });
      return;
    }

    // Validate order amount
    if (!data.orderAmount || data.orderAmount <= 0) {
      appToast.show({
        msg: t("validOrderAmountIsRequired"),
        color: "warning",
      });
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        orderId: data.orderId,
        deliveryAgentId: selectedAgentId,
        deliveryProcessType:
          activeTab === "self-shipment" ? "Personal" : "Courier",
        orderType: data.orderType || "B2C",
        orderValue: data.orderAmount || 0,
        deliveryAgentType:
          activeTab === "self-shipment" ? "Internal" : "External",
        remarks: formData.remarks || "",
        invoiceId: data.invoiceId,
      };

      const response = await LogisticsService.assignDelivery(payload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({
          msg: t("deliveryAssignedSuccessfully"),
          color: "success",
        });

        callback({
          action: "submit",
          data: {
            ...data,
            assignmentResponse: response.data?.data,
            deliveryAgentId: selectedAgentId,
            deliveryProcessType: payload.deliveryProcessType,
            deliveryAgentType: payload.deliveryAgentType,
          },
        });
        setSelectedEmployee(null);
        reset();
      } else {
        appToast.show({
          msg: response.data?.message || t("failedToAssignDelivery"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error assigning delivery:", error);
      appToast.show({
        msg: error?.message || t("anErrorOccurredWhileAssigningDelivery"),
        color: "danger",
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AppModal
      show={show}
      callback={({ action }) => action === "close" && handleModalClose()}
    >
      <AppModal.Title onClose={handleModalClose}>
        <div className="tw:text-lg tw:font-semibold">
          {t("assignDeliveryPerson")}
        </div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          {t(
            "chooseBetweenYourLastMileDeliveryTeamOrACourierAgencyToHandleThisDelivery"
          )}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        {/* Tabs hidden - self-shipment only */}
        {/* <div className="tw:mb-2 tw:text-sm tw:text-gray-600">Self Shipment</div> */}
        <form
          onSubmit={handleSubmit(submitForm)}
          className="tw:mt-4 tw:space-y-4"
        >
          {activeTab === "self-shipment" && (
            <>
              <Controller
                name="teamMember"
                control={control}
                rules={{ required: t("selectADeliveryPerson") }}
                render={({ field, fieldState }) => (
                  <AppSelect
                    label={t("deliveryPerson")}
                    options={teamMembers}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    placeholder={
                      loading ? t("loading") : t("selectADeliveryPerson")
                    }
                    isRequired
                    inputClassName="tw:w-full"
                    disabled={loading}
                  />
                )}
              />

              {/* Vehicle Details Display */}
              {selectedEmployee && selectedEmployee.vehicleDetails && (
                <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:border">
                  <h4 className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-3">
                    {t("vehicleDetails")}
                  </h4>
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                    <div>
                      <label className="tw:text-xs tw:text-gray-500 tw:block tw:mb-1">
                        {t("vehicleNumber")}
                      </label>
                      <p className="tw:text-sm tw:text-gray-900">
                        {selectedEmployee.vehicleDetails.vehicleNo || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="tw:text-xs tw:text-gray-500 tw:block tw:mb-1">
                        {t("vehicleType")}
                      </label>
                      <p className="tw:text-sm tw:text-gray-900">
                        {selectedEmployee.vehicleDetails.type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="tw:text-xs tw:text-gray-500 tw:block tw:mb-1">
                        {t("capacity")}
                      </label>
                      <p className="tw:text-sm tw:text-gray-900">
                        {selectedEmployee.vehicleDetails.capacity
                          ? `${selectedEmployee.vehicleDetails.capacity} ${t(
                              "kg"
                            )}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Courier agency selection hidden for now */}

          {/* Remarks Field */}

          <AppTextarea
            label={t("remarks")}
            name="remarks"
            register={register}
            placeholder={t("addAnySpecialInstructionsOrRemarksForDelivery")}
            inputClassName="tw:w-full"
            rows={3}
          />

          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton
              type="button"
              color="secondary"
              onClick={handleModalClose}
              disabled={assigning}
            >
              {t("cancel")}
            </AppButton>
            <AppButton type="submit" color="primary" disabled={assigning}>
              {assigning ? t("assigning") : t("assignAndDispatch")}
            </AppButton>
          </div>
        </form>
      </AppModal.Content>
    </AppModal>
  );
};

export default AssignDeliveryPersonModal;
