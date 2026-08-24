import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyTeamOnShift,
  getTeamOnShift,
  type TeamMember,
  type TeamOnShiftData,
} from "./helper";

const MemberRow = ({ member }: { member: TeamMember }) => (
  <div className="tw:flex tw:items-center tw:gap-3 tw:py-3 tw:first:pt-0 tw:last:pb-0">
    <span
      className={clsx(
        "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
        member.avatarClass,
      )}
    >
      {member.initials}
    </span>

    <div className="tw:min-w-0 tw:flex-1">
      <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
        {member.name}
      </div>
      <div className="tw:text-[11px] tw:text-slate-500">
        {member.role} · {member.shift}
      </div>
    </div>

    <AppBadge
      size="sm"
      variant={member.status === "in" ? "success" : "light"}
      className="tw:uppercase"
    >
      {member.status}
    </AppBadge>
  </div>
);

/** Who is behind the counter right now. */
const TeamOnShift = () => {
  const [data, setData] = useState<TeamOnShiftData>(emptyTeamOnShift);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: TeamOnShiftData;
      try {
        result = await getTeamOnShift();
      } catch (e) {
        result = emptyTeamOnShift();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppCard className="app-home-panel">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          {data.heading}{" "}
          <span className="tw:font-normal tw:text-slate-400">
            {data.inCount}/{data.totalCount} in
          </span>
        </div>
        {data.linkTo && (
          <Link
            to={data.linkTo}
            className="tw:flex tw:items-center tw:text-xs tw:font-semibold tw:text-emerald-700"
          >
            {data.linkLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-6">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:divide-y tw:divide-border/60">
          {data.members.map((member) => (
            <MemberRow key={member.key} member={member} />
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default TeamOnShift;
