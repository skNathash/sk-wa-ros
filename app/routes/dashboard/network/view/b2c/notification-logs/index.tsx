import { useEffect, useState } from "react";
import { useParams } from "react-router";
import CustomerService from "~/services/CustomerService";
import NotificationLogs from "~/shared/notifications/logs/NotificationLogs";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

const NotificationLogsPage = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [mobileNo, setMobileNo] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true);
        try {
          const resp = await CustomerService.getCustomer(id);
          const userData = resp?.data?.data || null;
          setMobileNo(userData?.mobile);
          setEmail(userData?.email);
        } catch (e) {
          setMobileNo(null);
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }
  }, [id]);

  return (
    <>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
          <AppSpinner />
        </div>
      ) : (
        <>
          {mobileNo && id ? (
            <NotificationLogs userId={id} mobileNo={mobileNo} type="b2c" email={email} />
          ) : (
            <div className="tw:text-center tw:text-gray-500">
              Customer not found
            </div>
          )}
        </>
      )}
    </>
  );
};

export default NotificationLogsPage;
