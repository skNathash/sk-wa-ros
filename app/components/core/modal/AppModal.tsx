import { DialogTitle } from "@radix-ui/react-dialog";
import clsx from "clsx";
import { X } from "lucide-react";
import React, { type ReactNode, useCallback } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import useScreenView from "~/hooks/useScreenView";

type Props = {
  children: ReactNode;
  show: boolean;
  callback?: (a: { action: string; data: any }) => void;
  className?: string;
  backdropDismiss?: boolean;
  isAutoHeight?: boolean;
  disableSwipe?: boolean;
  noPadding?: boolean;
  overFlowHidden?: boolean;
};

type TitleProps = {
  children: ReactNode;
  onClose: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  noShadow?: boolean;
  noBg?: boolean;
  toolbarClassName?: string;
  showBackBtn?: boolean;
  hideCloseBtns?: boolean;
};

type HeaderProps = {
  children: ReactNode;
  className?: string;
  showCloseBtn?: boolean;
  onClose?: () => void;
  noShadow?: boolean;
};

type ContentProps = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
};

function AppModal({
  children,
  show = false,
  callback,
  className = "",
  backdropDismiss = true,
  isAutoHeight = false,
  disableSwipe = false,
  noPadding = false,
  overFlowHidden = false,
}: Props) {
  const { isMobile } = useScreenView();

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!backdropDismiss && !open) {
        return;
      }

      if (!open && callback) {
        callback({ action: "close", data: {} });
      }
    },
    [callback, backdropDismiss],
  );

  // Mobile view - use Drawer
  if (isMobile) {
    return (
      <Drawer
        open={show}
        onOpenChange={onOpenChange}
        dismissible={!disableSwipe}
      >
        <DrawerContent
          className={clsx(
            "tw:flex tw:flex-col",
            { "tw:p-0.5": !noPadding },
            isAutoHeight ? "auto-height-modal" : "",
            className,
          )}
        >
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop view - use Dialog
  return (
    <Dialog open={show} onOpenChange={onOpenChange}>
      <DialogContent
        className={clsx(
          "tw:flex tw:flex-col",
          {
            "tw:p-0.5": !noPadding,
            "tw:p-0": noPadding,
            "tw:overflow-hidden": overFlowHidden,
          },
          isAutoHeight ? "auto-height-modal" : "",
          className,
        )}
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          const p = document.querySelectorAll(
            "[data-radix-popper-content-wrapper]",
          );
          if (p.length > 0) {
            e.preventDefault();
          }
        }}
        // showCloseButton={backdropDismiss}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

const Header: React.FC<HeaderProps> & { displayName?: string } = ({
  children,
  className = "",
  showCloseBtn = false,
  onClose,
  noShadow = false,
}) => {
  const { isMobile } = useScreenView();

  // Mobile view - use DrawerHeader
  if (isMobile) {
    return (
      <DrawerHeader
        className={clsx(
          "tw:flex-shrink-0",
          className,
          showCloseBtn || noShadow ? "tw:border-none" : "",
          noShadow ? "tw:border-b tw:border-gray-200" : "",
        )}
      >
        <div className="tw:flex tw:items-center tw:justify-between">
          {children}
        </div>
      </DrawerHeader>
    );
  }

  // Desktop view - use DialogHeader
  return (
    <DialogHeader
      className={clsx(
        "tw:flex-shrink-0",
        className,
        showCloseBtn || noShadow ? "tw:border-none" : "",
        noShadow ? "tw:border-b tw:border-gray-200" : "",
      )}
    >
      <DialogTitle>
        <div className="tw:flex tw:items-center tw:justify-between">
          {/* {showCloseBtn ? (
          <button
            onClick={onClose}
            className="tw:!rounded-full tw:w-10 tw:h-10 tw:bg-black tw:text-gray-300 tw:inline-flex tw:items-center tw:justify-center tw:mb-2"
          >
            <X className="tw:text-2xl" />
          </button>
        ) : null} */}
          {children}
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};

const Title: React.FC<TitleProps> & { displayName?: string } = ({
  children,
  onClose,
  noShadow = false,
  noBg = false,
  toolbarClassName = "",
  showBackBtn = false,
  hideCloseBtns = false,
}) => {
  const { isMobile } = useScreenView();

  // Mobile view - use DrawerHeader with DrawerTitle
  if (isMobile) {
    return (
      <DrawerHeader
        className={clsx(
          "app-modal-title tw:px-4 tw:pt-4 tw:flex-shrink-0",
          {
            "tw:bg-white": !noBg,
            "tw:border-none": noShadow,
            "tw:border-b tw:border-gray-200": noShadow,
          },
          toolbarClassName,
        )}
      >
        <DrawerTitle>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:flex-1 tw:text-left">{children}</div>
            {!hideCloseBtns && !showBackBtn ? (
              <Button
                onClick={onClose}
                className="tw:p-2 tw:self-start tw:cursor-pointer"
                variant="ghost"
              >
                <X />
              </Button>
            ) : null}
          </div>
        </DrawerTitle>
      </DrawerHeader>
    );
  }

  // Desktop view - use DialogHeader with DialogTitle
  return (
    <DialogHeader
      className={clsx(
        "app-modal-title tw:px-4 tw:pt-4 tw:flex-shrink-0",
        {
          "tw:bg-white": !noBg,
          "tw:border-none": noShadow,
          "tw:border-b tw:border-gray-200": noShadow,
        },
        toolbarClassName,
      )}
    >
      <DialogTitle>
        <div className="tw:flex tw:justify-between tw:items-center">
          {/* {!hideCloseBtns && showBackBtn ? (
          <button onClick={onClose} className="tw:p-2">
            <X className="tw:text-2xl"></X>
          </button>
        ) : null} */}
          <div className="tw:flex-1 tw:text-left">{children}</div>
          {!hideCloseBtns && !showBackBtn ? (
            <Button
              onClick={onClose}
              className="tw:p-2 tw:self-start tw:cursor-pointer"
              variant="ghost"
            >
              <X />
            </Button>
          ) : null}
        </div>
      </DialogTitle>
    </DialogHeader>
  );
};

const Content: React.FC<ContentProps> & { displayName?: string } = ({
  children,
  className,
  noPadding = false,
}: ContentProps) => {
  const { isMobile } = useScreenView();

  // Both mobile and desktop use the same content structure
  return (
    <div className={clsx("tw:overflow-y-auto tw:flex-1", className)}>
      <div
        className={clsx({ "tw:px-4 tw:pb-4": !noPadding, "tw:p-0": noPadding })}
      >
        {children}
      </div>
    </div>
  );
};

const Footer: React.FC<ContentProps> & { displayName?: string } = ({
  children,
  className,
}: ContentProps) => {
  const { isMobile } = useScreenView();

  // Mobile view - use DrawerFooter
  if (isMobile) {
    return (
      <DrawerFooter
        className={clsx("tw:p-4 tw:flex-shrink-0 tw:justify-start", className)}
      >
        {children}
      </DrawerFooter>
    );
  }

  // Desktop view - use DialogFooter
  return (
    <DialogFooter
      className={clsx("tw:p-4 tw:flex-shrink-0 tw:justify-start", className)}
    >
      {children}
    </DialogFooter>
  );
};

AppModal.Header = Header;
AppModal.Header.displayName = "AppModal.Header";

AppModal.Title = Title;
AppModal.Title.displayName = "AppModal.Title";

AppModal.Content = Content;
AppModal.Content.displayName = "AppModal.Content";

AppModal.Footer = Footer;
AppModal.Footer.displayName = "AppModal.Footer";

export default AppModal;
