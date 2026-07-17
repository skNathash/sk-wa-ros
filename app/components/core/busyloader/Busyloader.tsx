import { Dialog, DialogContent } from "~/components/ui/dialog";
import AppSpinner from "../Spinner/AppSpinner";
import { DialogTitle } from "@radix-ui/react-dialog";

interface BusyLoaderProps {
  show: boolean;
  message?: string;
  isCentered?: boolean;
}

const BusyLoader = ({ show, message, isCentered = true }: BusyLoaderProps) => {
  return (
    <Dialog open={show}>
      <DialogTitle className="tw:hidden"></DialogTitle>
      <DialogContent
        className={`tw:flex tw:items-center tw:gap-4 tw:w-auto ${
          isCentered ? "tw:justify-center" : ""
        }`}
        showCloseButton={false}
        aria-describedby="busy-loader-message"
      >
        <AppSpinner className="tw:w-8 tw:h-8" />
        <div className="tw:text-sm tw:text-gray-700">
          {message || "Loading, please wait..."}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusyLoader;
