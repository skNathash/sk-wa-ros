import { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { ProductService } from "~/services/ProductService";
import DateFormat from "~/components/core/date/DateFormat";
import useAppToast from "~/hooks/useAppToast";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

interface Props {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
}

const CouponModal = ({ show, callback }: Props) => {
  const appToast = useAppToast();

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!show) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await ProductService.getCoupons({
          page: 1,
          count: 300,
          filter: {
            status: {
              $in: ["Active", "PartiallyRedeemed", "Approved"],
            },
          },
        });

        // API expected shape: [{ coupon: { couponCode, couponValidity, description } }]
        const list = Array.isArray(res?.data) ? res.data : [];
        if (mounted) setData(list);
      } catch (err) {
        // swallow; parent can show toast if needed via callback
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleApply = (coupon: any) => {
    const c = coupon?.coupon || {};
    const code = c?.couponCode || "";

    if (!code) {
      appToast.show({ msg: "Invalid coupon data", color: "danger" });
      return;
    }

    callback({ action: "apply", data: { coupon: c, couponCode: code } });
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">Available Coupons</div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[70vh]">
        {loading && (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
            <AppSpinner />
          </div>
        )}

        {!loading && (!data || data.length === 0) && (
          <div className="tw:text-center tw:py-12 tw:text-gray-500">
            <div className="tw:text-sm">No coupons available</div>
          </div>
        )}

        <div className="tw:space-y-2" role="list">
          {!loading &&
            Array.isArray(data) &&
            data.map((item: any, idx: number) => {
              const c = item?.coupon || {};
              const key = c?.couponCode;
              return (
                <div
                  key={key}
                  className="tw:bg-gray-50 tw:p-3 tw:rounded-lg tw:border tw:border-gray-200 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:hover:bg-gray-100 tw:transition-colors"
                  role="listitem"
                >
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:mb-1">
                      <span className="tw:font-semibold tw:text-base tw:truncate">
                        {c?.couponCode || "-"}
                      </span>
                    </div>
                    <div className="tw:mb-1">
                      <span className="tw:text-xs tw:text-red-500 tw:font-medium">
                        Expires:{" "}
                        <DateFormat
                          value={c?.couponValidity}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                    </div>
                    {c?.description && (
                      <div className="tw:text-xs tw:text-gray-600 tw:truncate">
                        {c.description}
                      </div>
                    )}
                  </div>
                  <AppButton
                    size="small"
                    onClick={() => handleApply(item)}
                    className="tw:px-3 tw:py-1 tw:text-xs"
                  >
                    Apply
                  </AppButton>
                </div>
              );
            })}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default CouponModal;
