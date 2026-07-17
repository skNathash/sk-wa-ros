import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import ProductService from "~/services/ProductService";

type Props = {
  brandId: string;
  callback: (a: { data: any }) => void;
};

const BrandBlk = ({ brandId = "", callback }: Props) => {
  const [details, setDetails] = useState<any>({});

  const init = useCallback(async () => {
    const r = await ProductService.getBrands(
      { filter: { _id: brandId } },
      { useOldApi: true },
    );
    setDetails(Array.isArray(r.data) && r.data.length > 0 ? r.data[0] : {});
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      init();
    }
  }, [brandId, init]);

  const viewBrand = () => {
    callback({
      data: {
        brandIds: details._id,
        brandNames: details.name,
      },
    });
  };

  if (!details._id) {
    return;
  }

  return (
    <div
      className="tw:mb-4 tw:flex tw:py-3 tw:items-center tw:cursor-pointer tw:mt-4"
      onClick={viewBrand}
    >
      <div className="tw:w-12 tw:h-12 tw:rounded-lg tw:border tw:border-gray-200 tw:overflow-hidden">
        <ImgRender assetId={details?.image[0]} />
      </div>
      <div className="tw:flex-1 tw:px-4">
        <div className="tw:text-sm tw:font-medium">{details.name}</div>
        <div className="tw:text-xs tw:text-green-600">Explore All Products</div>
      </div>
      <div>
        <ChevronRight className="tw:text-xl tw:mt-0.5" />
      </div>
    </div>
  );
};

export default BrandBlk;
