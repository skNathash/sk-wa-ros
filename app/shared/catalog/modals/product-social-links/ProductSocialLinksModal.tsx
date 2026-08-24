import { ExternalLink, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";

type SocialLink = { name: string; link: string };

type Props = {
  show: boolean;
  dealId?: string;
  youtubeLink?: string;
  instagramLink?: string;
  // Deal-level default links, surfaced as a "catalog default" hint (not auto-filled).
  youtubeDefault?: string;
  instagramDefault?: string;
  callback: (a: { action: string; data?: SocialLink[] }) => void;
};

type FormData = {
  youtubeLink: string;
  instagramLink: string;
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidYouTubeUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const u = new URL(url);
  return (
    u.hostname === "youtube.com" ||
    u.hostname === "youtu.be" ||
    u.hostname === "www.youtube.com"
  );
};

const isValidInstagramUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const u = new URL(url);
  return u.hostname === "instagram.com" || u.hostname === "www.instagram.com";
};

const DefaultLinkHint = ({ link }: { link?: string }) => {
  if (!link) return null;
  return (
    <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
      <div className="tw:flex tw:items-center tw:gap-1">
        <span className="tw:shrink-0">Using catalog default:</span>
        <span title={link} className="tw:min-w-0 tw:truncate tw:text-gray-700">
          {link}
        </span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          title="Open link in new tab"
          className="tw:shrink-0 tw:text-gray-500 tw:hover:text-gray-700"
        >
          <ExternalLink className="tw:w-3.5 tw:h-3.5" />
        </a>
      </div>
      <span>Enter a link to override.</span>
    </div>
  );
};

const ProductSocialLinksModal = ({
  show,
  dealId,
  youtubeLink,
  instagramLink,
  youtubeDefault,
  instagramDefault,
  callback,
}: Props) => {
  const toast = useAppToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, control } = useForm<FormData>({
    defaultValues: { youtubeLink: "", instagramLink: "" },
  });

  // Show the deal default only while the field is empty (default is in effect).
  const youtubeValue = useWatch({ control, name: "youtubeLink" });
  const instagramValue = useWatch({ control, name: "instagramLink" });

  useEffect(() => {
    if (show) {
      reset({
        youtubeLink: youtubeLink || "",
        instagramLink: instagramLink || "",
      });
    }
  }, [show, youtubeLink, instagramLink, reset]);

  const handleClose = () => callback({ action: "close" });

  const onSubmit = async (formData: FormData) => {
    if (!dealId) return;

    const youtube = formData.youtubeLink?.trim();
    const instagram = formData.instagramLink?.trim();

    if (youtube && !isValidYouTubeUrl(youtube)) {
      toast.show({ msg: "Please provide a valid YouTube URL", color: "error" });
      return;
    }
    if (instagram && !isValidInstagramUrl(instagram)) {
      toast.show({
        msg: "Please provide a valid Instagram URL",
        color: "error",
      });
      return;
    }

    // Send only the platforms that have a link. Omitted platforms are cleared.
    const sellerSocialMediaLinks: SocialLink[] = [];
    if (youtube)
      sellerSocialMediaLinks.push({ name: "youtube", link: youtube });
    if (instagram)
      sellerSocialMediaLinks.push({ name: "instagram", link: instagram });

    try {
      setSubmitting(true);
      const resp = await SellerCatalogService.updateSocialMediaLinks(
        dealId,
        sellerSocialMediaLinks,
      );
      if (resp.statusCode === 200 || resp.statusCode === 201) {
        toast.show({ msg: "Saved successfully", color: "success" });
        callback({ action: "submit", data: sellerSocialMediaLinks });
      } else {
        toast.show({
          msg: resp.data?.message || "Failed to update links",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error updating social media links:", error);
      toast.show({ msg: "An error occurred", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <span className="tw:font-semibold tw:text-base tw:tracking-tight">
          Product Links
        </span>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
          <p className="tw:text-xs tw:text-gray-500">
            Add YouTube or Instagram links for this product. This will be
            displayed on the CLUB App
          </p>
          <div className="tw:mb-4">
            <AppInput
              label="YouTube Link"
              name="youtubeLink"
              type="text"
              register={register}
              placeholder="https://youtube.com/..."
              className="tw:mb-0"
              inputClassName="tw:bg-white"
              leftIcon={<Youtube className="tw:w-4 tw:h-4 tw:text-red-600" />}
            />
            {!youtubeValue?.trim() && <DefaultLinkHint link={youtubeDefault} />}
          </div>
          <div>
            <AppInput
              label="Instagram Link"
              name="instagramLink"
              type="text"
              register={register}
              placeholder="https://instagram.com/..."
              className="tw:mb-0"
              inputClassName="tw:bg-white"
              leftIcon={
                <Instagram className="tw:w-4 tw:h-4 tw:text-pink-600" />
              }
            />
            {!instagramValue?.trim() && (
              <DefaultLinkHint link={instagramDefault} />
            )}
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton fill="outline" onClick={handleClose} color="dark">
            Cancel
          </AppButton>
          <AppButton
            color="success"
            onClick={handleSubmit(onSubmit)}
            isLoading={submitting}
          >
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ProductSocialLinksModal;
