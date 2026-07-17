import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import useAppToast from "~/hooks/useAppToast";
import InfoBlock from "~/components/core/info-blk/InfoBlock";

interface AddMoreImagesModalProps {
  show: boolean;
  callback: (action: { action: string; data?: any }) => void;
  dealName: string;
  dealId: string;
  dealRefId?: string;
  oldImages?: string[];
  feature?: "subscribe" | "inventory";
}

const AddMoreImagesModal = ({
  show,
  callback,
  dealName,
  dealId,
  dealRefId,
  oldImages,
  feature = "inventory",
}: AddMoreImagesModalProps) => {
  const toast = useAppToast();
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const existingOldImages = Array.isArray(oldImages) ? oldImages : [];

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (show) {
      setUploadedImages([]);
    }
  }, [show]);

  const handleImageUpload = (uploadResponse: any) => {
    // Store the uploaded file data in state without calling API
    setUploadedImages((prev) => [...prev, { id: uploadResponse._id }]);

    toast.show({
      msg: "Image added successfully",
      color: "success",
    });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (uploadedImages.length === 0) {
      toast.show({
        msg: "Please upload at least one image",
        color: "warning",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setShowConfirmDialog(false);

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Build payload as required by the API
      const params = {
        dealId: dealId,
        dealRefId: dealRefId || dealId,
        dealName: dealName,
        type: "IMAGE_UPDATE",
        oldImages: existingOldImages,
        newImages: uploadedImages.map((img) => img.id),
        remarks: "Updated product images with better quality",
      };

      setUploading(true);

      const response = await InventorySubscribeService.createSellerDealRequests(
        params
      );

      setUploading(false);

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.show({
          msg: "Product images submitted for approval",
          color: "success",
        });

        // Return the submitted payload and response to the parent
        callback({
          action: "submit",
          data: {
            payload: params,
            uploadedImages,
            dealId,
            dealName,
            response,
          },
        });
      } else {
        toast.show({
          msg: "Failed to submit product images",
          color: "error",
        });
      }
    } catch (error) {
      setShowConfirmDialog(false);
      toast.show({
        msg: "An error occurred while submitting images",
        color: "error",
      });
      console.error("Image submission error:", error);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const handleClose = () => {
    setUploadedImages([]);
    callback({ action: "close" });
  };

  return (
    <>
      <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
        <AppModal.Title onClose={handleClose}>Add More Images</AppModal.Title>

        <AppModal.Content className="tw:max-h-[90vh]">
          {/* Deal Name Display */}
          <div className="tw:mb-4 tw:pb-3 tw:border-b tw:border-gray-200">
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:w-2 tw:h-2 tw:bg-blue-500 tw:rounded-full"></div>
              <span className="tw:text-sm tw:font-medium tw:text-gray-600">
                Deal:
              </span>
              <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                {dealName}
              </span>
            </div>
          </div>

          {feature === "subscribe" && (
            <InfoBlock size="sm" variant="info" bordered className="tw:mb-4">
              <div className="tw:text-xs">
                <span className="tw:font-semibold tw:block">Please note</span>{" "}
                The uploadedimages will be sent as an approval request to the
                StoreKing team. After review, they will be displayed on the
                product page.
              </div>
            </InfoBlock>
          )}

          {/* Upload Section */}
          <div className="tw:mb-4">
            <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
              Upload Images
            </label>
            <FileUpload
              onFileUpload={handleImageUpload}
              accept="image/*"
              allowedExtensions={["jpg", "jpeg", "png"]}
              maxSizeMB={5}
              label="Upload Product Images"
            >
              <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-6 tw:text-center tw:bg-gray-50 hover:tw:bg-gray-100 hover:tw:border-gray-400 tw:transition-all tw:cursor-pointer tw:group">
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:space-y-2">
                  <div className="tw:p-3 tw:bg-white tw:rounded-full tw:shadow-sm tw:group-hover:tw:shadow-md tw:transition-shadow">
                    <Upload
                      size={24}
                      className="tw:text-gray-500 group-hover:tw:text-gray-700"
                    />
                  </div>
                  <div className="tw:text-sm tw:text-gray-600">
                    <span className="tw:font-medium">
                      Click to upload images
                    </span>
                  </div>
                  <div className="tw:text-xs tw:text-gray-400">
                    JPG, PNG up to 5MB
                  </div>
                </div>
              </div>
            </FileUpload>
          </div>

          {/* Display Uploaded Images */}
          {uploadedImages && uploadedImages.length > 0 && (
            <div className="tw:mb-4">
              <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
                Uploaded Images ({uploadedImages.length})
              </label>
              <FileUploadedSlide
                images={uploadedImages}
                onRemove={handleRemoveImage}
              />
            </div>
          )}
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:gap-3 tw:justify-end">
            <AppButton
              fill="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </AppButton>
            <AppButton
              onClick={handleSubmit}
              disabled={uploadedImages.length === 0}
              isLoading={uploading}
            >
              Submit
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      <AppAlertDialog
        show={showConfirmDialog}
        title="Submit Images for Approval"
        description="Your images will be sent as an approval request to the StoreKing team. After review, they will be displayed on the product page."
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        type="confirm"
        okText="Submit"
        cancelText="Cancel"
      />
    </>
  );
};

export default AddMoreImagesModal;
