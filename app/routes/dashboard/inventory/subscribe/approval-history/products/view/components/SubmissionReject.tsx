import { XCircle } from "lucide-react";
import type { Item } from "../helper";
import ProductDetails from "./ProductDetails";

type Props = {
  requested: Partial<Item>;
  remarks: string;
  onImageClick?: (images: any[]) => void;
};

const SubmissionReject = ({ requested, remarks, onImageClick }: Props) => {
  return (
    <div>
      <div className="tw:flex tw:gap-2 tw:border tw:border-red-200 tw:bg-red-50/60 tw:rounded-lg tw:p-3 tw:mb-4">
        <XCircle size={16} className="tw:text-red-600 tw:shrink-0 tw:mt-0.5" />
        <div className="tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-red-900">
            StoreKing rejected this submission
          </div>
          <div className="tw:text-xs tw:text-red-700 tw:mt-0.5">
            {remarks ? `Reason: ${remarks}` : "No reason was provided."}
          </div>
        </div>
      </div>

      <ProductDetails data={requested} onImageClick={onImageClick} />
    </div>
  );
};

export default SubmissionReject;
