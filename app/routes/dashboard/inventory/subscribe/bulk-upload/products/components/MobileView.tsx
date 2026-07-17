import React from "react";
import { Barcode } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AuthService from "~/services/AuthService";

interface MobileViewProps {
  products: any[];
  mode?: "detailed" | "dealId";
}

const MobileView: React.FC<MobileViewProps> = ({ products, mode = "detailed" }) => {
  const isDealId = mode === "dealId";
  return (
    <div className="tw:space-y-4">
      {products.length > 0 ? (
        products.map((product, index) =>
          isDealId ? (
            <AppCard key={index} className="tw:mb-3">
              <div className="tw:mb-3">
                <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:mb-1">
                  {product.name || "--"}
                </h3>
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <KeyValue label="Deal Ref" size="sm">
                  <span className="tw:font-mono">
                    {product.dealRef || product.dealId || "--"}
                  </span>
                </KeyValue>
                <KeyValue label="Status" size="sm">
                  <AppBadge
                    variant={product.statusVariant || "default"}
                    className="tw:whitespace-nowrap"
                  >
                    {product.status || "-"}
                  </AppBadge>
                </KeyValue>
                <div className="tw:col-span-2">
                  <KeyValue label="Validation Message" size="sm">
                    <span className="tw:text-sm tw:text-gray-600">
                      {product.error || "--"}
                    </span>
                  </KeyValue>
                </div>
              </div>
            </AppCard>
          ) : (
          <AppCard key={index} className="tw:mb-3">
            <div className="tw:mb-3">
              <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:mb-1">
                {product.name}
              </h3>
              <div className="tw:text-sm tw:text-gray-500 tw:font-mono tw:flex tw:items-center tw:gap-2">
                <Barcode size={16} />
                {product.barcode}
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-3">
              <KeyValue label="Brand" size="sm">
                <span className="tw:font-medium">
                  {product.brand?.name || "--"}
                </span>
              </KeyValue>

              <KeyValue label="Category" size="sm">
                <span className="tw:font-medium">
                  {product.category?.name || "--"}
                </span>
              </KeyValue>

              <KeyValue label="MRP" size="sm">
                <Amount value={Number(product.mrp)} decimalPlaces={2} />
              </KeyValue>

              <KeyValue label="Price" size="sm">
                <Amount
                  value={
                    AuthService.isMasterLogin()
                      ? Number(product.mrp)
                      : Number(product.price)
                  }
                  decimalPlaces={2}
                />
              </KeyValue>

              <KeyValue label="Unit" size="sm">
                <span className="tw:font-medium">{product.unit}</span>
              </KeyValue>

              <KeyValue label="Qty" size="sm">
                <span className="tw:font-medium">{product.qty}</span>
              </KeyValue>

              <KeyValue label="Status" size="sm">
                <AppBadge
                  variant={product.statusVariant || "default"}
                  className="tw:whitespace-nowrap"
                >
                  {product.status || "-"}
                </AppBadge>
              </KeyValue>
            </div>
          </AppCard>
          ),
        )
      ) : (
        <AppCard>
          <div className="tw:text-center tw:py-8 tw:text-gray-500">
            No products found
          </div>
        </AppCard>
      )}
    </div>
  );
};

export default MobileView;
