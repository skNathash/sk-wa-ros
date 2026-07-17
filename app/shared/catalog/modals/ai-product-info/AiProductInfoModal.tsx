import {
  CheckCircle2,
  DollarSign,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Info,
  Package,
  ScanLine,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react";
import React, { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import { ASSET } from "~/constants";
import CommonService from "~/services/CommonService";
import ImgRender from "~/components/core/img/ImgRender";

interface AiProductInfoModalProps {
  show: boolean;
  mode?: "add" | "search";
  callback: (data: { action: string; data: any }) => void;
}

const AiProductInfoModal: React.FC<AiProductInfoModalProps> = ({
  show,
  mode = "add",
  callback,
}) => {
  const appToast = useAppToast();
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [images, setImages] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);

  const processingMessages = [
    "Analyzing image quality...",
    "Detecting barcode and labels...",
    "Extracting pricing and product info...",
    "Matching details with StoreKing catalog...",
  ];

  React.useEffect(() => {
    let timer: number | undefined;
    if (isProcessing) {
      timer = window.setInterval(() => {
        setProcessingMsgIndex((i) => (i + 1) % processingMessages.length);
      }, 2000);
    } else {
      setProcessingMsgIndex(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing]);

  // Reset modal state whenever it is opened
  React.useEffect(() => {
    if (show) {
      setStep("upload");
      setImages([]);
      setProcessedData([]);
      setIsProcessing(false);
      setProcessingMsgIndex(0);
    }
  }, [show]);

  const handleFileUpload = (data: any) => {
    if (data && data._id && images.length < 4) {
      setImages([...images, { id: data._id }]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleNext = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    try {
      const urls = images.map((image) => `${ASSET}/${image.id}?size=400`);
      const results = await CommonService.getAiImgInfo(urls);
      const data = results.data?.data || results.data;
      const normalizedData = Array.isArray(data) ? data : [data];

      if (results.statusCode !== 200) {
        const errMsg = results.data?.message;
        throw new Error(
          results.data?.message ||
            "Failed to process images, please try with different images",
        );
      }

      if (mode === "search") {
        // Include the uploaded image ids along with AI results so callers can
        // prefill images when opening AddProductModal from search flow.
        callback({ action: "proceed", data: normalizedData, images });
        return;
      }

      setProcessedData(normalizedData);
      setStep("preview");
    } catch (error) {
      console.error("Error processing images:", error);
      appToast.show({
        msg: "Failed to process images. Please try again.",
        color: "error",
      });
      // Handle error - maybe show toast
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceed = () => {
    callback({ action: "proceed", data: processedData });
  };

  const handleClose = () => {
    setStep("upload");
    setImages([]);
    setProcessedData([]);
    callback({ action: "close", data: {} });
  };

  const renderProcessingState = () => (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:text-center">
      <div className="tw:relative tw:mb-6">
        <div className="tw:absolute tw:inset-0 tw:animate-ping tw:rounded-full tw:bg-indigo-400/20"></div>
        <div className="tw:relative tw:rounded-full tw:bg-indigo-600 tw:p-5 tw:shadow-lg tw:shadow-indigo-200">
          <Sparkles className="tw:h-10 tw:w-10 tw:text-white tw:animate-pulse" />
        </div>
      </div>
      <h3 className="tw:text-xl tw:font-bold tw:text-gray-900">
        StoreKing AI is analyzing your product
      </h3>
      <p className="tw:mt-3 tw:text-sm tw:text-gray-500 tw:max-w-xs">
        Hold tight — StoreKing AI is extracting barcodes, pricing, and product
        details. This may take a few seconds depending on image quality.
      </p>
      <p className="tw:mt-2 tw:text-sm tw:text-indigo-600 tw:font-medium">
        {processingMessages[processingMsgIndex]}
      </p>
      <div className="tw:mt-8 tw:flex tw:gap-1">
        <div className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-indigo-600 tw:animate-bounce"></div>
        <div className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-indigo-600 tw:animate-bounce [animation-delay:0.2s]"></div>
        <div className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-indigo-600 tw:animate-bounce [animation-delay:0.4s]"></div>
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:flex tw:items-center tw:justify-center tw:h-8 tw:w-8">
            <ImgRender
              src="ai/sk-ai.png"
              className="tw:h-8 tw:w-8 tw:object-contain"
            />
          </div>
          <div>
            <span className="tw:text-base tw:font-bold tw:text-gray-900">
              StoreKing AI
            </span>
            <div className="tw:text-xs tw:text-slate-600">
              Extract product info from images
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-max-[90vh]">
        {isProcessing ? (
          renderProcessingState()
        ) : (
          <div className="tw:py-2">
            <div className="tw:mb-5 tw:flex tw:items-center tw:gap-3 tw:p-2 tw:bg-linear-to-r tw:from-indigo-50 tw:to-blue-50 tw:rounded-xl tw:border tw:border-indigo-100/50">
              <div className="tw:bg-white tw:p-2 tw:rounded-lg tw:shadow-sm">
                <Info className="tw:h-4 tw:w-4 tw:text-indigo-600" />
              </div>
              <p className="tw:text-xs tw:text-indigo-900 tw:leading-snug">
                <span className="tw:font-bold">Quick Tip:</span> Upload clear
                photos (front, back, barcode).
              </p>
            </div>

            <div className="tw:space-y-5">
              {images.length < 4 ? (
                <FileUpload onFileUpload={handleFileUpload}>
                  <div className="tw:group tw:relative tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:w-full tw:aspect-[16/6] tw:border-2 tw:border-dashed tw:border-gray-200 tw:rounded-2xl tw:p-3 tw:transition-all hover:tw:border-indigo-500/50 hover:tw:bg-indigo-50/20 hover:tw:shadow-sm">
                    <div className="tw:rounded-2xl tw:bg-gray-50 tw:p-2 group-hover:tw:bg-indigo-100/50 tw:transition-all tw:group-hover:tw:scale-110">
                      <Upload className="tw:h-5 tw:w-5 tw:text-gray-400 group-hover:tw:text-indigo-600" />
                    </div>
                    <div className="tw:text-center">
                      <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-800">
                        Tap to upload up to 4 product photos
                      </span>
                      <span className="tw:mt-1.5 tw:block tw:text-[10px] tw:text-gray-500">
                        JPG, PNG, or WEBP · Max 10MB each
                      </span>
                      <span className="tw:mt-1.5 tw:block tw:text-[10px] tw:text-indigo-700">
                        Use images of the same product only (e.g. front, back,
                        barcode).
                      </span>
                    </div>
                  </div>
                </FileUpload>
              ) : (
                <div className="tw:group tw:relative tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:w-full tw:aspect-[16/6] tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-2xl tw:p-6 tw:bg-gray-50">
                  <div className="tw:rounded-2xl tw:bg-gray-200 tw:p-4">
                    <ImageIcon className="tw:h-7 tw:w-7 tw:text-gray-500" />
                  </div>
                  <div className="tw:text-center">
                    <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-600">
                      Maximum 4 photos reached
                    </span>
                    <span className="tw:mt-1.5 tw:block tw:text-xs tw:text-gray-500">
                      Remove some photos to upload more
                    </span>
                  </div>
                </div>
              )}

              {images && images.length > 0 && (
                <div className="tw:bg-gray-50/50 tw:rounded-2xl tw:p-4 tw:border tw:border-gray-100">
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-3 tw:px-1">
                    <span className="tw:text-xs tw:font-bold tw:text-gray-700 tw:uppercase tw:tracking-wider">
                      Selected Photos ({images.length})
                    </span>
                  </div>
                  <div className="tw:bg-white tw:rounded-xl tw:p-3 tw:border tw:border-gray-200/60 tw:shadow-sm">
                    <FileUploadedSlide
                      images={images}
                      onRemove={handleRemoveImage}
                      onImageClick={() => {}}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AppModal.Content>
      {!isProcessing && (
        <AppModal.Footer className="tw:bg-gray-50/50">
          <div className="tw:flex tw:justify-end tw:gap-3 tw:w-full">
            <AppButton
              onClick={handleClose}
              color="light"
              fill="clear"
              className="tw:font-semibold tw:text-gray-500 hover:tw:text-gray-700"
            >
              Cancel
            </AppButton>
            <AppButton
              onClick={handleNext}
              color="primary"
              disabled={images.length === 0}
              className="tw:px-6 tw:shadow-md tw:shadow-indigo-100"
            >
              <Sparkles className="tw:mr-2 tw:h-4 tw:w-4" />
              Analyze with StoreKing AI
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </>
  );

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    highlight = false,
  }: {
    icon: any;
    label: string;
    value: string;
    highlight?: boolean;
  }) => (
    <div
      className={`tw:flex tw:items-center tw:gap-4 tw:p-3 tw:rounded-xl tw:transition-all ${highlight ? "tw:bg-indigo-50/50 tw:border tw:border-indigo-100/50" : "hover:tw:bg-gray-50"}`}
    >
      <div
        className={`tw:flex tw:items-center tw:justify-center tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl ${
          highlight
            ? "tw:bg-indigo-600 tw:shadow-md tw:shadow-indigo-100"
            : "tw:bg-gray-100"
        }`}
      >
        <Icon
          className={`tw:h-5 tw:w-5 ${
            highlight ? "tw:text-white" : "tw:text-gray-500"
          }`}
        />
      </div>
      <div className="tw:flex-1 tw:min-w-0">
        <p className="tw:text-xs tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-widest">
          {label}
        </p>
        <p
          className={`tw:mt-0.5 tw:font-bold ${
            highlight
              ? "tw:text-lg tw:text-indigo-950"
              : "tw:text-sm tw:text-gray-900"
          }`}
        >
          {value || "Not Detected"}
        </p>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:items-center tw:justify-center tw:h-8 tw:w-8 tw:rounded-lg tw:bg-green-600">
            <CheckCircle2 className="tw:h-5 tw:w-5 tw:text-white" />
          </div>
          <span className="tw:text-base tw:font-bold tw:text-gray-900">
            StoreKing AI — Product Details
          </span>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:py-2">
          <div className="tw:bg-white tw:rounded-2xl tw:border tw:border-gray-100 tw:shadow-sm tw:overflow-hidden">
            <div className="tw:bg-gradient-to-r tw:from-gray-50 tw:to-white tw:px-5 tw:py-4 tw:border-b tw:border-gray-100/60">
              <h4 className="tw:text-sm tw:font-bold tw:text-gray-800 tw:flex tw:items-center tw:gap-2">
                <Sparkles className="tw:h-4 tw:w-4 tw:text-indigo-500" />
                Review Extracted Details
              </h4>
            </div>

            <div className="tw:p-4 tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-3">
              <div className="md:tw:col-span-2">
                <InfoRow
                  icon={Tag}
                  label="Product Name"
                  value={
                    (processedData?.[0] as any)?.product_basic_info
                      ?.product_name || (processedData?.[0] as any)?.name
                  }
                  highlight
                />
              </div>

              <InfoRow
                icon={Package}
                label="Brand"
                value={
                  (processedData?.[0] as any)?.product_basic_info?.brand ||
                  (processedData?.[0] as any)?.brand
                }
              />

              <InfoRow
                icon={ScanLine}
                label="Barcode"
                value={
                  (processedData?.[0] as any)?.product_basic_info?.barcode ||
                  (processedData?.[0] as any)?.barcode
                }
              />

              <InfoRow
                icon={DollarSign}
                label="MRP"
                value={
                  (processedData?.[0] as any)?.pricing_info?.mrp ||
                  (processedData?.[0] as any)?.mrp ||
                  (processedData?.[0] as any)?.commercial_fields?.mrp
                }
              />

              <InfoRow
                icon={Info}
                label="Category"
                value={
                  (processedData?.[0] as any)?.product_basic_info?.category ||
                  (processedData?.[0] as any)?.category
                }
              />

              <InfoRow
                icon={Package}
                label="Unit (UOM)"
                value={
                  (processedData?.[0] as any)?.pricing_info?.uom ||
                  (processedData?.[0] as any)?.uom
                }
              />

              <div className="md:tw:col-span-2 tw:mt-1">
                <div className="tw:flex tw:items-start tw:gap-4 tw:p-4 tw:rounded-2xl tw:bg-gray-50/50 tw:border tw:border-gray-100/50">
                  <div className="tw:flex tw:items-center tw:justify-center tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl tw:bg-white tw:shadow-sm">
                    <FileText className="tw:h-5 tw:w-5 tw:text-gray-400" />
                  </div>
                  <div className="tw:flex-1">
                    <p className="tw:text-xs tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-widest">
                      Description
                    </p>
                    <p className="tw:mt-1 tw:text-sm tw:text-gray-600 tw:leading-relaxed">
                      {(processedData?.[0] as any)?.visual_description
                        ?.description ||
                        (processedData?.[0] as any)?.shortDescription ||
                        "No additional description was detected for this product."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer className="tw:bg-gray-50/50">
        <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
          <AppButton
            onClick={() => setStep("upload")}
            color="light"
            fill="clear"
            className="tw:font-bold tw:text-indigo-600 hover:tw:bg-indigo-50"
          >
            <Upload className="tw:mr-2 tw:h-4 tw:w-4" />
            Scan Another
          </AppButton>
          <div className="tw:flex tw:gap-3">
            <AppButton
              onClick={handleClose}
              color="light"
              fill="clear"
              className="tw:font-semibold tw:text-gray-500"
            >
              Discard
            </AppButton>
            <AppButton
              onClick={handleProceed}
              color="success"
              className="tw:px-6 tw:shadow-md tw:shadow-green-100"
            >
              Add to Catalog
            </AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </>
  );

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[95vh]">
      {step === "upload" ? renderUploadStep() : renderPreviewStep()}
    </AppModal>
  );
};

export default AiProductInfoModal;
