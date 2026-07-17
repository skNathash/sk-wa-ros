import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { ASSET } from "~/constants";
import AjaxService from "~/services/AjaxService";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { Paperclip, Camera, Image } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useTranslation } from "react-i18next";

interface FileUploadProps {
  maxSizeMB?: number;
  allowedExtensions?: string[];
  accept?: string; // MIME types or file extensions for the file input accept attribute (defaults to "image/*")
  onFileUpload?: (response: any) => void;
  children?: ReactNode;
  label?: string;
  uploadUrl?: string;
  note?: ReactNode;
  // Cordova-specific props
  dontUseNative?: boolean; // Disable Cordova camera/gallery functionality
  useCameraPluginGallery?: boolean; // Enable gallery option in Cordova popover
  showOnlyCamera?: boolean; // Show only camera option, skip popover
}

const FileUpload = ({
  maxSizeMB = 10,
  allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic"],
  accept = "image/*,.heic,.webp",
  onFileUpload,
  children,
  label,
  uploadUrl,
  note,
  dontUseNative = false,
  useCameraPluginGallery = true,
  showOnlyCamera = false,
}: FileUploadProps) => {
  const { t } = useTranslation();

  const [busyLoading, setBusyLoading] = useState<{
    show: boolean;
    message?: string;
  }>({
    show: false,
    message: t("uploadingFile") + "...",
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const toast = useAppToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if Cordova is available
  const isCordovaAvailable = MiscService.hasCordova();

  const handleClick = () => {
    // If Cordova is available and not disabled, show popover
    if (isCordovaAvailable && !dontUseNative) {
      if (showOnlyCamera) {
        openCordovaCamera("camera");
      } else {
        setIsPopoverOpen(true);
      }
    } else {
      // Fallback to regular file input
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileValidationAndUpload(files[0]);
    }
  };

  const handleFileValidationAndUpload = async (file: File) => {
    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeMB) {
      toast.show({
        msg: t("fileSizeExceedsMaxLimit", { maxSizeMB }),
        color: "warning",
      });
      return;
    }

    // Validate file extension if allowedExtensions is provided
    if (allowedExtensions.length > 0) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowedExtensions.includes(fileExtension)) {
        toast.show({
          msg: t("onlyAllowedFiles", {
            allowedExtensions: allowedExtensions.join(", "),
          }),
          color: "warning",
        });
        return;
      }
    }

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setBusyLoading({ show: true, message: t("uploadingFile") + "..." });

      const url = uploadUrl || ASSET + "/upload";
      const response = await AjaxService.request(
        url,
        "POST",
        {
          file: file,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setBusyLoading({ show: false });

      // Reset the file input value to allow re-selecting the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Call the callback function with the response data
        if (onFileUpload) {
          onFileUpload(response.data);
        }
      } else {
        toast.show({
          msg: response?.data?.message || t("failedToUploadFile"),
          color: "error",
        });
      }
    } catch (error: any) {
      setBusyLoading({ show: false });
      toast.show({
        msg:
          error?.data?.message ||
          error?.message ||
          t("anErrorOccurredWhileUploadingTheFile"),
        color: "error",
      });
      console.error("File upload error:", error);
    }
  };

  // Cordova camera functions
  const openCordovaCamera = async (type: "camera" | "gallery") => {
    if (!isCordovaAvailable || !(navigator as any).camera) {
      toast.show({
        msg: t("cameraFeatureNotAvailable"),
        color: "error",
      });
      return;
    }

    const defaultOptions = {
      encodingType: 1,
      quality: 75,
      targetWidth: 1000,
      targetHeight: 1000,
      saveToPhotoAlbum: false,
      destinationType: (window as any).Camera.DestinationType.FILE_URI,
    };

    let options: any = { ...defaultOptions };

    if (type === "gallery") {
      options.sourceType = (
        window as any
      ).Camera.PictureSourceType.PHOTOLIBRARY;
    } else if (type === "camera") {
      options.sourceType = (window as any).Camera.PictureSourceType.CAMERA;
    }

    setBusyLoading({ show: true, message: t("openingCamera") + "..." });
    setIsPopoverOpen(false);

    (navigator as any).camera.getPicture(
      (data: any) => {
        setBusyLoading({ show: false });
        cameraSuccessCallback(data);
      },
      (error: any) => {
        setBusyLoading({ show: false });
        cameraErrorCallback(error);
      },
      options,
    );
  };

  const cameraSuccessCallback = async (imageUri: string) => {
    try {
      setBusyLoading({ show: true, message: t("processingImage") + "..." });

      // Resolve the file system URL to get the file
      (window as any).resolveLocalFileSystemURL(
        imageUri,
        (fileEntry: any) => {
          fileEntry.file((file: any) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const base64String = (reader.result as string).split(",")[1];
                const blob = b64toBlob(base64String, "image/jpeg", 512);

                // Upload the blob
                await uploadCordovaFile(blob);
              } catch (error) {
                setBusyLoading({ show: false });
                toast.show({
                  msg: t("errorProcessingImage"),
                  color: "error",
                });
                console.error("Image processing error:", error);
              }
            };
            reader.readAsDataURL(file);
          });
        },
        (error: any) => {
          setBusyLoading({ show: false });
          toast.show({
            msg: t("errorAccessingImageFile"),
            color: "error",
          });
          console.error("File system error:", error);
        },
      );
    } catch (error) {
      setBusyLoading({ show: false });
      toast.show({
        msg: t("errorProcessingCameraResult"),
        color: "error",
      });
      console.error("Camera success callback error:", error);
    }
  };

  const cameraErrorCallback = (error: string) => {
    toast.show({
      msg: error || t("youHaveNotSelectedAnyItem"),
      color: "error",
    });
  };

  const b64toBlob = (
    b64Data: string,
    contentType: string,
    sliceSize: number,
  ) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  const uploadCordovaFile = async (blob: Blob) => {
    try {
      const url = prepareUrlOnSelectedFileType("");
      const formData = new FormData();
      formData.append("file", blob);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "JWT " + AuthService.getLoggedInToken(),
        },
        body: formData,
      });

      setBusyLoading({ show: false });

      if (response.ok) {
        // Reset the file input value to allow re-selecting the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        const responseData = await response.json();
        if (onFileUpload) {
          onFileUpload(responseData);
        }
      } else {
        let msg = "";
        try {
          const errData = await response.json();
          msg = errData?.message || errData?.data?.message || "";
        } catch {}
        toast.show({
          msg: msg || t("failedToUploadFile"),
          color: "error",
        });
      }
    } catch (error: any) {
      setBusyLoading({ show: false });
      toast.show({
        msg: error?.message || t("errorOccurredWhileUploadingFile"),
        color: "error",
      });
      console.error("Cordova file upload error:", error);
    }
  };

  const prepareUrlOnSelectedFileType = (file: string) => {
    const img = ["jpg", "jpeg", "png", "webp", "heic"];
    const docs = ["pdf", "zip", "doc"];
    const name = file || "";
    let url = uploadUrl || ASSET + "/upload";
    const extension = name.substring(name.lastIndexOf(".") + 1);

    if (img.indexOf(extension) !== -1) {
      url += /\?/.test(url) ? "&type=image" : "?type=image";
    }

    if (docs.indexOf(extension) !== -1) {
      url += /\?/.test(url) ? "&type=doc" : "?type=doc";
    }

    return url;
  };

  return (
    <>
      <BusyLoader show={busyLoading.show} message={busyLoading.message} />

      {/* toasts shown via useAppToast */}

      <input
        type="file"
        ref={fileInputRef}
        className="tw:hidden"
        onChange={handleFileChange}
        accept={accept || undefined}
      />

      {isCordovaAvailable && !dontUseNative ? (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div style={{ cursor: "pointer" }}>
              {children ? (
                children
              ) : (
                <label className="tw:cursor-pointer tw:bg-blue-500 tw:text-white tw:px-4 tw:py-2 tw:rounded tw:text-sm tw:inline-flex tw:items-center tw:gap-2">
                  <Paperclip size={18} />
                  {label || t("chooseFile")}
                </label>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="tw:w-56 tw:p-2">
            <div className="tw:space-y-2">
              <button
                onClick={() => openCordovaCamera("camera")}
                className="tw:w-full tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2 tw:text-sm tw:rounded-md tw:hover:bg-gray-100 tw:transition-colors"
              >
                <Camera size={18} className="tw:text-blue-600" />
                <span>{t("openCamera")}</span>
              </button>
              {useCameraPluginGallery && (
                <button
                  onClick={() => openCordovaCamera("gallery")}
                  className="tw:w-full tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2 tw:text-sm tw:rounded-md tw:hover:bg-gray-100 tw:transition-colors"
                >
                  <Image size={18} className="tw:text-green-600" />
                  <span>{t("openGallery")}</span>
                </button>
              )}
              {/* <button
                onClick={() => {
                  setIsPopoverOpen(false);
                  fileInputRef.current?.click();
                }}
                className="tw:w-full tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2 tw:text-sm tw:rounded-md tw:hover:bg-gray-100 tw:transition-colors"
              >
                <Paperclip size={18} className="tw:text-gray-600" />
                <span>{t("chooseFile")}</span>
              </button> */}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div onClick={handleClick} style={{ cursor: "pointer" }}>
          {children ? (
            children
          ) : (
            <label className="tw:cursor-pointer tw:bg-blue-500 tw:text-white tw:px-4 tw:py-2 tw:rounded tw:text-sm tw:inline-flex tw:items-center tw:gap-2">
              <Paperclip size={18} />
              {label || t("chooseFile")}
            </label>
          )}
        </div>
      )}

      {note ? (
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">{note}</div>
      ) : null}
    </>
  );
};

export default FileUpload;
