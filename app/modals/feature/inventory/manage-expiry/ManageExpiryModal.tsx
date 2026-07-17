import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import LocationInput from "~/components/feature/inventory/location-input/LocationInput";
import { RACK_BIN_LOCATION_NON_SELLABLE } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";

const ManageExpiryModal = ({
  show,
  callback,
  data,
  binId,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  data?: any[];
  binId?: string;
}) => {
  const { show: showToast } = useAppToast();
  const { t } = useTranslation(["common"]);
  // Local copy of data when modal opens. Each item gets destination and isMoved flags
  const [localData, setLocalData] = useState<any[]>([]);

  useEffect(() => {
    if (show) {
      setLocalData(
        (data || []).map((d: any) => ({
          ...d,
          destination: d.destination || null,
          isMoved: d.isMoved || false,
          loading: d.loading || false,
          // per-item open state for toggling the form block
          isOpen: d.isOpen !== undefined ? d.isOpen : false,
        }))
      );
    }
  }, [show, data]);

  const toggleOpen = (idx: number) => {
    setLocalData((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, isOpen: !p.isOpen } : p))
    );
  };

  const handleLocationSelect = (
    idx: number,
    payload: {
      location: string;
      locationDetail: any;
      rack: string;
      rackDetails: any;
      bin: string;
      binDetails: any;
    }
  ) => {
    setLocalData((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, destination: payload } : it))
    );
  };

  // Validation helper for move action. Returns an object with a `msg` string.
  // If msg is non-empty, the action is invalid and msg contains the error.
  const validateMove = (item: any): { msg: string } => {
    if (!item) return { msg: "Item not found" };
    if (item.isMoved) return { msg: "Item already moved" };
    const dest = item.destination;
    if (!dest || !dest.location || !dest.rack || !dest.bin) {
      return { msg: "Please select location, rack and bin" };
    }
    return { msg: "" };
  };

  // Handler to move an item to non-sellable. Extracted from inline to avoid inline functions.
  const handleMove = async (idx: number, it: any) => {
    const item = localData[idx];
    const { msg } = validateMove(item);
    if (msg) {
      showToast({ msg, color: "error" });
      return;
    }

    const dest = item.destination;
    const fid = AuthService.getLoggedInUserId();
    if (!fid) {
      showToast({ msg: "User not found", color: "error" });
      return;
    }

    // mark this item as loading
    setLocalData((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, loading: true } : p))
    );

    try {
      const res = await RackBinService.moveStock(fid, {
        from: {
          binId: binId || it.location?.binId || "",
          stockMasters: [
            {
              stockMasterId: it.stockMasterId || it._id || "",
              quantity: it.quantity || it.qty || 0,
            },
          ],
        },
        to: {
          binId: dest.bin,
        },
        dealId: it.dealId || "",
        dealName: it.dealName || it.name || "",
        reason: "Moved to non-sellable via expiry management",
      });

      if (res.statusCode === 200) {
        showToast({ msg: "Stock moved to non-sellable", color: "success" });
        // mark as moved
        setLocalData((prev) =>
          prev.map((p, i) => (i === idx ? { ...p, isMoved: true } : p))
        );
        // notify parent with action and payload
        callback({
          action: "move-to-non-sellable",
          data: { ...it, destination: dest },
        });
      } else {
        showToast({
          msg: res.data?.message || "Failed to move stock",
          color: "error",
        });
      }
    } catch (e) {
      console.error("Failed to move stock", e);
      showToast({ msg: "Failed to move stock", color: "error" });
    } finally {
      // clear loading flag for this item
      setLocalData((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, loading: false } : p))
      );
    }
  };
  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:!max-w-3xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:text-lg tw:font-semibold">
          {t("expiryManagement")}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[80vh]">
        <div className="tw:text-sm tw:font-medium tw:text-orange-900">
          {t("itemsRequiringAttention")}
        </div>

        {localData && localData.length > 0 ? (
          localData.map((it, idx) => (
            <div
              className="tw:bg-gray-50 tw:rounded-lg tw:p-4 tw:my-2 tw:border tw:border-gray-200"
              key={idx}
            >
              <div className="tw:flex-1">
                <button
                  className="tw:w-full tw:block tw:cursor-pointer"
                  onClick={() => toggleOpen(idx)}
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2 tw:w-full tw:cursor-pointer">
                    <div className="tw:text-sm tw:font-medium">
                      {it.dealName || it.name || "Unnamed Item"}
                    </div>
                    <ChevronDown
                      size={18}
                      className={`tw:transition-transform ${
                        it.isOpen ? "tw:rotate-180" : ""
                      }`}
                    />
                  </div>
                  <div className="tw:flex tw:gap-x-2 tw:gap-y-1 tw:text-xs tw:text-gray-500 tw:flex-wrap">
                    <span>{it.quantity ?? it.qty ?? "-"} units</span>
                    {it.batchId && (
                      <span>
                        {t("snapshotId")}: {it.stockMasterId}
                      </span>
                    )}
                    {it.barcode && (
                      <span>
                        {t("barcode")}: {it.barcode}
                      </span>
                    )}

                    {it.expiryDate && (
                      <span>
                        {t("expiryDate")}:{" "}
                        <DateFormat
                          value={it.expiryDate}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                    )}

                    {/* mrp */}
                    {it.mrp && (
                      <span>
                        {t("mrp")}: <Amount value={it.mrp} />
                      </span>
                    )}
                  </div>
                  {it.expiryInfo && (
                    <div className="tw:text-red-500 tw:text-sm">
                      {it.expiryInfo}
                    </div>
                  )}
                </button>
              </div>

              {/* Row containing Location selector and Move button aligned with space-between */}
              {it.isOpen && (
                <div className="tw:mt-3 tw:flex tw:flex-col tw:md:flex-row tw:md:items-end tw:md:justify-between tw:gap-4">
                  <div className="tw:flex-1">
                    <LocationInput
                      // auto select non-sellable as location
                      locationId={RACK_BIN_LOCATION_NON_SELLABLE}
                      rackId={""}
                      binId={""}
                      dealId={it.dealId || ""}
                      qty={it.quantity ?? it.qty ?? 1}
                      callback={(payload) => handleLocationSelect(idx, payload)}
                      autoLoadRack={true}
                      locationType="non-sellable"
                      isRequired={true}
                      hideSuggestButton={true}
                    />
                  </div>

                  <div className="tw:text-right">
                    <AppButton
                      color="danger"
                      size="small"
                      onClick={() => handleMove(idx, it)}
                      isLoading={!!it.loading}
                    >
                      Move to Non-Sellable
                    </AppButton>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="tw:text-sm tw:text-gray-600 tw:py-4">
            No expiry items found.
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ManageExpiryModal;
