import clsx from "clsx";
import React, { type ReactNode, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from "~/components/ui/sheet";

// Types

type Props = {
  children: ReactNode;
  show: boolean;
  callback?: (a: { action: string; data: any }) => void;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  backdropDismiss?: boolean;
  isAutoHeight?: boolean;
};

type TitleProps = {
  children: ReactNode;
  onClose: () => void;
  toolbarClassName?: string;
  hideCloseBtn?: boolean;
};

type HeaderProps = {
  children: ReactNode;
  className?: string;
  showCloseBtn?: boolean;
  onClose?: () => void;
};

type ContentProps = {
  children: ReactNode;
  className?: string;
};

function AppSheet({
  children,
  show = false,
  callback,
  side = "right",
  className = "",
  backdropDismiss = true,
  isAutoHeight = false,
}: Props) {
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open && callback) {
        callback({ action: "close", data: {} });
      }
    },
    [callback]
  );

  useEffect(() => {
    // Add any side effects if needed when sheet opens/closes
  }, [show]);

  return (
    <Sheet open={show} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={clsx(
          isAutoHeight ? "auto-height-sheet" : "",
          "tw:p-0",
          className
        )}
        // Optionally handle backdropDismiss if shadcn Sheet supports it
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}

const Header: React.FC<HeaderProps> & { displayName?: string } = ({
  children,
  className = "",
  showCloseBtn = false,
  onClose,
}) => {
  return (
    <SheetHeader className={clsx("tw:sticky tw:top-0 tw:z-10", className)}>
      <div className="tw:flex tw:items-center tw:justify-between">
        {children}
        {/* Optionally add a close button if showCloseBtn is true */}
        {showCloseBtn && onClose ? (
          <button onClick={onClose} className="tw:p-2">
            ×
          </button>
        ) : null}
      </div>
    </SheetHeader>
  );
};

const Title: React.FC<TitleProps> & { displayName?: string } = ({
  children,
  onClose,
  toolbarClassName = "",
  hideCloseBtn = false,
}) => {
  return (
    <SheetHeader
      className={clsx(
        "tw:sticky tw:top-0 tw:z-10 tw:bg-white",
        toolbarClassName
      )}
    >
      <SheetTitle className="tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex-1">{children}</div>
        {!hideCloseBtn ? (
          <button onClick={onClose} className="tw:p-2">
            ×
          </button>
        ) : null}
      </SheetTitle>
    </SheetHeader>
  );
};

const Content: React.FC<ContentProps> & { displayName?: string } = ({
  children,
  className,
}: ContentProps) => {
  return (
    <div className={clsx("tw:flex-1 tw:overflow-auto", className)}>
      {children}
    </div>
  );
};

const Footer: React.FC<ContentProps> & { displayName?: string } = ({
  children,
  className,
}: ContentProps) => {
  return <SheetFooter className={className}>{children}</SheetFooter>;
};

AppSheet.Header = Header;
AppSheet.Header.displayName = "AppSheet.Header";

AppSheet.Title = Title;
AppSheet.Title.displayName = "AppSheet.Title";

AppSheet.Content = Content;
AppSheet.Content.displayName = "AppSheet.Content";

AppSheet.Footer = Footer;
AppSheet.Footer.displayName = "AppSheet.Footer";

export default AppSheet;
