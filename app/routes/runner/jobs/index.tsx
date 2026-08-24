import { Info, Search, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppTab from "~/components/core/tab/AppTab";
import { Input } from "~/components/ui/input";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import RunnerHeader from "~/shared/runner/header/RunnerHeader";
import type { TabItem } from "~/types/CommonTypes";
import ActiveJobCard from "./components/active-job-card/ActiveJobCard";
import AvailableJobCard from "./components/available-job-card/AvailableJobCard";
import TodayJobCard from "./components/today-job-card/TodayJobCard";
import {
  ACTIVE_JOB_CARDS,
  AVAILABLE_JOBS,
  AVAILABLE_NOTE_LBL,
  DEFAULT_JOB_TAB,
  JOBS_HEADER,
  JOB_TABS,
  JOB_TAB_PARAM,
  TODAY_JOBS,
  TODAY_STORE_LBL,
  TODAY_SUMMARY_LBL,
  type RunnerJobTabKey,
} from "./helper";

/**
 * Runner job list — the runner's three views of the same day: what they are on
 * now, what they have already run, and what is still open to claim. The feed
 * lives in the URL rather than in state so a job link can point at the tab it
 * belongs to, and so back returns to the feed the runner left.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const paramTab = searchParams.get(JOB_TAB_PARAM) as RunnerJobTabKey | null;
  const activeTab =
    paramTab && JOB_TABS.some((tab) => tab.key === paramTab)
      ? paramTab
      : DEFAULT_JOB_TAB;

  // Replace rather than push: flipping between feeds is a view change, not a
  // step the runner should have to walk back through to leave the screen.
  const onTabChange = (tab: TabItem) => {
    const params = new URLSearchParams(searchParams);
    params.set(JOB_TAB_PARAM, tab.key);
    setSearchParams(params, { replace: true });
  };

  const onSearchToggle = () => {
    setIsSearchOpen((open) => !open);
    setSearch("");
  };

  return (
    <>
      <RunnerHeader title={JOBS_HEADER.title} subtitle={JOBS_HEADER.subtitle}>
        <AppButton
          fill="clear"
          size="icon"
          className="runner-hero-icon-btn"
          onClick={onSearchToggle}
        >
          {isSearchOpen ? <X size={18} /> : <Search size={18} />}
        </AppButton>
      </RunnerHeader>

      {/* Feed switch, with search opening under it so the tabs never move. */}
      <div className="runner-jobs-bar">
        <AppTab
          tabs={JOB_TABS}
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant="pills"
          scrollable
        />

        {isSearchOpen && (
          <div className="tw:relative tw:mt-3">
            <Search
              size={16}
              className="tw:absolute tw:top-1/2 tw:left-3 tw:-translate-y-1/2 tw:text-slate-400"
            />
            <Input
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order code, customer or store"
              className="tw:pl-9"
            />
          </div>
        )}
      </div>

      {activeTab === "active" && (
        <section className="runner-card-grid tw:px-4 tw:pt-4 tw:pb-6">
          {ACTIVE_JOB_CARDS.map((job) => (
            <ActiveJobCard key={job.id} job={job} />
          ))}
        </section>
      )}

      {activeTab === "today" && (
        <section className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-4 tw:pb-6">
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="app-label tw:text-slate-500">
              {TODAY_SUMMARY_LBL}
            </span>
            <span className="tw:ml-auto tw:truncate tw:text-xs tw:text-slate-400">
              {TODAY_STORE_LBL}
            </span>
          </div>

          <div className="runner-card-grid">
            {TODAY_JOBS.map((job) => (
              <TodayJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {activeTab === "available" && (
        <section className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-4 tw:pb-6">
          <p className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-400">
            <Info size={13} className="tw:shrink-0" />
            {AVAILABLE_NOTE_LBL}
          </p>

          <div className="runner-card-grid">
            {AVAILABLE_JOBS.map((job) => (
              <AvailableJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default RunnerJobs;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner jobs"),
    },
  ];
}
