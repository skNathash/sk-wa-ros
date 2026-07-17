import React, { useState, useCallback, useEffect } from "react";
import { Truck, Check, Users, Building2, FileDown } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import AssignDeliveryPersonModal from "~/modals/feature/delivery/assign-delivery/AssignDeliveryPersonModal";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";
import LogisticsService from "~/services/LogisticsService";
import type { AssignDeliveryPayload } from "~/types/LogisticsTypes";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";

interface ShipProps {
  invoiceRefId: string;
  invoiceId: string;
  invoiceDocumentId?: string;
  orderAmount?: number;
  orderId?: string;
  orderType?: string;
  callback: (action: { action: string; data?: any }) => void;
}

interface DeliveryMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const deliveryMethods: DeliveryMethod[] = [
  {
    id: "selfShipment",
    title: "Self Shipment",
    description: "Assign to your internal Last-Mile Delivery team.",
    icon: <Users className="tw:w-6 tw:h-6 tw:text-blue-600" />,
  },
  // {
  //   id: "courierAgency",
  //   title: "Courier Agency",
  //   description: "Assign to external courier agencies for delivery",
  //   icon: <Building2 className="tw:w-6 tw:h-6 tw:text-purple-600" />,
  // },
  {
    id: "deliveryAgent",
    title: "Delivery Person",
    description: "Assign to delivery persons for delivery",
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

const Ship: React.FC<ShipProps> = ({
  invoiceRefId,
  invoiceId,
  invoiceDocumentId,
  orderAmount,
  orderId,
  orderType,
  callback,
}) => {
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
    "selfShipment",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [assignModal, setAssignModal] = useState<{ show: boolean; data?: any }>(
    {
      show: false,
    },
  );
  // OTP modal removed from Ship - parent will handle showing OTP in ShippedDetails

  const [counts, setCounts] = useState<{
    selfShipment: number;
    courierAgency: number;
    deliveryAgent: number;
  }>({
    selfShipment: 0,
    courierAgency: 0,
    deliveryAgent: 0,
  });

  const selfShipmentPosition = "Franchise Owner";

  useEffect(() => {
    const fetchData = async () => {
      const promises = [
        FranchiseService.getFranSubUserCount({
          filter: {
            position: selfShipmentPosition,
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
        courierAgency: 0,
        deliveryAgent: deliveryAgent.data?.data?.filteredTotal || 0,
      });
    };
    fetchData();
  }, []);

  const handleMethodSelect = (methodId: string) => {
    if (methodId === "courierAgency") {
      appToast.show({
        msg: "Coming soon",
        color: "info",
      });
      return;
    }

    const method = deliveryMethods.find((m) => m.id === methodId);
    if (method && counts[methodId as keyof typeof counts] > 0) {
      setSelectedMethod(methodId);
    } else {
      appToast.show({
        msg: "This delivery method is not available",
        color: "warning",
      });
    }
  };

  const handleSelfDelivery = async () => {
    setBusyloader({
      show: true,
      message: `Loading ${selfShipmentPosition}...`,
    });

    const response = await FranchiseService.getFranSubUser({
      filter: {
        position: selfShipmentPosition,
      },
    });
    const deliveryAgentId: string | undefined =
      response?.data?.data?.[0]?._id;

    if (!deliveryAgentId) {
      setBusyloader({ show: false, message: "" });

      appToast.show({
        msg: `No ${selfShipmentPosition} found`,
        color: "warning",
      });
      return;
    }

    const payload: AssignDeliveryPayload = {
      orderId: orderId || "",
      deliveryAgentId,
      deliveryProcessType: "Personal",
      orderType: orderType || "B2C",
      orderValue: orderAmount || 0,
      deliveryAgentType: "Internal",
      remarks: "",
      invoiceId: invoiceId,
    };

    const deliveryResponse = await LogisticsService.assignDelivery(payload);

    if (
      deliveryResponse.statusCode === 200 ||
      deliveryResponse.statusCode === 201
    ) {
      setBusyloader({ show: false, message: "" });
      appToast.show({
        msg: "Delivery assigned successfully",
        color: "success",
      });
      callback({
        action: "deliveryAssigned",
        data: {
          ...deliveryResponse.data?.data,
        },
      });
    } else {
      setBusyloader({ show: false, message: "" });
      appToast.show({
        msg: deliveryResponse.data?.message || "Failed to assign delivery",
        color: "danger",
      });
    }
  };

  const handleAssignDelivery = () => {
    if (!selectedMethod) {
      appToast.show({
        msg: "Please select a delivery method",
        color: "warning",
      });
      return;
    }

    if (selectedMethod === "deliveryAgent" && counts.deliveryAgent === 0) {
      appToast.show({
        msg: "No delivery agents available",
        color: "warning",
      });
      return;
    }

    if (selectedMethod === "selfShipment") {
      setAppAlertDialog({
        show: true,
        title: "Confirm Self Delivery",
        description: "Are you sure you want to assign delivery to yourself?",
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
        okText: "Confirm",
        cancelText: "Cancel",
      });
      return;
    }

    // Show the assign delivery person modal
    setAssignModal({
      show: true,
      data: {
        method: selectedMethod,
        invoiceRefId,
        invoiceId,
        orderAmount,
        orderId,
        orderType,
      },
    });
  };

  // Handler for AssignDeliveryPersonModal callback
  const handleAssignModalCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "close") {
        setAssignModal({ show: false });
      } else if (args.action === "submit") {
        // Inform parent (process/index.tsx) that delivery was assigned so it can
        // refresh data and trigger OTP verification UI in ShippedDetails.
        callback({
          action: "deliveryAssigned",
          data: {
            ...assignModal.data,
            ...args.data,
          },
        });
        setAssignModal({ show: false });
      }
    },
    [assignModal.data, callback],
  );

  // OTP handled by parent ShippedDetails; Ship no longer opens OTP modal.

  return (
    <>
      <AppCard
        title="Prepare for Shipment"
        icon={<Truck />}
        subtitle="The order has been invoiced and is ready for delivery assignment."
      >
        {/* Invoice Status Section */}
        <div className="tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:p-4 tw:mb-6">
          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-col tw:md:flex-row tw:md:items-start">
            <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
              <div className="tw:w-8 tw:h-8 tw:bg-green-100 tw:rounded-full tw:flex tw:items-center tw:justify-center">
                <Check className="tw:w-4 tw:h-4 tw:text-green-600" />
              </div>
              <div>
                <h4 className="tw:font-bold tw:text-green-800">
                  Invoice Generated
                </h4>
                <p className="tw:text-sm tw:text-green-700">
                  Invoice ID: {invoiceRefId} - Ready for delivery assignment.
                </p>
              </div>
            </div>

            {/* Download invoice button next to ready for delivery */}
            <div className="tw:mt-3 md:tw:mt-0">
              {orderType === "B2C" ? (
                <PrintReceipt orderId={orderId || ""} />
              ) : (
                <AppButton
                  size="small"
                  color="success"
                  fill="outline"
                  onClick={() => {
                    if (invoiceDocumentId) {
                      CommonService.assetDownload(invoiceDocumentId);
                      appToast.show({
                        msg: "Downloading invoice",
                        color: "success",
                      });
                    } else {
                      appToast.show({
                        msg: "Invoice document not available",
                        color: "danger",
                      });
                    }
                  }}
                >
                  <FileDown className="tw:text-lg" />
                  Download Invoice
                </AppButton>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Method Selection */}
        <div className="tw:mb-6">
          <h4 className="tw:font-bold tw:text-gray-800 tw:mb-4">
            Choose Delivery Method
          </h4>

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
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
                      {method.title}
                    </h5>
                    <p className="tw:text-sm tw:text-gray-600 tw:mb-2">
                      {method.description}
                    </p>
                    <p
                      className={`tw:text-xs ${
                        counts[method.id as keyof typeof counts] > 0
                          ? "tw:text-gray-500"
                          : "tw:text-red-500"
                      }`}
                    >
                      {counts[method.id as keyof typeof counts] > 0
                        ? `Available: ${
                            counts[method.id as keyof typeof counts]
                          }`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="tw:text-center">
          <AppButton
            onClick={handleAssignDelivery}
            disabled={!selectedMethod}
            color="dark"
            fill="solid"
          >
            {selectedMethod === "selfShipment" ? (
              <Truck className="tw:w-4 tw:h-4" />
            ) : (
              <Building2 className="tw:w-4 tw:h-4" />
            )}
            Assign for{" "}
            {selectedMethod === "selfShipment"
              ? "Self Delivery"
              : "Delivery Person"}
          </AppButton>
        </div>
      </AppCard>

      {/* Assign Delivery Person Modal */}
      <AssignDeliveryPersonModal
        show={assignModal.show}
        data={assignModal.data}
        callback={handleAssignModalCallback}
        type={
          selectedMethod === "selfShipment" ? "self-shipment" : "delivery-agent"
        }
      />

      {/* OTP verification moved out to parent/shipped details */}

      <BusyLoader show={busyloader.show} />

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

export default Ship;
