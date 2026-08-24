import { Download, Search, Upload } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import DocumentSubmissionModal from "~/routes/user/my-profile/modals/DocumentSubmissionModal";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import { useIsMobile } from "~/hooks/use-mobile";
import useTheme from "~/hooks/useTheme";
import type { BreadcrumbItem, SectionTab } from "~/types/CommonTypes";
import DocumentCard from "./components/DocumentCard";
import DocumentsSidePane, {
  type SidePaneStatusFilter,
} from "./components/DocumentsSidePane";
import MissingDocuments from "./components/MissingDocuments";
import {
  buildDocumentsModel,
  matchesSearch,
  type DocumentItem,
  type ProofType,
} from "./helper";

type StatusFilter = SidePaneStatusFilter;

const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
  { key: "missing", label: "Missing" },
];

const breadcrumbsBase: BreadcrumbItem[] = [
  { label: "dashboard", redirect: { path: "/dashboard" } },
  { label: "myProfile", redirect: { path: "/user/my-profile" } },
  { label: "Documents" },
];

const DocumentsPage: React.FC = () => {
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { t } = useTranslation(["common"]);
  const isMobile = useIsMobile();
  const isTheme2 = useTheme() === "theme-2";

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [uploadModal, setUploadModal] = useState<{
    show: boolean;
    proofType?: ProofType;
  }>({ show: false });
  const [previewModal, setPreviewModal] = useState<{
    show: boolean;
    images: { id: string }[];
  }>({ show: false, images: [] });

  const breadcrumbs: BreadcrumbItem[] = breadcrumbsBase.map((b) => ({
    ...b,
    label: typeof b.label === "string" ? t(b.label as string) : b.label,
  }));

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const resp = await AuthService.getLoggedInFranchiseDetails();
      // The upload modal merges against the cached user's documents, so keep
      // the cache in step with what this page just read.
      if (resp?.data?.data?._id) {
        AuthService.setloggedInUser(resp.data.data);
      }
      const formatted = FranchiseService.formatFranchise(
        resp?.data?.data || {},
      );
      setProfileData(formatted);
    } catch {
      setProfileData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const model = useMemo(() => buildDocumentsModel(profileData), [profileData]);

  const visibleItems = useMemo(
    () =>
      model.items.filter(
        (item) =>
          (statusFilter === "all" || item.status === statusFilter) &&
          (!typeFilter || item.type === typeFilter) &&
          matchesSearch(item, search),
      ),
    [model.items, statusFilter, typeFilter, search],
  );

  // Mobile status tabs — the four buckets a store cares about; "rejected"
  // stays out of the scroller and is reachable through the card itself.
  const statusTabs: SectionTab[] = useMemo(
    () =>
      statusFilters
        .filter((filter) => filter.key !== "rejected")
        .map((filter) => ({
          key: filter.key,
          label: filter.label,
          badge: model.counts[filter.key],
        })),
    [model.counts],
  );

  // Rejected only shows up once a reviewer has actually rejected something.
  const summary = [
    `${model.counts.verified} verified`,
    `${model.counts.pending} pending`,
    model.counts.rejected ? `${model.counts.rejected} rejected` : "",
    `${model.counts.missing} missing`,
  ]
    .filter(Boolean)
    .join(" · ");

  const handleView = (item: DocumentItem) => {
    setPreviewModal({
      show: true,
      images: item.images.map((img) => ({ id: img.id })),
    });
  };

  const handleAdd = (item: DocumentItem) => {
    // FSSAI is captured by its own flow on the profile page; everything else
    // goes through the document submission modal.
    if (item.redirect) {
      appNav.to(item.redirect);
      return;
    }
    setUploadModal({ show: true, proofType: item.proofType });
  };

  const handleUploadCallback = (data: { action: string }) => {
    setUploadModal({ show: false });
    if (data?.action === "success") {
      fetchProfile();
    }
  };

  const handleExportBundle = () => {
    appToast.show({ msg: "Export bundle — coming soon", color: "info" });
  };

  const uploadButton = (
    <AppButton
      size="small"
      color="primary"
      onClick={() => setUploadModal({ show: true })}
    >
      <Upload size={16} />
      Upload doc
    </AppButton>
  );

  const searchInput = (
    <div className="tw:relative tw:flex-1">
      <Search
        size={16}
        className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400"
      />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name / number"
        className="tw:w-full tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50 tw:py-2 tw:pl-9 tw:pr-3 tw:text-sm tw:outline-none tw:focus:border-primary"
      />
    </div>
  );

  const documentsList = loading ? (
    <div className="tw:flex tw:h-64 tw:items-center tw:justify-center">
      <div className="tw:h-10 tw:w-10 tw:animate-spin tw:rounded-full tw:border-t-2 tw:border-b-2 tw:border-gray-900" />
    </div>
  ) : visibleItems.length ? (
    <div className="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] tw:gap-4">
      {visibleItems.map((item) => (
        <DocumentCard
          key={item.key}
          item={item}
          onView={handleView}
          onAdd={handleAdd}
        />
      ))}
    </div>
  ) : (
    <NoData
      title="No documents found"
      description="Try a different search or filter, or upload a new document."
    />
  );

  // Mobile drops the card chrome entirely: the status tabs sit under the
  // header, and search shares its row with the upload action.
  if (isMobile) {
    return (
      <>
        <AppHeader
          title="Documents"
          subtitle={summary}
          sectionKey="profile"
          activeTab="documents"
          mobileLead="menu"
        />
        <div className="app-page page-bg tw:p-4">
          {/* Status buckets replace the chip row on mobile. The sticky bar is a
              theme-2-only affordance, so the legacy theme gets a plain track. */}
          <SectionTabs
            tabs={statusTabs}
            activeTab={statusFilter}
            onTabChange={(tab) => setStatusFilter(tab.key as StatusFilter)}
            noShadow
            sticky={isTheme2}
            scrollable
          />

          <div className="tw:space-y-4 theme-2-mobile-gap-top">
            <div className="tw:flex tw:items-center tw:gap-2">
              {searchInput}
              <div className="tw:shrink-0">{uploadButton}</div>
            </div>

            {model.missing.length ? (
              <MissingDocuments items={model.missing} onAdd={handleAdd} />
            ) : null}

            {documentsList}
          </div>
        </div>

        <DocumentSubmissionModal
          show={uploadModal.show}
          defaultProofType={uploadModal.proofType}
          callback={handleUploadCallback}
          onClose={() => setUploadModal({ show: false })}
        />

        <ImgPreviewModal
          show={previewModal.show}
          images={previewModal.images}
          callback={() => setPreviewModal({ show: false, images: [] })}
        />
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="Documents"
        subtitle={summary}
        sectionKey="profile"
        activeTab="documents"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — profile section menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="documents"
                  title="Manage profile"
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} />
                  <AppCard
                    className="tw:mb-0 tw:py-3"
                    headerClassName="tw:border-b tw:border-gray-200 tw:px-4 tw:[.border-b]:pb-3"
                    bodyClassName="tw:space-y-4 tw:px-4 tw:pt-3"
                    title={
                      <div className="tw:flex tw:w-full tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
                        <span className="tw:text-xl tw:font-semibold tw:text-gray-900">
                          All documents
                        </span>
                        <div className="tw:flex tw:items-center tw:gap-2">
                          {/* <AppButton
                            size="small"
                            fill="outline"
                            color="medium"
                            onClick={handleExportBundle}
                          >
                            <Download size={16} />
                            Export bundle
                          </AppButton> */}
                          {uploadButton}
                        </div>
                      </div>
                    }
                  >
                    {/* Search + status/type facets. Hidden in theme-2 desktop where
                      the same controls live inside the documents side pane. */}
                    <div className="app-pane-hide tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3">
                      <div className="tw:flex">{searchInput}</div>

                      <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2 tw:border-b tw:border-gray-200 tw:pb-3">
                        {statusFilters
                          .filter(
                            (filter) =>
                              filter.key === "all" ||
                              statusFilter === filter.key ||
                              model.counts[filter.key] > 0,
                          )
                          .map((filter) => (
                            <FilterChip
                              key={filter.key}
                              active={statusFilter === filter.key}
                              count={model.counts[filter.key]}
                              onClick={() => setStatusFilter(filter.key)}
                            >
                              {filter.label}
                            </FilterChip>
                          ))}
                      </div>

                      <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2">
                        <FilterChip
                          active={!typeFilter}
                          prefix="Type:"
                          onClick={() => setTypeFilter("")}
                        >
                          All
                        </FilterChip>
                        {model.types.map((type) => (
                          <FilterChip
                            key={type.type}
                            active={typeFilter === type.type}
                            count={type.count}
                            onClick={() => setTypeFilter(type.type)}
                          >
                            {type.type}
                          </FilterChip>
                        ))}
                      </div>
                    </div>

                    <div className="app-pane-hide">
                      {model.missing.length ? (
                        <MissingDocuments
                          items={model.missing}
                          onAdd={handleAdd}
                        />
                      ) : null}
                    </div>

                    {documentsList}
                  </AppCard>
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <DocumentsSidePane
                    model={model}
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    typeFilter={typeFilter}
                    onTypeChange={setTypeFilter}
                    onAdd={handleAdd}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentSubmissionModal
        show={uploadModal.show}
        defaultProofType={uploadModal.proofType}
        callback={handleUploadCallback}
        onClose={() => setUploadModal({ show: false })}
      />

      <ImgPreviewModal
        show={previewModal.show}
        images={previewModal.images}
        callback={() => setPreviewModal({ show: false, images: [] })}
      />
    </>
  );
};

export default DocumentsPage;
