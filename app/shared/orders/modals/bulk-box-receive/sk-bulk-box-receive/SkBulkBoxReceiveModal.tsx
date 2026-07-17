import { CheckCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import OmsService from "~/services/OmsService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

const SkBulkBoxReceiveModal = ({
  show,
  callback,
  boxes,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  boxes: any[];
}) => {
  const [display, setDisplay] = useState("overview");

  const [scannedCount, setScannedCount] = useState(0);

  const [processing, setProcessing] = useState(false);

  const [errors, setErrors] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  // overview summary state
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<{
    products: number;
    units: number;
    value: number;
  }>({
    products: 0,
    units: 0,
    value: 0,
  });
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setScannedCount(0);
      setProcessing(false);
      setResults([]);
      setErrors([]);
      setDisplay("overview");
      // compute overview summary
      computeOverviewSummary();
    }
  }, [show]);

  const computeOverviewSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const productIds = new Set<string>();
      let totalUnits = 0;
      let totalValue = 0;

      const tasks = (boxes || []).map(async (box: any) => {
        try {
          const resp = await PurchaseOrderService.getPoPackages(box?.boxNo);
          const data = resp?.data?.data || {};
          const pkg = Array.isArray(data) ? data[0] || {} : data || {};
          const packages = pkg?.items || [];
          packages.forEach((e: any) => {
            const qty = Number(e?.packageQuantity) || 0;
            const price = Number(e?.packageB2bPrice) || 0;
            const dealId = e?.dealId;
            if (dealId) productIds.add(String(dealId));
            totalUnits += qty;
            totalValue += qty * price;
          });
        } catch (_) {
          // ignore per-box errors in summary, continue best-effort
        }
      });

      await Promise.all(tasks);

      setSummary({
        products: productIds.size,
        units: totalUnits,
        value: totalValue,
      });
    } catch (e: any) {
      setSummaryError(e?.message || "Failed to compute summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleReceiveAll = () => {
    let index = 0;
    setDisplay("processing");
    setScannedCount(1);
    setProcessing(true);

    const process = async () => {
      const box = boxes[index];

      const packageResponse = await PurchaseOrderService.getPoPackages(
        box?.boxNo
      );

      const data = packageResponse?.data?.data || {};
      const packageData = Array.isArray(data) ? data[0] || {} : data || {};

      if (!packageData?.orderId) {
        // record error for this box and continue
        const err = { box: box, error: "Order ID not found" };
        setErrors((prev) => [...prev, err]);
        setResults((prev) => [
          ...prev,
          { box: box, status: "error", items: [], error: err.error },
        ]);
        const next = index + 1;
        setScannedCount(next);
        if (next < boxes.length) {
          index = next;
          process();
        } else {
          setProcessing(false);
          setDisplay("success");
        }
        return;
      }

      const orderId = packageData?.orderId;

      const packages = packageData?.items || [];

      let payload = {
        invoiceId: box?.actualInvoiceNo || "",
        packageId: box?.boxNo || "",
        items: packages.map((e: any) => ({
          dealId: e.dealId,
          dealRefId: e.dealRefId,
          dealName: e.name || e.dealName || "",
          receivedQuantity: Number(e.quantity || e.packageQuantity) || 0,
          invoiceQuantity: Number(e.quantity || e.packageQuantity) || 0,
          damagedQuantity: 0,
          damagedImages: Array.isArray(e.snapshots) ? e.snapshots : [],
          shortageQuantity: 0,
          mrp: Number(e.mrp) || 0,
          purchasePrice:
            Number(e.price || e.purchasePrice || e.packageB2bPrice) || 0,
          tax: Number(e.tax) || 0,
          cgst: Number(e.cgst) || 0,
          sgst: Number(e.sgst) || 0,
          remarks: "",
          barcode: e.snapshots?.[0]?.barcode || e.barcode || "",
        })),
        remarks: "",
      };

      const response = await PurchaseOrderService.submitSkOrderReceipt(
        orderId,
        payload
      );

      if (response.statusCode !== 200) {
        const err = { box: box, error: response.data?.message || "Error" };
        setErrors((prev) => [...prev, err]);
        setResults((prev) => [
          ...prev,
          { box: box, status: "error", items: [], error: err.error },
        ]);
      } else {
        // map items for summary
        const packages = packageData?.items || [];
        const items = packages.map((e: any) => ({
          name: e.name || e.dealName || e.dealId || "-",
          qty: Number(e.quantity || e.packageQuantity) || 0,
        }));

        setResults((prev) => [
          ...prev,
          { box: box, status: "success", items: items },
        ]);
      }

      const next = index + 1;
      setScannedCount(next);
      if (next < boxes.length) {
        index = next;
        process();
      } else {
        setProcessing(false);
        setDisplay("success");
      }
    };

    process();
  };

  return (
    <AppModal show={show} callback={callback} backdropDismiss={!processing}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-bold">
          {display === "overview"
            ? "Bulk Receive Boxes"
            : display === "processing"
            ? "Processing Boxes"
            : "Bulk Receive Summary"}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        {display === "overview" && (
          <div className="tw:space-y-3">
            <div className="tw:text-sm tw:text-gray-500">
              You have selected {boxes.length} boxes to receive. Please click
              the button below to receive all boxes.
            </div>

            <div className="tw:border tw:border-slate-200 tw:rounded tw:p-3">
              <div className="tw:text-xs tw:text-slate-500 tw:mb-2">
                Overview
              </div>
              {summaryLoading ? (
                <div className="tw:text-sm tw:text-slate-600">
                  Calculating summary...
                </div>
              ) : summaryError ? (
                <div className="tw:text-sm tw:text-red-500">{summaryError}</div>
              ) : (
                <div className="tw:grid tw:grid-cols-3 tw:gap-3">
                  <div className="tw:bg-slate-50 tw:rounded tw:p-3">
                    <div className="tw:text-xs tw:text-slate-500">
                      Total Products
                    </div>
                    <div className="tw:text-lg tw:font-bold tw:text-gray-900">
                      {summary.products}
                    </div>
                  </div>
                  <div className="tw:bg-slate-50 tw:rounded tw:p-3">
                    <div className="tw:text-xs tw:text-slate-500">
                      Total Units
                    </div>
                    <div className="tw:text-lg tw:font-bold tw:text-gray-900">
                      {summary.units}
                    </div>
                  </div>
                  <div className="tw:bg-slate-50 tw:rounded tw:p-3">
                    <div className="tw:text-xs tw:text-slate-500">
                      Total Value
                    </div>
                    <div className="tw:text-lg tw:font-bold tw:text-gray-900">
                      <Amount value={summary.value} />
                    </div>
                  </div>
                </div>
              )}
              <div className="tw:flex tw:items-start tw:gap-2 tw:mt-3 tw:text-xs tw:text-slate-600">
                <Info className="tw:w-4 tw:h-4" />
                <span>All items will be marked Good and fully inwarded.</span>
              </div>
            </div>
          </div>
        )}

        {display === "processing" && (
          <div className="tw:text-center tw:text-slate-600 tw:text-sm tw:py-8 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2">
            <AppSpinner />
            <div>Please wait while we process the boxes...</div>
            <div className="tw:text-lg tw:font-bold">
              Scanned {scannedCount} of {boxes.length} boxes
            </div>
          </div>
        )}

        {display === "success" && (
          <AppScrollArea className="tw:text-sm tw:text-slate-600 tw:h-[300px]">
            <div className="tw:space-y-3">
              {results.map((r: any, idx: number) => (
                <div
                  key={r.box?.boxNo || idx}
                  className="tw:border tw:border-slate-200 tw:p-3 tw:rounded"
                >
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <div className="tw:font-bold tw:text-gray-900">
                      Box ID: {r.box?.boxNo || r.box?.packageId || "-"}
                    </div>
                    <div>
                      <AppBadge
                        variant={r.status === "success" ? "primary" : "danger"}
                      >
                        {r.status === "success" ? "Success" : "Error"}
                      </AppBadge>
                    </div>
                  </div>

                  {r.status === "error" && r.error && (
                    <div className="tw:text-xs tw:text-red-500 tw:mt-1">
                      {r.error}
                    </div>
                  )}

                  {r.items && r.items.length > 0 && (
                    <div className="tw:mt-2 tw:text-sm">
                      <div className="tw:font-semibold tw:mb-2">
                        Items processed ({r.items.length})
                      </div>
                      <div className="tw:space-y-2">
                        {r.items.map((it: any, i: number) => (
                          <div
                            key={i}
                            className="tw:flex tw:justify-between tw:items-center tw:bg-slate-50 tw:px-3 tw:py-2 tw:rounded"
                          >
                            <div className="tw:text-gray-700">{it.name}</div>
                            <div className="tw:font-bold">{it.qty}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AppScrollArea>
        )}
      </AppModal.Content>
      {display === "overview" && (
        <AppModal.Footer>
          <AppButton
            color="light"
            onClick={handleClose}
            fill="outline"
            isLoading={processing}
          >
            <X className="tw:w-4 tw:h-4" />
            Cancel
          </AppButton>
          <AppButton
            color="success"
            onClick={handleReceiveAll}
            isLoading={processing}
          >
            <CheckCircle className="tw:w-4 tw:h-4" />
            Receive All
          </AppButton>
        </AppModal.Footer>
      )}
      {display === "success" && (
        <AppModal.Footer>
          <AppButton
            color="light"
            onClick={() => callback({ action: "received", data: { results } })}
            fill="outline"
          >
            Close
          </AppButton>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default SkBulkBoxReceiveModal;
