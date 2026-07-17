import { Eye } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { SellerDeal, TableHeaderItem } from "~/types/CommonTypes";

const DesktopView = ({
  data,
  loading,
  callback,
}: {
  data: SellerDeal[];
  loading: boolean;
  callback: (a: { action: string; data: Record<string, any> }) => void;
}) => {
  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout
      container
      containerStyle={tableStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : null}

        {!loading && data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : null}

        {data.map((item, index) => (
          <AppTable.Row key={item._id}>
            <AppTable.Cell>
              <input
                type="checkbox"
                checked={item.selected}
                onChange={(e) => {
                  callback({
                    action: "select",
                    data: {
                      ...item,
                      selected: e.target.checked,
                    },
                  });
                }}
              />
            </AppTable.Cell>
            <AppTable.Cell>
              <div className="tw:text-xs tw:font-medium tw:mb-1">
                {item.name}
              </div>

              <div className="tw:text-xs tw:text-gray-500">ID: {item.id}</div>
            </AppTable.Cell>
            <AppTable.Cell>{item.purchaseInfo?.poId}</AppTable.Cell>
            <AppTable.Cell>
              <AppLink onClick={() => {}}>
                {item.vendorDetails?.name} ss
              </AppLink>
            </AppTable.Cell>
            <AppTable.Cell className="tw:font-medium">
              {item.purchaseInfo?.quantity}
            </AppTable.Cell>
            <AppTable.Cell>
              <DateFormat
                value={item.expectedDeliveryDate}
                formatStr="dd MMM yyyy"
              />
            </AppTable.Cell>
            <AppTable.Cell>
              <AppButton size="small" fill="outline" color="light">
                <Eye />
                View
              </AppButton>
            </AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

const tableStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const headers: TableHeaderItem[] = [
  {
    label: "",
    key: "select",
    width: "3%",
  },
  {
    label: "Product",
    key: "product",
    width: "20%",
  },
  {
    label: "PO ID",
    key: "poId",
    width: "10%",
  },
  {
    label: "Vendor",
    key: "vendor",
    width: "15%",
  },
  {
    label: "Quantity",
    key: "quantity",
    width: "5%",
  },
  {
    label: "Expected Delivery",
    key: "expectedDelivery",
    width: "10%",
  },
  {
    label: "Action",
    key: "action",
    width: "10%",
  },
];

export default DesktopView;
