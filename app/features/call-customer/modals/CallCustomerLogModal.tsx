import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CustomerService from "~/services/CustomerService";
import CallCustomerLogs from "../components/CallCustomerLogs";
import useAppToast from "~/hooks/useAppToast";
import { PhoneCall, User } from "lucide-react";
import CommonService from "~/services/CommonService";

type Props = {
  show: boolean;
  customerId: string;
  callback: (a: { action: string; data: any }) => void;
};

const CallCustomerLogModal = ({ show, customerId, callback }: Props) => {
  const appToast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    CommonService.isOzonetelLoggedIn()
  );
  const [dailing, setDailing] = useState(false);

  useEffect(() => {
    if (show) {
      const fetchCustomer = async () => {
        setLoading(true);
        const res = await CustomerService.getCustomer(customerId);
        setCustomer(res.data);
        setLoading(false);
      };
      fetchCustomer();
    }
  }, [show]);

  const onClose = () => {
    callback({
      action: "close",
      data: null,
    });
  };

  const handleDial = async () => {
    setDailing(true);
    const r = await CustomerService.callToCustomer({
      customerId: customerId,
    });
    setDailing(false);
    if (r.statusCode == 200) {
      if (r.data?.status !== "Failed") {
        appToast.show({
          msg: "Call to customer initiated successfully",
          color: "success",
        });
      } else {
        appToast.show({
          msg: r.data?.message || "Failed to initiate call",
          color: "danger",
        });
      }
    } else {
      appToast.show({
        msg: r.data?.message || "Failed to initiate call",
        color: "danger",
      });
    }
  };

  const handleLoginToCall = () => {
    CommonService.attachOzonetelIframe();
    setIsLoggedIn(true);
    callback({
      action: "close",
      data: null,
    });
  };

  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:!max-w-4xl tw:max-h-[90vh] tw:overflow-y-auto"
    >
      <AppModal.Title onClose={onClose} noShadow>
        <span className="tw:font-semibold">Customer Call Logs</span>
      </AppModal.Title>
      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && customer ? (
          <>
            <div className="tw:bg-gray-50 tw:rounded-lg tw:p-4 tw:mb-4 tw:border tw:border-gray-200">
              <div className="tw:flex tw:justify-between tw:gap-2 tw:mb-2">
                <div className="tw:text-lg tw:font-bold tw:mb-2 tw:flex tw:items-center tw:gap-2">
                  <User className="tw:mr-1" />
                  {customer.fName} {customer.lName}
                </div>
                <div>
                  {isLoggedIn ? (
                    <AppButton
                      size="small"
                      color="primary"
                      onClick={handleDial}
                      disabled={dailing}
                    >
                      <PhoneCall />
                      {dailing ? "Dialing..." : "Call To Customer"}
                    </AppButton>
                  ) : (
                    <AppButton
                      color="light"
                      fill="outline"
                      size="small"
                      onClick={handleLoginToCall}
                    >
                      Login to Call
                    </AppButton>
                  )}
                </div>
              </div>
              <div className="tw:flex tw:gap-4">
                <KeyValue label="ID" size="sm" horizontal>
                  : {customer._id}
                </KeyValue>
                <KeyValue label="Mobile" size="sm" horizontal>
                  : {customer.mobile}
                </KeyValue>
              </div>
            </div>

            <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
              <div className="tw:text-lg tw:font-bold tw:mb-2">Call Logs</div>
              <CallCustomerLogs customerId={customerId} />
            </div>
          </>
        ) : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default CallCustomerLogModal;
