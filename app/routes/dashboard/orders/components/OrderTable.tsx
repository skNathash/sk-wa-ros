import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";

interface OrderTableProps {
  data: any[];
  loading?: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({ data, loading = false }) => {
  return (
    <>
      <AppTable>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : null}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="text-center">
                <NoData/>
              </td>
            </tr>
          )}

          {data.length > 0
            ? data.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td><DateFormat value={order.createdAt} /></td>
                  <td>{order.total}</td>
                  <td>{order.status}</td>
                </tr>
              ))
            : null}
        </AppTable.Body>
      </AppTable>
    </>
  );
};

const headers = [
  { label: "Order ID", key: "orderId" },
  { label: "Ordered On", key: "orderedOn" },
  { label: "Total", key: "total" },
  { label: "Status", key: "status" },
];

export default OrderTable;
