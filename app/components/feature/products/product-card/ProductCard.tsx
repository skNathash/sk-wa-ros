import useAppNav from "~/hooks/useAppNav";
import ProductCardOne from "./ProductCardOne";
import ProductCardTwo from "./ProductCardTwo";
import type { BuyCartType } from "~/types/CommonTypes";

type Props = {
  data: any;
  callback?: (a: { action: string; data?: any }) => void;
  type?: number;
  bgStyle?: any;
  imgBgStyle?: any;
  noSave?: boolean;
  cartType?: BuyCartType;
  useBusyLoader?: boolean;
  hideAddToCart?: boolean;
  /**
   * Paint the image area with a `TintTile` instead of the plain `imgBgStyle`
   * plate. `true` picks a tone off the brand so every SKU of a brand shares one
   * colour, a number pins a tone, `-1` uses the theme tint.
   */
  tint?: boolean | number;
};

const ProductCard = ({
  data,
  callback,
  type = 1,
  bgStyle = {},
  imgBgStyle = {},
  noSave = false,
  cartType,
  useBusyLoader = false,
  hideAddToCart = false,
  tint = false,
}: Props) => {
  const appNav = useAppNav();

  const onCardCb = (e: any) => {
    if (e.action == "click") {
      // GAService.viewItem({
      //   id: data._id,
      //   name: data.name,
      //   mrp: data.mrp,
      // });
      if (callback) {
        callback({ action: "click", data: { deal: data } });
        return;
      }
    }

    if (callback) {
      const t = { ...e };
      delete t.action;
      callback({ action: e.action, data: { ...t } });
    }

    if (e.action == "link") {
      appNav.to(e.data.path, e.data.params || {});
      return;
    }

    if (e.action == "brand") {
      appNav.to("/products/sk", {
        brandIds: e.data.brand?._id,
        brandNames: e.data.brand?.name,
      });
      return;
    }
  };

  return (
    <>
      {type == 1 ? (
        <ProductCardOne
          imgBgStyle={imgBgStyle}
          data={data}
          callback={onCardCb}
          cartType={cartType}
          useBusyLoader={useBusyLoader}
          hideAddToCart={hideAddToCart}
          tint={tint}
        />
      ) : null}
      {type == 2 ? (
        <ProductCardTwo
          imgBgStyle={imgBgStyle}
          bgStyle={bgStyle}
          data={data}
          callback={onCardCb}
          cartType={cartType}
          useBusyLoader={useBusyLoader}
          tint={tint}
        />
      ) : null}
    </>
  );
};

export default ProductCard;
