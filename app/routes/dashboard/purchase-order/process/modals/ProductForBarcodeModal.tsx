import React, { useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";

interface ProductForBarcodeModalProps {
  products: any[];
  barcode: string;
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}

const ProductForBarcodeModal: React.FC<ProductForBarcodeModalProps> = ({
  products,
  barcode,
  show,
  callback,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const searchLower = searchTerm.toLowerCase();
    return products.filter((product) => {
      const name = product.dealName?.toLowerCase() || "";
      const sku = product.dealRefId?.toLowerCase() || "";

      return name.includes(searchLower) || sku.includes(searchLower);
    });
  }, [products, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <span className="tw:text-lg tw:font-bold">
          Select Product for Barcode
        </span>
        <div className="tw:mb-2 tw:text-sm tw:text-slate-500">
          Choose which product this barcode belongs to:
          <span className="tw:bg-gray-100 tw:ml-2 tw:px-2 tw:py-1 tw:rounded tw:font-mono tw:font-medium tw:text-gray-700">
            {barcode}
          </span>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <Input
          type="text"
          className="tw:mb-4"
          placeholder="Search products by name or SKU..."
          onChange={handleSearchChange}
        />
        <div className="tw:space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="tw:text-center tw:text-gray-500 tw:py-8 tw:text-sm">
              {searchTerm
                ? "No products found matching your search."
                : "No products available."}
            </div>
          ) : (
            filteredProducts.map((product, idx) => (
              <div
                key={product.dealId || idx}
                className="tw:bg-white tw:rounded tw:p-2 tw:mb-2 tw:border tw:border-gray-200"
              >
                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:font-semibold tw:text-base">
                    {product.dealName}
                  </div>

                  <AppButton
                    size="small"
                    color="dark"
                    onClick={() =>
                      callback({ action: "select", data: { product } })
                    }
                  >
                    Select
                  </AppButton>
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  SKU: {product.dealRefId || "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  Ordered: {product.quantity || "-"} units
                </div>
                {/* <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  Existing barcodes:
                  <span className="tw:flex tw:flex-wrap tw:gap-2 tw-mt-1">
                    {(product.barcodes || []).map((bc: string, i: number) => (
                      <span
                        key={bc + i}
                        className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded tw:font-mono tw:text-xs tw:font-semibold tw:text-gray-700"
                      >
                        {bc}
                      </span>
                    ))}
                  </span>
                </div> */}
              </div>
            ))
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default ProductForBarcodeModal;
