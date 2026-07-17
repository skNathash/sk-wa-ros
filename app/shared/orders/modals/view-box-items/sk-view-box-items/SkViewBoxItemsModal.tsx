import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppBadge from "~/components/core/badge/AppBadge";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import SellerCatalogService from "~/services/SellerCatalogService";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";

const SkViewBoxItemsModal = ({
  show,
  callback,
  boxId,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  boxId?: string | null | number;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<any | null>(null);

  useEffect(() => {
    if (show) {
      fetchPackage();
    } else {
      // clear on hide
      setPackageData(null);
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
      const res = await PurchaseOrderService.getPoPackages(String(boxId));
      const data = res?.data?.data || null;
      if (!data) {
        setError("No package data found");
      } else {
        // Normalize items and enrich with locations from catalog
        const pkg = Array.isArray(data) && data.length > 0 ? data[0] : {};
        const items = Array.isArray(pkg.items) ? pkg.items : [];

        // Collect dealIds and fetch catalog to get locations
        const dealIds: string[] = (items || [])
          .map((e: any) => e?.dealId)
          .filter(Boolean);

        let idToLocations: Record<string, any[]> = {};
        if (dealIds.length > 0) {
          try {
            const catalogResp = await SellerCatalogService.getProducts({
              filter: { dealRefId: { $in: dealIds } },
              count: dealIds.length,
            });
            const deals = catalogResp?.data?.data || [];
            deals.forEach((d: any) => {
              const key = d?.dealRefId;
              if (key) {
                idToLocations[key] = d?.locations || [];
              }
            });
          } catch (_) {
            // ignore catalog errors; continue with base data
          }
        }

        const enrichedItems = (items || []).map((e: any) => ({
          ...e,
          dealName: e.name,
          packageQuantity: e.quantity || 0,
          mrp: e.mrp,
          price: e.price,
          snapshots: e.snapshots || [],
          barcode: e.snapshots?.[0]?.barcode || "",
          locations: idToLocations[e?.dealId] || [],
        }));

        const enrichedData = Array.isArray(data)
          ? enrichedItems
          : { ...pkg, items: enrichedItems };

        setPackageData(enrichedData);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch package details");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} backdropDismiss={!loading}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-bold">View Box Items</div>
      </AppModal.Title>

      <AppModal.Content>
        {loading && (
          <div className="tw:flex tw:items-center tw:justify-center tw:flex-col tw:gap-3 tw:py-6">
            <AppSpinner />
            <div className="tw:text-sm tw:text-slate-600">
              Loading box items...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="tw:text-sm tw:text-red-500">{error}</div>
        )}

        {!loading && !error && packageData && (
          <div className="tw:text-sm tw:text-slate-700">
            <div className="tw:mb-3 tw:font-medium">
              BOX ID: {packageData?.packageId || "-"}
            </div>

            <AppScrollArea className="tw:h-[300px]">
              <div className="tw:space-y-3">
                {(packageData?.packages || []).map((p: any, idx: number) => (
                  <div
                    key={p.dealId || idx}
                    className="tw:border tw:border-slate-200 tw:p-3 tw:rounded"
                  >
                    <div className="tw:flex tw:justify-between tw:items-center">
                      <div className="tw:font-semibold tw:text-gray-900">
                        {p.dealName || "-"}
                      </div>
                      <div>
                        <AppBadge variant="primary">
                          Qty {p.packageQuantity || 0}
                        </AppBadge>
                      </div>
                    </div>

                    <div className="tw:mt-2 tw:text-xs tw:text-slate-600">
                      MRP: {p.dealMrp ?? "-"} | B2B Price:{" "}
                      {p.packageB2bPrice ?? "-"}
                    </div>

                    {p.barcodes && p.barcodes.length > 0 && (
                      <div className="tw:mt-2 tw:text-xs tw:text-slate-600">
                        Barcodes:{" "}
                        {p.barcodes
                          .map((b: any) => b.barcode?.[0] || "-")
                          .join(", ")}
                      </div>
                    )}

                    {Array.isArray(p.locations) && p.locations.length > 0 && (
                      <div className="tw:mt-3">
                        <LocationsBlock locations={p.locations} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AppScrollArea>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default SkViewBoxItemsModal;
