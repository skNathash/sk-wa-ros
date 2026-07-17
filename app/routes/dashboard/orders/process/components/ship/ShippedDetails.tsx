import { Truck, CheckCircle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { useState, useEffect } from "react";
import useAppNav from "~/hooks/useAppNav";
import DateFormat from "~/components/core/date/DateFormat";
import OtpVerifyModal from "./modals/OtpVerifyModal";

type Props = {
  shipment: {
    contact: string;
    name: string;
    shipmentId: string;
    shipmentType: string;
    shippedOn: string;
    invoiceRefId?: string;
    vehicleInfo?: {
      type?: string;
      capacity?: string;
      vehicleNo?: string;
    };
    isApproved?: boolean;
  };
  // When parent sets this prop.show to true, ShippedDetails should open the OTP modal
  triggerOtpVerify?: {
    show: boolean;
    shipmentId?: string;
    invoiceRefId?: string;
  };
  // Callback to inform parent that the trigger has been handled
  onOtpHandled?: () => void;
  invoiceRefId?: string;
};

const ShippedDetails = ({
  shipment,
  triggerOtpVerify,
  onOtpHandled,
  invoiceRefId,
}: Props) => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(
    shipment.isApproved || false
  );
  const nav = useAppNav();

  // Use effect to watch for trigger prop and open OTP modal when parent requests it
  useEffect(() => {
    if (triggerOtpVerify && triggerOtpVerify.show) {
      setShowOtpModal(true);
      // let parent know we've handled the trigger so it can reset
      if (onOtpHandled) onOtpHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOtpVerify]);

  const handleOtpModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "success") {
      setIsOtpVerified(true);
    }
    setShowOtpModal(false);
  };

  return (
    <>
      <AppCard
        title="Order In-Transit"
        icon={<Truck />}
        subtitle="This order has been shipped and is on its way to the customer."
      >
        <div className="tw:bg-slate-100 tw:p-4 tw:rounded-md tw:mb-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:text-sm tw:font-medium">Method:</div>
            <div className="tw:text-sm">
              {shipment.shipmentType === "deliveryagent"
                ? "Delivery Agent"
                : "Self Shipment"}
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:text-sm tw:font-medium">Contact:</div>
            <div className="tw:text-sm">{shipment.contact}</div>
          </div>

          {shipment.shippedOn ? (
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:text-sm tw:font-medium">Shipped On:</div>
              <div className="tw:text-sm">
                <DateFormat value={shipment.shippedOn} />
              </div>
            </div>
          ) : null}

          {/* Vehicle Details */}
          {shipment.vehicleInfo && (
            <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:bg-white tw:p-3 tw:rounded-md tw:border tw:border-slate-200">
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  Vehicle Type
                </div>
                <div className="tw:text-sm tw:text-gray-900">
                  {shipment.vehicleInfo.type || "N/A"}
                </div>
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  Capacity
                </div>
                <div className="tw:text-sm tw:text-gray-900">
                  {shipment.vehicleInfo.capacity
                    ? `${shipment.vehicleInfo.capacity} kg`
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  Vehicle Number
                </div>
                <div className="tw:text-sm tw:text-gray-900">
                  {shipment.vehicleInfo.vehicleNo || "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OTP Verification Section - Hide for selfship */}
        {shipment.shipmentType !== "selfship" && (
          <>
            {!isOtpVerified ? (
              <div className="tw:mb-4">
                <div className="tw:bg-amber-50 tw:p-3 tw:rounded-md tw:border tw:border-amber-200 tw:mb-4">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div className="tw:w-5 tw:h-5 tw:bg-amber-100 tw:rounded-full tw:flex tw:items-center tw:justify-center">
                      <span className="tw:text-amber-600 tw:text-xs tw:font-bold">
                        !
                      </span>
                    </div>
                    <div className="tw:text-sm tw:text-amber-700">
                      <span className="tw:font-medium">Verify OTP</span> to
                      confirm delivery team has received the shipment
                    </div>
                  </div>
                </div>
                <AppButton onClick={() => setShowOtpModal(true)}>
                  Verify OTP
                </AppButton>
              </div>
            ) : (
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4 tw:text-green-600">
                <CheckCircle className="tw:w-5 tw:h-5" />
                <span className="tw:text-sm tw:font-medium">OTP Verified</span>
              </div>
            )}
          </>
        )}

        {shipment.shipmentType === "selfship" ? (
          <div className="tw:bg-blue-50 tw:p-4 tw:rounded-md tw:text-center tw:border tw:border-blue-300">
            <div className="tw:text-sm tw:font-medium tw:text-blue-800 tw:mb-2">
              Order is now with the delivery team
            </div>
            <div className="tw:text-sm tw:text-blue-500">
              Track delivery progress in the Last-Mile Delivery Dashboard
            </div>
            <div className="tw:mt-3 tw:flex tw:justify-center">
              <AppButton
                color="primary"
                fill="solid"
                size="small"
                onClick={() =>
                  nav.to("/dashboard/delivery/in-transit", {
                    tab: "in-transit",
                  })
                }
              >
                Open Delivery Dashboard
              </AppButton>
            </div>
          </div>
        ) : null}
      </AppCard>

      {/* OTP Verification Modal */}
      <OtpVerifyModal
        show={showOtpModal}
        callback={handleOtpModalCallback}
        shipmentId={shipment.shipmentId}
        invoiceRefId={invoiceRefId}
      />
    </>
  );
};

export default ShippedDetails;
