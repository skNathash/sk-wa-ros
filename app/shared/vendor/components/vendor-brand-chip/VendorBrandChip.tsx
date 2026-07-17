import { ChevronRight } from "lucide-react";
import { useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import VendorBrandListModal from "../../modals/vendor-brand-list/VendorBrandListModal";
import { useTranslation } from "react-i18next";

const VendorBrandChip = ({
  sourceAllBrands,
  sourceableBrands,
}: {
  sourceAllBrands: boolean;
  sourceableBrands: any[];
}) => {
  const { t } = useTranslation(["common"]);

  const [modal, setModal] = useState({
    show: false,
    data: [] as any[],
  });

  const handleViewBrands = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    setModal({
      show: true,
      data: sourceableBrands,
    });
  };

  const modalCb = (a: { action: string; data: any }) => {
    setModal({
      show: false,
      data: [],
    });
  };

  return (
    <>
      {sourceAllBrands ? (
        <AppBadge variant="light">{t("allBrands")}</AppBadge>
      ) : null}

      {!sourceAllBrands ? (
        <div className="tw:flex tw:gap-2 tw:items-center">
          <AppBadge variant="light">
            {sourceableBrands?.length > 0 ? (
              sourceableBrands[0]?.brandName
            ) : (
              <span className="tw:text-gray-500">{t("noBrands")}</span>
            )}
          </AppBadge>
          {sourceableBrands?.length > 1 && (
            <span
              className="tw:text-gray-500 tw:cursor-pointer tw:hover:text-gray-700"
              onClick={handleViewBrands}
            >
              <ChevronRight size={16} />
            </span>
          )}
        </div>
      ) : null}

      <VendorBrandListModal
        show={modal.show}
        brands={modal.data}
        callback={modalCb}
      />
    </>
  );
};

export default VendorBrandChip;
