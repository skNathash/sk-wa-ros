import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

type Props = {
  children: React.ReactNode;
  triggerContent: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  noPadding?: boolean;
  contentClassName?: string;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const AppPopover = ({
  children,
  triggerContent,
  align = "center",
  side = "top",
  sideOffset = 4,
  alignOffset = 0,
  avoidCollisions = true,
  noPadding,
  contentClassName,
  modal = false,
  open,
  onOpenChange,
}: Props) => {
  return (
    <Popover modal={modal} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        className={`${noPadding ? "tw:p-0" : ""} ${contentClassName || ""}`}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default AppPopover;
