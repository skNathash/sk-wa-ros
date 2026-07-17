import { useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import SellerService from "~/services/SellerService";
import { FileText } from "lucide-react";

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

  return (
    <AppCard
      title="Invoice & Shipment"
      icon="file-text"
      subtitle="The order has been packed. Please generate an invoice to proceed."
    >
      <div className="tw:p-4 tw:text-center">
        <AppButton
          onClick={handleGenerateInvoice}
          isLoading={isLoading}
          disabled={isLoading}
          color="success"
          fill="solid"
        >
          <FileText />
          Generate Invoice
        </AppButton>
      </div>
    </AppCard>
  );
};

export default GenerateInvoice;
