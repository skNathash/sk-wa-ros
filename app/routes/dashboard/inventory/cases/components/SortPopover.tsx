import { ArrowUpDown } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";

const SortPopover = () => {
  return (
    <>
      <AppPopover
        triggerContent={
          <Button variant="outline" size="sm">
            <ArrowUpDown size={18} />
          </Button>
        }
      >
        <div>SortPopover</div>
      </AppPopover>
    </>
  );
};

export default SortPopover;
