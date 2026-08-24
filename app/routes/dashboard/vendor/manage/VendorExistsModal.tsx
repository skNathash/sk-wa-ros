import {
  ArrowRight,
  Check,
  FileText,
  Link2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import VendorService from "~/services/VendorService";

export interface ExistingVendor {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  gst?: string;
  address?: string;
}

interface VendorExistsModalProps {
  show: boolean;
  vendor: ExistingVendor | null;
  callback: (result: { action: "close" | "goToList" }) => void;
}

/** First letters of up to two words, e.g. "charan vendor" -> "CV". */
const getInitials = (name?: string) => {
  if (!name?.trim()) return "V";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "V";
};

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="tw:flex tw:items-start tw:gap-3 tw:px-3.5 tw:py-3">
    <span className="tw:mt-0.5 tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-100 tw:text-slate-500">
      <Icon size={14} />
    </span>
    <div className="tw:min-w-0 tw:flex-1">
      <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-slate-400">
        {label}
      </p>
      <p className="tw:mt-0.5 tw:text-sm tw:font-medium tw:text-slate-800 tw:break-words">
        {children}
      </p>
    </div>
  </div>
);

const VendorExistsModal = ({
  show,
  vendor,
  callback,
}: VendorExistsModalProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);

  // Reset the linked/success state whenever the modal is (re)opened
  useEffect(() => {
    if (show) {
      setLinked(false);
      setLinking(false);
    }
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleGoToList = () => {
    callback({ action: "goToList" });
  };

  const handleLink = async () => {
    if (!vendor?._id) return;
    try {
      setLinking(true);
      const response = await VendorService.addToFavorites(vendor._id);
      if (response.statusCode === 200 || response.statusCode === 201) {
        setLinked(true);
        appToast.show({
          msg: t("vendorLinkedSuccessfully", "Vendor linked successfully"),
          color: "success",
        });
      } else {
        appToast.show({
          msg:
            response.data?.message ||
            t("failedToLinkVendor", "Failed to link vendor"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error linking vendor:", error);
      appToast.show({
        msg:
          error?.response?.data?.message ||
          t("failedToLinkVendor", "Failed to link vendor"),
        color: "danger",
      });
    } finally {
      setLinking(false);
    }
  };

  const initials = getInitials(vendor?.name);

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-md">
      <style>{`
        @keyframes vem-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes vem-rise {
          from { transform: translateY(6px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .vem-pop  { animation: vem-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) both; }
        .vem-rise { animation: vem-rise 0.32s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .vem-pop, .vem-rise { animation: none; }
        }
      `}</style>

      <AppModal.Title onClose={handleClose}>
        <span className="tw:text-base tw:font-semibold tw:text-slate-900">
          {linked
            ? t("vendorLinked", "Vendor Linked")
            : t("vendorAlreadyExists", "Vendor Already Exists")}
        </span>
      </AppModal.Title>

      <AppModal.Content>
        {linked ? (
          /* ---------- Success state ---------- */
          <div className="vem-rise tw:flex tw:flex-col tw:items-center tw:pt-4 tw:pb-2 tw:text-center">
            <div className="tw:relative tw:mb-4">
              <div className="tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-gradient-to-br tw:from-primary tw:to-indigo-600 tw:text-xl tw:font-bold tw:text-white tw:shadow-sm">
                {initials}
              </div>
              <span className="vem-pop tw:absolute tw:-bottom-1.5 tw:-right-1.5 tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-500 tw:text-white tw:ring-4 tw:ring-white">
                <Check size={15} strokeWidth={3} />
              </span>
            </div>

            <p className="tw:text-base tw:font-semibold tw:text-slate-900">
              {t("vendorLinkedToYourList", "Added to your vendor list")}
            </p>
            <p className="tw:mt-1 tw:text-sm tw:font-medium tw:text-slate-600">
              {vendor?.name}
            </p>
            <p className="tw:mt-2 tw:max-w-[19rem] tw:text-xs tw:leading-relaxed tw:text-slate-400">
              {t(
                "vendorLinkedHelp",
                "You can now raise purchase orders and track payments with this vendor.",
              )}
            </p>
          </div>
        ) : (
          /* ---------- Existing-vendor state ---------- */
          <div className="tw:flex tw:flex-col tw:gap-4">
            {/* Identity */}
            <div className="tw:flex tw:items-center tw:gap-3.5">
              <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-gradient-to-br tw:from-primary tw:to-indigo-600 tw:text-base tw:font-bold tw:text-white tw:shadow-sm">
                {initials}
              </div>
              <div className="tw:min-w-0">
                <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-primary">
                  {t("registeredSupplier", "In StoreKing network")}
                </p>
                <p className="tw:truncate tw:text-base tw:font-semibold tw:text-slate-900">
                  {vendor?.name || "-"}
                </p>
              </div>
            </div>

            {/* Detail card */}
            <div className="tw:divide-y tw:divide-slate-100 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
              <DetailRow icon={Phone} label={t("mobileNumber")}>
                {vendor?.mobile || "-"}
              </DetailRow>
              {vendor?.email ? (
                <DetailRow icon={Mail} label={t("emailAddress")}>
                  {vendor.email}
                </DetailRow>
              ) : null}
              {vendor?.gst ? (
                <DetailRow icon={FileText} label={t("gstNumber")}>
                  <span className="tw:font-mono tw:tracking-wide tw:uppercase">
                    {vendor.gst}
                  </span>
                </DetailRow>
              ) : null}
              {vendor?.address ? (
                <DetailRow icon={MapPin} label={t("address")}>
                  {vendor.address}
                </DetailRow>
              ) : null}
            </div>

            {/* Note */}
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:rounded-lg tw:border-l-2 tw:border-primary tw:bg-primary/5 tw:px-3 tw:py-2.5">
              <Link2
                size={15}
                className="tw:mt-0.5 tw:shrink-0 tw:text-primary"
              />
              <p className="tw:text-xs tw:leading-relaxed tw:text-slate-600">
                {t(
                  "vendorExistsLinkInfo",
                  "This vendor is already registered. Link them to add this vendor to your list — no need to create a new one.",
                )}
              </p>
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        {linked ? (
          <div className="tw:flex tw:w-full tw:gap-2.5">
            <AppButton
              type="button"
              fill="outline"
              color="medium"
              onClick={handleClose}
              className="tw:flex-1"
            >
              {t("close")}
            </AppButton>
            <AppButton
              type="button"
              color="primary"
              onClick={handleGoToList}
              className="tw:flex-1"
            >
              {t("viewVendorList", "View vendor list")}
              <ArrowRight className="tw:h-4 tw:w-4" />
            </AppButton>
          </div>
        ) : (
          <div className="tw:flex tw:w-full tw:gap-2.5">
            <AppButton
              type="button"
              fill="outline"
              color="medium"
              onClick={handleClose}
              className="tw:flex-1"
              disabled={linking}
            >
              {t("cancel")}
            </AppButton>
            <AppButton
              type="button"
              color="primary"
              onClick={handleLink}
              className="tw:flex-1"
              isLoading={linking}
              disabled={linking || !vendor?._id}
            >
              <Link2 className="tw:h-4 tw:w-4" />
              {t("linkVendor", "Link Vendor")}
            </AppButton>
          </div>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default VendorExistsModal;
