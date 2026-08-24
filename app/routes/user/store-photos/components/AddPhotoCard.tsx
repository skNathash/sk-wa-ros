import { Plus } from "lucide-react";
import React from "react";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { UPLOAD_PROPS } from "./uploadProps";

interface AddPhotoCardProps {
  /** Appends the picked file to the gallery. */
  onUpload: (asset: any) => void;
  /** Copy under the plus — "Add photo" for an empty gallery. */
  label: string;
  hint: string;
}

/** Trailing tile of the gallery — the slot the next upload lands in. */
const AddPhotoCard: React.FC<AddPhotoCardProps> = ({
  onUpload,
  label,
  hint,
}) => (
  <div>
    <FileUpload {...UPLOAD_PROPS} onFileUpload={onUpload}>
      <div className="tw:flex tw:aspect-square tw:cursor-pointer tw:sm:aspect-auto tw:sm:h-44 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:px-3 tw:text-center tw:hover:border-primary tw:hover:bg-primary/5">
        <Plus size={22} className="tw:text-gray-400" />
        <div className="tw:text-sm tw:font-semibold tw:text-gray-700">
          {label}
        </div>
        <div className="tw:text-xs tw:text-gray-500">{hint}</div>
      </div>
    </FileUpload>
  </div>
);

export default AddPhotoCard;
