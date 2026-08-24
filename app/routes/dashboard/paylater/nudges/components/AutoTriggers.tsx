import clsx from "clsx";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSwitch from "~/components/core/form/AppSwitch";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import useScreenView from "~/hooks/useScreenView";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { STAGE_TONES, getStage, type AutoTrigger } from "../helper";

interface AutoTriggersProps {
  data: AutoTrigger[];
  callback?: (payload: { action: string; data: AutoTrigger }) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Stage", key: "stage", enableSort: false, width: "12%" },
  { label: "When (event)", key: "when", enableSort: false, width: "33%" },
  { label: "Then (nudge)", key: "then", enableSort: false, width: "33%" },
  {
    label: "Audience",
    key: "audience",
    enableSort: false,
    width: "10%",
    isRightAligned: true,
  },
  {
    label: "Status",
    key: "status",
    enableSort: false,
    width: "12%",
    isRightAligned: true,
  },
];

const StageChip = ({ trigger }: { trigger: AutoTrigger }) => (
  <span
    className={clsx(
      "tw:inline-block tw:rounded tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
      STAGE_TONES[trigger.stage].chip,
    )}
  >
    {getStage(trigger.stage).name}
  </span>
);

/**
 * The always-on half of the page: the events that build an audience on their
 * own and the nudge each one fires. The switch is the only control — what a
 * trigger does is fixed, whether it runs is not.
 */
const AutoTriggers: React.FC<AutoTriggersProps> = ({ data, callback }) => {
  const { isMobile } = useScreenView();

  const header = (
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
      <h4 className="tw:text-sm tw:font-bold tw:text-gray-900">
        Auto-triggers
      </h4>
      <span className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
        event → nudge · runs on schedule
      </span>
    </div>
  );

  if (!data.length) {
    return (
      <AppCard className="tw:mb-0">
        {header}
        <NoData />
      </AppCard>
    );
  }

  // Phones get one card per trigger — five columns of copy do not survive a
  // 360px table, and the switch has to stay reachable.
  if (isMobile) {
    return (
      <AppCard className="tw:mb-0">
        {header}
        <div className="tw:mt-3 tw:divide-y tw:divide-gray-100">
          {data.map((trigger) => (
            <div key={trigger.id} className="tw:py-3">
              <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:gap-2">
                <StageChip trigger={trigger} />
                <AppSwitch
                  checked={trigger.enabled}
                  label=""
                  onCheckedChange={() =>
                    callback?.({ action: "toggle", data: trigger })
                  }
                />
              </div>

              <p className="tw:text-xs tw:text-gray-700">{trigger.when}</p>
              <p className="tw:text-xs tw:font-medium tw:text-gray-900">
                → {trigger.then}
              </p>
              <p className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
                {trigger.audience} in audience
              </p>
            </div>
          ))}
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard className="tw:mb-0">
      {header}

      <div className="tw:mt-3">
        <AppTable size="sm" minWidth="700px">
          <AppTable.Header>
            <TableHeader headers={headers} />
          </AppTable.Header>
          <AppTable.Body>
            {data.map((trigger) => (
              <AppTable.Row key={trigger.id}>
                <AppTable.Cell>
                  <StageChip trigger={trigger} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-gray-700">
                  {trigger.when}
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-medium tw:text-gray-900">
                  {trigger.then}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right tw:font-semibold">
                  {trigger.audience}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right">
                  <div className="tw:flex tw:justify-end">
                    <AppSwitch
                      checked={trigger.enabled}
                      label=""
                      onCheckedChange={() =>
                        callback?.({ action: "toggle", data: trigger })
                      }
                    />
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))}
          </AppTable.Body>
        </AppTable>
      </div>
    </AppCard>
  );
};

export default AutoTriggers;
