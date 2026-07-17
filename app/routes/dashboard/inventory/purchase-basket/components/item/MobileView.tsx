import React from "react";
import {
  Box,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash,
} from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";

interface PurchaseBasketItem {
  _id: string;
  product: {
    name: string;
    sku?: string;
    image?: string;
  };
  currentStock: number;
  desiredQty: number;
  unitPrice: number;
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
  suggestedVendor: {
    name: string;
    id: string;
  };
  estTotal: number;
  targetDate: string;
  dateAdded: string;
  addedBy: {
    name: string;
    id: string;
  };
}

interface MobileViewProps {
  data: PurchaseBasketItem[];
  onEdit?: (item: PurchaseBasketItem) => void;
  onDelete?: (item: PurchaseBasketItem) => void;
  onView?: (item: PurchaseBasketItem) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  onEdit,
  onDelete,
  onView,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "tw:text-red-600 tw:bg-red-50";
      case "high":
        return "tw:text-orange-600 tw:bg-orange-50";
      case "medium":
        return "tw:text-yellow-600 tw:bg-yellow-50";
      case "low":
        return "tw:text-green-600 tw:bg-green-50";
      default:
        return "tw:text-gray-600 tw:bg-gray-50";
    }
  };

  return (
    <div className="tw-space-y-4">
      {data.map((item) => (
        <div
          key={item._id}
          className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:shadow-sm"
        >
          {/* Product Header */}
          <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
            <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="tw:w-12 tw:h-12 tw:rounded-lg tw:object-cover"
                />
              )}
              <div className="tw:flex-1">
                <h3 className="tw:font-semibold tw:text-gray-900 tw:text-sm">
                  {item.product.name}
                </h3>
                {item.product.sku && (
                  <p className="tw:text-xs tw:text-gray-500">
                    SKU: {item.product.sku}
                  </p>
                )}
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-1">
              <span
                className={`tw:px-2 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium ${getPriorityColor(
                  item.priority
                )}`}
              >
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </span>
            </div>
          </div>

          {/* Stock and Quantity Info */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Box className="tw:text-gray-400" size={16} />
              <div>
                <p className="tw:text-xs tw:text-gray-500">Current Stock</p>
                <p className="tw:font-medium tw:text-sm">{item.currentStock}</p>
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <AlertTriangle className="tw:text-blue-400" size={16} />
              <div>
                <p className="tw:text-xs tw:text-gray-500">Desired Qty</p>
                <p className="tw:font-medium tw:text-sm tw:text-blue-600">
                  {item.desiredQty}
                </p>
              </div>
            </div>
          </div>

          {/* Price and Total */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-3">
            <div>
              <p className="tw:text-xs tw:text-gray-500">Unit Price</p>
              <p className="tw:font-medium tw:text-sm">
                <Amount value={item.unitPrice} />
              </p>
            </div>
            <div>
              <p className="tw:text-xs tw:text-gray-500">Est. Total</p>
              <p className="tw:font-bold tw:text-sm tw:text-green-600">
                <Amount value={item.estTotal} />
              </p>
            </div>
          </div>

          {/* Vendor and Reason */}
          <div className="tw:mb-3">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
              <User className="tw:text-gray-400" size={16} />
              <div>
                <p className="tw:text-xs tw:text-gray-500">Suggested Vendor</p>
                <p className="tw:font-medium tw:text-sm">
                  {item.suggestedVendor.name}
                </p>
              </div>
            </div>
            <div>
              <p className="tw:text-xs tw:text-gray-500">Reason</p>
              <p className="tw:text-sm tw:text-gray-700">{item.reason}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Calendar className="tw:text-gray-400" size={16} />
              <div>
                <p className="tw:text-xs tw:text-gray-500">Target Date</p>
                <p className="tw:text-sm">
                  <DateFormat value={item.targetDate} formatStr="dd MMM yyyy" />
                </p>
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Clock className="tw:text-gray-400" size={16} />
              <div>
                <p className="tw:text-xs tw:text-gray-500">Added</p>
                <p className="tw:text-sm">
                  <DateFormat value={item.dateAdded} formatStr="dd MMM yyyy" />
                </p>
              </div>
            </div>
          </div>

          {/* Added By */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
            <User className="tw:text-gray-400" size={16} />
            <div>
              <p className="tw:text-xs tw:text-gray-500">Added By</p>
              <p className="tw:text-sm">{item.addedBy.name}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:pt-3 tw:border-t tw:border-gray-100">
            {onView && (
              <button
                onClick={() => onView(item)}
                className="tw:flex tw:items-center tw:gap-1 tw:px-3 tw:py-1 tw:text-blue-600 tw:text-sm hover:tw:bg-blue-50 tw:rounded"
              >
                <Eye size={16} />
                View
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="tw:flex tw:items-center tw:gap-1 tw:px-3 tw:py-1 tw:text-green-600 tw:text-sm hover:tw:bg-green-50 tw:rounded"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item)}
                className="tw:flex tw:items-center tw:gap-1 tw:px-3 tw:py-1 tw:text-red-600 tw:text-sm hover:tw:bg-red-50 tw:rounded"
              >
                <Trash size={16} />
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
