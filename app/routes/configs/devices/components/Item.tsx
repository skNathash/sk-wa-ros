import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";

type Props = {
  data: any;
  index: number;
  callback: (res: { action: string; data?: any; index?: number }) => void;
};

const Item = ({ data, index, callback }: Props) => {
  return (
    <AppCard>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:gap-2 tw:md:items-center">
        <div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:text-base tw:font-bold">{data.name}</div>
            <AppBadge
              variant={data.status === "Active" ? "success" : "danger"}
              size="sm"
            >
              {data.status}
            </AppBadge>
          </div>
          <KeyValue label="Ref No." horizontal size="sm" className="tw:mb-1">
            {data.refNo}
          </KeyValue>
          <KeyValue label="Created At" horizontal size="sm">
            <DateFormat value={data.createdAt} />
          </KeyValue>
        </div>
        <div>
          <div className="tw:flex tw:flex-row tw:gap-2">
            <AppButton
              size="small"
              fill="outline"
              onClick={() => callback({ action: "edit", data })}
            >
              Edit
            </AppButton>
            {data.status === "Active" ? (
              <AppButton
                size="small"
                fill="outline"
                color="danger"
                onClick={() =>
                  callback({ action: "markAsInactive", data, index })
                }
              >
                Mark as Inactive
              </AppButton>
            ) : (
              <AppButton
                size="small"
                fill="outline"
                color="success"
                onClick={() =>
                  callback({ action: "markAsActive", data, index })
                }
              >
                Mark as Active
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default Item;
