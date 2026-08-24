import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import Runners from "./runners/Runners";
import DeliveryNavChips from "~/shared/delivery/components/delivery-side-pane/DeliveryNavChips";

const TrackerSidePane = () => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <PaneTitle title="Live Shipments" forceTitle />
      <DeliveryNavChips activeKey="tracker" />
      <Runners />
    </div>
  );
};

export default TrackerSidePane;
