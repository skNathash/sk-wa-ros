import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";

type ProductDetailsProps = {
  onImageClick?: (images: any[]) => void;
  data: {
    productName?: string;
    brandName?: string;
    categoryName?: string;
    mrp?: number;
    price?: number;
    weight?: number;
    unitType?: string;
    barcode?: string;
    hsn?: string;
    gst?: number;
    description?: string;
    images?: string[];
    isConsumerOffer?: boolean;
    consumerOfferData?: string | null;
    consumerOfferPrice?: number | null;
  };
};

const ProductDetails = ({ data, onImageClick }: ProductDetailsProps) => {
  const renderData = (value: any, type: string = "text") => {
    if (type === "image") {
      return (
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {Array.isArray(value) && value.length > 0 ? (
            value.map((item: string) => (
              <div
                key={item}
                className="tw:cursor-pointer tw:rounded-md tw:border-2 tw:border-gray-200 hover:tw:border-blue-400 tw:transition-colors"
                onClick={() => onImageClick?.(value)}
              >
                <ImgRender
                  assetId={item}
                  className="tw:w-20 tw:h-20 tw:object-cover tw:rounded-md"
                />
              </div>
            ))
          ) : (
            <span className="tw:text-gray-500">No images</span>
          )}
        </div>
      );
    }
    if (type === "amount") {
      return <Amount value={value || 0} />;
    }

    if (type === "boolean") {
      return (
        <AppBadge variant={value ? "success" : "default"}>
          {value ? "Yes" : "No"}
        </AppBadge>
      );
    }

    return value || "--";
  };

  const isConsumerOfferEnabled = data.isConsumerOffer === true;

  const detailItems = [
    {
      label: "Product Name",
      value: data.productName,
      type: "text",
    },
    {
      label: "OFFER",
      value: data.isConsumerOffer,
      type: "boolean",
    },
    // Consumer offer title & price will be conditionally added below when enabled
    {
      label: "Brand",
      value: data.brandName,
      type: "text",
    },
    {
      label: "Category",
      value: data.categoryName,
      type: "text",
    },
    {
      label: "MRP",
      value: data.mrp,
      type: "text",
    },
    {
      label: "Price",
      value: data.price,
      type: "text",
    },
    {
      label: "Weight",
      value:
        data.weight !== undefined && data.weight !== null
          ? `${data.weight} ${data.unitType || ""}`
          : undefined,
      type: "text",
    },
    {
      label: "Unit Type",
      value: data.unitType,
      type: "text",
    },
    {
      label: "Barcode",
      value: data.barcode,
      type: "text",
    },
    {
      label: "HSN",
      value: data.hsn,
      type: "text",
    },
    {
      label: "GST %",
      value: typeof data.gst === "number" ? `${data.gst}%` : data.gst,
      type: "text",
    },
    {
      label: "Description",
      value: data.description,
      type: "text",
    },
    {
      label: "Images",
      value: data.images,
      type: "image",
    },
  ];

  if (isConsumerOfferEnabled) {
    detailItems.splice(2, 0, {
      label: "OFFER TITLE",
      value: data.consumerOfferData ?? "--",
      type: "text",
    });
  }

  return (
    <div className="tw:space-y-4">
      {detailItems.map((item) => (
        <div
          key={item.label}
          className="tw:bg-gray-50 tw:p-4 tw:rounded-md tw:border tw:border-gray-200"
        >
          <div className="tw:text-sm tw:font-semibold tw:mb-2 tw:text-gray-700">
            {item.label}
          </div>
          <div className="tw:text-sm tw:text-slate-600">
            {renderData(item.value, item.type)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductDetails;
