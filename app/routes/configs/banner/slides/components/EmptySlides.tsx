import { ImagePlus, Plus } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";

interface EmptySlidesProps {
  onAddSlide?: () => void;
}

const EmptySlides: React.FC<EmptySlidesProps> = ({ onAddSlide }) => {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:px-4 tw:text-center">
      <div className="tw:w-16 tw:h-16 tw:rounded-full tw:bg-slate-100 tw:flex tw:items-center tw:justify-center tw:mb-4">
        <ImagePlus size={28} className="tw:text-slate-400" />
      </div>

      <h3 className="tw:text-base tw:font-semibold tw:text-slate-800 tw:mb-1">
        No Slides Yet
      </h3>
      <p className="tw:text-sm tw:text-slate-500 tw:max-w-md tw:mb-6">
        You haven't added any banner slides yet. Click the button below to
        create your first slide.
      </p>

      {onAddSlide && (
        <AppButton size="small" onClick={onAddSlide}>
          <Plus size={16} />
          Add New Slide
        </AppButton>
      )}
    </div>
  );
};

export default EmptySlides;
