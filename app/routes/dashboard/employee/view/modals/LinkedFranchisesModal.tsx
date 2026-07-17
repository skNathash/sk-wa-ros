import { Store, Trash2, Search, Building2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import FranchiseSearchInput from "~/routes/dashboard/employee/components/FranchiseSearchInput";
import { useTranslation } from "react-i18next";

interface LinkedFranchise {
  franchiseId: string;
  name: string;
  refId: string;
  mobile: string;
  email: string;
}

interface LinkedFranchisesModalProps {
  show: boolean;
  data: LinkedFranchise[];
  callback: (a: { action: string; data?: LinkedFranchise[] }) => void;
}

const LinkedFranchisesModal: React.FC<LinkedFranchisesModalProps> = ({
  show,
  data,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const [franchises, setFranchises] = useState<LinkedFranchise[]>([]);

  React.useEffect(() => {
    if (show) setFranchises([...data]);
  }, [show, data]);

  const handleClose = () => callback({ action: "close" });

  const searchParams = useMemo(
    () => ({
      filter: {
        _id: { $nin: franchises.map((f) => f.franchiseId).filter(Boolean) },
      },
    }),
    [franchises]
  );

  const handleAdd = useCallback(
    (item: any) => {
      if (!item?.value) return;
      const val = item.value;
      const exists = franchises.some((f) => f.franchiseId === val.franchiseId);
      if (exists) return;
      setFranchises((prev) => [
        ...prev,
        {
          franchiseId: val.franchiseId,
          name: val.name,
          refId: val.refId,
          mobile: val.mobile,
          email: val.email,
        },
      ]);
    },
    [franchises]
  );

  const handleRemove = (franchiseId: string) => {
    setFranchises((prev) => prev.filter((f) => f.franchiseId !== franchiseId));
  };

  const handleClearAll = () => setFranchises([]);

  const handleSubmit = () => {
    const cleaned = franchises.map(
      ({ franchiseId, name, refId, mobile, email }) => ({
        franchiseId,
        name,
        refId,
        mobile,
        email,
      })
    );
    callback({ action: "submit", data: cleaned });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{t("linkedFranchises")}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]" noPadding>
        <div className="tw:flex tw:items-start tw:gap-3 tw:p-4 tw:border-b tw:bg-linear-to-r tw:from-blue-50 tw:to-white">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:bg-blue-100 tw:text-blue-700 tw:shrink-0">
            <Store size={18} />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
              Stores this employee can serve
            </div>
            <p className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
              Search and add B2B retailers below. The employee will only be able to
              place or fulfil orders at the stores listed here.
            </p>
          </div>
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-7 tw:h-6 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold tw:bg-blue-600 tw:text-white">
            {franchises.length}
          </span>
        </div>

        <div className="tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <Search size={14} className="tw:text-gray-500" />
            <span className="tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
              Add a B2B retailer
            </span>
          </div>
          <FranchiseSearchInput
            size="sm"
            placeholder={t("searchFranchise")}
            params={searchParams}
            callback={(item, action) => {
              if (action === "add") handleAdd(item);
            }}
          />
        </div>

        <div className="tw:px-4 tw:pb-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
            <span className="tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
              Selected B2B retailers ({franchises.length})
            </span>
            {franchises.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="tw:text-xs tw:text-red-600 tw:hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {franchises.length === 0 ? (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:py-10 tw:px-4 tw:border tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:text-center">
              <Building2 size={28} className="tw:text-gray-400" />
              <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                No B2B retailers added yet
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:max-w-xs">
                Use the search above to find a B2B retailer and link it to this
                employee.
              </div>
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:gap-2">
              {franchises.map((f) => (
                <div
                  key={f.franchiseId}
                  className="tw:group tw:flex tw:items-center tw:gap-3 tw:p-2.5 tw:border tw:rounded-lg tw:bg-white tw:hover:border-blue-300 tw:transition-colors"
                >
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-md tw:bg-blue-50 tw:text-blue-700 tw:shrink-0">
                    <Store size={14} />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:font-medium tw:text-sm tw:truncate">
                      {f.name}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                      {f.refId}
                      {f.mobile ? ` • ${f.mobile}` : ""}
                      {f.email ? ` • ${f.email}` : ""}
                    </div>
                  </div>
                  <AppButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={() => handleRemove(f.franchiseId)}
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
            {franchises.length} B2B retailer{franchises.length === 1 ? "" : "s"}{" "}
            will be linked
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

export default LinkedFranchisesModal;
