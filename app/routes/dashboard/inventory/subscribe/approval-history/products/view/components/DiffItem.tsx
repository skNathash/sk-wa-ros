import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";

// Updated to support image preview functionality

type Props = {
  label: string;
  originalData: any;
  updatedData: any;
  type: string;
  onImageClick?: (images: any[]) => void;
};

const isDataEqual = (data1: any, data2: any, type: string) => {
  if (type === "image") {
    return (
      Array.isArray(data1) &&
      Array.isArray(data2) &&
      data1?.join(",") === data2?.join(",")
    );
  }
  return data1 === data2;
};

const DiffItem = ({
  label,
  originalData,
  updatedData,
  type,
  onImageClick,
}: Props) => {
  const renderData = (data: any) => {
    if (type === "image") {
      return (
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {Array.isArray(data) &&
            data?.map((item: any) => (
              <div
                key={item}
                className="tw:cursor-pointer tw:rounded-md tw:border-2 tw:border-gray-200 hover:tw:border-blue-400 tw:transition-colors"
                onClick={() => onImageClick?.(data)}
              >
                <ImgRender
                  assetId={item}
                  className="tw:w-20 tw:h-20 tw:object-cover tw:rounded-md"
                />
              </div>
            ))}
        </div>
      );
    }
    if (type === "amount") {
      return <Amount value={data} />;
    }

    if (type === "boolean") {
      return (
        <AppBadge variant={data ? "success" : "default"}>
          {data ? "Yes" : "No"}
        </AppBadge>
      );
    }

    return data;
  };

  let bgColor = isDataEqual(originalData, updatedData, type)
    ? "tw:bg-gray-100/50"
    : "tw:bg-yellow-100/50";

  return (
    <div className={`${bgColor} tw:p-4 tw:rounded-md tw:mb-2`}>
      <div className="tw:text-sm tw:font-semibold tw:mb-2">{label}</div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <div>
          <div className="tw:text-xs tw:text-gray-600 tw:font-semibold tw:mb-1.5">
            ORIGINAL
          </div>
          <div className="tw:text-sm tw:text-slate-600">
            {renderData(originalData)}
          </div>
        </div>

        <div className="tw:md:border-l tw:md:pl-4">
          <div className="tw:text-xs tw:text-blue-600 tw:font-semibold tw:mb-1.5">
            FINAL
          </div>
          <div className="tw:text-sm tw:text-slate-600 tw:font-semibold">
            {renderData(updatedData)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffItem;
