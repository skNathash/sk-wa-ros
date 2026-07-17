import React from "react";
import { Phone } from "lucide-react";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppButton from "~/components/core/button/AppButton";
import NoData from "~/components/core/no-data/NoData";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { CustomerItem } from "../helper";

interface Props {
  loading?: boolean;
  data: CustomerItem[];
  onSelect: (customer: CustomerItem) => void;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const headers: TableHeaderItem[] = [
  {
    label: "Name",
    key: "name",
    enableSort: false,
    width: "30%",
    langKey: "name",
  },
  {
    label: "Mobile",
    key: "mobile",
    enableSort: false,
    width: "20%",
    langKey: "mobile",
  },
  {
    label: "ID",
    key: "franchiseId",
    enableSort: false,
    width: "20%",
    langKey: "id",
  },
  {
    label: "Location",
    key: "location",
    enableSort: false,
    width: "20%",
    langKey: "location",
  },
  {
    label: "Action",
    key: "action",
    enableSort: false,
    width: "10%",
    langKey: "action",
  },
];

const DesktopView: React.FC<Props> = ({ loading, data, onSelect }) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="100px"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : (
          data.map((item, idx) => {
            const id = item._id || item.id || String(idx);
            return (
              <AppTable.Row
                key={id}
                className="tw:cursor-pointer tw:hover:bg-blue-50"
                onClick={() => onSelect(item)}
              >
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-gradient-to-br tw:from-blue-400 tw:to-purple-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:text-xs tw:font-bold tw:flex-shrink-0">
                      {item.initials || "?"}
                    </div>
                    <span className="tw:font-semibold tw:text-gray-800">
                      {item.name || "-"}
                    </span>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-gray-600">
                    <Phone size={12} />
                    <span>{item.mobile || "-"}</span>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:text-blue-600 tw:font-medium">
                    {item.franchiseId || item.referenceId || "-"}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:text-gray-500">
                    {item.location || "-"}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      onSelect(item);
                    }}
                  >
                    Select
                  </AppButton>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
