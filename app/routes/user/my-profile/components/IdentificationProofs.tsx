import React from "react";
import ProfileAccordion from "./ProfileAccordion";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ImgRender from "~/components/core/img/ImgRender";
import { FileText, Edit } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

interface Doc {
  photoID: string;
  photoIDNo: string;
  photoIDFile: string | string[];
}

interface IdentificationProofsProps {
  docs: Doc[];
}

const IdentificationProofs: React.FC<
  IdentificationProofsProps & { onEdit?: () => void }
> = ({ docs = [], onEdit }) => {
  // Group docs by photoID
  const grouped: { name: string; refNo: string; images: string[] }[] =
    Object.values(
      docs.reduce(
        (
          acc: Record<
            string,
            { name: string; refNo: string; images: string[] }
          >,
          doc
        ) => {
          if (!acc[doc.photoID]) {
            acc[doc.photoID] = {
              name: doc.photoID,
              refNo: doc.photoIDNo,
              images: [],
            };
          }
          if (Array.isArray(doc.photoIDFile)) {
            acc[doc.photoID].images.push(...doc.photoIDFile);
          } else if (doc.photoIDFile) {
            acc[doc.photoID].images.push(doc.photoIDFile);
          }
          return acc;
        },
        {}
      )
    );

  return (
    <ProfileAccordion
      title="Identification Proofs"
      defaultExpanded={false}
      icon={<FileText />}
    >
      <div className="tw:relative">
        {onEdit && (
          <AppButton
            size="small"
            fill="clear"
            className="tw:absolute tw:top-0 tw:right-0"
            onClick={onEdit}
          >
            <Edit className="tw:text-base tw:mr-1" size={16} />
            Edit
          </AppButton>
        )}
        {grouped.length === 0 && (
          <div className="tw:text-gray-400">
            No identification proofs available.
          </div>
        )}
        {grouped.map((item) => (
          <div key={item.name} className="tw:mb-6">
            <div className="tw:font-semibold tw:mb-1">{item.name}</div>
            <div className="tw:text-xs tw:mb-2 tw:text-gray-500">
              Ref No: {item.refNo || "-"}
            </div>
            {item.images.length > 0 && (
              <AppSwiper
                config={{ slidesPerView: "auto", spaceBetween: 12 }}
                className="tw:max-w-full tw:mb-2"
              >
                {item.images.map((img, idx) => (
                  <AppSwiper.Slide key={idx} isAutoWidth>
                    <ImgRender
                      assetId={img}
                      className="tw:w-24 tw:h-24 tw:object-cover tw:rounded tw:border"
                      alt={item.name}
                    />
                  </AppSwiper.Slide>
                ))}
              </AppSwiper>
            )}
          </div>
        ))}
      </div>
    </ProfileAccordion>
  );
};

export default IdentificationProofs;
