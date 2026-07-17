import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type {
  BreadcrumbItem,
  PaginationState,
  SortProps,
} from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import BulkUploadMainTab from "../components/BulkUploadMainTab";
import { getCount, getData, prepareParams } from "./helper";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type { ViewToggleType } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SimpleAddProductModal from "~/shared/catalog/modals/simple-add-product/SimpleAddProductModal";
import SuccessModal from "../../modals/SuccessModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.BULK-IMPORT-PRODUCTS"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/search?tab=search" },
  },
  {
    label: "Not Found Barcodes",
  },
];

const InvalidBarcodes = () => {
  const { t } = useTranslation();

  const appToast = useAppToast();

  const appNav = useAppNav();
  const [data, setData] = useState<any[]>([]);
  const { isMobile } = useScreenView();
  const [view, setView] = useState<ViewToggleType>("list");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [createProductModal, setCreateProductModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tabRefreshKey, setTabRefreshKey] = useState(0);

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
    type?: "alert" | "confirm";
    okText?: string;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
    type: "confirm",
    okText: "Continue",
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 30,
    startSlNo: 1,
    endSlNo: 30,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({});
  const sortRef = useRef<SortProps>({
    key: "createdAt",
    value: "desc",
  });

  useEffect(() => {
    applyFilter();
  }, []);

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData(result || []);

      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;

      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    // advance page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // swallow - keep previous data
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  };

  const handleCallback = (a: { action: string; data?: any }) => {
    if (a.action === "createProduct") {
      setCreateProductModal({ show: true, data: a.data });
    }

    if (a.action === "copyBarcode") {
      CommonService.copyToClipboard(a.data.barcode || "");
      appToast.show({ msg: "Barcode copied to clipboard", color: "success" });
    }

    if (a.action === "remove") {
      // show confirmation before removing
      setConfirmDialog({
        show: true,
        title: "Remove barcode",
        description:
          "Are you sure you want to remove this not found barcode? This cannot be undone.",
        successCb: async () => {
          setConfirmDialog((prev) => ({ ...prev, show: false }));
          try {
            const id = a.data?._id;
            // call delete API (expects an _id)
            const res =
              await InventorySubscribeService.removeInvalidBarcode(id);

            if (res && res.statusCode === 200) {
              appToast.show({ msg: "Barcode removed", color: "success" });
              applyFilter();
              setTabRefreshKey((k) => k + 1);
            } else {
              const msg = res?.data?.message || "Failed to remove";
              appToast.show({ msg, color: "danger" });
            }
          } catch (e: any) {
            appToast.show({
              msg: e?.message || "Failed to remove",
              color: "danger",
            });
          }
        },
        cancelCb: () => {
          setConfirmDialog((prev) => ({ ...prev, show: false }));
        },
      });
    }
  };

  const handleCreateProductModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    if (a.action === "created") {
      setCreateProductModal({ show: false, data: null });
      applyFilter();
      setTabRefreshKey((k) => k + 1);
      setShowSuccessModal(true);
    } else {
      setCreateProductModal({ show: false, data: null });
    }
  };

  const handleSuccessModal = (data: { action: string; data?: any }) => {
    const action = data?.action;
    setShowSuccessModal(false);
    if (action === "view-requests") {
      viewSubscriptionHistory();
    }
  };

  const viewSubscriptionHistory = () => {
    appNav.to("/dashboard/inventory/subscribe/approval-history/products", {
      tab: "history",
    });
  };

  return (
    <>
      <AppHeader title={t("notFoundBarcodes")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>

          <BulkUploadMainTab
            activeTab="invalid-barcodes"
            className="tw:mb-4"
            refreshKey={tabRefreshKey}
          />

          <p className="tw:text-xs tw:text-gray-600 tw:mb-4 tw:-mt-1">
            View and manage barcodes that failed validation during bulk upload.
            Create products manually for not found barcodes.
          </p>

          <Filter callback={handleFilterChange} />

          <div className="tw:flex tw:justify-between tw:mb-2">
            <div>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={data.length}
                fwSize="sm"
              />
            </div>
            <ViewToggle viewType={view} callback={setView} />
          </div>

          {isMobile || view === "card" ? (
            <MobileView
              loading={loading}
              data={data}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              hasMoreData={hasMoreData}
              callback={handleCallback}
              status={filterRef.current.status || "PENDING"}
            />
          ) : (
            <>
              <AppCard noContentPadding noPadding>
                <DesktopView
                  data={data}
                  loading={loading}
                  callback={handleCallback}
                  loadMore={loadMore}
                  loadingMore={loadingMore}
                  hasMoreData={hasMoreData}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                  status={filterRef.current.status || "PENDING"}
                />
              </AppCard>
            </>
          )}
        </div>
      </div>

      <SimpleAddProductModal
        show={createProductModal.show}
        callback={handleCreateProductModalCallback}
        initialData={{
          barcode: createProductModal.data?.barcode,
          _id: createProductModal.data?._id,
        }}
      />

      <AppAlertDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        description={confirmDialog.description}
        type={confirmDialog.type}
        okText={confirmDialog.okText}
        onConfirm={confirmDialog.successCb}
        onCancel={confirmDialog.cancelCb}
      />

      <SuccessModal show={showSuccessModal} callback={handleSuccessModal} />
    </>
  );
};

export default InvalidBarcodes;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Not Found Barcodes"),
    },
  ];
}
