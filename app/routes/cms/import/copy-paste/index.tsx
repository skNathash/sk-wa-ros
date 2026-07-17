import AppCard from "~/components/core/card/AppCard";
import AppTextarea from "~/components/core/form/AppTextarea";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import { useForm } from "react-hook-form";
import { ClipboardPaste, Info } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

export default function CopyPasteImport() {
  const { register, handleSubmit, formState } = useForm();

  return (
    <AppCard
      className="tw:mt-8"
      title="Paste from Spreadsheet"
      subtitle="Copy data from a spreadsheet and paste it here. The first row must contain headers."
    >
      <div className="tw:mb-2">
        <div className="tw:text-lg tw:font-bold"></div>
        <div className="tw:text-gray-500 tw:text-sm"></div>
      </div>
      <InfoBlock className="tw:mb-4" variant="info" size="sm">
        <div className="tw:flex tw:gap-4">
          <div>
            <Info size={20} className="tw:text-blue-500" />
          </div>
          <div className="tw:flex-1">
            <div className="tw:font-semibold">Required Headers</div>
            <div className="tw:text-gray-700 tw:text-sm">
              Your data must include columns for:{" "}
              <b>name, sku, brand_id, category_id</b>. Other columns like{" "}
              <b>barcodes</b> (comma-separated if multiple), description,
              b2c_price, cost_price, stock_quantity etc., are optional.
            </div>
          </div>
        </div>
      </InfoBlock>
      <form>
        <AppTextarea
          name="importData"
          label="Paste Data"
          placeholder="Paste your tab-separated product data here..."
          rows={8}
          register={register}
        />
        <div className="tw:text-end tw:mt-4">
          <AppButton type="submit">
            <ClipboardPaste size={16} />
            Process Pasted Data
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
}
