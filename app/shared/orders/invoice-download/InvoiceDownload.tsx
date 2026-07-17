import { FileDown, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";

import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";

interface InvoiceDownloadProps {
  invoiceNo?: string;
  invoiceDocumentId?: string;
  children?: ReactNode;
}

const InvoiceDownload = ({
  invoiceNo,
  invoiceDocumentId,
  children,
}: InvoiceDownloadProps) => {
  const toast = useAppToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (downloading) {
      return;
    }

    if (!invoiceDocumentId && !invoiceNo) {
      toast.show({ msg: "Invoice document not found", color: "danger" });
      return;
    }

    setDownloading(true);
    try {
      if (invoiceDocumentId) {
        CommonService.assetDownload(invoiceDocumentId);
        toast.show({ msg: "Downloading invoice", color: "success" });
        return;
      }

      if (invoiceNo) {
        const resp = await OmsService.printShipmentPackageInvoice(invoiceNo);

        if (resp.statusCode === 200) {
          const file = resp.data?.data?.filePath;
          if (file) {
            CommonService.assetDownload(file);
            toast.show({ msg: "Downloading invoice", color: "success" });
          } else {
            toast.show({ msg: "No file found", color: "danger" });
          }
        } else {
          toast.show({ msg: "Failed to prepare invoice", color: "danger" });
        }
      }
    } catch (error) {
      toast.show({ msg: "Failed to download", color: "danger" });
    } finally {
      setDownloading(false);
    }
  }, [downloading, invoiceDocumentId, invoiceNo, toast]);

  const triggerContent = useMemo(() => {
    if (children) {
      return children;
    }

    return downloading ? (
      <Loader2 className="tw:w-4 tw:h-4 tw:animate-spin" />
    ) : (
      <FileDown size={16} className="tw:text-gray-500" />
    );
  }, [children, downloading]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="tw:!px-0 tw:!py-0 tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-gray-500 tw:hover:text-gray-900 tw:transition-all tw:duration-300"
    >
      {triggerContent}
    </button>
  );
};

export default InvoiceDownload;
