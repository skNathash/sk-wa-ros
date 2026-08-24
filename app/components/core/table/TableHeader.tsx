import React from "react";
import { useTranslation } from "react-i18next";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import { TableHead, TableRow } from "~/components/ui/table";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import AppPopover from "../popover/AppPopover";

export interface TableHeaderGroup {
  /** Label shown over the spanned columns. Use "" for ungrouped columns. */
  label: string;
  /** Number of columns this band covers. Must total the number of headers. */
  span: number;
  /** Optional background/utility classes for this band (e.g. "tw:bg-blue-50"). */
  className?: string;
}

interface TableHeaderProps {
  headers: TableHeaderItem[];
  onSort?: (data: { key: string; value: SortValue }) => void;
  className?: string;
  sortValue?: SortValue;
  sortKey?: string;
  noBg?: boolean;
  /** Optional top band row that groups columns. Spans must total headers.length. */
  groups?: TableHeaderGroup[];
}

const TableHeader: React.FC<TableHeaderProps> = ({
  headers,
  onSort,
  className = "",
  sortValue,
  sortKey,
  noBg = false,
  groups,
}) => {
  const { t } = useTranslation(["common"]);

  const handleSort = (item: TableHeaderItem) => {
    if (!item.enableSort) return;
    if (onSort) {
      // If clicking on the same column, toggle the sort direction
      // If clicking on a different column, start with ascending
      const newValue =
        item.key === sortKey && sortValue === "asc" ? "desc" : "asc";
      onSort({
        key: item.key || "",
        value: newValue,
      });
    }
  };

  const renderInfo = (info?: React.ReactNode) => {
    if (!info) return null;
    return (
      <AppPopover triggerContent={<Info className="tw:w-4 tw:h-4" />}>
        <div className="tw:text-sm tw:text-gray-500">{info}</div>
      </AppPopover>
    );
  };

  const contentClass = (header: TableHeaderItem) => {
    const justify = header.isRightAligned
      ? "tw:justify-end"
      : header.isCentered
        ? "tw:justify-center"
        : "";
    return `tw:flex tw:items-center tw:gap-1 ${justify}`;
  };

  const alignClass = (header: TableHeaderItem) => {
    if (header.isRightAligned) return "tw:text-right";
    if (header.isCentered) return "tw:text-center";
    return "";
  };

  return (
    <>
      {groups && groups.length > 0 && (
        <TableRow className={className}>
          {groups.map((group, index) => (
            <TableHead
              key={`group-${index}`}
              colSpan={group.span}
              className={`${group.className ? group.className : noBg ? "" : "tw:bg-slate-100"} ${
                group.label
                  ? `tw:text-center tw:font-semibold tw:border-b tw:border-l tw:border-r tw:border-slate-200 ${
                      group.className?.includes("tw:text-")
                        ? ""
                        : "tw:text-gray-700"
                    }`
                  : ""
              }`}
            >
              {group.label}
            </TableHead>
          ))}
        </TableRow>
      )}
      <TableRow className={className}>
        {headers.map((header, index) => (
        <TableHead
          key={index}
          className={`${header.className ? header.className : noBg ? "" : "tw:bg-slate-50"}
            ${alignClass(header)}
            ${header.enableSort ? "tw:cursor-pointer" : ""}
            ${header.isSticky ? "tw:sticky tw:top-0" : ""}
          `}
          style={{ width: header.width }}
          colSpan={header.colSpan}
          onClick={() => handleSort(header)}
        >
          {header.enableSort ? (
            <div className={contentClass(header)}>
              {header.langKey ? t(header.langKey) : header.label}
              {renderInfo(header.info)}
              <div className="tw:flex tw:flex-col tw:self-center tw:mt-1">
                <ChevronUp
                  size={14}
                  data-active={
                    sortValue === "asc" && header.key === sortKey
                      ? "true"
                      : undefined
                  }
                  className={`${
                    sortValue === "asc" && header.key === sortKey
                      ? "tw:text-blue-500"
                      : "tw:text-gray-500"
                  }`}
                />
                <ChevronDown
                  size={14}
                  data-active={
                    sortValue === "desc" && header.key === sortKey
                      ? "true"
                      : undefined
                  }
                  className={`tw:relative tw:-top-1 ${
                    sortValue === "desc" && header.key === sortKey
                      ? "tw:text-blue-500"
                      : "tw:text-gray-500"
                  }`}
                />
              </div>
            </div>
          ) : header.langKey ? (
            <div className={contentClass(header)}>
              {t(header.langKey)}
              {renderInfo(header.info)}
            </div>
          ) : (
            <div className={contentClass(header)}>
              {header.label}
              {renderInfo(header.info)}
            </div>
          )}
        </TableHead>
      ))}
      </TableRow>
    </>
  );
};

export default TableHeader;
