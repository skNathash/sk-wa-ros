import AppCard from "~/components/core/card/AppCard";
import { AppTable, TableHeader } from "~/components/core/table";

interface BoxesProps {
  boxes: any[];
}

const Boxes = ({ boxes }: BoxesProps) => {
  return (
    <AppCard>
      <AppTable size="sm">
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {boxes.map((box, index) => (
            <tr key={box._id}>
              <td>{index + 1}</td>
              <td>{box.invoiceNo}</td>
              <td>{box.status}</td>
            </tr>
          ))}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

const headers = [
  { label: "S.No", key: "sno", width: "3%" },
  { label: "Box ID", key: "boxId" },
  { label: "Status", key: "status" },
];

export default Boxes;
