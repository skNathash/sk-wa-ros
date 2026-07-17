import React from "react";
import { useTranslation } from "react-i18next";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import type { TableHeaderItem, SortValue } from "~/types/CommonTypes";
import Amount from "~/components/core/amount/Amount";

interface DesktopViewProps {
  data: any[];
  loading?: boolean;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortKey?: string;
  sortValue?: SortValue;
}

const headers: TableHeaderItem[] = [
  {
    key: "poDate",
    label: "PO Date",
    langKey: "poDate",
    width: "20%",
  },
  {
    key: "poId",
    label: "PO ID",
    langKey: "poId",
    width: "20%",
  },
  {
    key: "status",
    label: "Status",
    langKey: "status",
    width: "12%",
    isCentered: true,
  },
  {
    key: "quantity",
    label: "Qty",
    langKey: "quantity",
    width: "15%",
    isCentered: true,
  },
  {
    key: "purchasePrice",
    label: "Purchase Price",
    langKey: "purchasePrice",
    width: "20%",
    isCentered: true,
  },
  {
    key: "total",
    label: "Total",
    langKey: "total",
    width: "25%",
    isCentered: true,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading = false,
  onSort,
  sortKey,
  sortValue,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout
      container
      containerStyle={containerStyle}
      stickyHeader
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
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("loading") || "Loading..."}
            </AppTable.Cell>
          </AppTable.Row>
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("noDataFound") || "No data found"}
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <DateFormat value={row.poDate} />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/dashboard/purchase-order/view/${row.poObjId}`}
                >
                  {row.poId}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <AppBadge variant={(row._statusColor as any) || "default"}>
                  {row._statusLbl || "-"}
                </AppBadge>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                {row.quantity?.toLocaleString() || "0"}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={row.purchasePrice || 0} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={row.totalAmount || 0} />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
