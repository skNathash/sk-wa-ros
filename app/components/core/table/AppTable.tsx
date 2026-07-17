import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface AppTableProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
  hover?: boolean;
  striped?: boolean;
  responsive?: boolean;
  size?: "sm" | "md" | "lg";
  minWidth?: string;
  fixedLayout?: boolean;
  stickyHeader?: boolean;
  container?: boolean;
  containerStyle?: React.CSSProperties;
  light?: boolean;
  condensed?: boolean;
}

interface AppTableComposition {
  Header: React.FC<{
    children: React.ReactNode;
    className?: string;
    light?: boolean;
  }>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
  Row: React.FC<{
    children: React.ReactNode;
    className?: string;
    id?: string;
    onClick?: () => void;
    noHover?: boolean;
  }>;
  Cell: React.FC<{
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
    rowSpan?: number;
    style?: React.CSSProperties;
  }>;
}

const AppTable: React.FC<AppTableProps> & AppTableComposition = ({
  children,
  className = "",
  bordered = true,
  hover = true,
  striped = false,
  responsive = true,
  size = "sm",
  minWidth = "100%",
  fixedLayout = false,
  stickyHeader = false,
  container = false,
  containerStyle,
  condensed = false,
}) => {
  const tableClasses = [
    // bordered ? "table-bordered" : "",
    // hover ? "table-hover" : "",
    // striped ? "tw:table-striped" : "",
    size === "sm" ? "table-sm" : "",
    condensed ? "condensed" : "",
    size === "md" ? "table-md" : "",
    size === "lg" ? "table-lg" : "",
    fixedLayout ? "fixed-layout" : "",
    stickyHeader ? "table-header-sticky" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const table = (
    <Table className={tableClasses} style={{ minWidth }}>
      {children}
    </Table>
  );

  const wrappedTable =
    0 && responsive ? <div className="table-responsive">{table}</div> : table;

  if (container) {
    return (
      <>
        <div
          className="table-container tw:overflow-y-auto thin-scrollbar tranparent-scrollbar"
          style={containerStyle}
        >
          {wrappedTable}
        </div>
      </>
    );
  }

  return wrappedTable;
};

// These will be defined in separate files and attached to AppTable
AppTable.Header = ({ children, className = "", light = false }) => (
  <TableHeader>{children}</TableHeader>
);

AppTable.Body = ({ children, className = "" }) => (
  <TableBody className={className}>{children}</TableBody>
);

AppTable.Footer = ({ children, className = "" }) => (
  <TableFooter className={className}>{children}</TableFooter>
);

AppTable.Row = ({ children, className = "", onClick, id, noHover = false }) => (
  <TableRow
    className={className + (noHover ? " tw:hover:bg-transparent" : "")}
    onClick={onClick}
    id={id}
  >
    {children}
  </TableRow>
);

AppTable.Cell = ({ children, className = "", colSpan, rowSpan, style }) => (
  <TableCell
    className={className + " tw:truncate tw:whitespace-normal"}
    colSpan={colSpan}
    rowSpan={rowSpan}
    style={style}
  >
    {children}
  </TableCell>
);

export default AppTable;
