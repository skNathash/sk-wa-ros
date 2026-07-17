import { Download } from "lucide-react";
import DownloadSampleBlock from "~/shared/others/components/DownloadSampleBlock";

interface BulkBarcodeInfoProps {
  onDownloadTemplate: () => void;
}

const BulkBarcodeInfo = ({ onDownloadTemplate }: BulkBarcodeInfoProps) => {
  return (
    <DownloadSampleBlock onDownloadTemplate={onDownloadTemplate} template={2} />
  );
};

export default BulkBarcodeInfo;
