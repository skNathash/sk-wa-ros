import { useState } from "react";
import useAppToast from "~/hooks/useAppToast";
import SellerService from "~/services/SellerService";
import { ChevronRight, FileText } from "lucide-react";

interface GenerateInvoiceProps {
  boxes: any[];
  orderId: string;
  callback: (action: { action: string; data?: any }) => void;
}

const GenerateInvoice: React.FC<GenerateInvoiceProps> = ({
  boxes,
  orderId,
  callback,
}) => {
  const appToast = useAppToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateInvoice = async () => {
    try {
      setIsLoading(true);

      // Extract package IDs only from boxes with status "Closed"
      const packageIds = boxes
        .filter((box) => box.status === "Closed")
        .map((box) => box._id);

      const response = await SellerService.generateInvoiceForOrder({
        orderId,
        packageIds,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({
          msg: "Invoice generated successfully!",
          color: "success",
        });

        callback({
          action: "invoiceGenerated",
          data: response.data,
        });
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to generate invoice",
          color: "error",
        });
      }
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      appToast.show({
        msg: error?.message || "An error occurred while generating invoice",
        color: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closedBoxes = boxes.filter((box) => box.status === "Closed").length;

  return (
    <div className="op-stage-invoice tw:mb-4">
      <div className="op-card op-card-pad">
        <div className="tw:flex tw:items-center tw:gap-3 tw:mb-3">
          <div
            className="tw:p-2.5 tw:rounded-xl tw:shrink-0"
            style={{
              backgroundColor: "var(--op-tint)",
              color: "var(--op-accent)",
            }}
          >
            <FileText size={20} />
          </div>
          <div className="tw:flex-1 tw:min-w-0">
            <div className="op-eyebrow tw:mb-0.5">Packing Complete</div>
            <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
              Next: generate the invoice
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {closedBoxes > 0
                ? `All items are packed in ${closedBoxes} ${closedBoxes === 1 ? "box" : "boxes"}. `
                : ""}
              This bills the order and unlocks delivery assignment.
            </div>
          </div>
        </div>

        <div className="op-cta">
          <button
            type="button"
            className="op-cta-btn"
            onClick={handleGenerateInvoice}
            disabled={isLoading}
          >
            <FileText size={18} />
            {isLoading ? "Generating Invoice..." : "Generate Invoice"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateInvoice;
