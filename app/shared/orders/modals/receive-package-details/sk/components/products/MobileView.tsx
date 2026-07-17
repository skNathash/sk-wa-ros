import React from "react";
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";

interface MobileViewProps {
  products: any[];
  callback: (a: { action: string; data?: any }) => void;
  selectedProducts?: Set<string>;
}

const MobileView: React.FC<MobileViewProps> = ({
  products = [],
  callback,
  selectedProducts = new Set(),
}) => {
  const [expandedProducts, setExpandedProducts] = React.useState<Set<string>>(
    new Set()
  );

  const handleQuantityChange = (
    productId: string,
    value: number,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        _id: productId,
        field: "received",
        value,
        index,
      },
    });
  };

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return <CheckCircle className="tw:w-4 tw:h-4 tw:text-green-500" />;
      case "damaged":
        return <XCircle className="tw:w-4 tw:h-4 tw:text-red-500" />;
      case "missing":
        return <AlertTriangle className="tw:w-4 tw:h-4 tw:text-yellow-500" />;
      default:
        return <Package className="tw:w-4 tw:h-4 tw:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "tw:bg-green-100 tw:text-green-800";
      case "damaged":
        return "tw:bg-red-100 tw:text-red-800";
      case "missing":
        return "tw:bg-yellow-100 tw:text-yellow-800";
      default:
        return "tw:bg-gray-100 tw:text-gray-800";
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="tw:space-y-4">
      {/* Header */}
      <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg">
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
          <div className="tw:flex tw:items-center tw:gap-2">
            <Package className="tw:w-5 tw:h-5 tw:text-primary" />
            <span className="tw:font-medium tw:text-gray-900">
              Products ({products.length})
            </span>
          </div>
        </div>
        <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:text-sm tw:text-gray-600">
          <div className="tw:text-center">
            <div className="tw:font-semibold tw:text-green-600">
              {products.filter((p) => p.status === "received").length}
            </div>
            <div className="tw:text-xs">Received</div>
          </div>
          <div className="tw:text-center">
            <div className="tw:font-semibold tw:text-red-600">
              {products.filter((p) => p.status === "damaged").length}
            </div>
            <div className="tw:text-xs">Damaged</div>
          </div>
          <div className="tw:text-center">
            <div className="tw:font-semibold tw:text-yellow-600">
              {products.filter((p) => p.status === "missing").length}
            </div>
            <div className="tw:text-xs">Missing</div>
          </div>
        </div>
      </div>

      {/* Products Cards */}
      <div className="tw:space-y-3">
        {products.map((product, index) => {
          const productKey = product._id || product.dealId;
          const isExpanded = expandedProducts.has(productKey);
          const orderedQty = Number(product.packageQuantity) || 0;

          return (
            <AppCard
              key={product._id}
              bodyClassName="tw:p-0"
              className={`tw:border-2 ${
                selectedProducts.has(product._id)
                  ? "tw:border-primary tw:bg-primary/5"
                  : "tw:border-gray-200"
              }`}
            >
              {/* Product Header */}
              <div
                className="tw:p-4 tw:cursor-pointer"
                onClick={() => toggleProductExpansion(productKey)}
              >
                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
                    <div className="tw:flex-shrink-0 tw:h-12 tw:w-12">
                      {product.image ? (
                        <img
                          className="tw:h-12 tw:w-12 tw:rounded-lg tw:object-cover"
                          src={product.image}
                          alt={product.name}
                        />
                      ) : (
                        <div className="tw:h-12 tw:w-12 tw:rounded-lg tw:bg-gray-200 tw:flex tw:items-center tw:justify-center">
                          <Package className="tw:w-6 tw:h-6 tw:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:truncate">
                        {product.dealName ||
                          product.productName ||
                          product.name}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                        SKU: {product.dealId || product.sku}
                      </div>
                      <div className="tw:mt-2">
                        <LocationsBlock locations={product.locations} />
                      </div>
                    </div>
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div className="tw:flex tw:items-center tw:gap-1">
                      {getStatusIcon(product.status)}
                      <span
                        className={`tw:inline-flex tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:rounded-full ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="tw:w-4 tw:h-4 tw:text-gray-400" />
                    ) : (
                      <ChevronDown className="tw:w-4 tw:h-4 tw:text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="tw:mt-3 tw:grid tw:grid-cols-2 tw:gap-4 tw:text-sm">
                  <div>
                    <span className="tw:text-gray-500">Expected:</span>
                    <span className="tw:ml-1 tw:font-medium">{orderedQty}</span>
                  </div>
                  <div>
                    <span className="tw:text-gray-500">Received:</span>
                    <span className="tw:ml-1 tw:font-medium">
                      {product.receivedQty || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="tw:border-t tw:border-gray-200 tw:p-4 tw:bg-gray-50">
                  <div className="tw:space-y-4">
                    {/* Quantity Input */}
                    <div>
                      <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
                        Received Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={orderedQty}
                        value={product.receivedQty || 0}
                        onChange={(e) =>
                          handleQuantityChange(
                            productKey,
                            parseInt(e.target.value) || 0,
                            index
                          )
                        }
                        className="tw:w-full tw:px-3 tw:py-2 tw:text-sm tw:border tw:border-gray-300 tw:rounded-md tw:focus:ring-2 tw:focus:ring-primary tw:focus:border-primary"
                      />
                    </div>

                    {/* Actions */}
                    <div className="tw:space-y-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(productKey, orderedQty, index)
                        }
                        className="tw:w-full tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:bg-primary tw:border tw:border-transparent tw:rounded-md tw:hover:bg-primary/90"
                      >
                        Mark as Received
                      </button>
                      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(productKey, 0, index)
                          }
                          className="tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:text-red-700 tw:bg-red-100 tw:border tw:border-red-300 tw:rounded-md tw:hover:bg-red-200"
                        >
                          Mark Damaged
                        </button>
                        <button
                          onClick={() =>
                            handleQuantityChange(productKey, 0, index)
                          }
                          className="tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:text-yellow-700 tw:bg-yellow-100 tw:border tw:border-yellow-300 tw:rounded-md tw:hover:bg-yellow-200"
                        >
                          Mark Missing
                        </button>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {product.category && (
                      <div className="tw:text-sm">
                        <span className="tw:text-gray-500">Category:</span>
                        <span className="tw:ml-1 tw:font-medium">
                          {product.category}
                        </span>
                      </div>
                    )}
                    {product.notes && (
                      <div className="tw:text-sm">
                        <span className="tw:text-gray-500">Notes:</span>
                        <span className="tw:ml-1">{product.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AppCard>
          );
        })}
      </div>
    </div>
  );
};

export default MobileView;
