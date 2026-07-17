import React from "react";
import { AppTable, TableHeader } from "~/components/core/table";

type SlabItem = Record<string, any>;

const headers = [
  { label: "Quantity Range", key: "quantityRange" },
  { label: "Discount", key: "discount" },
];

const PriceSlabGridView: React.FC<{ slabs?: SlabItem[] }> = ({
  slabs = [],
}) => {
  if (!slabs || slabs.length === 0) {
    return (
      <div className="tw:p-4 tw:text-sm tw:text-gray-600">
        No slabs available
      </div>
    );
  }

  return (
    <div>
      <div className="tw:text-xs tw:mb-2">Slabs</div>
      <AppTable bordered condensed className="tw:border-gray-200 tw:border">
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {slabs.map((s, index) => {
            const from = s.minQuantity ?? null;
            const to = s.maxQuantity ?? null;
            const discount = s.discountPercentage || 0;

            return (
              <AppTable.Row key={s._id || `slab-${index}`}>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <div className="tw:font-medium">
                      {from} to {to}
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:font-medium">
                    {discount != null ? (
                      <span className="tw:font-semibold">{discount}%</span>
                    ) : (
                      <span className="tw:text-gray-400">-</span>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default PriceSlabGridView;
