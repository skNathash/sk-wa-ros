import React from "react";
import { Trash2 } from "lucide-react";
import { AppTable, TableHeader } from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import AppButton from "~/components/core/button/AppButton";

interface DesktopViewProps {
  data: any[];
  callback: (args: { action: string; data?: any }) => void;
}

const headers = [
  { label: "Name", key: "name", width: "35%" },
  { label: "Mobile", key: "mobileNo", width: "20%", isCentered: true },
  { label: "COD", key: "codEnabled", width: "15%", isCentered: true },
  { label: "Prepaid", key: "prepaidEnabled", width: "15%", isCentered: true },
  { label: "Action", key: "action", width: "15%", isCentered: true },
];

const DesktopView: React.FC<DesktopViewProps> = ({ data = [], callback }) => {
  if (!data?.length) {
    return <NoData />;
  }

  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers as any} />
      </AppTable.Header>

      <AppTable.Body>
        {data.map((item) => (
          <AppTable.Row key={item._id || item.buyerId}>
            <AppTable.Cell>
              <div className="tw:flex tw:flex-col">
                <span className="tw:font-medium tw:text-gray-900">
                  {item.name || "-"}
                </span>
                <div className="tw:text-xs tw:text-gray-500">
                  {item.buyerId || ""}
                </div>
              </div>
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-center">
              {item.mobileNo || "-"}
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-center">
              <AppBadge variant={item.codEnabled ? "success" : "light"}>
                {item.codEnabled ? "On" : "Off"}
              </AppBadge>
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-center">
              <AppBadge variant={item.prepaidEnabled ? "success" : "light"}>
                {item.prepaidEnabled ? "On" : "Off"}
              </AppBadge>
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-center">
              <AppButton
                onClick={() => callback({ action: "remove", data: item })}
                size="small"
                fill="outline"
                color="danger"
              >
                <Trash2 size={16} />
              </AppButton>
            </AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
