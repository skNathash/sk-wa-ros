import { Trash2 as Trash2Icon } from "lucide-react";
import React from "react";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import type { TableHeaderItem } from "~/types/CommonTypes";
import PickedSanpshotsInfo from "../snapshots-info/PickedSanpshotsInfo";
import PickingIncDcr from "./PickingIncDcr";
import PriceLockedNote from "../PriceLockedNote";
import SanpshotPicker from "~/shared/catalog/components/snapshot-picker/SanpshotPicker";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const headers: TableHeaderItem[] = [
  { label: "Sl No", key: "slNo", width: "8%", isCentered: true },
  { label: "Products", key: "products", width: "35%" },
  { label: "Location", key: "location", width: "25%" },
  { label: "Ordered", key: "ordered", width: "16%", isCentered: true },
  { label: "Picking", key: "picking", width: "16%", isCentered: true },
  { label: "Action", key: "action", width: "16%", isCentered: true },
];

const containerStyle = {
  maxHeight: "calc(100vh - 300px)",
};

const DesktopView: React.FC<{
  products: any[];
  callback: (a: { action: string; data?: any }) => void;
  loading?: boolean;
}> = ({ products, callback, loading = false }) => {
  const snapshotCallback = (
    data: { action: string; data: any },
    product: any
  ) => {
    if (data.action === "update" && data.data?.updatedMasterData?.length > 0) {
      if (product && data.data.updatedMasterData.length > 0) {
        callback({
          action: "update-snapshots",
          data: {
            product: product,
            snapshots: data.data.updatedMasterData,
          },
        });
      }
    } else {
      callback({
        action: "remove",
        data: { dealId: product.dealId },
      });
    }
  };

  return (
    <div className="tw:space-y-4">
      {/* Products Table */}
      <AppTable
        size="sm"
        fixedLayout
        container
        minWidth="1000px"
        containerStyle={containerStyle}
        stickyHeader
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products && products.length > 0 ? (
            products.map((product, idx) => (
              <AppTable.Row
                key={idx}
                className="tw:cursor-pointer hover:tw:bg-gray-50"
              >
                <AppTable.Cell className="tw:text-center">
                  {idx + 1}
                </AppTable.Cell>
                <AppTable.Cell className="tw:sticky tw:left-0 tw:bg-white tw:z-10">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${product.dealId}`}
                    className="tw:font-medium"
                  >
                    {product.dealName || product.name || "--"}
                  </AppLink>
                  {product.dealRefId && (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                      ID: {product.dealRefId}
                    </div>
                  )}
                  {product.sku && (
                    <div className="tw:text-xs tw:text-gray-500">
                      SKU: {product.dealId}
                    </div>
                  )}
                  <div className="tw:mt-1">
                    <PriceLockedNote product={product} />
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <LocationsBlock locations={product.locations} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:font-medium">
                    <DisplayQty
                      qty={product.orderedQty || 0}
                      isLooseQty={false}
                      uom={product.selectedStockUom}
                    />
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <div className="tw:inline-flex tw:gap-2 tw:mt-2">
                    {/* <PickingIncDcr
                      product={product}
                      callback={callback}
                      loading={loading}
                    /> */}
                    <SanpshotPicker
                      dealId={product.dealId}
                      snapshots={product.snapshots}
                      callback={(data) => snapshotCallback(data, product)}
                      maxQuantity={product.orderedQty}
                      mrp={product.mrp}
                      dealName={product.dealName}
                      selectedStockUom={product.selectedStockUom}
                      overridePrice={product.overridePrice}
                    />
                  </div>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <div className="tw:flex tw:flex-col tw:gap-2 tw:items-center">
                    {product.snapshots?.length > 0 && (
                      <PickedSanpshotsInfo
                        pickedSanpshots={product.snapshots}
                        selectedStockUom={product.selectedStockUom}
                      />
                    )}
                    {(product.pickedQty || 0) > 0 && (
                      <button
                        onClick={() =>
                          callback({
                            action: "remove",
                            data: { dealId: product.dealId },
                          })
                        }
                        className="tw:text-red-500 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:cursor-pointer"
                      >
                        Cancel Pick
                        <Trash2Icon size={14} />
                      </button>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))
          ) : (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-8"
              >
                <div className="tw:text-gray-500">
                  No products added yet. Use the form above to add products.
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
