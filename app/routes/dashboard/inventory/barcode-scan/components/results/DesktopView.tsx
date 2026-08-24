import { useMemo, useState } from "react";
import { orderBy } from "lodash";

import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

import type { AiSuggestedProduct } from "../../helper";
import ResultRow from "./ResultRow";
import type { ScanResultRow } from "./helper";

interface Props {
  rows: ScanResultRow[];
  onAdded?: () => void;
  onCreateFromAi?: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Product", key: "name", width: "44%", enableSort: true },
  { label: "Source", key: "source", width: "14%" },
  {
    label: "MRP",
    key: "mrp",
    width: "12%",
    isRightAligned: true,
    enableSort: true,
  },
  { label: "Quantity", key: "qty", width: "16%", isCentered: true },
  { label: "Action", key: "action", width: "14%", isCentered: true },
];

const SORT_ACCESSORS: Record<string, (row: ScanResultRow) => string | number> = {
  name: (row) => (row.name || "").toLowerCase(),
  mrp: (row) => Number(row.mrp) || 0,
};

const containerStyle = { maxHeight: "calc(100vh - 260px)" };

/**
 * Desktop display of the scan results — one sortable table over every source,
 * already filtered by the chips above it.
 */
const DesktopView: React.FC<Props> = ({
  rows,
  onAdded,
  onCreateFromAi,
  onImagePreview,
}) => {
  const [sort, setSort] = useState<{ key: string; value: SortValue }>({
    key: "",
    value: undefined,
  });

  const sorted = useMemo(() => {
    const accessor = SORT_ACCESSORS[sort.key];
    if (!accessor || !sort.value) return rows;
    return orderBy(rows, [accessor], [sort.value === "desc" ? "desc" : "asc"]);
  }, [rows, sort]);

  return (
    <AppTable
      size="sm"
      container
      responsive
      fixedLayout
      stickyHeader
      condensed
      minWidth="760px"
      containerStyle={containerStyle}
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sort.key}
          sortValue={sort.value}
          onSort={setSort}
        />
      </AppTable.Header>
      <AppTable.Body>
        {sorted.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <span className="tw:text-xs tw:text-gray-400">
                Nothing in this bucket for the scanned code
              </span>
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          sorted.map((row) => (
            <ResultRow
              key={row.key}
              row={row}
              onAdded={onAdded}
              onCreateFromAi={onCreateFromAi}
              onImagePreview={onImagePreview}
            />
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
