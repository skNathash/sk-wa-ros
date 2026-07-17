import { AppTable } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";

type Prop = {
  slabs: any[];
};

const headers = [
  { label: "Quantity Range", key: "quantityRange" },
  { label: "Discount", key: "discount" },
];

const SlabGrid = ({ slabs = [] }: Prop) => {
  return (
    <AppTable
      bordered
      condensed
      className="tw:border-gray-200 tw:border tw:rounded-md tw:overflow-hidden tw:bg-white tw:shadow-sm"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {slabs.map((slab) => (
          <AppTable.Row key={slab._id}>
            <AppTable.Cell>
              {slab.minQuantity} - {slab.maxQuantity}
            </AppTable.Cell>
            <AppTable.Cell>{slab.discountPercentage}%</AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default SlabGrid;
