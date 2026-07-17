import { X } from "lucide-react";
import { memo } from "react";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  data: Array<any>;
  callback: (a: { action: string; data?: any }) => void;
};

const GMapAddrTownSelect = ({ show, data = [], callback }: Props) => {
  return (
    <AppModal show={show} className="transparent-modal" callback={callback}>
      <AppModal.Content className="ion-padding tw:bg-transparent/55">
        <div className="tw:bg-white tw:rounded-lg tw:overflow-hidden">
          <div className="tw:px-4 tw:py-2 tw:font-semibold tw:border-b tw:flex">
            <div className="tw:flex-1">Choose Town</div>
            <div>
              <button onClick={() => callback({ action: "close" })}>
                <X />
              </button>
            </div>
          </div>
          {data.map((x, k) => (
            <button
              className="tw:block tw:text-left tw:border-b tw:border-b-app-gray-4 tw:cursor-pointer tw:text-sm tw:px-4 tw:py-2"
              key={k}
              onClick={() => callback({ action: "selected", data: x })}
            >
              <div className="tw:font-medium tw:mb-1">{x.town}</div>
              <div className="tw:text-xs">
                {x.district} {x.state} - {x.pincode}
              </div>
            </button>
          ))}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default memo(GMapAddrTownSelect);
