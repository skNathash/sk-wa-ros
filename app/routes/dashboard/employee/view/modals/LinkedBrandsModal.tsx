import { Tag, Trash2, Search, PackageOpen } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import { useTranslation } from "react-i18next";

interface LinkedBrand {
  id: string;
  brandId: string;
  brandName: string;
}

interface LinkedBrandsModalProps {
  show: boolean;
  data: LinkedBrand[];
  callback: (a: { action: string; data?: LinkedBrand[] }) => void;
}

const LinkedBrandsModal: React.FC<LinkedBrandsModalProps> = ({
  show,
  data,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const [brands, setBrands] = useState<LinkedBrand[]>([]);

  React.useEffect(() => {
    if (show) setBrands([...data]);
  }, [show, data]);

  const handleClose = () => callback({ action: "close" });

  const searchParams = useMemo(
    () => ({
      filter: {
        "applicableBrand.brandId": {
          $nin: brands.map((b) => b.brandId).filter(Boolean),
        },
      },
    }),
    [brands]
  );

  const handleAdd = useCallback(
    (item: any) => {
      if (!item?.value) return;
      const val = item.value;
      const exists = brands.some((b) => b.id === val.id);
      if (exists) return;
      setBrands((prev) => [
        ...prev,
        { id: val.id, brandId: val.objId || val.id, brandName: val.name },
      ]);
    },
    [brands]
  );

  const handleRemove = (id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearAll = () => setBrands([]);

  const handleSubmit = () => {
    const cleaned = brands.map(({ id, brandId, brandName }) => ({
      id,
      brandId,
      brandName,
    }));
    callback({ action: "submit", data: cleaned });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{t("linkedBrands")}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]" noPadding>
        <div className="tw:flex tw:items-start tw:gap-3 tw:p-4 tw:border-b tw:bg-linear-to-r tw:from-amber-50 tw:to-white">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:bg-amber-100 tw:text-amber-700 tw:shrink-0">
            <Tag size={18} />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
              Brands this employee can sell
            </div>
            <p className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
              Search and add brands below. Only added brands will appear in the
              employee's catalog. Already-added brands are hidden from search.
            </p>
          </div>
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-7 tw:h-6 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold tw:bg-amber-600 tw:text-white">
            {brands.length}
          </span>
        </div>

        <div className="tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <Search size={14} className="tw:text-gray-500" />
            <span className="tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
              Add a brand
            </span>
          </div>
          <BrandSearchInput
            size="sm"
            placeholder={t("searchBrand")}
            params={searchParams}
            callback={(item, action) => {
              if (action === "add") handleAdd(item);
            }}
          />
        </div>

        <div className="tw:px-4 tw:pb-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
            <span className="tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
              Selected brands ({brands.length})
            </span>
            {brands.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="tw:text-xs tw:text-red-600 tw:hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {brands.length === 0 ? (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:py-10 tw:px-4 tw:border tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:text-center">
              <PackageOpen size={28} className="tw:text-gray-400" />
              <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                No brands added yet
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:max-w-xs">
                Use the search above to find a brand and add it to this
                employee.
              </div>
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:gap-2">
              {brands.map((b) => (
                <div
                  key={b.id}
                  className="tw:group tw:flex tw:items-center tw:gap-3 tw:p-2.5 tw:border tw:rounded-lg tw:bg-white tw:hover:border-amber-300 tw:transition-colors"
                >
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-md tw:bg-amber-50 tw:text-amber-700 tw:shrink-0">
                    <Tag size={14} />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:font-medium tw:text-sm tw:truncate">
                      {b.brandName}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                      ID: {b.id}
                    </div>
                  </div>
                  <AppButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={() => handleRemove(b.id)}
                  >
                    <Trash2 size={14} />
                  </AppButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
          <span className="tw:text-xs tw:text-gray-500">
            {brands.length} brand{brands.length === 1 ? "" : "s"} will be linked
          </span>
          <div className="tw:flex tw:gap-2">
            <AppButton fill="outline" onClick={handleClose}>
              {t("cancel")}
            </AppButton>
            <AppButton onClick={handleSubmit}>{t("save")}</AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default LinkedBrandsModal;
