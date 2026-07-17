import { Eye } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import type { SellerDeal, SortValue } from "~/types/CommonTypes";

interface DesktopViewProps {
  data: SellerDeal[];
  loading?: boolean;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortKey?: string;
  sortValue?: SortValue;
}

const headers = [
  { label: "Product Name", key: "dealName", width: "24%", enableSort: true },
  { label: "ID", key: "id", width: "10%" },
  { label: "Category", key: "category", width: "10%" },
  { label: "Sales", key: "sales", width: "10%" },
  { label: "Stock", key: "totalStock", width: "5%", isCentered: true },
  { label: "B2C Price", key: "b2cPrice", width: "10%", isCentered: true },
  { label: "B2B Price", key: "b2bPrice", width: "10%", isCentered: true },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  onSort,
  sortKey,
  sortValue,
}) => {
  return (
    <AppTable
      stickyHeader
      container
      containerStyle={containerStyle}
      minWidth="1000px"
      fixedLayout
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortKey={sortKey}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => (
            <AppTable.Row key={item.id || item._id || idx}>
              <AppTable.Cell>
                <AppLink
                  className="tw:text-blue-600 tw:mb-2 tw:block"
                  asLink
                  href={`/dashboard/inventory/products/view/${item._id}`}
                >
                  {item.name}
                </AppLink>
                <div>
                  <AppBadge variant={item._movementTypeColor}>
                    {item.movementType}
                  </AppBadge>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{item.id || item._id}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/cms/categories/view/${item.category?.id || ""}`}
                >
                  {item.category?.name || "--"}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:flex tw:gap-1 tw:items-center">
                    {item.salesAnalytics?.last7Days?.quantity || 0} units
                    <AppPopover
                      triggerContent={
                        <button className="tw:cursor-pointer">
                          <Eye size={14} />
                        </button>
                      }
                    >
                      <DealSummaryPopover
                        salesAnalytics={item.salesAnalytics}
                      />
                    </AppPopover>
                  </div>
                  <div className="tw:text-gray-500 tw:text-xs">
                    Last 7d sales
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {item.maxQty ?? "-"}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={item.b2cPrice} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={item.b2bPrice} />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
