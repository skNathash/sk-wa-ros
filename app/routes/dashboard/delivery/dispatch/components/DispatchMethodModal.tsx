import { Building2, Truck, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import LogisticsService from "~/services/LogisticsService";
import type { AssignDeliveryPayload } from "~/types/LogisticsTypes";

interface DispatchMethodModalProps {
  show: boolean;
  data?: {
    orderId: string;
    invoiceId: string;
    orderAmount?: number;
    orderType?: string;
    orderRefNo?: string;
  };
  callback: (args: { action: string; data?: any }) => void;
}

interface DeliveryMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  titleLangKey: string;
  descriptionLangKey: string;
}

const deliveryMethods: DeliveryMethod[] = [
  {
    id: "selfShipment",
    title: "Self Shipment",
    titleLangKey: "selfShipment",
    description: "Assign to your internal Last-Mile Delivery team.",
    descriptionLangKey: "assignToYourInternalLastMileDeliveryTeam",
    icon: <Users className="tw:w-6 tw:h-6 tw:text-blue-600" />,
  },
  {
    id: "deliveryAgent",
    title: "Delivery Person",
    titleLangKey: "deliveryPerson",
    description: "Assign to delivery persons for delivery",
    descriptionLangKey: "assignToDeliveryPersonsForDelivery",
    icon: <Building2 className="tw:w-6 tw:h-6 tw:text-purple-600" />,
  },
];

const defaultAppAlertDialog = {
  show: false,
  title: "",
  description: "",
  onConfirm: () => {},
  onCancel: () => {},
  okText: "",
  cancelText: "",
};

const DispatchMethodModal: React.FC<DispatchMethodModalProps> = ({
  show,
  data,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [busyloader, setBusyloader] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    okText: string;
    cancelText: string;
  }>({
    ...defaultAppAlertDialog,
  });

  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    "selfShipment"
  );
  const [assignModal, setAssignModal] = useState<{ show: boolean; data?: any }>(
    {
      show: false,
    }
  );

  const [counts, setCounts] = useState<{
    selfShipment: number;
    deliveryAgent: number;
  }>({
    selfShipment: 0,
    deliveryAgent: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const promises = [
        FranchiseService.getFranSubUserCount({
          filter: {
            position: "Franchise Owner",
          },
        }),
        FranchiseService.getFranSubUserCount({
          filter: {
            position: "Delivery Agent",
          },
        }),
      ];
      const [selfShipment, deliveryAgent] = await Promise.all(promises);
      setCounts({
        selfShipment: selfShipment.data?.data?.filteredTotal || 0,
        deliveryAgent: deliveryAgent.data?.data?.filteredTotal || 0,
      });
    };
    fetchData();
  }, []);

  const handleMethodSelect = (methodId: string) => {
    const method = deliveryMethods.find((m) => m.id === methodId);
    if (method && counts[methodId as keyof typeof counts] > 0) {
      setSelectedMethod(methodId);
    } else {
      appToast.show({
        msg: t("thisDeliveryMethodIsNotAvailable"),
        color: "warning",
      });
    }
  };

  const handleSelfDelivery = async () => {
    if (!data?.orderId) {
      appToast.show({
        msg: t("orderIdIsRequiredForAssignment"),
        color: "danger",
      });
      return;
    }

    setBusyloader({ show: true, message: "Loading franchise owner..." });

    const response = await FranchiseService.getFranSubUser({
      filter: {
        position: "Franchise Owner",
      },
    });

    const franchiseOwner = response?.data?.data?.[0];

    if (!franchiseOwner?._id) {
      setBusyloader({ show: false, message: "" });

      appToast.show({
        msg: t("noFranchiseOwnerFound"),
        color: "warning",
      });
      return;
    }

    const payload: AssignDeliveryPayload = {
      orderId: data.orderId,
      deliveryAgentId: franchiseOwner._id,
      deliveryProcessType: "Personal",
      orderType: data.orderType || "B2C",
      orderValue: data.orderAmount || 0,
      deliveryAgentType: "Internal",
      remarks: "",
      invoiceId: data.invoiceId,
    };

    const deliveryResponse = await LogisticsService.assignDelivery(payload);

    if (
      deliveryResponse.statusCode === 200 ||
      deliveryResponse.statusCode === 201
    ) {
      setBusyloader({ show: false, message: "" });
      appToast.show({
        msg: t("deliveryAssignedSuccessfully"),
        color: "success",
      });
      callback({
        action: "deliveryAssigned",
        data: {
          ...deliveryResponse.data?.data,
          method: "selfShipment",
        },
      });
    } else {
      setBusyloader({ show: false, message: "" });
      appToast.show({
        msg: deliveryResponse.data?.message || t("failedToAssignDelivery"),
        color: "danger",
      });
    }
  };

  const handleAssignDelivery = () => {
    if (!selectedMethod) {
      appToast.show({
        msg: t("pleaseSelectADeliveryMethod"),
        color: "warning",
      });
      return;
    }

    if (selectedMethod === "deliveryAgent" && counts.deliveryAgent === 0) {
      appToast.show({
        msg: t("noDeliveryAgentsAvailable"),
        color: "warning",
      });
      return;
    }

    if (selectedMethod === "selfShipment") {
      setAppAlertDialog({
        show: true,
        title: t("confirmSelfDelivery"),
        description: t("areYouSureYouWantToAssignDeliveryToYourself"),
        onConfirm: async () => {
          setAppAlertDialog({
            ...defaultAppAlertDialog,
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
          handleSelfDelivery();
        },
        onCancel: () => {
          setAppAlertDialog({
            ...defaultAppAlertDialog,
          });
        },
        okText: t("confirm"),
        cancelText: t("cancel"),
      });
      return;
    }

    // Inform parent to open Assign Delivery modal and close this dispatch modal
    callback({
      action: "openAssignModal",
      data: {
        method: selectedMethod,
        invoiceId: data?.invoiceId,
        orderAmount: data?.orderAmount,
        orderId: data?.orderId,
        orderType: data?.orderType,
      },
    });
  };

  // Handler for AssignDeliveryPersonModal callback
  const handleAssignModalCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "close") {
        setAssignModal({ show: false });
      } else if (args.action === "submit") {
        callback({
          action: "deliveryAssigned",
          data: {
            ...assignModal.data,
            ...args.data,
            method: "deliveryAgent",
          },
        });
        setAssignModal({ show: false });
      }
    },
    [assignModal.data, callback]
  );

  const handleModalClose = () => {
    callback({ action: "close" });
    setSelectedMethod("selfShipment");
  };

  return (
    <>
      <AppModal
        show={show}
        callback={({ action }) => action === "close" && handleModalClose()}
      >
        <AppModal.Title onClose={handleModalClose}>
          <div className="tw:text-lg tw:font-semibold">
            {t("chooseDeliveryMethod")}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
            {t("selectHowYouWantToHandleThisDelivery")}
          </div>
        </AppModal.Title>
        <AppModal.Content>
          {/* Delivery Method Selection */}
          <div className="tw:mb-6">
            <div className="tw:grid tw:grid-cols-1 tw:gap-4">
              {deliveryMethods.map((method) => (
                <div
                  key={method.id}
                  className={`tw:border tw:rounded-lg tw:p-4 tw:cursor-pointer tw:transition-all ${
                    selectedMethod === method.id
                      ? "tw:border-blue-500 tw:bg-blue-50"
                      : "tw:border-gray-200 tw:bg-gray-50 tw:cursor-not-allowed"
                  }`}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="tw:flex tw:items-start tw:gap-3">
                    <div className="tw:flex-shrink-0">{method.icon}</div>
                    <div className="tw:flex-1">
                      <h5 className="tw:font-bold tw:text-gray-800 tw:mb-1">
                        {t(method.titleLangKey)}
                      </h5>
                      <p className="tw:text-sm tw:text-gray-600 tw:mb-2">
                        {t(method.descriptionLangKey)}
                      </p>
                      <p
                        className={`tw:text-xs ${
                          counts[method.id as keyof typeof counts] > 0
                            ? "tw:text-gray-500"
                            : "tw:text-red-500"
                        }`}
                      >
                        {counts[method.id as keyof typeof counts] > 0
                          ? `${t("available")}: ${
                              counts[method.id as keyof typeof counts]
                            }`
                          : t("notAvailable")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton
              type="button"
              color="secondary"
              onClick={handleModalClose}
            >
              {t("cancel")}
            </AppButton>
            <AppButton
              onClick={handleAssignDelivery}
              disabled={!selectedMethod}
              color="primary"
            >
              {selectedMethod === "selfShipment" ? (
                <Truck className="tw:w-4 tw:h-4" />
              ) : (
                <Building2 className="tw:w-4 tw:h-4" />
              )}
              {selectedMethod === "selfShipment"
                ? t("assignSelfDelivery")
                : t("assignDeliveryPerson")}
            </AppButton>
          </div>
        </AppModal.Content>
      </AppModal>

      {/* Assign Delivery Person Modal moved to parent (dispatch page) */}

      <BusyLoader show={busyloader.show} message={busyloader.message} />

      <AppAlertDialog
        description={appAlertDialog.description}
        onCancel={appAlertDialog.onCancel}
        onConfirm={appAlertDialog.onConfirm}
        title={appAlertDialog.title}
        cancelText={appAlertDialog.cancelText}
        type="confirm"
        okText={appAlertDialog.okText}
        show={appAlertDialog.show}
      />
    </>
  );
};

export default DispatchMethodModal;
