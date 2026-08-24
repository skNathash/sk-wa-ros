import { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppLink from "~/components/core/link/AppLink";
import { Check } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import AuthService from "~/services/AuthService";
import AppButton from "~/components/core/button/AppButton";
import ReceiveBoxFlow from "~/shared/purchase-order/components/receive-box-flow/ReceiveBoxFlow";

const ViewBoxItemsModal = ({
  show,
  callback,
  boxId,
  allowReceive = false,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  boxId?: string | null | number;
  /**
   * Opt in to the receive action in the footer. Off by default — only surfaces
   * that own the yet-to-receive feed (purchase-order/not-received) turn it on;
   * everywhere else this modal stays read-only.
   */
  allowReceive?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<any | null>(null);

  useEffect(() => {
    if (show) {
      fetchPackage();
    } else {
      setPkg(null);
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, boxId]);

  const fetchPackage = async () => {
    if (!boxId) {
      setError("Box ID not provided");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await PurchaseOrderService.getPoPackages(
        AuthService.getLoggedInUserId(),
        {
          filter: {
            refNo: boxId,
          },
        }
      );
      const data = res?.data?.data || null;
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("No package data found");
        setPkg(null);
      } else {
        // API returns array of packages; pick first
        const first = Array.isArray(data) ? data[0] : data;
        setPkg(first);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch package details");
      setPkg(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  // "Shipped" is the only state a box can still be received from; anything
  // else (already received, short, closed) gets no receive button.
  const canReceive = allowReceive && pkg?.status === "Shipped";

  return (
    <AppModal
      show={show}
      callback={callback}
      backdropDismiss={!loading}
      className="tw:max-h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-bold tw:text-slate-900">
          Box details
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {loading && (
          <div className="tw:flex tw:items-center tw:justify-center tw:flex-col tw:gap-3 tw:h-full">
            <AppSpinner />
            <div className="tw:text-sm tw:text-slate-500">Loading box...</div>
          </div>
        )}

        {!loading && error && (
          <div className="tw:p-4">
            <div className="tw:w-full tw:py-4 tw:px-3 tw:bg-red-50 tw:text-sm tw:text-red-700 tw:rounded tw:border tw:border-red-100">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && pkg && (
          <div className="tw:space-y-5">
            {/* Box Summary Card */}
            <div className="tw:bg-white tw:rounded-lg tw:border tw:border-slate-200 tw:shadow-sm tw:overflow-hidden">
              <div className="tw:p-4">
                <div className="tw:flex tw:justify-between tw:items-start tw:gap-4 tw:mb-4">
                  <div>
                    <div className="tw:text-xs tw:text-slate-500 tw:uppercase tw:tracking-wider tw:font-semibold">
                      Box Number
                    </div>
                    <div className="tw:text-lg tw:font-bold tw:text-slate-900 tw:mt-0.5">
                      {pkg?.refNo || "-"}
                    </div>
                    <div className="tw:mt-1 tw:text-sm tw:text-slate-600">
                      from{" "}
                      {pkg?.from?.name ? (
                        <AppLink
                          asLink
                          href={`/dashboard/vendor/view/${pkg?.from?.id}`}
                          className="tw:text-blue-600 tw:font-medium hover:tw:underline"
                        >
                          {pkg.from.name}
                        </AppLink>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  <div className="tw:text-right">
                    <div className="tw:text-xs tw:text-slate-500 tw:uppercase tw:tracking-wider tw:font-semibold">
                      Order ID
                    </div>
                    <div className="tw:mt-0.5">
                      {pkg?.orderData?.refId ? (
                        <AppLink
                          asLink
                          href={
                            pkg.from?.type === "SELLER"
                              ? `/dashboard/orders/view/${pkg?.orderData?.id}`
                              : `/dashboard/purchase-order/view/${pkg?.orderData?.id}`
                          }
                          className="tw:text-blue-600 tw:font-medium hover:tw:underline"
                        >
                          {pkg.orderData.refId}
                        </AppLink>
                      ) : (
                        <span className="tw:text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:pt-3 tw:border-t tw:border-slate-100">
                  <div>
                    <div className="tw:text-xs tw:text-slate-500">
                      Shipped On
                    </div>
                    <div className="tw:text-sm tw:font-medium tw:text-slate-800">
                      {pkg?.createdAt ? (
                        <DateFormat value={pkg?.createdAt} />
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                  <div className="tw:text-right">
                    <div className="tw:text-xs tw:text-slate-500">
                      Invoice No
                    </div>
                    <div className="tw:text-sm tw:font-medium tw:text-slate-800">
                      {pkg?.invoiceData?.refId || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Totals Footer */}
              <div className="tw:bg-slate-50 tw:px-4 tw:py-3 tw:flex tw:justify-between tw:items-center tw:border-t tw:border-slate-200">
                <div>
                  <span className="tw:text-sm tw:text-slate-600">Items:</span>{" "}
                  <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
                    {pkg?.totalItems || 0}
                  </span>
                  <span className="tw:text-xs tw:text-slate-500 tw:ml-1">
                    ({pkg?.totalQuantity ?? 0} units)
                  </span>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-sm tw:text-slate-600">
                    Total Value:
                  </span>
                  <span className="tw:text-base tw:font-bold tw:text-emerald-600">
                    <Amount value={pkg?.totalValue ?? 0} />
                  </span>
                </div>
              </div>
            </div>

            {/* Received Status Banner */}
            {pkg?.receivedOn && (
              <div className="tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded-lg tw:p-3 tw:flex tw:items-center tw:gap-3">
                <div className="tw:flex-shrink-0 tw:h-8 tw:w-8 tw:rounded-full tw:bg-emerald-100 tw:flex tw:items-center tw:justify-center">
                  <Check size={16} className="tw:text-emerald-600" />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-bold tw:text-emerald-800">
                    Received
                  </div>
                  <div className="tw:text-xs tw:text-emerald-700">
                    on <DateFormat value={pkg?.receivedOn} />
                    {pkg?.receivedBy?.name && (
                      <span> by {pkg.receivedBy.name}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div>
              <div className="tw:text-sm tw:font-bold tw:text-slate-800 tw:mb-2 tw:px-1">
                Box Content
              </div>
              <div className="tw:bg-white tw:border tw:border-slate-200 tw:rounded-lg tw:overflow-hidden">
                {(pkg?.items || []).length > 0 ? (
                  <div className="tw:divide-y tw:divide-slate-100">
                    {(pkg?.items || []).map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="tw:p-3 hover:tw:bg-slate-50 tw:transition-colors"
                      >
                        <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                          <div className="tw:flex-1 tw:min-w-0">
                            <AppLink
                              asLink
                              href={`/dashboard/inventory/products/view/${it.dealId}`}
                              className="tw:text-sm tw:font-medium tw:text-slate-900 hover:tw:underline tw:line-clamp-2"
                            >
                              {it.name || "Unknown Item"}
                            </AppLink>
                            <div className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                              Ref ID: {it.dealRefId || "-"}
                            </div>
                          </div>
                          <div className="tw:text-right flex-shrink-0">
                            <div className="tw:inline-flex tw:items-center tw:bg-blue-50 tw:text-blue-700 tw:text-xs tw:font-semibold tw:px-2 tw:py-0.5 tw:rounded-md tw:border tw:border-blue-100">
                              x{it.quantity ?? 0}
                            </div>
                          </div>
                        </div>

                        <div className="tw:flex tw:items-center tw:justify-between tw:mt-2 tw:text-xs">
                          <div className="tw:text-slate-500">
                            Unit Price:{" "}
                            <span className="tw:font-medium tw:text-slate-700">
                              <Amount value={it.price} className="tw:inline" />
                            </span>
                          </div>
                          <div className="tw:text-slate-500">
                            MRP:{" "}
                            <span className="tw:font-medium tw:text-slate-700">
                              <Amount value={it.mrp} className="tw:inline" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tw:p-6 tw:text-center tw:text-sm tw:text-slate-500">
                    No items found in this box.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleClose}
            disabled={loading}
            color="light"
            fill="outline"
          >
            Close
          </AppButton>

          {canReceive && (
            <ReceiveBoxFlow
              // The receive flow needs orderIdToProcess / isNonSkVendor, which
              // the raw package response doesn't carry.
              data={PurchaseOrderService.formatPoDashboardSummary(pkg)}
              onReceived={() => callback({ action: "received", data: pkg })}
            >
              <AppButton color="primary">Received</AppButton>
            </ReceiveBoxFlow>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ViewBoxItemsModal;
