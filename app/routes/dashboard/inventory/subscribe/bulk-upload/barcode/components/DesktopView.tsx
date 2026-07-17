import React from "react";
import { Trash2, CheckCircle, XCircle, CheckCheck } from "lucide-react";
import { AppTable, TableHeader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import type { BarcodeDealType } from "../helper";
import AppBadge from "~/components/core/badge/AppBadge";

interface DesktopViewProps {
  products: BarcodeDealType[];
  onRemove?: (index: number) => void;
  onSubscribe?: (index: number) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Barcode", key: "barcode", width: "10%" },
  { label: "Item Name", key: "dealName", width: "20%" },
  { label: "ID", key: "dealId", width: "10%" },
  { label: "MRP", key: "mrp", width: "10%" },
  { label: "Status", key: "status", width: "10%" },
  { label: "", key: "action", width: "20%" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  products,
  onRemove,
  onSubscribe,
}) => {
  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  const handleSubscribe = (index: number) => {
    if (onSubscribe) {
      onSubscribe(index);
    }
  };

  return (
    <div className="tw:w-full">
      <AppTable
        container
        stickyHeader
        responsive
        bordered
        hover
        size="sm"
        className="tw:mt-4"
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products.length > 0 ? (
            products.map((product, index) => (
              <AppTable.Row key={index}>
                <AppTable.Cell className="tw:font-mono tw:text-sm">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-[180px]">
                    {product.status === "VALID" ? (
                      <CheckCircle size={16} className="tw:text-green-600" />
                    ) : (
                      <XCircle size={16} className="tw:text-red-600" />
                    )}
                    <span className="tw:truncate">{product.barcode?.[0]}</span>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-medium tw:min-w-[200px]">
                  <div className="tw:block">
                    <span className="tw:truncate tw:block tw:font-medium">
                      {product.dealName}
                    </span>
                    {product.status === "INVALID" && product.error ? (
                      <div className="tw:text-xs tw:text-red-600 tw:mt-1 tw:line-clamp-2">
                        {product.error}
                      </div>
                    ) : null}
                  </div>

                  {product?.category?.categoryName ||
                  product?.brand?.brandName ? (
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                      {product?.brand?.brandName ? (
                        <div className="tw:text-xs tw:text-gray-500 tw:line-clamp-2">
                          {product.brand.brandName}
                        </div>
                      ) : null}

                      <span>•</span>

                      {product?.category?.categoryName ? (
                        <div className="tw:text-xs tw:text-gray-500 tw:line-clamp-2">
                          {product.category.categoryName}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </AppTable.Cell>
                <AppTable.Cell>{product.refId}</AppTable.Cell>
                <AppTable.Cell>
                  <Amount value={Number(product.mrp)} decimalPlaces={2} />
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppBadge variant={product.statusColor}>
                    {product.status === "INVALID"
                      ? "Not Found"
                      : product.status}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell>
                  {!product?.subscribeError ? (
                    <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:flex-wrap">
                      {product.isSubscribed && (
                        <div className="tw:text-xs tw:text-gray-500">
                          Already Subscribed
                        </div>
                      )}

                      {product.status === "VALID" &&
                        !product.isInCart &&
                        !product.isSubscribed && (
                          <AppButton
                            size="small"
                            fill="solid"
                            color="success"
                            onClick={() => handleSubscribe(index)}
                            className="tw:px-3 tw:py-1 tw:text-xs"
                          >
                            Subscribe
                          </AppButton>
                        )}

                      {product.isInCart && (
                        <div className="tw:text-xs tw:text-blue-800 tw:font-medium tw:flex tw:items-center tw:gap-1">
                          <CheckCheck size={14} className="tw:text-blue-800" />
                          Added to Cart
                        </div>
                      )}
                      {!product.isInCart && (
                        <AppButton
                          size="small"
                          fill="outline"
                          color="danger"
                          onClick={() => handleRemove(index)}
                          className="tw:px-2 tw:py-1"
                        >
                          <Trash2 size={14} />
                        </AppButton>
                      )}
                    </div>
                  ) : (
                    <div className="tw:text-xs tw:text-red-500 tw:text-right">
                      {product.subscribeError}
                    </div>
                  )}
                </AppTable.Cell>
              </AppTable.Row>
            ))
          ) : (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-8 tw:text-gray-500"
              >
                No products found
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
