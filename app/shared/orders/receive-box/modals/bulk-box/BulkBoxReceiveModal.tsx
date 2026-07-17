import {
  CheckCircle,
  IndianRupee,
  Info,
  Layers,
  Package,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

const BulkBoxReceiveModal = ({
  show,
  callback,
  boxIds,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  // array of shipment/package ids (box ids)
  boxIds: string[];
}) => {
  const [display, setDisplay] = useState("overview");

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

  // store fetched package details keyed by boxId (refNo)
  const [fetchedPackages, setFetchedPackages] = useState<Record<string, any>>(
    {}
  );

  useEffect(() => {
    if (show) {
      setProcessing(false);
      setResults([]);
      setErrors([]);
      setDisplay("overview");
      setFetchedPackages({});
      fetchPackagesAndComputeSummary();
    }
  }, [show]);

  const fetchPackagesAndComputeSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const ids = boxIds || [];

      if (ids.length === 0) {
        setSummary({ products: 0, units: 0, value: 0 });
        setSummaryLoading(false);
        return;
      }

      // request all packages using refNo $in
      try {
        const params = { filter: { refNo: { $in: ids } } };
        const resp = await PurchaseOrderService.getPoPackages(
          AuthService.getLoggedInUserId(),
          params
        );

        const data = Array.isArray(resp?.data?.data) ? resp.data.data : [];

        // build map keyed by refNo for quick lookup
        const map: Record<string, any> = {};
        data.forEach((pkg: any) => {
          const key = pkg?.refNo;
          if (key) map[String(key)] = pkg;
        });

        // compute totals and set fetchedPackages in one update
        let totalProducts = 0;
        let totalUnits = 0;
        let totalValue = 0;
        const fetched: Record<string, any> = {};

        ids.forEach((boxId: string) => {
          const pkg = map[boxId] || {};
          fetched[boxId] = pkg;
          totalProducts += Number(pkg?.totalItems || 0);
          totalUnits += Number(pkg?.totalQuantity || 0);
          totalValue += Number(pkg?.totalValue || 0);
        });

        setFetchedPackages(fetched);
        setSummary({
          products: totalProducts,
          units: totalUnits,
          value: totalValue,
        });
      } catch (err: any) {
        // mark each requested id with fetch error
        const fetchedErr: Record<string, any> = {};
        (boxIds || []).forEach((boxId: string) => {
          fetchedErr[boxId] = { _fetchError: err?.message || "Fetch error" };
        });
        setFetchedPackages(fetchedErr);
        setSummary({ products: 0, units: 0, value: 0 });
        setSummaryError(err?.message || "Failed to fetch packages");
      }
    } catch (e: any) {
      setSummaryError(e?.message || "Failed to compute summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close", data: { results } });
  };

  const handleReceiveAll = async () => {
    setDisplay("processing");
    setProcessing(true);

    try {
      // collect all _id from fetchedPackages
      const fetchedMap: Record<string, any> = { ...fetchedPackages };
      const collectedIds = Object.keys(fetchedMap)
        .map((ref) => fetchedMap[ref]?._id)
        .filter(Boolean) as string[];

      if (collectedIds.length === 0) {
        // nothing to send
        const emptyResults = (boxIds || []).map((refId) => ({
          box: { boxNo: refId },
          status: "error",
          items: [],
          error: "Package not found or missing internal id",
        }));
        setResults(emptyResults);
        setDisplay("success");
        return;
      }

      // send array of ids to bulk receive API - service expects [{ shipmentId }]
      const payload = collectedIds.map((id) => ({ shipmentId: id }));
      const resp = await PurchaseOrderService.receiveBulkPackages(
        payload as any
      );
      const respData = Array.isArray(resp?.data?.data) ? resp.data.data : [];

      // Map response items by shipment/package id. Accept both 'shipmentId' and 'shpimentId' typos
      const respById: Record<string, any> = {};
      respData.forEach((it: any) => {
        const key = it?.shipmentId;
        if (key) respById[String(key)] = it;
      });

      // Build results aligned with original boxIds order
      const newResults: any[] = (boxIds || []).map((refId: string) => {
        const fetched = fetchedMap[refId] || {};
        const box = { boxNo: refId };
        const pkgId = fetched?._id;

        const items = (fetched.items || []).map((e: any) => ({
          name: e.name || e.dealName || "-",
          qty: Number(e.packageQuantity || e.quantity) || 0,
        }));

        if (!pkgId) {
          return {
            box,
            status: "error",
            items,
            error: fetched._fetchError || "Missing package id",
          };
        }

        const r = respById[String(pkgId)];
        if (!r) {
          return {
            box,
            status: "error",
            items,
            error: "No response from receive API",
          };
        }

        const statusStr = String(r?.status || "").toLowerCase();
        if (statusStr === "delivered") {
          return { box, status: "success", items };
        }

        return {
          box,
          status: "error",
          items,
          error:
            r.message || `Not delivered (status=${r?.status || "unknown"})`,
        };
      });

      setResults(newResults);
      setDisplay("success");
    } catch (err: any) {
      // Bulk API failed; surface an error for all boxes
      const fallback = (boxIds || []).map((refId) => ({
        box: { boxNo: refId },
        status: "error",
        items: (fetchedPackages[refId]?.items || []).map((e: any) => ({
          name: e.name || e.dealName || "-",
          qty: Number(e.packageQuantity || e.quantity) || 0,
        })),
        error: err?.message || "Bulk receive failed",
      }));
      setResults(fallback);
      setErrors([{ error: err?.message || "Bulk receive failed" }]);
      setDisplay("success");
    } finally {
      setProcessing(false);
    }
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
              You have selected {boxIds.length} boxes to receive. Please click
              the button below to receive all boxes.
            </div>

            <div className="tw:border tw:border-slate-200 tw:rounded tw:p-3">
              <div className="tw:text-xs tw:text-slate-500 tw:mb-2">
                Overview
              </div>
              {summaryLoading ? (
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppSpinner />
                  <div className="tw:text-sm tw:text-slate-600">
                    Calculating summary...
                  </div>
                </div>
              ) : summaryError ? (
                <div className="tw:text-sm tw:text-red-500">{summaryError}</div>
              ) : (
                <div className="tw:grid tw:grid-cols-2 md:tw:grid-cols-3 tw:gap-3">
                  <div className="tw:flex tw:items-center tw:bg-white tw:border tw:border-slate-100 tw:rounded tw:p-3 tw:overflow-hidden">
                    <div className="tw:flex-shrink-0 tw:p-2 tw:bg-indigo-50 tw:rounded tw:mr-3">
                      <Package className="tw:w-5 tw:h-5 tw:text-indigo-600" />
                    </div>
                    <div className="tw:min-w-0">
                      <div className="tw:text-xs tw:text-slate-500">
                        Products
                      </div>
                      <div
                        title={String(summary.products)}
                        className="tw:text-2xl tw:font-semibold tw:text-gray-900 tw:truncate tw:break-words"
                      >
                        {summary.products}
                      </div>
                    </div>
                  </div>

                  <div className="tw:flex tw:items-center tw:bg-white tw:border tw:border-slate-100 tw:rounded tw:p-3 tw:overflow-hidden">
                    <div className="tw:flex-shrink-0 tw:p-2 tw:bg-amber-50 tw:rounded tw:mr-3">
                      <Layers className="tw:w-5 tw:h-5 tw:text-amber-600" />
                    </div>
                    <div className="tw:min-w-0">
                      <div className="tw:text-xs tw:text-slate-500">Units</div>
                      <div
                        title={String(summary.units)}
                        className="tw:text-2xl tw:font-semibold tw:text-gray-900 tw:truncate tw:break-words"
                      >
                        {summary.units}
                      </div>
                    </div>
                  </div>

                  <div className="tw:flex tw:items-center tw:bg-white tw:border tw:border-slate-100 tw:rounded tw:p-3 tw:overflow-hidden tw:col-span-2">
                    <div className="tw:flex-shrink-0 tw:p-2 tw:bg-green-50 tw:rounded tw:mr-3">
                      <IndianRupee className="tw:w-5 tw:h-5 tw:text-green-600" />
                    </div>
                    <div className="tw:min-w-0">
                      <div className="tw:text-xs tw:text-slate-500">Value</div>
                      <div
                        title={String(summary.value)}
                        className="tw:text-2xl tw:font-semibold tw:text-gray-900 tw:truncate tw:break-words"
                      >
                        <span className="tw:inline-block tw:max-w-full tw:truncate">
                          <Amount value={summary.value} />
                        </span>
                      </div>
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
          <div className="tw:text-center tw:text-slate-600 tw:text-sm tw:py-8 tw:flex-col tw:items-center tw:justify-center tw:gap-2">
            <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-11">
              <AppSpinner />
            </div>
            <div>Please wait while we process the boxes...</div>
            <div className="tw:text-lg tw:font-bold">Processing boxes...</div>
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
                    <div className="tw:font-bold tw:text-gray-900 tw:flex tw:items-center tw:gap-2">
                      {r.status === "success" ? (
                        <CheckCircle
                          className="tw:w-5 tw:h-5 tw:text-green-600"
                          aria-label="success"
                        />
                      ) : (
                        <X
                          className="tw:w-5 tw:h-5 tw:text-red-500"
                          aria-label="error"
                        />
                      )}
                      <div className="tw:font-bold tw:text-gray-900">
                        Box ID: {r.box?.boxNo || "-"}
                      </div>
                    </div>
                    <div>
                      <AppBadge
                        variant={r.status === "success" ? "success" : "danger"}
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
                            className="tw:flex tw:justify-between tw:gap-2 tw:items-center tw:bg-slate-50 tw:px-3 tw:py-2 tw:rounded"
                          >
                            <div className="tw:text-gray-700 tw:text-xs">
                              {it.name}
                            </div>
                            <div className="tw:font-bold tw:text-xs">
                              Qty: {it.qty}
                            </div>
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
          <div className="tw:flex tw:justify-end tw:gap-2">
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
          </div>
        </AppModal.Footer>
      )}
      {display === "success" && (
        <AppModal.Footer>
          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton
              color="light"
              onClick={() =>
                callback({ action: "received", data: { results } })
              }
              fill="outline"
            >
              Close
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default BulkBoxReceiveModal;
