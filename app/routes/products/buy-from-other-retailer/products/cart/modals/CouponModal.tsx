import { useEffect, useState } from "react";
import { Ticket, Copy, Check } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import CouponService from "~/services/CouponService";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";

interface Props {
  show: boolean;
  cartId: string;
  callback: (data: { action: string; data?: any }) => void;
}

const CouponModal = ({ show, cartId, callback }: Props) => {
  const appToast = useAppToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string>("");

  const handleCopy = (code: string) => {
    if (!code) return;
    CommonService.copyToClipboard(code);
    setCopiedCode(code);
    appToast.show({ msg: `Copied ${code}`, color: "success" });
    setTimeout(() => setCopiedCode(""), 1500);
  };

  useEffect(() => {
    if (!show || !cartId) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await CouponService.getAvailableCartCoupons(cartId);
        const coupons = res?.data?.data?.coupons;
        if (mounted) setData(Array.isArray(coupons) ? coupons : []);
      } catch {
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [show, cartId]);

  const handleClose = () => callback({ action: "close" });

  const handleApply = (coupon: any) => {
    const code = coupon?.code;
    if (!code) return;
    callback({ action: "apply", data: { coupon, code } });
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

        {!loading && data.length === 0 && (
          <div className="tw:text-center tw:py-12 tw:text-gray-500">
            <Ticket className="tw:w-8 tw:h-8 tw:mx-auto tw:mb-2 tw:text-gray-300" />
            <div className="tw:text-sm">No coupons available for this cart</div>
          </div>
        )}

        <div className="tw:space-y-2" role="list">
          {!loading &&
            data.map((item: any, idx: number) => {
              const code = item?.code;
              const description = item?.title;
              const validity = item?.validTill;
              const discountValue = item?.discountValue;
              const isPercent = item?.discountKind === "PERCENT";
              const maxDiscountPerUse = item?.maxDiscountPerUse;

              return (
                <div
                  key={code || idx}
                  className="tw:bg-gray-50 tw:p-3 tw:rounded-lg tw:border tw:border-dashed tw:border-gray-300 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:hover:bg-gray-100 tw:transition-colors"
                  role="listitem"
                >
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                      <Ticket
                        className="tw:w-4 tw:h-4 tw:text-blue-600 tw:shrink-0"
                        strokeWidth={2.25}
                      />
                      <span className="tw:font-semibold tw:text-sm tw:truncate">
                        {code || "-"}
                      </span>
                      {code && (
                        <button
                          type="button"
                          onClick={() => handleCopy(code)}
                          className="tw:shrink-0 tw:text-gray-400 tw:hover:text-blue-600 tw:transition-colors"
                          aria-label={`Copy coupon ${code}`}
                          title="Copy code"
                        >
                          {copiedCode === code ? (
                            <Check
                              className="tw:w-3.5 tw:h-3.5 tw:text-green-600"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Copy
                              className="tw:w-3.5 tw:h-3.5"
                              strokeWidth={2.25}
                            />
                          )}
                        </button>
                      )}
                      {discountValue != null && (
                        <span className="tw:text-xs tw:font-medium tw:text-green-700 tw:bg-green-50 tw:px-1.5 tw:py-0.5 tw:rounded">
                          {isPercent ? (
                            <>
                              {discountValue}% off
                              {maxDiscountPerUse != null && (
                                <>
                                  {" "}
                                  up to{" "}
                                  <Amount value={Number(maxDiscountPerUse)} />
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <Amount value={Number(discountValue)} /> off
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    {description && (
                      <div className="tw:text-xs tw:text-gray-600 tw:truncate">
                        {description}
                      </div>
                    )}
                    {validity && (
                      <div className="tw:text-[11px] tw:text-red-500 tw:mt-0.5">
                        Expires:{" "}
                        <DateFormat value={validity} formatStr="dd MMM yyyy" />
                      </div>
                    )}
                  </div>
                  <AppButton
                    size="small"
                    onClick={() => handleApply(item)}
                    className="tw:px-3 tw:py-1 tw:text-xs tw:shrink-0"
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
