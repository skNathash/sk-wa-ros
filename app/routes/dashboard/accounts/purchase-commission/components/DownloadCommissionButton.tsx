import { FileDown } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import AccountService from "~/services/AccountService";
import CommonService from "~/services/CommonService";

type Props = {
  receiptId: string;
  size?: "small" | "large" | "default" | "icon";
  className?: string;
};

export default function DownloadCommissionButton({
  receiptId,
  size = "small",
  className,
}: Props) {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const resp = await AccountService.downloadCommissionInvoiceByReceiptId(
        receiptId
      );
      if (resp.statusCode === 200) {
        const file = resp.data?.data?.receiptDocumentId;
        if (file) {
          CommonService.assetDownload(file);
          toast.show({ msg: "Downloading receipt", color: "success" });
        } else {
          toast.show({ msg: "No file found", color: "danger" });
        }
      } else {
        toast.show({ msg: "Failed to download", color: "danger" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppButton
      size={size}
      fill="outline"
      color="primary"
      className={
        className || "tw:h-8 tw:px-2 tw:py-0 tw:flex tw:items-center tw:gap-1"
      }
      onClick={handleDownload}
      isLoading={loading}
    >
      <FileDown className="tw:w-4 tw:h-4" />
      Download
    </AppButton>
  );
}
