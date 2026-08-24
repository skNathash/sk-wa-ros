import { useCallback, useMemo, useState } from "react";
import useAppToast from "~/hooks/useAppToast";
import AudiencePanel from "./components/AudiencePanel";
import AutoTriggers from "./components/AutoTriggers";
import CadencePanel from "./components/CadencePanel";
import LifecycleStages from "./components/LifecycleStages";
import StageFocusHeader from "./components/StageFocusHeader";
import WhatsappPreview from "./components/WhatsappPreview";
import {
  getAutoTriggers,
  getStage,
  getStageDetail,
  getStages,
  type AutoTrigger,
  type NudgeStageKey,
} from "./helper";

/**
 * Paylater nudges — the six lifecycle stages across the top, then everything
 * about the stage in focus: who is in it, on what schedule, and the draft that
 * would go out. The auto-trigger table underneath is the same flow running
 * without anyone on the page.
 *
 * The nudge APIs do not exist yet, so the page reads hardcoded data from
 * `helper.ts`; the components already take the shapes a service would return.
 */
const Nudges = () => {
  const toast = useAppToast();

  const stages = useMemo(() => getStages(), []);

  // "Remind" is where the everyday work sits, so the page opens on it.
  const [activeKey, setActiveKey] = useState<NudgeStageKey>("remind");
  const [triggers, setTriggers] = useState<AutoTrigger[]>(() =>
    getAutoTriggers(),
  );

  const stage = getStage(activeKey);
  const detail = getStageDetail(activeKey);

  const handleStageSelect = useCallback(
    (payload: { action: string; data: NudgeStageKey }) => {
      setActiveKey(payload.data);
    },
    [],
  );

  const handlePreviewAction = useCallback(
    (payload: { action: string }) => {
      if (payload.action === "send") {
        toast.show({
          msg: `Nudge queued for ${detail.audience.length} ${stage.name.toLowerCase()} recipients`,
          color: "success",
        });
        return;
      }

      toast.show({
        msg: "Template editing is not available yet",
        color: "info",
      });
    },
    [detail.audience.length, stage.name, toast],
  );

  const handleTriggerToggle = useCallback(
    (payload: { action: string; data: AutoTrigger }) => {
      const { data: trigger } = payload;
      const enabled = !trigger.enabled;

      setTriggers((prev) =>
        prev.map((item) =>
          item.id === trigger.id ? { ...item, enabled } : item,
        ),
      );

      toast.show({
        msg: `${getStage(trigger.stage).name} trigger ${enabled ? "enabled" : "paused"}`,
        color: enabled ? "success" : "warning",
      });
    },
    [toast],
  );

  return (
    <>
      <LifecycleStages
        stages={stages}
        activeKey={activeKey}
        callback={handleStageSelect}
      />

      <StageFocusHeader stage={stage} />

      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-4 tw:items-stretch">
        <AudiencePanel summary={detail.summary} members={detail.audience} />

        <CadencePanel
          title={detail.cadenceTitle}
          source={detail.cadenceSource}
          steps={detail.cadence}
          note={detail.cadenceNote}
        />

        <WhatsappPreview
          preview={detail.preview}
          recipients={detail.audience.length}
          callback={handlePreviewAction}
        />
      </div>

      <AutoTriggers data={triggers} callback={handleTriggerToggle} />
    </>
  );
};

export default Nudges;
