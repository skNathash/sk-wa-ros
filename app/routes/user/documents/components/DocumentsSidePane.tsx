import { Search } from "lucide-react";
import React from "react";
import type { DocStatus, DocumentsModel, DocumentItem } from "../helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export type SidePaneStatusFilter = "all" | DocStatus;

interface DocumentsSidePaneProps {
  model: DocumentsModel;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: SidePaneStatusFilter;
  onStatusChange: (value: SidePaneStatusFilter) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onAdd: (item: DocumentItem) => void;
}

interface StatusChip {
  key: SidePaneStatusFilter;
  label: string;
  activeClass: string;
  inactiveClass: string;
}

/**
 * One chip per status the model actually tracks — verified and rejected
 * included, so a rejected upload is reachable instead of hiding behind "All".
 */
const statusChips: StatusChip[] = [
  {
    key: "all",
    label: "All",
    activeClass:
      "tw:bg-primary tw:text-white tw:border-transparent tw:hover:bg-primary-dark",
    inactiveClass:
      "tw:bg-gray-100 tw:text-gray-700 tw:border-gray-200 tw:hover:border-primary/50 tw:hover:text-gray-900",
  },
  {
    key: "verified",
    label: "Verified",
    activeClass:
      "tw:bg-emerald-600 tw:text-white tw:border-transparent tw:hover:bg-emerald-700",
    inactiveClass:
      "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-200 tw:hover:bg-emerald-100",
  },
  {
    key: "pending",
    label: "Pending",
    activeClass:
      "tw:bg-amber-500 tw:text-white tw:border-transparent tw:hover:bg-amber-600",
    inactiveClass:
      "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200 tw:hover:bg-amber-100",
  },
  {
    key: "rejected",
    label: "Rejected",
    activeClass:
      "tw:bg-red-600 tw:text-white tw:border-transparent tw:hover:bg-red-700",
    inactiveClass:
      "tw:bg-red-50 tw:text-red-700 tw:border-red-200 tw:hover:bg-red-100",
  },
  {
    key: "missing",
    label: "Missing",
    activeClass:
      "tw:bg-red-500 tw:text-white tw:border-transparent tw:hover:bg-red-600",
    inactiveClass:
      "tw:bg-red-50 tw:text-red-700 tw:border-red-200 tw:hover:bg-red-100",
  },
];

/**
 * Theme-2 side pane for the Documents page.
 *
 * Mirrors the shared design: a searchable, filterable document navigator with
 * a "missing — unlock next" checklist and a document-type breakdown.
 */
const DocumentsSidePane: React.FC<DocumentsSidePaneProps> = ({
  model,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onAdd,
}) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-5">
      {/* Header */}
      <div className="tw:flex tw:items-center tw:justify-between">
        <PaneTitle title="Documents" className="tw:text-lg tw:text-gray-900" />
        {/* Scope label removed — the pane header carries the title alone.
        <span className="tw:text-xs tw:text-gray-500">
          {model.counts.all} total
        </span>
        */}
      </div>

      {/* Search */}
      <div className="tw:relative">
        <Search
          size={14}
          className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name / number"
          className="tw:w-full tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:py-1.5 tw:pl-8 tw:pr-3 tw:text-xs tw:outline-none tw:focus:border-primary"
        />
      </div>

      {/* Status filter chips */}
      <div className="tw:flex tw:flex-wrap tw:gap-1.5 tw:border-b tw:border-gray-200 tw:pb-3">
        {statusChips.map((chip) => {
          const active = statusFilter === chip.key;
          const count = model.counts[chip.key];
          // A store has at most five documents, so an empty bucket is noise —
          // keep "All" and whatever is selected, drop the rest.
          if (!count && chip.key !== "all" && !active) return null;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onStatusChange(chip.key)}
              className={`tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:transition-colors tw:cursor-pointer ${
                active ? chip.activeClass : chip.inactiveClass
              }`}
            >
              <span>{chip.label}</span>
              <span className="tw:text-[10px] tw:opacity-80">·</span>
              <span className="tw:text-[10px] tw:font-semibold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Missing documents */}
      {model.missing.length > 0 && (
        <div>
          <h3 className="tw:mb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            Missing — unlock next
          </h3>
          <div className="tw:flex tw:flex-col tw:gap-1.5">
            {model.missing.map((item) => (
              <div
                key={item.key}
                className="tw:flex tw:items-center tw:gap-2.5 tw:py-1.5"
              >
                <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-100 tw:text-[11px] tw:font-bold tw:text-red-600">
                  {item.initials}
                </span>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-xs tw:font-semibold tw:text-gray-800">
                    {item.title}
                  </div>
                  <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                    {item.hint || item.type}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="tw:shrink-0 tw:rounded-full tw:bg-primary tw:px-3 tw:py-1 tw:text-[11px] tw:font-medium tw:text-white tw:transition-colors tw:hover:bg-primary-dark"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Types — only worth a facet list once the store has more than one. */}
      {model.types.length > 1 && (
        <div>
          <h3 className="tw:mb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            Types
          </h3>
          <div className="tw:flex tw:flex-col">
            <button
              type="button"
              onClick={() => onTypeChange("")}
              className={`tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 tw:py-1.5 tw:text-xs tw:transition-colors tw:cursor-pointer tw:last:border-b-0 ${
                !typeFilter
                  ? "tw:font-semibold tw:text-primary"
                  : "tw:text-gray-700 tw:hover:text-gray-900"
              }`}
            >
              <span>All</span>
              <span className="tw:text-[11px] tw:text-gray-500">
                {model.counts.all}
              </span>
            </button>
            {model.types.map((type) => {
              const active = typeFilter === type.type;
              return (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => onTypeChange(type.type)}
                  className={`tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 tw:py-1.5 tw:text-xs tw:transition-colors tw:cursor-pointer tw:last:border-b-0 ${
                    active
                      ? "tw:font-semibold tw:text-primary"
                      : "tw:text-gray-700 tw:hover:text-gray-900"
                  }`}
                >
                  <span>{type.type}</span>
                  <span className="tw:text-[11px] tw:text-gray-500">
                    {type.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsSidePane;
