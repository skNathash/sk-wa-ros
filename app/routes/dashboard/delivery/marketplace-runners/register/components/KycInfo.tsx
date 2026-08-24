import { useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import PhotoUploadCard from "./PhotoUploadCard";

/**
 * Step three — the runner's photo and their Aadhaar. The whole step is
 * optional, but an Aadhaar number pulls both card faces in with it
 * (see `validateKyc`).
 */
const KycInfo = () => {
  const { register, control } = useFormContext();
  const aadhaarNo = useWatch({ control, name: "aadhaarNo" });

  return (
    <>
      <AppCard title="Runner photo" icon="camera">
        <PhotoUploadCard
          field="photo"
          label="Upload photo"
          note="Max size 5MB — jpg, jpeg or png"
        />
      </AppCard>

      <AppCard title="Aadhaar" icon="credit-card" className="tw:mt-4">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          <AppInput
            label="Aadhaar number"
            name="aadhaarNo"
            register={register}
            placeholder="12-digit Aadhaar number"
            size="sm"
            maxLength={12}
          />
        </div>

        {/* Both faces only matter once a number has been typed — until then
            there is nothing for the scans to back up. */}
        {aadhaarNo?.trim() ? (
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-4">
            <div>
              <div className="tw:text-xs tw:font-medium tw:mb-2">Front</div>
              <PhotoUploadCard
                field="aadhaarFront"
                label="Upload front"
                note="Max size 5MB — jpg, jpeg or png"
              />
            </div>

            <div>
              <div className="tw:text-xs tw:font-medium tw:mb-2">Back</div>
              <PhotoUploadCard
                field="aadhaarBack"
                label="Upload back"
                note="Max size 5MB — jpg, jpeg or png"
              />
            </div>
          </div>
        ) : null}
      </AppCard>
    </>
  );
};

export default KycInfo;
