import { Camera } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { AppInput } from "~/components/core/form";
import InpBlock from "./InpBlock";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { FileText } from "lucide-react";
import { useIsMobile } from "~/hooks/use-mobile";
import Divider from "~/components/core/divider/Divider";

const DocumentsInfo = () => {
  const { register, control, setValue, getValues } = useFormContext();

  const [gstCertificateImages, shopImages, gstNumber] = useWatch({
    control: control,
    name: ["gstCertificateImages", "shopImages", "gstNumber"],
  });

  const uploadGst = (response: { _id: string }) => {
    if (response && response._id) {
      const images = getValues("gstCertificateImages");
      setValue("gstCertificateImages", [...images, { id: response._id }]);
    }
  };

  const uploadShop = (response: { _id: string }) => {
    if (response && response._id) {
      const images = getValues("shopImages");
      setValue("shopImages", [...images, { id: response._id }]);
    }
  };

  const onRemoveGst = (index: number) => {
    const images = getValues("gstCertificateImages");
    images.splice(index, 1);
    setValue("gstCertificateImages", images);
  };

  const onRemoveShop = (index: number) => {
    const images = getValues("shopImages");
    images.splice(index, 1);
    setValue("shopImages", images);
  };

  return (
    <InpBlock
      title="Documents Information"
      defaultExpanded={false}
      expandOnDesktop={true}
      icon={<FileText size={20} />}
    >
      <div>
        {/* Input Fields Grid */}
        <div className="tw:grid tw:gap-4 tw:mb-6 tw:grid-cols-1 tw:md:grid-cols-2">
          <AppInput
            name="gstNumber"
            register={register}
            label="GST Number"
            placeholder="Enter your GST number"
            isRequired={gstCertificateImages?.length > 0}
          />

          <AppInput
            name="fssaiCertificate"
            register={register}
            label="FSSAI Number"
            placeholder="Enter your FSSAI number"
          />
        </div>

        {/* Upload Sections Grid */}
        <div className="tw:grid tw:gap-6 tw:grid-cols-1 tw:md:grid-cols-2">
          <div>
            <FileUpload
              maxSizeMB={10}
              allowedExtensions={["jpg", "png"]}
              onFileUpload={uploadGst}
            >
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                <div className="tw:w-12 tw:h-12 tw:text-gray-500">
                  <Camera
                    className="tw:w-12 tw:h-12 tw:text-gray-500"
                    size={48}
                  />
                </div>
                <div className="tw:col-span-10 tw:flex tw:flex-col tw:justify-center">
                  <div>
                    Upload GST Certificate{" "}
                    {/* {gstNumber && <span className="tw:text-red-500">*</span>} */}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    Upload .jpg,.png, MAX 10MB
                  </div>
                </div>
              </div>
            </FileUpload>

            <FileUploadedSlide
              images={gstCertificateImages}
              onRemove={onRemoveGst}
            />
          </div>
        </div>

        <Divider />

        <div>
          <FileUpload
            maxSizeMB={10}
            allowedExtensions={["jpg", "png"]}
            onFileUpload={uploadShop}
          >
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
              <div className="tw:w-12 tw:h-12 tw:text-gray-500">
                <Camera
                  className="tw:w-12 tw:h-12 tw:text-gray-500"
                  size={48}
                />
              </div>
              <div className="tw:col-span-10 tw:flex tw:flex-col tw:justify-center">
                <div>Upload Shop Images</div>
                <div className="tw:text-xs tw:text-gray-500">
                  Upload .jpg,.png, MAX 10MB
                </div>
              </div>
            </div>
          </FileUpload>

          <FileUploadedSlide images={shopImages} onRemove={onRemoveShop} />
        </div>
      </div>
    </InpBlock>
  );
};

export default DocumentsInfo;
