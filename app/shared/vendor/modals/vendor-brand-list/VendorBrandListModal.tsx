import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppBadge from "~/components/core/badge/AppBadge";
import { useTranslation } from "react-i18next";

interface Brand {
  brandName: string;
  brandId?: string;
  _id?: string;
}

interface VendorBrandListModalProps {
  show: boolean;
  brands: Brand[];
  callback: (data: { action: string; data: any }) => void;
}

const VendorBrandListModal: React.FC<VendorBrandListModalProps> = ({
  show,
  brands,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title
        onClose={(e: any) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
          {t("vendorBrands")}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {brands.length > 0 ? (
            brands.map((brand) => (
              <AppBadge
                key={brand.brandId}
                variant="primary"
                className="tw:text-sm"
              >
                {brand.brandName}
              </AppBadge>
            ))
          ) : (
            <p className="tw:text-gray-500 tw:text-sm">
              {t("noBrandsAvailableForVendor")}
            </p>
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default VendorBrandListModal;
