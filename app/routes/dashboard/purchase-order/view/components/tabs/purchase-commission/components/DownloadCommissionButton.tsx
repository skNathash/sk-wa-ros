import { FileDown } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  size?: "small" | "large" | "default" | "icon";
  className?: string;
  subscriptionId?: string | null;
};

export default function DownloadCommissionButton({
  size = "small",
  className,
  subscriptionId,
}: Props) {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // If a subscriptionId is provided, prefer platform-fee plan detail download
      if (subscriptionId) {
        try {
          const res =
            await FranchiseService.getPlatformPlanDetails(subscriptionId);
          const d = res.data.data?.invoiceDocumentId || "";
          if (d) {
            CommonService.assetDownload(d);
            toast.show({ msg: "Downloading receipt", color: "success" });
            return;
          }
        } catch (err) {
          // ignore and fallback to legacy
          console.error("Error fetching plan details", err);
        }
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
