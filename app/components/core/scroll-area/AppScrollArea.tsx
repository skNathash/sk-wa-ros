import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";

const AppScrollArea = ({
  children,
  className,
  orientation = "vertical",
}: {
  children: React.ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) => {
  return (
    <ScrollArea className={className}>
      {children}
      <ScrollBar orientation={orientation} className="tw:w-0.5" />
    </ScrollArea>
  );
};

export default AppScrollArea;
