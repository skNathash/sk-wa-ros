import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import CommonService from "~/services/CommonService";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";

const PriceChangeLog = ({ logs }: { logs?: any[] }) => {
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  // Items that have never been re-priced come through without an auditLog.
  const entries = logs || [];

  useEffect(() => {
    if (!entries.length) return;
    const fetchUsers = async () => {
      const userIds = entries.map((log) => log.loggedBy).filter(Boolean);
      if (!userIds.length) return;
      const userDetails = await CommonService.getUsers({
        page: 1,
        count: userIds.length,
        filter: {
          _id: {
            $in: userIds,
          },
        },
      });
      let obj: { [key: string]: string } = {};
      userDetails.data.forEach((user: any) => {
        obj[user._id] = user.name;
      });
      setUsers(obj);
    };
    fetchUsers();
  }, [entries]);

  if (!entries.length) return null;

  return (
    <AppCard title="Logs">
      {entries.map((log) => (
        <div
          className="tw:border-b tw:border-gray-200 tw:py-4 tw:last:border-b-0"
          key={log._id}
        >
          <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between">
            <KeyValue label="Updated On" size="sm">
              <DateFormat value={log.loggedAt} />
            </KeyValue>
            <KeyValue label="Updated By" size="sm">
              {users[log.loggedBy] || log.loggedBy || "System"}
            </KeyValue>
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-4">
            <div>
              <div className="tw:text-xs tw:text-gray-500 tw:font-bold tw:mb-2">
                Old Price
              </div>
              <KeyValue
                label="Price"
                size="sm"
                horizontal
                labelClassName="tw:w-1/3"
              >
                :{" "}
                <DisplayPrice
                  price={log.oldData?.price}
                  uom={log.oldData?.selectedStockUom}
                  decimalPlaces={2}
                  className="tw:text-red-500"
                />
              </KeyValue>
              <KeyValue
                label="MRP"
                size="sm"
                horizontal
                labelClassName="tw:w-1/3"
              >
                :{" "}
                <DisplayPrice
                  price={log.oldData?.mrp}
                  uom={log.oldData?.selectedStockUom}
                  decimalPlaces={2}
                  className="tw:text-red-500"
                />
              </KeyValue>
            </div>
            <div>
              <div className="tw:text-xs tw:text-gray-500 tw:font-bold tw:mb-2">
                New Price
              </div>
              <KeyValue
                label="Price"
                size="sm"
                horizontal
                labelClassName="tw:w-1/3"
              >
                :{" "}
                <DisplayPrice
                  price={log.newData?.price}
                  uom={log.newData?.selectedStockUom}
                  decimalPlaces={2}
                  className="tw:text-green-500"
                />
              </KeyValue>
              <KeyValue
                label="MRP"
                size="sm"
                horizontal
                labelClassName="tw:w-1/3"
              >
                :{" "}
                <DisplayPrice
                  price={log.newData?.mrp}
                  uom={log.newData?.selectedStockUom}
                  decimalPlaces={2}
                  className="tw:text-green-500"
                />
              </KeyValue>
            </div>
          </div>
        </div>
      ))}
    </AppCard>
  );
};

export default PriceChangeLog;
