import { useEffect, useState } from "react";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import RackBinService from "~/services/RackBinService";

const Pickings = ({ orderId }: { orderId: string }) => {
  const [pickings, setPickings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPickings = async () => {
      const response = await RackBinService.getOrderPicking(orderId, {
        filter: {
          status: {
            $nin: ["Cancelled"],
          },
        },
      });
      setPickings(response.data?.data || []);
    };

    fetchPickings();
  }, [orderId]);

  if (!pickings?.length) {
    return null;
  }

  return (
    <>
      <div className="tw:rounded-lg tw:p-4 tw:border tw:border-green-400 tw:mt-2 tw:bg-green-50 tw:text-slate-700">
        {pickings.map((picking, index) => (
          <div className="tw:mb-2" key={index}>
            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
              <div>
                <KeyValue label="Picked by" size="sm">
                  {picking.createdBy?.name}
                </KeyValue>
              </div>
              <div>
                <KeyValue label="Picking Status" size="sm">
                  {picking.status}
                </KeyValue>
              </div>
              <div>
                <KeyValue label="Picked at" size="sm">
                  <DateFormat value={picking.pickingStartedOn} />
                </KeyValue>
              </div>

              <div>
                <KeyValue label="Picking Ended On" size="sm">
                  <DateFormat value={picking.pickingEndedOn} />
                </KeyValue>
              </div>
            </div>

            {picking.items.map((item: any, index: number) => (
              <div
                key={index}
                className="tw:flex tw:items-center tw:gap-2 tw:bg-white tw:rounded-lg tw:px-4 tw:py-2 tw:border tw:border-green-200 tw:justify-between tw:text-sm tw:mb-2"
              >
                <div>
                  <div>{item.dealName}</div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {item.dealRefId}
                  </div>
                </div>
                <div>
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <DisplayQty
                      qty={Number(item.pickedQty) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                    <span>/</span>
                    <DisplayQty
                      qty={Number(item.orderedQty) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

export default Pickings;
