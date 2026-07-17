import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppBadge from "~/components/core/badge/AppBadge";
import { useTranslation } from "react-i18next";

interface Brand {
  brandName: string;
  brandId?: string;
  _id?: string;
}

interface VendorBrandsListModalProps {
  show: boolean;
  brands: Brand[];
  callback?: (data: { action: string; data: any }) => void;
}

const VendorBrandsListModal: React.FC<VendorBrandsListModalProps> = ({
  show,
  brands,
  callback,
}) => {
  const { t } = useTranslation(["common"]);

  const handleClose = () => {
    if (callback) {
      callback({ action: "close", data: {} });
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
          {t("vendorBrands")}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <AppBadge
                  key={brand.brandId || brand._id || brand.brandName}
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
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default VendorBrandsListModal;
