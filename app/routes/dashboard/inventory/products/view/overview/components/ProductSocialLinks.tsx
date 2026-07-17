import React from "react";
import { Instagram, Pencil, Plus, Youtube } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppButton from "~/components/core/button/AppButton";

type SocialLink = { name: string; link: string };

interface ProductSocialLinksProps {
  basic: {
    youtubeLink?: SocialLink[];
    instaLink?: SocialLink[];
  };
  onEditLinks?: (platform?: "youtube" | "instagram") => void;
}

const ProductSocialLinks: React.FC<ProductSocialLinksProps> = ({
  basic,
  onEditLinks,
}) => {
  const youtubeLink = basic.youtubeLink?.[0]?.link || "";
  const instagramLink = basic.instaLink?.[0]?.link || "";

  return (
    <AppCard title="Media Links">
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-4">
        <KeyValue label="YouTube Link" size="sm">
          <div className="tw:flex tw:items-center tw:gap-2">
            {youtubeLink ? (
              <a
                href={youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:inline-flex tw:items-center tw:gap-1 tw:text-primary tw:hover:underline tw:break-all"
              >
                <Youtube size={14} className="tw:text-red-600 tw:shrink-0" />
                View
              </a>
            ) : (
              <span className="tw:text-gray-400">--</span>
            )}
            {onEditLinks && (
              <AppButton
                size="small"
                fill="clear"
                color="primary"
                onClick={() => onEditLinks("youtube")}
              >
                {youtubeLink ? <Pencil size={12} /> : <Plus size={12} />}
                {youtubeLink ? "Edit" : "Add"}
              </AppButton>
            )}
          </div>
        </KeyValue>
        <KeyValue label="Instagram Link" size="sm">
          <div className="tw:flex tw:items-center tw:gap-2">
            {instagramLink ? (
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:inline-flex tw:items-center tw:gap-1 tw:text-primary tw:hover:underline tw:break-all"
              >
                <Instagram size={14} className="tw:text-pink-600 tw:shrink-0" />
                View
              </a>
            ) : (
              <span className="tw:text-gray-400">--</span>
            )}
            {onEditLinks && (
              <AppButton
                size="small"
                fill="clear"
                color="primary"
                onClick={() => onEditLinks("instagram")}
              >
                {instagramLink ? <Pencil size={12} /> : <Plus size={12} />}
                {instagramLink ? "Edit" : "Add"}
              </AppButton>
            )}
          </div>
        </KeyValue>
      </div>
    </AppCard>
  );
};

export default ProductSocialLinks;
