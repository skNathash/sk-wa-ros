import { Minus, Plus } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

const PickingIncDcr = ({
  product,
  callback,
  loading,
}: {
  product: any;
  callback: (a: { action: string; data?: any }) => void;
  loading: boolean;
}) => {
  return (
    <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:border tw:rounded tw:p-1">
      <button
        onClick={() => {
          callback({
            action: "fetch-master-data",
            data: { dealId: product.dealId, product },
          });
        }}
        disabled={loading}
        className="tw:cursor-pointer"
      >
        {loading ? <AppSpinner /> : <Minus size={14} />}
      </button>
      <span className="tw:font-medium tw:text-blue-600">
        {product.pickedQty || 0}
      </span>
      <button
        onClick={() =>
          callback({
            action: "fetch-master-data",
            data: { dealId: product.dealId, product },
          })
        }
        disabled={loading}
        className="tw:cursor-pointer"
        title="Edit picking data"
      >
        {loading ? <AppSpinner /> : <Plus size={14} />}
      </button>
    </div>
  );
};

export default PickingIncDcr;
