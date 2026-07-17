import React, { useEffect, useState } from "react";
import { User, Phone, Mail, Link2 } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import KeyValue from "~/components/core/key-value/KeyValue";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import CustomerService from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";

interface LinkCustomerRetailerModalProps {
  show: boolean;
  cid: string;
  callback: (result: { action: string; data?: any }) => void;
}

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  customerId: string;
  referenceId: string;
}

const LinkCustomerRetailerModal: React.FC<LinkCustomerRetailerModalProps> = ({
  show,
  cid,
  callback,
}) => {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [alertDialog, setAlertDialog] = useState(false);

  useEffect(() => {
    if (show && cid) {
      fetchCustomer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, cid]);

  const fetchCustomer = async () => {
    setLoading(true);
    setFetchError(false);
    setCustomer(null);
    try {
      const resp = await CustomerService.getCustomer(cid);
      const data = resp?.data?.data || resp?.data;
      if (data) {
        setCustomer({
          name: data.name || data.fullName || "",
          phone: data.phone || data.mobile || "",
          email: data.email || "",
          customerId: data._id || data.id || cid,
          referenceId: data.referenceId || "",
        });
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    setAlertDialog(false);
    setLinking(true);
    try {
      const franchiseId = AuthService.getLoggedInUserId();
      const response = await CustomerService.linkCustomerToFranchise(cid, franchiseId);
      if (response?.statusCode === 200) {
        toast.show({ msg: "Customer linked successfully", color: "success" });
        callback({ action: "success", data: response });
      } else {
        toast.show({
          msg: response?.message || "Something went wrong. Please try again.",
          color: "error",
        });
      }
    } catch (err: any) {
      toast.show({
        msg: err?.message || "Something went wrong. Please try again.",
        color: "error",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleClose = () => {
    setCustomer(null);
    setFetchError(false);
    callback({ action: "close" });
  };

  return (
    <>
      <AppModal show={show} callback={() => handleClose()}>
        <AppModal.Title onClose={handleClose}>
          <span className="tw:text-base tw:font-semibold">Link Customer to Store</span>
        </AppModal.Title>

        <AppModal.Content>
          {loading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:py-10">
              <BusyLoader show />
            </div>
          ) : fetchError || !customer ? (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-10 tw:text-gray-500">
              <User size={36} className="tw:mb-2 tw:text-gray-300" />
              <p className="tw:text-sm">Customer details not available</p>
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:gap-3">
              {/* Customer Identity */}
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:bg-primary/10 tw:text-primary tw:shrink-0">
                  <User size={18} />
                </div>
                <div className="tw:min-w-0">
                  <p className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                    {customer.name || "-"}
                  </p>
                  <p className="tw:text-xs tw:text-gray-500 tw:truncate">
                    ID: {customer.referenceId}
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50/50 tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-2">
                <KeyValue label="Phone" horizontal size="sm" icon={Phone}>
                  {customer.phone || "-"}
                </KeyValue>
                <KeyValue label="Email" horizontal size="sm" icon={Mail}>
                  {customer.email || "-"}
                </KeyValue>
              </div>

              {/* Info Banner */}
              <div className="tw:rounded-md tw:bg-blue-50 tw:border tw:border-blue-100 tw:px-3 tw:py-2 tw:flex tw:items-start tw:gap-2">
                <Link2 size={14} className="tw:text-blue-500 tw:mt-0.5 tw:shrink-0" />
                <p className="tw:text-xs tw:text-blue-700 tw:leading-relaxed">
                  This customer is already registered. Linking them will add
                  them to your store's customer base.
                </p>
              </div>
            </div>
          )}
        </AppModal.Content>

        {!loading && (
          <AppModal.Footer>
            <div className="tw:flex tw:gap-2 tw:w-full">
              <AppButton
                type="button"
                fill="outline"
                size="small"
                onClick={handleClose}
                className="tw:flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                size="small"
                onClick={() => setAlertDialog(true)}
                className="tw:flex-1"
                disabled={loading || fetchError || !customer || linking}
              >
                {linking ? "Linking..." : "Link Customer"}
              </AppButton>
            </div>
          </AppModal.Footer>
        )}
      </AppModal>

      <AppAlertDialog
        title="Link Customer"
        description="Are you sure you want to link this customer to your network?"
        show={alertDialog}
        onConfirm={handleLink}
        onCancel={() => setAlertDialog(false)}
      />
    </>
  );
};

export default LinkCustomerRetailerModal;
