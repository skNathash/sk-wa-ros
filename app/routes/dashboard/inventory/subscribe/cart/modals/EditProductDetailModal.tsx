import { Copy, Edit2, Plus, Search, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
// Removed consumer offer UI per requirement
import { useTranslation } from "react-i18next";
import InpLabel from "~/components/core/form/InpLabel";
import ImgRender from "~/components/core/img/ImgRender";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import ProductService from "~/services/ProductService";
import UomPriceService from "~/services/UomPriceService";
import Amount from "~/components/core/amount/Amount";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import ChooseBarcode from "../components/ChooseBarcode";
import B2cPriceConfig, {
  DEFAULT_B2C_PRICE_CONFIG,
} from "../components/B2cPriceConfig";
import type { B2cPriceConfigValue } from "../components/B2cPriceConfig";
import { clone } from "../helper";

type EditProductDetailModalProps = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  product?: any;
  mode?: "edit" | "add" | "clone";
  cartId: string;
  unitOptions?: { label: string; value: string }[];
};

export const uomOptions = InventorySubscribeService.getUomOptions();

type EditProductFormValues = {
  name: string;
  brand?: any[];
  newBrand?: string;
  images?: any[];
  description?: string;
  mrp?: number | string;
  purchasePrice?: number | string;
  quantity?: number | string;
  uom?: string;
  hsn?: string;
  gst?: number | string;
  barcode?: string;
  isConsumerOffer?: boolean;
  consumerOfferData?: any;
  consumerOfferPrice?: number | string;
  b2cPriceConfig?: B2cPriceConfigValue;
};

const DEFAULT_VALUES: EditProductFormValues = {
  name: "",
  brand: [],
  newBrand: "",
  images: [],
  description: "",
  mrp: "",
  purchasePrice: "",
  quantity: "",
  uom: "",
  hsn: "",
  gst: "",
  barcode: "",
  isConsumerOffer: false,
  consumerOfferData: undefined,
  consumerOfferPrice: "",
  b2cPriceConfig: DEFAULT_B2C_PRICE_CONFIG,
};

const validateForm = (values: EditProductFormValues, isCloned?: boolean) => {
  let msg = "";
  if (isCloned && !values.name?.trim()) {
    msg = "Name is required";
  } else if (isCloned && !values.brand?.length && !values.newBrand?.trim()) {
    msg = "Brand is required";
  } else if (!values.uom) {
    msg = "UOM is required";
  } else if (!values.mrp) {
    msg = "MRP is required";
  } else if (!values.purchasePrice) {
    msg = "Purchase price is required";
  } else if (Number(values.purchasePrice) > Number(values.mrp)) {
    msg = "Purchase price cannot be greater than MRP";
  } else if (Number(values.mrp) < Number(values.purchasePrice)) {
    msg = "MRP cannot be less than purchase price";
  }
  return { msg };
};

export default function EditProductDetailModal({
  show,
  callback,
  product,
  mode = "edit",
  cartId,
  unitOptions,
}: EditProductDetailModalProps) {
  const appToast = useAppToast();
  const { t } = useTranslation();

  const isMasterLogin = AuthService.isMasterLogin();

  const { register, handleSubmit, control, setValue, getValues, reset } =
    useForm<EditProductFormValues>({
      defaultValues: DEFAULT_VALUES,
    });

  const [showBarcodeOption, setShowBarcodeOption] = useState(false);
  const [addNewBrand, setAddNewBrand] = useState(false);
  const [fetchedUnitOptions, setFetchedUnitOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const prevUomRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const fetchUoms = async () => {
      try {
        const response = await CommonService.getUomMasters({
          filter: { isPackType: false },
        });
        const list = response?.data?.data || [];
        if (cancelled) return;
        setFetchedUnitOptions(
          list
            .filter((item: any) => String(item.name).toLowerCase() !== "kg")
            .map((item: any) => ({ label: item.name, value: item.name })),
        );
      } catch (e) {
        // ignore
      }
    };
    fetchUoms();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedUnitOptions =
    unitOptions && unitOptions.length > 0
      ? unitOptions.filter((o) => String(o.value).toLowerCase() !== "kg")
      : fetchedUnitOptions.length > 0
        ? fetchedUnitOptions
        : uomOptions;

  const [
    brand,
    images,
    barcode,
    uomWatch,
    mrpWatch,
    purchasePriceWatch,
    quantityWatch,
  ] = useWatch({
    control,
    name: [
      "brand",
      "images",
      "barcode",
      "uom",
      "mrp",
      "purchasePrice",
      "quantity",
    ],
  });

  useEffect(() => {
    if (show) {
      setShowBarcodeOption(product?.showbarcodeOption);
      prevUomRef.current = product?.unitType;
    }
  }, [product, show]);

  useEffect(() => {
    if (!show) return;
    const prev = prevUomRef.current;
    if (prev === uomWatch) return;
    if (
      UomPriceService.isSmallUom(prev) !== UomPriceService.isSmallUom(uomWatch)
    ) {
      setValue("mrp", "");
      setValue("purchasePrice", "");
      setValue("consumerOfferPrice", "");
    }
    prevUomRef.current = uomWatch;
  }, [uomWatch, show, setValue]);

  useEffect(() => {
    if (show) {
      const hasNewBrand = !!product?.newBrand?.trim?.();
      const hasBrand = !!product?.brand?.brandId && !hasNewBrand;

      // If product has newBrand, prioritize it and show the new brand input by default
      setAddNewBrand(hasNewBrand);

      reset({
        ...DEFAULT_VALUES,
        name: product?.isCloned
          ? product?.dealName || product?.name
          : product?.name,
        brand: hasBrand
          ? [
              {
                label: product?.brand?.name,
                value: {
                  id: product?.brand?.brandId,
                  name: product?.brand?.name,
                  objId: product?.brand?.id,
                },
              },
            ]
          : [],
        newBrand: hasNewBrand ? product?.newBrand || "" : "",
        uom: product?.unitType,
        hsn: product?.hsnNumber || product?.hsn,
        gst: product?.gst,
        mrp: UomPriceService.toDisplayPrice(product?.mrp, product?.unitType),
        purchasePrice: UomPriceService.toDisplayPrice(
          product?.price,
          product?.unitType,
        ),
        quantity: product?.quantity || "",
        description: product?.description,
        images: product?.images?.map((image: any) => ({ id: image })),
        barcode: product?.barcode,
        isConsumerOffer: product?.isConsumerOffer || false,
        consumerOfferData: product?.consumerOfferData,
        consumerOfferPrice: UomPriceService.toDisplayPrice(
          product?.consumerOfferPrice,
          product?.unitType,
        ),
        b2cPriceConfig: product?.b2cPriceConfig || DEFAULT_B2C_PRICE_CONFIG,
      });
    }
  }, [show, reset, product]);

  const onClose = () => callback({ action: "close" });

  const [isSaving, setIsSaving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const onSubmit = async () => {
    const values = getValues();
    const { msg } = validateForm(values, product?.isCloned);
    if (msg) {
      appToast.show({ msg, color: "error" });
      return;
    }

    const brand = values?.brand?.[0]?.value;

    // Build payload similar to bulk subscription structure
    const payload: Record<string, any> = {
      name: values.name,
      quantity: values?.quantity
        ? Number(values.quantity)
        : product?.quantity || 0,
      mrp: Number(UomPriceService.toApiPrice(values.mrp, values.uom)),
      price: Number(
        UomPriceService.toApiPrice(values.purchasePrice, values.uom),
      ),
      images: values?.images?.map((image: any) => image?.id) || [],
      barcodes: values?.barcode ? [values.barcode] : [],
    };

    // Persist B2C price config so it survives a page reload (getCart reads it
    // back). Not applicable to cloned items, which have no B2C config UI.
    // Fixed price and discount are mutually exclusive — zero out the unused one.
    if (!product?.isCloned) {
      const cfg = values.b2cPriceConfig;
      const isFixedPrice = !!cfg?.isFixedPrice;
      const fixedPrice = Number(cfg?.fixedPrice) || 0;
      const discount = Number(cfg?.discount) || 0;
      if (isFixedPrice && fixedPrice > 0) {
        payload.b2cPriceConfig = { isFixedPrice: true, fixedPrice, discount: 0 };
      } else if (!isFixedPrice && discount > 0) {
        payload.b2cPriceConfig = { isFixedPrice: false, fixedPrice: 0, discount };
      } else {
        payload.b2cPriceConfig = {
          isFixedPrice: false,
          fixedPrice: 0,
          discount: 0,
        };
      }
    }

    // Include optional fields where relevant
    if (values?.uom) payload.unitType = values.uom;
    if (values?.description) payload.description = values.description;
    if (values?.hsn) payload.hsnNumber = values.hsn;
    if (values?.gst !== undefined && values?.gst !== "")
      payload.gst = Number(values.gst);
    if (values?.isConsumerOffer !== undefined)
      payload.isConsumerOffer = values.isConsumerOffer;
    if (values?.isConsumerOffer) {
      if (values?.consumerOfferData)
        payload.consumerOfferData = values.consumerOfferData;
      if (
        values?.consumerOfferPrice !== undefined &&
        values?.consumerOfferPrice !== ""
      )
        payload.consumerOfferPrice = Number(
          UomPriceService.toApiPrice(values.consumerOfferPrice, values.uom),
        );
    }

    if (values?.newBrand) {
      // Fetch generic brand details for the new brand
      try {
        const brandResponse = await ProductService.getBrands({
          filter: { name: "Generic_Brand" },
          page: 1,
          count: 1,
        });

        if (
          brandResponse.statusCode === 200 &&
          brandResponse.data?.data?.length > 0
        ) {
          const genericBrand = brandResponse.data.data[0];
          payload.brand = {
            id: genericBrand.id,
            name: genericBrand.name,
            brandId: genericBrand._id,
          };
          // Keep newBrand in payload along with generic brand details
          payload.newBrand = values.newBrand;
        } else {
          // No generic brand found, use newBrand as is
          payload.newBrand = values.newBrand;
          delete payload.brand;
        }
      } catch (error) {
        console.error("Error fetching generic brand:", error);
        // Fallback to using newBrand if API call fails
        payload.newBrand = values.newBrand;
        delete payload.brand;
      }
    } else if (brand) {
      payload.brand = {
        id: brand?.objId,
        name: brand?.name,
        brandId: brand?.id,
      };
      // Ensure newBrand is cleared when brand object exists
      delete payload.newBrand;
    }

    try {
      setIsSaving(true);
      const itemId = product?.itemId;
      if (!cartId || !itemId) {
        throw new Error("Missing cartId or itemId");
      }
      const response = await InventorySubscribeService.updateCartItem(
        cartId,
        itemId,
        payload,
      );

      if (response.statusCode === 200) {
        appToast.show({ msg: "Product updated", color: "success" });
        callback({
          action: "submit",
          data: {
            ...values,
            showbarcodeOption: showBarcodeOption,
            brand:
              payload.brand ||
              (brand
                ? { id: brand?.objId, name: brand?.name, brandId: brand?.id }
                : undefined),
            newBrand: payload.newBrand || (!brand ? values?.newBrand : ""),
            images: values?.images?.map((image: any) => image?.id),
            unitType: values?.uom,
            price: Number(
              UomPriceService.toApiPrice(values.purchasePrice, values.uom),
            ),
            mrp: Number(UomPriceService.toApiPrice(values.mrp, values.uom)),
            quantity: values?.quantity
              ? Number(values.quantity)
              : product?.quantity || 0,
            barcode: values?.barcode,
            isConsumerOffer:
              product?.isConsumerOffer || payload?.isConsumerOffer || false,
            consumerOfferData:
              product?.consumerOfferData || payload?.consumerOfferData,
            consumerOfferPrice:
              product?.consumerOfferPrice || payload?.consumerOfferPrice,
            b2cPriceConfig: product?.isCloned
              ? product?.b2cPriceConfig
              : values.b2cPriceConfig,
          },
        });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to update product",
          color: "danger",
        });
      }
    } catch (error: any) {
      appToast.show({
        msg: error?.message || "Failed to update product",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrandSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brand", [item]);
      setValue("newBrand", "");
    } else {
      setValue("brand", []);
    }
  };

  const toggleAddNewBrand = () => {
    setAddNewBrand((prev) => !prev);
    if (!addNewBrand) {
      // switching to add new brand
      setValue("brand", []);
    } else {
      // switching back to search
      setValue("newBrand", "");
    }
  };

  const handleImageUpload = (data: any) => {
    const images = getValues("images");
    if (data && data._id) {
      setValue("images", [...(images || []), { id: data._id }]);
    }
  };

  const handleMrpChange = () => {
    const mrp = Number(getValues("mrp"));
    const purchasePrice = Number(getValues("purchasePrice"));

    if (mrp < 0) {
      setValue("mrp", 0);
    } else if (purchasePrice > 0 && mrp < purchasePrice) {
      // If MRP is less than purchase price, update purchase price to match MRP
      setValue("purchasePrice", mrp);
    }

    // Keep the fixed B2C selling price within the (new) MRP. Discount mode
    // needs no change — its final price is derived live from MRP.
    const uom = getValues("uom");
    const apiMrp =
      Number(UomPriceService.toApiPrice(getValues("mrp"), uom)) || 0;
    const cfg = getValues("b2cPriceConfig");
    if (cfg?.isFixedPrice && apiMrp > 0 && Number(cfg.fixedPrice) > apiMrp) {
      setValue("b2cPriceConfig", { ...cfg, fixedPrice: apiMrp });
    }
  };

  const handlePurchasePriceChange = () => {
    const mrp = Number(getValues("mrp"));
    const purchasePrice = Number(getValues("purchasePrice"));
    if (purchasePrice < 0) {
      setValue("purchasePrice", 0);
    }

    if (purchasePrice > mrp) {
      setValue("purchasePrice", mrp);
    }
  };

  const handleRemoveImage = (index: number) => {
    const images = getValues("images");
    images?.splice(index, 1);
    setValue("images", images);
  };

  const handleBarcodeChange = (params: { action: string; data?: any }) => {
    if (params.action === "addBarcode") {
      setShowBarcodeOption(false);
    } else if (params.action === "cancelBarcode") {
      setShowBarcodeOption(true);
    } else if (params.action === "markAsLocal") {
      setValue("barcode", params.data?.barcode || "");
      callback({
        action: "markAsLocal",
        data: {
          barcode: params.data?.barcode,
          itemId: product?.itemId,
        },
      });
      return;
    }
    const barcode = (params.data?.value ?? "").replace(/[^a-zA-Z0-9]/g, "");
    setValue("barcode", barcode);
  };

  const handleCreateOffer = () => {
    const values = getValues();
    // Prepare product data for offer modal
    const productData = {
      name: product?.isCloned
        ? product?.dealName || product?.name || values.name
        : product?.name || values.name,
      dealId: product?.dealId,
      itemId: product?.itemId,
      mrp:
        Number(UomPriceService.toApiPrice(values.mrp, values.uom)) ||
        product?.mrp,
      price:
        Number(UomPriceService.toApiPrice(values.purchasePrice, values.uom)) ||
        product?.price,
      unitType: values.uom || product?.unitType,
      hsn: values.hsn || product?.hsnNumber || product?.hsn,
      gst:
        values.gst !== undefined && values.gst !== ""
          ? Number(values.gst)
          : product?.gst,
      description: values.description || product?.description,
      brand: product?.brand,
      category: product?.category,
      isConsumerOffer: product?.isConsumerOffer || false,
      consumerOfferData: product?.consumerOfferData,
      consumerOfferPrice: product?.consumerOfferPrice,
    };

    callback({
      action: "createOffer",
      data: productData,
    });
  };

  const handleCloneProduct = async () => {
    if (!product) {
      return;
    }

    const values = getValues();

    const selectedBrandValue = values?.brand?.[0]?.value;
    const brandPayload = selectedBrandValue
      ? {
          id: selectedBrandValue?.objId,
          name: selectedBrandValue?.name,
          brandId: selectedBrandValue?.id,
        }
      : product?.brand;

    const gstValue =
      values.gst !== undefined && values.gst !== ""
        ? Number(values.gst)
        : (product?.gst ?? "");

    const cloneUom = values.uom || product?.unitType || "unit";
    const cloneMrpDisplay = values.mrp || product?.mrp || 0;
    const clonePriceDisplay = values.purchasePrice || product?.price || 0;
    const clonePayload = {
      name: "",
      dealName: "",
      quantity: 0,
      clonedFrom: product?.dealId,
      mrp: Number(UomPriceService.toApiPrice(cloneMrpDisplay, cloneUom)),
      price: Number(UomPriceService.toApiPrice(clonePriceDisplay, cloneUom)),
      unitType: cloneUom,
      hsn: values.hsn || product?.hsnNumber || product?.hsn || "",
      gst: gstValue,
      description: values.description || product?.description || "",
    };

    try {
      setIsCloning(true);
      const result = await clone(clonePayload);
      if (result.status === "success" && result.data) {
        const imagesFromForm = values?.images?.length
          ? values.images.map((image: any) => image.id)
          : product?.images || [];

        const clonedItem = {
          ...product,
          name: product?.name || "",
          dealName: "",
          quantity: 0,
          price: clonePayload.price,
          originalPrice: clonePayload.price,
          totalPrice: 0,
          unitType: clonePayload.unitType,
          barcode: product?.barcode || "",
          barcodeOptions: product?.barcodeOptions || [],
          showbarcodeOption:
            (product?.barcodeOptions?.length || 0) > 0 ? true : false,
          isCloned: true,
          clonedFrom: result.data?.clonedFrom || clonePayload.clonedFrom,
          itemId: result.data?.itemId,
          images: imagesFromForm,
          duplicateItemAnimate: true,
          isConsumerOffer: false,
          consumerOfferData: undefined,
          consumerOfferPrice: undefined,
          brand: brandPayload,
          newBrand: values.newBrand || product?.newBrand || "",
          hsn: clonePayload.hsn,
          gst: gstValue === "" ? undefined : Number(gstValue),
          description: clonePayload.description,
        };

        appToast.show({ msg: result.msg, color: "success" });
        callback({
          action: "clone",
          data: { clonedItem },
        });
      } else {
        appToast.show({
          msg: result.msg || "Failed to duplicate product",
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: "Failed to duplicate product",
        color: "danger",
      });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <AppModal
      show={show}
      callback={onClose}
      backdropDismiss={false}
      className="tw:max-h-[95vh] tw:max-w-xl!"
    >
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2 tw:font-semibold">
          <Edit2 />
          <div>
            {mode === "clone" ? "Duplicate Product" : "Edit Product Details"}
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[95vh]">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Consumer offer UI intentionally hidden in this modal as per requirement */}

          {/* Display section for non-cloned products */}
          {!product?.isCloned && (
            <div className="tw:flex tw:gap-4 tw:mb-6 tw:pb-4 tw:border-b tw:border-gray-200">
              {/* Image Section */}
              <div className="tw:flex-shrink-0">
                <div className="tw:relative tw:w-20 tw:h-20 tw:bg-gray-50 tw:rounded-md tw:flex tw:items-center tw:justify-center tw:overflow-hidden">
                  <ImgRender
                    assetId={
                      product?.images && product.images.length > 0
                        ? product.images[0]
                        : undefined
                    }
                    alt={product?.name || ""}
                    className="tw:w-full tw:h-full tw:object-contain"
                  />
                </div>
              </div>

              {/* Product Details Section */}
              <div className="tw:flex-1">
                {/* Deal Name / Product Name */}
                <div className="tw:mb-2">
                  <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:mb-1 tw:flex tw:items-center tw:gap-2">
                    <span>{product?.name || ""}</span>
                    {product?.isLocalDeal && (
                      <span className="tw:text-[10px] tw:font-medium tw:bg-emerald-600/90 tw:text-white tw:px-1.5 tw:py-0.5 tw:rounded">
                        Local
                      </span>
                    )}
                  </div>
                </div>

                {/* HSN and GST */}
                <div className="tw:flex tw:items-center tw:gap-4">
                  <div className="tw:text-sm tw:text-gray-800">
                    <span className="tw:font-medium">HSN:</span>{" "}
                    <span>{product?.hsnNumber || product?.hsn || "--"}</span>
                  </div>
                  <div className="tw:text-sm tw:text-gray-800">
                    <span className="tw:font-medium">GST:</span>{" "}
                    <span>
                      {product?.gst !== undefined && product?.gst !== null
                        ? `${product.gst}%`
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Name input - only show for cloned products */}
          {product?.isCloned && (
            <div className="tw:mb-4">
              <AppInput
                name="name"
                label="Name"
                placeholder="Enter product name"
                register={register}
                isRequired
                maxLength={200}
              />
            </div>
          )}

          {/* Brand input - only show for cloned products */}
          {product?.isCloned && (
            <div className="tw:mb-4">
              {addNewBrand ? (
                <>
                  <AppInput
                    name="newBrand"
                    label="Add New Brand"
                    placeholder="Enter brand name"
                    register={register}
                    className="tw:w-full"
                    maxLength={100}
                  />
                  <button
                    className="tw:text-xs tw:text-gray-500 tw:underline tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1"
                    onClick={toggleAddNewBrand}
                    type="button"
                  >
                    <Search size={14} />
                    Search All Brands
                  </button>
                </>
              ) : (
                <>
                  <BrandSearchInput
                    feature="inventory-subscribe"
                    label="Brand"
                    placeholder="Search brand"
                    values={brand}
                    callback={handleBrandSelect}
                    className="tw:w-full"
                    size="sm"
                    isRequired
                  />
                  <button
                    className="tw:text-xs tw:text-gray-500 tw:underline tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1"
                    onClick={toggleAddNewBrand}
                    type="button"
                  >
                    <Plus size={14} />
                    Add New Brand
                  </button>
                </>
              )}
            </div>
          )}

          {/* Grid view: mrp, purchase price, store stock, uom, barcode, hsn, gst */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-3 tw:mb-4">
            <div className="tw:flex tw:flex-col">
              <AppInput
                register={register}
                name="mrp"
                label="MRP"
                type="number"
                isRequired
                placeholder="Enter MRP"
                onChange={handleMrpChange}
              />
              {uomWatch && (
                <div className="tw:text-[9px] tw:text-gray-500 tw:mt-0.5 tw:leading-tight">
                  {UomPriceService.isSmallUom(uomWatch) ? (
                    <>
                      <div>
                        Enter MRP per 1{" "}
                        {UomPriceService.getDisplayUom(uomWatch)}
                      </div>
                      <div>
                        ={" "}
                        <Amount
                          value={UomPriceService.toBaseUnitPrice(
                            UomPriceService.toApiPrice(mrpWatch, uomWatch),
                          )}
                          decimalPlaces={3}
                        />{" "}
                        / {uomWatch}
                      </div>
                    </>
                  ) : (
                    <>per {UomPriceService.getDisplayUom(uomWatch)}</>
                  )}
                </div>
              )}
            </div>

            <div className="tw:flex tw:flex-col">
              <AppInput
                disabled={isMasterLogin}
                readOnly={isMasterLogin}
                register={register}
                name="purchasePrice"
                label="Purchase Price"
                type="number"
                isRequired
                placeholder="Enter purchase price"
                onChange={handlePurchasePriceChange}
              />
              {uomWatch && (
                <div className="tw:text-[9px] tw:text-gray-500 tw:mt-0.5 tw:leading-tight">
                  {UomPriceService.isSmallUom(uomWatch) ? (
                    <>
                      <div>
                        Enter price per 1{" "}
                        {UomPriceService.getDisplayUom(uomWatch)}
                      </div>
                      <div>
                        ={" "}
                        <Amount
                          value={UomPriceService.toBaseUnitPrice(
                            UomPriceService.toApiPrice(
                              purchasePriceWatch,
                              uomWatch,
                            ),
                          )}
                          decimalPlaces={3}
                        />{" "}
                        / {uomWatch}
                      </div>
                    </>
                  ) : (
                    <>per {UomPriceService.getDisplayUom(uomWatch)}</>
                  )}
                </div>
              )}
            </div>

            {!product?.isCloned && (
              <div>
                <AppInput
                  register={register}
                  name="quantity"
                  label="Store Stock"
                  type="number"
                  placeholder="Enter store stock"
                />
                {uomWatch && UomPriceService.isSmallUom(uomWatch) && (
                  <div className="tw:text-[9px] tw:text-gray-500 tw:mt-0.5 tw:leading-tight">
                    <div>
                      Enter qty in {UomPriceService.getDisplayUom(uomWatch)}
                    </div>
                    <div>
                      ={" "}
                      {UomPriceService.toApiQuantity(quantityWatch, uomWatch) ||
                        0}{" "}
                      {uomWatch}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Controller
              name="uom"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label="UOM"
                  placeholder="e.g. pcs, gm"
                  options={resolvedUnitOptions}
                  value={field.value}
                  onChange={field.onChange}
                  inputClassName="tw:w-full"
                  isRequired={true}
                />
              )}
            />

            <div className="tw:col-span-2 tw:pb-5">
              <InpLabel>Barcode</InpLabel>
              <ChooseBarcode
                barcode={barcode || ""}
                barcodeOptions={product?.barcodeOptions || []}
                showbarcodeOption={showBarcodeOption}
                dealId={
                  product?.isCloned
                    ? undefined
                    : product?.dealId || product?._id
                }
                uom={product?.unitType}
                callback={handleBarcodeChange}
                useSubscribeBtn={false}
              />
            </div>

            {/* HSN and GST - only show for cloned products */}
            {product?.isCloned && (
              <>
                <AppInput
                  name="hsn"
                  label="HSN"
                  placeholder="HSN code"
                  register={register}
                  maxLength={8}
                />

                <AppInput
                  name="gst"
                  label="GST %"
                  type="number"
                  placeholder="0-100"
                  register={register}
                />
              </>
            )}
          </div>

          {/* B2C selling price configuration — hidden for duplicate items */}
          {!product?.isCloned && (
            <div className="tw:mb-4 tw:border-t tw:border-gray-200 tw:pt-4">
              <InpLabel>B2C Price</InpLabel>
              <div className="tw:max-w-[200px]">
                <Controller
                  name="b2cPriceConfig"
                  control={control}
                  render={({ field }) => (
                    <B2cPriceConfig
                      config={field.value}
                      mrp={
                        Number(
                          UomPriceService.toApiPrice(mrpWatch, uomWatch),
                        ) || 0
                      }
                      unitType={uomWatch}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Description input - only show for non-cloned products */}
          {product?.isCloned && (
            <div className="tw:mb-4">
              <AppTextarea
                name="description"
                label="Description"
                placeholder="Enter description"
                register={register}
                rows={5}
                maxLength={800}
              />
              <div className="tw:text-xs tw:text-gray-500">
                Max 800 characters
              </div>
            </div>
          )}
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:flex-wrap tw:justify-between tw:gap-3 tw:w-full tw:items-center">
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {!product?.isCloned && (
              <>
                {/* <AppButton
                  color="success"
                  onClick={handleCreateOffer}
                  type="button"
                >
                  <Plus size={16} />
                  {t("consumerOffer.create")}
                </AppButton> */}
                <AppButton
                  fill="outline"
                  color="light"
                  onClick={handleCloneProduct}
                  type="button"
                  isLoading={isCloning}
                  disabled={isSaving}
                >
                  <Copy size={16} />
                  {t("clone")}
                </AppButton>
              </>
            )}
          </div>
          <div className="tw:flex tw:gap-x-3">
            <AppButton
              color="primary"
              type="submit"
              onClick={onSubmit}
              isLoading={isSaving}
            >
              Save
            </AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
}
