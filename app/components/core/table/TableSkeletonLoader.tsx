import React from "react";
import { TableCell, TableRow } from "~/components/ui/table";

interface TableSkeletonLoaderProps {
  cols: number;
  rows?: number;
}

const TableSkeletonLoader: React.FC<TableSkeletonLoaderProps> = ({
  cols,
  rows = 5,
}) => {
  return (
    <>
      {Array(rows)
        .fill(0)
        .map((_, rowIndex) => (
          <TableRow key={`skeleton-row-${rowIndex}`}>
            {Array(cols)
              .fill(0)
              .map((_, colIndex) => (
                <TableCell
                  key={`skeleton-cell-${rowIndex}-${colIndex}`}
                  className="font-xs text-center"
                >
                  <div className="skeleton-loader tw:h-4"></div>
                </TableCell>
              ))}
          </TableRow>
        ))}
    </>
  );
};

export default TableSkeletonLoader;
