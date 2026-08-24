import {
  Banknote,
  Eye,
  FileCheck2,
  History,
  Image as ImageIcon,
  Link2,
  MapPin,
  Pencil,
  Plus,
  ReceiptText,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import clsx from "clsx";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import AuthService from "~/services/AuthService";
import DeclarationAgreementModal from "~/shared/store/declaration-agreement/DeclarationAgreementModal";
import ConnectedSellerDetails from "../ConnectedSellerDetails";
import AddressLogsModal from "../../modals/AddressLogsModal";
import BankDetailModal from "../../modals/BankDetailModal";
import FssaiLicenseModal from "../../modals/FssaiLicenseModal";
import GstSettingsModal from "../../modals/GstSettingsModal";
import ProfileRequestLogModal from "../../modals/ProfileRequestLogModal";
import UpdateOwnerInformationModal from "../../modals/UpdateOwnerInformationModal";
import UpdateStoreInformationModal from "../../modals/UpdateStoreInformationModal";
import UpdateStoreLocationModal from "../../modals/UpdateStoreLocationModal";
import DetailCard, { DetailRows } from "./DetailCard";
import { buildStoreDetailsModel } from "./helper";

interface StoreDetailSectionsProps {
  profileData: any;
  /** Re-reads the profile after any modal writes to it. */
  onRefresh: () => void;
}

type ModalKey =
  | "store"
  | "store-logs"
  | "gst"
  | "location"
  | "address-logs"
  | "owner"
  | "bank"
  | "fssai"
  | "declaration";

/**
 * The detail half of the theme-2 profile page — branding, business, tax,
 * location, owner, bank, the linked seller and the legal record. Each card
 * reads its values out and hands editing back to the modal that already owns
 * that form.
 */
const StoreDetailSections: React.FC<StoreDetailSectionsProps> = ({
  profileData,
  onRefresh,
}) => {
  const toast = useAppToast();
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);

  const [modal, setModal] = useState<ModalKey | null>(null);
  const [termsModal, setTermsModal] = useState<{
    show: boolean;
    code?: string;
    title?: string;
    version?: string;
  }>({ show: false });

  const model = useMemo(
    () => buildStoreDetailsModel(profileData),
    [profileData],
  );

  /**
   * A master login is impersonating the store, so it may read the profile but
   * never write to it.
   */
  const openEditor = (key: ModalKey) => () => {
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setModal(key);
  };

  /** Branding is edited on its own page rather than in a modal. */
  const openBrandingPage = () => {
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    appNav.to("/user/store-branding");
  };

  const closeModal = (refresh: boolean) => {
    setModal(null);
    if (refresh) onRefresh();
  };

  const { branding, location, legal } = model;

  return (
    <>
      <div className="tw:mt-6 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
        <h2 className="tw:text-xs tw:font-bold tw:uppercase tw:tracking-widest tw:text-gray-400">
          SETTINGS · 6 AREAS · LIVE STATE
        </h2>
        <span className="tw:text-xs tw:text-gray-400">
          Tap to configure · every change is logged
        </span>
      </div>

      <div className="tw:mt-3 tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2 tw:xl:grid-cols-3">
        <DetailCard
          title="Branding"
          icon={ImageIcon}
          accent="tw:bg-fuchsia-50 tw:text-fuchsia-600"
          subtitle="Logo, tagline and social links"
          actions={[
            {
              key: "edit",
              label: branding.hasAny ? "Edit" : "Add",
              icon: branding.hasAny ? Pencil : Plus,
              onClick: openBrandingPage,
            },
          ]}
        >
          <div className="tw:flex tw:h-full tw:flex-1 tw:flex-col tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50/70 tw:p-4">
            <div className="tw:flex tw:items-center tw:gap-3.5">
              <div className="tw:flex tw:size-14 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:shadow-xs">
                {branding.logo ? (
                  <ImgRender
                    assetId={branding.logo}
                    alt="Store logo"
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                ) : (
                  <ImageIcon className="tw:h-6 tw:w-6 tw:text-gray-300" />
                )}
              </div>
              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:text-xs tw:text-gray-500">
                  Tagline
                </p>
                <p
                  className={clsx(
                    "tw:mt-0.5 tw:break-words tw:text-xs tw:font-semibold tw:line-clamp-2",
                    branding.caption
                      ? "tw:text-gray-900"
                      : "tw:font-normal tw:text-gray-400",
                  )}
                >
                  {branding.caption || "Not set"}
                </p>
              </div>
            </div>

            <div>
              <p className="tw:mb-1.5 tw:text-xs tw:text-gray-500">
                Social links
              </p>
              <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                {branding.links.length ? (
                  branding.links.map((link) => (
                    <a
                      key={link.key}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:text-gray-700 tw:hover:bg-gray-100 tw:transition-colors"
                    >
                      {link.label}
                    </a>
                  ))
                ) : (
                  <span className="tw:text-xs tw:text-gray-400">
                    No social links added
                  </span>
                )}
              </div>
            </div>
          </div>
        </DetailCard>

        <DetailCard
          title="Business"
          icon={Store}
          accent="tw:bg-emerald-50 tw:text-emerald-600"
          subtitle="What the store sells and when it trades"
          actions={[
            {
              key: "fssai",
              label: "FSSAI",
              icon: ShieldCheck,
              onClick: openEditor("fssai"),
            },
            {
              key: "logs",
              label: "History",
              icon: History,
              onClick: () => setModal("store-logs"),
            },
            {
              key: "edit",
              label: "Edit",
              icon: Pencil,
              onClick: openEditor("store"),
            },
          ]}
        >
          <DetailRows rows={model.business} />
        </DetailCard>

        <DetailCard
          title="Tax"
          icon={ReceiptText}
          accent="tw:bg-amber-50 tw:text-amber-600"
          subtitle="GST registration and invoice type"
          actions={[
            {
              key: "gst",
              label: "Manage",
              icon: Pencil,
              onClick: openEditor("gst"),
            },
          ]}
        >
          <DetailRows rows={model.tax} />
        </DetailCard>

        <DetailCard
          title="Location"
          icon={MapPin}
          accent="tw:bg-sky-50 tw:text-sky-600"
          subtitle={
            location.logCount
              ? `${location.logCount} change request${
                  location.logCount > 1 ? "s" : ""
                }`
              : "Where customers find the store"
          }
          actions={[
            ...(location.logCount
              ? [
                  {
                    key: "logs",
                    label: "History",
                    icon: History,
                    onClick: () => setModal("address-logs"),
                  },
                ]
              : []),
            {
              key: "edit",
              label: "Edit",
              icon: Pencil,
              onClick: openEditor("location"),
            },
          ]}
        >
          <DetailRows rows={model.locationRows} />
        </DetailCard>

        <DetailCard
          title="Owner"
          icon={User}
          accent="tw:bg-violet-50 tw:text-violet-600"
          subtitle="Who we contact about this store"
          actions={[
            {
              key: "edit",
              label: "Edit",
              icon: Pencil,
              onClick: openEditor("owner"),
            },
          ]}
        >
          <DetailRows rows={model.owner} />
        </DetailCard>

        <DetailCard
          title="Bank account"
          icon={Banknote}
          accent="tw:bg-blue-50 tw:text-blue-600"
          subtitle="Where payouts and settlements land"
          actions={[
            {
              key: "edit",
              label: model.hasBank ? "Edit" : "Add",
              icon: model.hasBank ? Pencil : Plus,
              onClick: openEditor("bank"),
              primary: !model.hasBank,
            },
          ]}
        >
          <DetailRows rows={model.bank} />
        </DetailCard>

        {model.linkedFranchiseId && (
          <DetailCard
            title="Connected seller"
            icon={Link2}
            accent="tw:bg-teal-50 tw:text-teal-600"
            subtitle="The SK seller this store sources from"
            className="tw:col-span-full"
          >
            <div className="tw:flex tw:h-full tw:flex-1 tw:flex-col tw:justify-center tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50/70 tw:p-4">
              <ConnectedSellerDetails
                fid={model.linkedFranchiseId}
                template={2}
              />
            </div>
          </DetailCard>
        )}

        {/* The legal record — the signed declaration and every policy the
            store has agreed to since signup. */}
        {(legal.signedAt || legal.terms.length > 0) && (
          <DetailCard
            title="Legal"
            icon={FileCheck2}
            accent="tw:bg-rose-50 tw:text-rose-600"
            subtitle="Declaration and agreed policies"
            className="tw:col-span-full"
            actions={
              legal.signedAt
                ? [
                    {
                      key: "declaration",
                      label: "View declaration",
                      icon: Eye,
                      onClick: () => setModal("declaration"),
                    },
                  ]
                : []
            }
          >
            <div className="tw:flex tw:h-full tw:flex-1 tw:flex-col tw:justify-center tw:gap-2">
              {legal.signedAt && (
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:rounded-xl tw:border tw:border-emerald-100 tw:bg-emerald-50 tw:px-4 tw:py-3">
                  <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-bold tw:text-emerald-800">
                    <ShieldCheck className="tw:h-4 tw:w-4" />
                    Declaration signed
                  </span>
                  <span className="tw:text-sm tw:text-emerald-900/70">
                    {legal.signedBy && `by ${legal.signedBy} · `}
                    <DateFormat value={legal.signedAt} />
                  </span>
                </div>
              )}

              {legal.terms.map((term, index) => (
                <div
                  key={term.code || index}
                  className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50 tw:px-4 tw:py-3"
                >
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                      {term.name || term.code || "Terms"}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {term.version && <span>v{term.version} · </span>}
                      Agreed <DateFormat value={term.agreedAt} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTermsModal({
                        show: true,
                        code: term.code,
                        title: term.name,
                        version: term.version,
                      })
                    }
                    className="tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-bold tw:text-gray-700 tw:hover:bg-gray-100"
                  >
                    <Eye className="tw:h-3.5 tw:w-3.5" />
                    View
                  </button>
                </div>
              ))}
            </div>
          </DetailCard>
        )}
      </div>

      <UpdateStoreInformationModal
        show={modal === "store"}
        data={model.storeEditData}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <ProfileRequestLogModal
        show={modal === "store-logs"}
        profileRequestLogs={model.requestLogs}
        callback={() => setModal(null)}
      />

      <GstSettingsModal
        show={modal === "gst"}
        gstNumber={profileData?.gstNumber}
        profileRequestLogs={model.requestLogs}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <FssaiLicenseModal
        show={modal === "fssai"}
        profileRequestLogs={model.requestLogs}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <UpdateStoreLocationModal
        show={modal === "location"}
        data={model.locationEditData}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <AddressLogsModal
        show={modal === "address-logs"}
        addresses={profileData?.addressLogs || []}
        callback={() => setModal(null)}
      />

      <UpdateOwnerInformationModal
        show={modal === "owner"}
        type="main"
        data={model.ownerEditData}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <BankDetailModal
        show={modal === "bank"}
        callback={({ action }) => closeModal(action === "submit")}
      />

      <DeclarationAgreementModal
        show={modal === "declaration"}
        acceptedAt={legal.signedAt}
        callback={() => setModal(null)}
      />

      <TermsModal
        show={termsModal.show}
        code={termsModal.code || ""}
        title={termsModal.title}
        version={termsModal.version}
        callback={() => setTermsModal({ show: false })}
      />
    </>
  );
};

export default StoreDetailSections;
