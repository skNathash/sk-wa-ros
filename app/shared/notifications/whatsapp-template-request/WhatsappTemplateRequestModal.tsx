import { Check, ImagePlus, MessageSquarePlus, Send, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppTextarea } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import WhatsappTemplateRequestService from "~/services/WhatsappTemplateRequestService";

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
};

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const WhatsappTemplateRequestModal: React.FC<Props> = ({ show, callback }) => {
  const toast = useAppToast();
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: { remarks: "" },
  });

  // Validate on submit instead of via field-level rules.
  const validate = (values: { remarks: string }) => {
    if (!values.remarks?.trim()) {
      setError("remarks", {
        type: "manual",
        message: "Please describe the template you need",
      });
      return false;
    }
    clearErrors("remarks");
    return true;
  };

  // Reset form state when the modal opens
  useEffect(() => {
    if (show) {
      reset({ remarks: "" });
      setImages([]);
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [show, reset]);

  const handleFileUpload = (data: any) => {
    const assetId = data?._id;
    if (!assetId) return;
    setImages((prev) => {
      if (prev.includes(assetId) || prev.length >= MAX_IMAGES) return prev;
      return [...prev, assetId];
    });
  };

  const handleRemoveImage = (assetId: string) => {
    setImages((prev) => prev.filter((id) => id !== assetId));
  };

  // Closing after a successful submit should still let the list refresh.
  const handleClose = () => {
    callback({ action: submitted ? "submit" : "close" });
  };

  const handleDone = () => {
    callback({ action: "submit" });
  };

  const handleSubmitAnother = () => {
    reset({ remarks: "" });
    setImages([]);
    setSubmitted(false);
  };

  const onSubmit = async (values: { remarks: string }) => {
    if (!validate(values)) return;
    setSubmitting(true);
    try {
      const payload = {
        remarks: values.remarks?.trim(),
        images,
      };
      const res = await WhatsappTemplateRequestService.create(payload);

      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        // Show the confirmation inside the modal instead of closing immediately.
        setSubmitted(true);
      } else {
        toast.show({
          msg: res?.data?.message || "Something went wrong",
          color: "error",
        });
      }
    } catch (error: any) {
      toast.show({
        msg: error?.data?.message || "Something went wrong",
        color: "error",
      });
      console.error("WhatsappTemplateRequestModal.onSubmit", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-lg tw:w-full">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-lg tw:bg-green-100 dark:tw:bg-green-900/40 tw:text-green-600 dark:tw:text-green-400">
            <MessageSquarePlus size={16} />
          </span>
          <div className="tw:font-semibold tw:text-base">
            {submitted ? "Request received" : "Request WhatsApp Template"}
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="modal-bg ion-padding">
        {submitted ? (
          <SuccessBlock />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="tw:space-y-4">
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border tw:border-green-100 dark:tw:border-green-900/40 tw:bg-green-50/60 dark:tw:bg-green-950/20 tw:px-3 tw:py-2.5">
                <Sparkles
                  size={16}
                  className="tw:shrink-0 tw:mt-0.5 tw:text-green-600 dark:tw:text-green-400"
                />
                <p className="tw:text-xs tw:leading-relaxed tw:text-slate-600 dark:tw:text-slate-300">
                  Describe the promotion template you need. Our StoreKing team
                  designs it, gets it approved, and adds it to your library.
                </p>
              </div>

              <AppTextarea
                name="remarks"
                register={register}
                label="What template do you need?"
                isRequired
                rows={4}
                maxLength={500}
                placeholder="e.g. A Diwali offer promotion with a product image and a link to my store"
                error={errors.remarks?.message as string}
              />

              <div>
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                  <div className="tw:text-sm tw:font-medium tw:text-slate-800 dark:tw:text-slate-100">
                    Reference images
                    <span className="tw:font-normal tw:text-slate-400">
                      {" "}
                      (optional)
                    </span>
                  </div>
                  <div className="tw:text-xs tw:text-slate-400 tw:tabular-nums">
                    {images.length}/{MAX_IMAGES}
                  </div>
                </div>

                <div className="tw:flex tw:flex-wrap tw:items-start tw:gap-2">
                  {images.map((assetId) => (
                    <FileUploadPreview
                      key={assetId}
                      image={assetId}
                      onRemove={() => handleRemoveImage(assetId)}
                    />
                  ))}

                  {images.length < MAX_IMAGES && (
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      maxSizeMB={MAX_IMAGE_SIZE_MB}
                      allowedExtensions={ALLOWED_IMAGE_EXTENSIONS}
                      accept=".jpg,.jpeg,.png,.webp"
                    >
                      <div className="tw:w-28 tw:h-[104px] tw:border tw:border-dashed tw:border-gray-300 dark:tw:border-neutral-700 tw:rounded-md tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:text-slate-500 tw:transition-colors tw:cursor-pointer tw:hover:border-green-500 tw:hover:text-green-600">
                        <ImagePlus size={20} />
                        <span className="tw:text-xs">Add image</span>
                      </div>
                    </FileUpload>
                  )}
                </div>
                <div className="tw:text-xs tw:text-slate-400 tw:mt-1.5">
                  Share designs or examples to help us match your style.
                </div>
                <div className="tw:text-xs tw:text-slate-400 tw:mt-1">
                  {ALLOWED_IMAGE_EXTENSIONS.join(", ").toUpperCase()} · up to{" "}
                  {MAX_IMAGE_SIZE_MB}MB each
                </div>
              </div>
            </div>
          </form>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        {submitted ? (
          <div className="tw:flex tw:w-full tw:justify-end tw:gap-2 tw:p-2">
            <AppButton
              onClick={handleSubmitAnother}
              color="light"
              fill="outline"
              size="small"
            >
              Request another
            </AppButton>
            <AppButton onClick={handleDone} color="primary" size="small">
              Done
            </AppButton>
          </div>
        ) : (
          <div className="tw:flex tw:w-full tw:justify-end tw:gap-2 tw:p-2">
            <AppButton
              onClick={handleClose}
              color="light"
              fill="outline"
              size="small"
              disabled={submitting}
            >
              Cancel
            </AppButton>
            <AppButton
              onClick={handleSubmit(onSubmit)}
              color="primary"
              size="small"
              isLoading={submitting}
            >
              <Send size={14} />
              Submit request
            </AppButton>
          </div>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

const SuccessBlock: React.FC = () => (
  <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:px-4 tw:py-6">
    <div className="tw:relative tw:mb-5">
      <span className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-green-500/10 tw:scale-150" />
      <span className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-green-500/10 tw:scale-[1.9]" />
      <span className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:rounded-full tw:bg-green-600 tw:text-white tw:shadow-lg tw:shadow-green-600/30">
        <Check size={30} strokeWidth={3} />
      </span>
    </div>

    <h3 className="tw:text-lg tw:font-semibold tw:text-slate-900 dark:tw:text-slate-50">
      Request submitted
    </h3>
    <p className="tw:mt-1.5 tw:max-w-xs tw:text-sm tw:leading-relaxed tw:text-slate-500 dark:tw:text-slate-400">
      Thanks! The StoreKing team will review your request and get back to you
      once your template is ready.
    </p>

    <div className="tw:mt-5 tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-amber-50 dark:tw:bg-amber-950/30 tw:border tw:border-amber-200 dark:tw:border-amber-900/50 tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-amber-700 dark:tw:text-amber-400">
      <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-amber-500" />
      Pending review
    </div>
  </div>
);

export default WhatsappTemplateRequestModal;
