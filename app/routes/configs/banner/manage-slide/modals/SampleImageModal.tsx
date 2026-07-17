import { Download } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import CommonService from "~/services/CommonService";

export const SAMPLE_BANNER_ASSET_IDS = [
  "00087923381327793404",
  "00113290332059655180",
  "00571655319215064665",
  "06060766659783841042",
  "05123418347338451080",
  "00261538457669441228",
  "00023383596636271148",
  "01027426526714575319",
  "00533637491116187375",
  "00006034590492374920",
  "00866834564173741545",
  "02095458483497906923",
  "14788054554320243232",
  "44166244135031531938",
  "05840998795223403542",
  "03215229411622279080",
  "22133676173076946348",
  "47733724327513364281",
  "03431966488221685817",
  "19158419707370187580",
];

interface SampleImageModalProps {
  show: boolean;
  onClose: () => void;
}

const SampleImageModal = ({ show, onClose }: SampleImageModalProps) => {
  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:sm:max-w-3xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={onClose}>
        <div>
          <h3 className="tw:text-base tw:font-semibold tw:text-slate-800">
            Sample Banners
          </h3>
          <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
            Reference examples of how banners look. Download to use as a guide.
          </p>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:gap-3 tw:py-1">
          {SAMPLE_BANNER_ASSET_IDS.map((assetId) => (
            <div
              key={assetId}
              className="tw:group tw:relative tw:rounded-lg tw:overflow-hidden tw:border tw:border-slate-200"
            >
              <ImgRender
                assetId={assetId}
                width={300}
                height={150}
                alt="Sample banner"
                className="tw:w-full tw:h-28 tw:object-cover"
              />
              <button
                type="button"
                onClick={() => CommonService.assetDownload(assetId)}
                title="Download"
                className="tw:absolute tw:top-1.5 tw:right-1.5 tw:bg-white/90 tw:text-slate-700 tw:rounded-full tw:p-1.5 tw:shadow tw:hover:bg-white tw:hover:text-blue-600 tw:transition-colors"
              >
                <Download size={15} />
              </button>
            </div>
          ))}
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:justify-end">
        <AppButton fill="outline" color="secondary" onClick={onClose}>
          Close
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SampleImageModal;
