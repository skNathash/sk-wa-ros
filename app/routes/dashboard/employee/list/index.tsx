import { UserPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import RbacService from "~/services/RbacService";
import type {
  BreadcrumbItem,
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import useScreenView from "~/hooks/useScreenView";
import Filter from "./components/Filter";
import Summary from "./components/Summary";
import {
  defaultSummary,
  getData,
  getSummary,
  mapFeatures,
  prepareParams,
} from "./helper";
import { produce } from "immer";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { orderBy } from "lodash";
import { useTranslation } from "react-i18next";
import PageAccessService from "~/services/PageAccessService";
import Rbac from "~/components/core/rbac/Rbac";
import CommonService from "~/services/CommonService";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import PageDescription from "~/components/core/page-description/PageDescription";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Alpha from "~/components/core/alpha/Alpha";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

const rbacRoles = {
  addUser: ["USER-MANAGEMENT.ADD-USER"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["USER-MANAGEMENT.VIEW-USER"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "Manage Staff",
    langKey: "manageEmployees",
  },
];

const EmployeeList = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { show: showToast } = useAppToast();
  const { isMobile } = useScreenView();
  const appNav = useAppNav();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [summary, setSummary] = useState<any[]>([...defaultSummary]);
  const [viewType, setViewType] = useState<ViewToggleType>("list");
  const [alpha, setAlpha] = useState<string>("");

  const [busyloader, setBusyloader] = useState({ show: false });

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});
  const featuresRef = useRef<any[]>([]);
  const sortRef = useRef<SortProps>({
    key: "name",
    value: "asc",
  });

  const loadFeatures = async () => {
    const r = await RbacService.getFeatures({ groupBy: "module" });

    const features = (r.data?.data || []).map((x: any) => ({
      label: x._id,
      key: x._id,
      // Use a larger multiplier for short ids and a smaller one for long ids;
      // also ensure a reasonable minimum width so columns don't collapse.
      width: `${Math.max(x._id.length * (x._id.length < 12 ? 16 : 9), 60)}px`,
      id: x._id,
      // isCentered: true,
      permissions: orderBy(x.features || [], ["name"], ["asc"]),
    }));
    featuresRef.current = features;
  };

  // Apply filter (initial load or filter change)
  const applyFilter = useCallback(async () => {
    loadSummary();
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
        sortRef.current as { key: string; value: "asc" | "desc" },
      );
      const result = await getData(params);
      setData(mapFeatures(featuresRef.current, result?.data || []));
      paginationRef.current.totalRecords = result?.count || 0;
      setHasMoreData(result?.count >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      // advance page
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current as { key: string; value: "asc" | "desc" },
      );
      const result = await getData(params);

      // update total records when provided by API
      if (typeof result?.count === "number") {
        paginationRef.current.totalRecords = result.count;
      }

      // map features the same way applyFilter does before appending
      const mapped = mapFeatures(featuresRef.current, result?.data || []);
      setData((prev) => [...prev, ...mapped]);

      setHasMoreData(
        (result?.data || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      await loadFeatures();
      applyFilter();
    };
    fetchData();
  }, []);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  const handleAlphaSelect = useCallback((val: string) => {
    setAlpha(val);
    filterRef.current = { ...filterRef.current, alpha: val };
    applyFilter();
  }, []);

  const loadSummary = useCallback(async () => {
    const summary = await getSummary(filterRef.current);
    setSummary(summary);
  }, []);

  const updatePermission = useCallback(async (payload: any) => {
    const userId = payload._id;
    const featureId = payload.featureId;
    const checked = payload.checked;
    if (!userId || !featureId) return;

    setBusyloader({ show: true });
    try {
      const payloadForApi = {
        features: [
          {
            featureId,
            active: checked,
          },
        ],
      };

      const response = await FranchiseService.updateFranSubUserPermissions(
        userId,
        payloadForApi,
      );

      if (response?.statusCode === 200) {
        setData((prev) =>
          produce(prev, (draft: any) => {
            const rowIndex = payload.index;
            const userIdx = rowIndex;
            if (userIdx === -1 || userIdx >= draft.length) return;

            const fIdx = payload.featureIndex;
            if (fIdx === -1 || fIdx >= draft[userIdx]._features.length) return;

            const feature = draft[userIdx]._features[fIdx];
            if (!feature) return;

            const pIdx = payload.permissionIndex;
            if (pIdx === -1 || pIdx >= (feature.permissions?.length || 0))
              return;

            if (feature.permissions && feature.permissions[pIdx]) {
              feature.permissions[pIdx].selected = checked;
            }

            if (feature.permissions && feature.permissions.length > 0) {
              feature.selected = feature.permissions.every(
                (p: any) => !!p.selected,
              );
            } else {
              feature.selected = checked;
            }
          }),
        );

        showToast({ msg: "Permission updated successfully", color: "success" });
      } else {
        showToast({
          msg: response?.data?.message || "Failed to update permission",
          color: "error",
        });
      }
    } catch (e) {
      showToast({
        msg: "Something went wrong. Please try again.",
        color: "error",
      });
    } finally {
      setBusyloader({ show: false });
    }
  }, []);

  const toggleAllPermissions = useCallback(
    async (payload: any) => {
      const userId = payload._id;
      const checked = payload.checked;
      if (!userId) return;

      // Get the row index and feature index from payload
      const rowIndex = payload.index;
      const featureIndex = payload.featureIndex;

      // Validate indices
      if (typeof rowIndex !== "number" || typeof featureIndex !== "number") {
        console.error("Invalid indices provided:", { rowIndex, featureIndex });
        return;
      }

      // Get the user data and feature data using the indices
      const userData = data[rowIndex];
      if (
        !userData ||
        !userData._features ||
        !userData._features[featureIndex]
      ) {
        console.error("User or feature data not found at indices:", {
          rowIndex,
          featureIndex,
        });
        return;
      }

      const featureData = userData._features[featureIndex];
      const permissions = featureData.permissions || [];

      // Build features array for API by collecting all permissions
      const featuresForApi = permissions.map((p: any) => ({
        featureId: p._id,
        active: !!checked,
      }));

      // Fallback: if there are no permissions, send single feature entry using feature id
      if (featuresForApi.length === 0) {
        featuresForApi.push({ featureId: featureData.id, active: !!checked });
      }

      setBusyloader({ show: true });
      try {
        const payloadForApi = { features: featuresForApi };

        const response = await FranchiseService.updateFranSubUserPermissions(
          userId,
          payloadForApi,
        );

        if (response?.statusCode === 200) {
          setData((prev) =>
            produce(prev, (draft: any) => {
              const userData = draft[rowIndex];
              if (
                !userData ||
                !userData._features ||
                !userData._features[featureIndex]
              ) {
                return;
              }

              const feature = userData._features[featureIndex];
              if (!feature) return;

              if (feature.permissions && feature.permissions.length > 0) {
                feature.permissions.forEach((p: any) => {
                  if (p) p.selected = !!checked;
                });
                feature.selected = !!checked;
              } else {
                feature.selected = !!checked;
              }
            }),
          );

          showToast({
            msg: "Permissions updated successfully",
            color: "success",
          });
        } else {
          showToast({
            msg: response?.data?.message || "Failed to update permissions",
            color: "error",
          });
        }
      } catch (e) {
        showToast({
          msg: "Something went wrong. Please try again.",
          color: "error",
        });
      } finally {
        setBusyloader({ show: false });
      }
    },
    [data],
  );

  const handleItemCallback = useCallback(
    ({ action, data }: { action: string; data: any }) => {
      switch (action) {
        case "toggleAllPermissions":
          toggleAllPermissions(data);
          break;
        case "updatePermission":
          updatePermission(data);
          break;
        default:
          break;
      }
    },
    [toggleAllPermissions, updatePermission],
  );

  const handleSort = useCallback((a: SortProps) => {
    sortRef.current.key = a.key;
    sortRef.current.value = a.value;
    applyFilter();
  }, []);

  return (
    <>
      <AppHeader title={t("manageEmployees")} />
      <div className="page-bg tw:p-4 app-page has-footer">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="staff"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="staff"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <PageDescription description="manageUser" className="tw:mb-4" />
            </div>
            <div>
              <Rbac roles={rbacRoles.addUser}>
                <AppButton
                  size="small"
                  onClick={() => appNav.to("/dashboard/employee/manage")}
                >
                  <UserPlus size={12} />
                  {t("addUser")}
                </AppButton>
              </Rbac>
            </div>
          </div>
          <Summary summary={summary} />
          <AppCard title={t("userList")} icon="users" noContentPadding>
            <div className="tw:px-6 tw:py-2">
              <div className="tw:mb-4">
                <Alpha selected={alpha} callback={handleAlphaSelect} />
              </div>
              <Filter callback={onFilterChange} />

              <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
                <div>
                  <PaginationSummary
                    loadingTotalRecords={loading}
                    paginationConfig={paginationRef.current}
                    loadedCount={data.length}
                    fwSize="sm"
                  />
                </div>

                <ViewToggle viewType={viewType} callback={setViewType} />
              </div>
            </div>
            {isMobile || viewType === "card" ? (
              <>
                <MobileView
                  data={data}
                  loading={loading}
                  callback={handleItemCallback}
                />
                {hasMoreData && !loading && (
                  <div className="tw:text-center tw:mt-4">
                    <LoadMoreButton
                      loadMore={loadMore}
                      loading={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                    />
                  </div>
                )}
              </>
            ) : (
              <DesktopView
                data={data}
                loading={loading}
                features={featuresRef.current}
                callback={handleItemCallback}
                onSort={handleSort}
                sortKey={sortRef.current.key}
                sortValue={sortRef.current.value}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                hasMoreData={hasMoreData}
              />
            )}
          </AppCard>
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={busyloader.show} />
    </>
  );
};

export default EmployeeList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Staff List"),
    },
  ];
}
