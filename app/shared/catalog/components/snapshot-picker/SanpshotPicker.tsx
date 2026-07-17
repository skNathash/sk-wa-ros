import { produce } from "immer";
import { debounce } from "lodash";
import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AuthService } from "~/services/AuthService";
import { RackBinService } from "~/services/RackBinService";
import type { SnapshotMasterItem } from "~/types/CommonTypes";
import ChooseSanpshotModal from "../../modals/sanpshots/ChooseSanpshotModal";

type Props = {
  dealId: string;
  dealName?: string;
  snapshots: Array<{ snapshotId: string; quantity: number }>;
  callback: (data: { action: string; data: any }) => void;
  maxQuantity?: number;
  mrp?: number;
  selectedStockUom?: string;
  overridePrice?: number | null;
};

const getMasterData = async (dealId: string, mrp: number, onMrp: boolean) => {
  const response = await RackBinService.getSnapshotsMastersData(
    AuthService.getLoggedInUserId() || "",
    {
      filter: { dealId, isUsable: true, quantity: { $gt: 0 } },
    },
    {
      filterOnMrp: onMrp,
      mrp: mrp,
    }
  );
  const data = response.data?.data || [];
  return {
    data,
    totalQuantity: data.reduce(
      (sum: number, item: SnapshotMasterItem) => sum + item.totalQuantity,
      0
    ),
  };
};

const SanpshotPicker = ({
  dealId,
  dealName,
  snapshots,
  callback,
  maxQuantity,
  mrp,
  selectedStockUom,
  overridePrice,
}: Props) => {
  const isLooseUom =
    selectedStockUom === "gm" || selectedStockUom === "ml";
  const altUom = selectedStockUom === "ml" ? "L" : "kg";

  const [quantity, setQuantity] = useState(0);
  const [displayUom, setDisplayUom] = useState<string>(
    selectedStockUom || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const isAltUnit = isLooseUom && (displayUom === "kg" || displayUom === "L");
  const step = isAltUnit ? 1000 : 1;
  const toBase = (v: number) => (isAltUnit ? v * 1000 : v);
  const fromBase = (v: number) => (isAltUnit ? v / 1000 : v);
  const displayQty = isLooseUom
    ? Number.isInteger(fromBase(quantity))
      ? fromBase(quantity)
      : Number(fromBase(quantity).toFixed(3))
    : quantity;

  const [masterData, setMasterData] = useState<SnapshotMasterItem[]>([]);

  const [hasMultipleMasterData, setHasMultipleMasterData] = useState(false);

  const [snapshotModal, setSnapshotModal] = useState<{
    show: boolean;
    snapshotData: SnapshotMasterItem[];
  }>({
    show: false,
    snapshotData: [],
  });

  const handleAction = useCallback(
    debounce((quantity: number) => {
      if (quantity <= 0) {
        callback?.({
          action: "update",
          data: { masterData, quantity, updatedMasterData: [] },
        });
        return;
      }

      let remainingQuantity = quantity;

      const updatedMasterData = produce(masterData, (draft) => {
        draft.forEach((item) => {
          item.masters.forEach((master) => {
            const minQuantity = Math.min(remainingQuantity, master.quantity);
            remainingQuantity -= minQuantity;
            master.usedQty = minQuantity;
          });
        });
      });

      // Filter items that have usedQty > 0 and add enteredStock property to match ChooseSanpshotModal structure
      const selectedItems = updatedMasterData
        .map((item) => {
          const totalUsedQty = item.masters.reduce(
            (sum, master) => sum + (master.usedQty || 0),
            0
          );
          if (totalUsedQty > 0) {
            return {
              ...item,
              enteredStock: totalUsedQty,
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      callback?.({
        action: "update",
        data: { masterData, quantity, updatedMasterData: selectedItems },
      });
    }, 800),
    [masterData, callback]
  );

  const handleIncrement = () => {
    if (hasMultipleMasterData) {
      openSnapshotModal();
      return;
    }

    let max = 0;
    if (maxQuantity) {
      max = maxQuantity;
    } else {
      max = masterData.reduce((acc, item) => acc + item.totalQuantity, 0);
    }

    if (!max) {
      handleAction(0);
      return;
    }

    if (quantity >= max) {
      handleAction(max);
      return;
    }

    const newquantity = Math.min(quantity + step, max);
    setQuantity(newquantity);
    handleAction(newquantity);
  };

  const openSnapshotModal = () => {
    const data = [...masterData];
    if (snapshots?.length > 0) {
      data.forEach((item) => {
        item.masters.forEach((master) => {
          const snapshot = snapshots.find(
            (snapshot) => snapshot.snapshotId === master._id
          );
          if (snapshot) {
            master.enteredStock = snapshot.quantity;
          }
        });
        item.enteredStock = item.masters.reduce(
          (sum, master) => sum + (master.enteredStock || 0),
          0
        );
      });
    }
    setSnapshotModal({ show: true, snapshotData: data });
  };

  const handleDecrement = () => {
    if (hasMultipleMasterData) {
      openSnapshotModal();
      return;
    }

    if (quantity <= 0) {
      handleAction(0);
      return;
    }

    const newquantity = Math.max(quantity - step, 0);
    setQuantity(newquantity);
    handleAction(newquantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasMultipleMasterData) {
      openSnapshotModal();
      return;
    }

    const raw = isLooseUom ? parseFloat(e.target.value) : parseInt(e.target.value);
    const value = isNaN(raw) ? 0 : toBase(raw);
    let max = 0;
    if (maxQuantity) {
      max = maxQuantity;
    } else {
      max = masterData.reduce((acc, item) => acc + item.totalQuantity, 0);
    }
    if (value < 0) {
      setQuantity(0);
      handleAction(0);
    } else if (max && value > max) {
      setQuantity(max);
      handleAction(max);
    } else {
      setQuantity(value);
      handleAction(value);
    }
  };

  const handleUomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDisplayUom(e.target.value);
  };

  useEffect(() => {
    const totalQuantity = snapshots.reduce(
      (sum, snapshot) => sum + snapshot.quantity,
      0
    );
    setQuantity(totalQuantity);
  }, [snapshots]);

  useEffect(() => {
    const loadMasterData = async () => {
      if (!dealId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, totalQuantity } = await getMasterData(
        dealId,
        mrp || 0,
        true
      );

      if (data.length > 0) {
        if (totalQuantity <= quantity) {
          const { data } = await getMasterData(dealId, mrp || 0, false);
          setMasterData(data);
          setHasMultipleMasterData(data.length > 1);
        } else {
          setMasterData(data);
          setHasMultipleMasterData(data.length > 1);
        }
      } else {
        setMasterData([]);
        setHasMultipleMasterData(false);
      }

      setIsLoading(false);
    };

    loadMasterData();
  }, [snapshots]);

  const handleMasterDataModalCallback = (data: {
    action: string;
    data?: any;
  }) => {
    setSnapshotModal({ show: false, snapshotData: [] });
    if (data.action === "select") {
      callback?.({
        action: "update",
        data: { masterData, quantity, updatedMasterData: data.data },
      });
    }
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-1 tw:border tw:rounded-md tw:p-1">
        {/* Decrement Button */}
        <button
          onClick={handleDecrement}
          disabled={isLoading || quantity <= 0}
          className="tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded tw:bg-white tw:hover:bg-gray-50 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <AppSpinner size="xs" />
          ) : (
            <Minus className="tw:w-3 tw:h-3 tw:text-gray-600" />
          )}
        </button>

        {/* Quantity Input */}
        <input
          type="number"
          value={displayQty}
          onChange={handleInputChange}
          min="0"
          step={isLooseUom && isAltUnit ? "0.001" : "1"}
          disabled={isLoading}
          readOnly={hasMultipleMasterData}
          className={`${
            isLooseUom ? "tw:w-14" : "tw:w-8"
          } tw:h-6 tw:text-center tw:text-xs tw:font-medium tw:text-gray-900 tw:border-0 tw:outline-none tw:disabled:opacity-50 tw:disabled:cursor-not-allowed`}
        />

        {isLooseUom && (
          <select
            value={displayUom}
            onChange={handleUomChange}
            disabled={isLoading}
            className="tw:h-6 tw:text-xs tw:rounded tw:border tw:border-input tw:bg-transparent tw:px-1"
          >
            <option value={selectedStockUom}>{selectedStockUom}</option>
            <option value={altUom}>{altUom}</option>
          </select>
        )}

        {/* Increment Button */}
        <button
          onClick={handleIncrement}
          disabled={isLoading}
          className="tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded tw:bg-white tw:hover:bg-gray-50 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <AppSpinner size="xs" />
          ) : (
            <Plus className="tw:w-3 tw:h-3 tw:text-gray-600" />
          )}
        </button>
      </div>

      {snapshotModal.show && (
        <ChooseSanpshotModal
          show={snapshotModal.show}
          masterData={snapshotModal.snapshotData}
          callback={handleMasterDataModalCallback}
          maxQty={maxQuantity || 0}
          validateOnMaxQty={true}
          dealName={dealName || ""}
          overridePrice={overridePrice}
          billedMrp={mrp}
        />
      )}
    </>
  );
};

export default SanpshotPicker;
