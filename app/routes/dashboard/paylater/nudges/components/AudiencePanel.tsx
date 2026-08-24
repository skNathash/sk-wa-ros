import clsx from "clsx";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import { getInitial, getTint } from "../../approvals/helper";
import { TONE_CLASS, type NudgeAudienceMember } from "../helper";

interface AudiencePanelProps {
  summary: string;
  members: NudgeAudienceMember[];
}

/**
 * Who the stage would nudge and why — the count, the one-line reason, then the
 * people themselves with the cadence step each is standing on.
 */
const AudiencePanel: React.FC<AudiencePanelProps> = ({ summary, members }) => {
  return (
    <AppCard className="tw:mb-0 tw:h-full">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:pb-3">
        <h4 className="tw:text-sm tw:font-bold tw:text-gray-900">Who + why</h4>
        <span className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          {members.length} shown
        </span>
      </div>

      <p className="tw:mb-3 tw:border-l-2 tw:border-blue-500 tw:bg-gray-50 tw:px-3 tw:py-2 tw:text-xs tw:text-gray-600">
        {summary}
      </p>

      {members.length === 0 ? (
        <NoData />
      ) : (
        <div className="tw:divide-y tw:divide-gray-100">
          {members.map((member) => (
            <div
              key={member.id}
              className="tw:flex tw:items-center tw:gap-3 tw:py-2.5"
            >
              <span
                className={clsx(
                  "tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-semibold tw:text-white",
                  getTint(member.name),
                )}
              >
                {getInitial(member.name)}
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5">
                  <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                    {member.name}
                  </span>
                  <AppBadge
                    size="sm"
                    variant={member.type === "b2b" ? "primary" : "secondary"}
                  >
                    {member.type.toUpperCase()}
                  </AppBadge>
                </div>
                <p className="tw:truncate tw:text-[11px] tw:text-gray-500">
                  <Amount value={member.amount} decimalPlaces={0} /> ·{" "}
                  {member.due}
                </p>
              </div>

              <span
                className={clsx(
                  "tw:shrink-0 tw:text-[11px] tw:font-semibold",
                  TONE_CLASS[member.tone],
                )}
              >
                {member.step}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default AudiencePanel;
