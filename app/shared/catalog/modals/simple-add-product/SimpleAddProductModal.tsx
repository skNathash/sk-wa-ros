import { CheckCircle2, ImagePlus, Info, ScanBarcode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import InventorySubscribeService from "~/services/InventorySubscribeService";

type Props = {
  show: boolean;
  initialData?: { barcode?: string; _id?: string };
  callback: (a: { action: string; data?: any }) => void;
};

export default function SimpleAddProductModal({
  show,
  initialData,
  callback,
}: Props) {
  const [images, setImages] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [previewImageId, setPreviewImageId] = useState<string>("");
  const { show: toast } = useAppToast();

  useEffect(() => {
    if (show) setImages([]);
  }, [show]);

  const handleFileUpload = (resp: any) => {
    if (resp && resp._id) setImages((prev) => [...prev, { id: resp._id }]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (imageId: string) => {
    setPreviewImageId(imageId);
    setShowImagePreviewModal(true);
  };

  const onClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const onSubmit = async () => {
    if (!images.length) return;

    const payload: Record<string, any> = {
      productName: "Untitled Product",
      qty: 0,
      mrp: 0,
      barcode: initialData?.barcode || "",
      uom: "unit",
      description: "",
      images: images.map((i) => i.id),
    };

    if (initialData?._id) {
      payload.invalidBarcodeId = initialData._id;
    }

    setLoading(true);
    try {
      const res = await InventorySubscribeService.importStoreProduct(payload);
      if (res?.statusCode === 200) {
        callback({ action: "created", data: { product: res.data } });
        toast({ msg: "Product created successfully", color: "success" });
      } else {
        toast({
          msg: res?.data?.message || "Failed to create product",
          color: "danger",
        });
      }
    } catch (err: any) {
      toast({
        msg: err?.message || "Failed to create product",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={onClose}>
        <div>
          <div className="tw:text-base tw:font-semibold tw:text-gray-900">
            Quick Add Product
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
            Snap a photo now, fill in the details later
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {initialData?.barcode && (
          <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-md">
            <ScanBarcode className="tw:w-4 tw:h-4 tw:text-blue-600 tw:shrink-0" />
            <span className="tw:text-xs tw:text-blue-700 tw:font-medium">
              Barcode
            </span>
            <span className="tw:text-sm tw:font-mono tw:font-semibold tw:text-gray-900 tw:truncate">
              {initialData.barcode}
            </span>
          </div>
        )}

        <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between">
          <label className="tw:text-sm tw:font-medium tw:text-gray-800">
            Product Images
            <span className="tw:text-red-500 tw:ml-0.5">*</span>
          </label>
          {images.length > 0 && (
            <span className="tw:text-xs tw:font-medium tw:text-gray-500">
              {images.length} uploaded
            </span>
          )}
        </div>

        <FileUpload
          onFileUpload={handleFileUpload}
          accept="image/*"
          allowedExtensions={["jpg", "jpeg", "png"]}
          maxSizeMB={5}
          label="Upload Product Images"
        >
          <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-6 tw:text-center tw:bg-gray-50 hover:tw:bg-blue-50 hover:tw:border-blue-400 tw:transition-colors tw:cursor-pointer">
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2">
              <div className="tw:p-3 tw:bg-white tw:rounded-full tw:shadow-sm tw:border tw:border-gray-200">
                <ImagePlus size={22} className="tw:text-blue-600" />
              </div>
              <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                {images.length
                  ? "Add more images"
                  : "Tap to upload product image"}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                JPG or PNG · up to 5 MB each
              </div>
            </div>
          </div>
        </FileUpload>

        {images.length > 0 && (
          <div className="tw:mt-4">
            <FileUploadedSlide
              images={images}
              onRemove={handleRemoveImage}
              onImageClick={handleImageClick}
            />
          </div>
        )}

        <div className="tw:mt-4 tw:flex tw:items-start tw:gap-2 tw:px-3 tw:py-2 tw:bg-amber-50 tw:border tw:border-amber-100 tw:rounded-md">
          <Info className="tw:w-4 tw:h-4 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
          <p className="tw:text-xs tw:text-amber-800">
            Sent to <span className="tw:font-semibold">StoreKing review</span>.
            Added to inventory shortly.
          </p>
        </div>

        <ImgPreviewModal
          show={showImagePreviewModal}
          callback={() => setShowImagePreviewModal(false)}
          images={images}
          initialImageId={previewImageId}
        />
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-3 tw:justify-end">
          <AppButton
            fill="outline"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Discard
          </AppButton>
          <AppButton
            type="button"
            color="primary"
            isLoading={loading}
            disabled={!images.length}
            className="tw:gap-2"
            onClick={onSubmit}
          >
            <CheckCircle2 className="tw:w-4 tw:h-4" />
            {images.length ? "Save Product" : "Add image to save"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
}
