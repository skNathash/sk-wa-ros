import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Swiper, SwiperOptions } from "swiper/types";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppSwiper from "~/components/core/swiper";
import { ALERT_DISMISS_TIME } from "~/constants";
import CartService from "~/services/CartService";
import useAppToast from "~/hooks/useAppToast";
import clsx from "clsx";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import PosService from "~/services/PosService";

type Props = {
  cartData: Array<any>;
  activeCartId: string;
  callback: (args: { action: string; data?: any }) => void;
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

const CartTabs = ({ cartData, activeCartId, callback }: Props) => {
  const appToast = useAppToast();

  const [busyLoader, setBusyLoader] = useState(false);

  const swiperRef = useRef<Swiper | null>(null);

  const [alertConfirm, setAlertConfirm] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.update();
    }
  }, [cartData]);

  const handleRemoveCart = async (
    cartId: string,
    index: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setAlertConfirm({
      show: true,
      title: `Remove Window - ${index + 1}`,
      description: "Are you sure you want to remove this cart?",
      onConfirm: async () => {
        setAlertConfirm({
          show: false,
          title: "",
          description: "",
          onConfirm: () => {},
          onCancel: () => {},
        });
        await new Promise((resolve) => setTimeout(resolve, ALERT_DISMISS_TIME));
        setBusyLoader(true);
        const response = await CartService.deleteMyCart(cartId);
        if (response.statusCode === 200) {
          callback({
            action: "removeCart",
            data: {
              cartId,
            },
          });
          appToast.show({
            msg: response.data?.message || "Cart removed successfully",
            color: "success",
          });
        } else {
          appToast.show({
            msg: response.data?.message || "Failed to remove cart",
            color: "danger",
          });
        }
        setBusyLoader(false);
      },
      onCancel: () => {
        setAlertConfirm({
          show: false,
          title: "",
          description: "",
          onConfirm: () => {},
          onCancel: () => {},
        });
      },
    });
  };

  const viewCart = (cartId: string) => {
    callback({
      action: "viewCart",
      data: {
        cartId,
      },
    });
  };

  const handleSwiperCallback = (data: {
    swiper: Swiper;
    action: "init" | "slideChange";
  }) => {
    if (data.action === "init") {
      swiperRef.current = data.swiper;
    }
  };

  const handleAddCart = async () => {
    setBusyLoader(true);
    const response = await PosService.createGuestCart({
      platform: "POS",
      cartType: "B2C",
    });
    if (response.statusCode === 200) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      callback({
        action: "addCart",
        data: {
          cartId: response.data?.data?.cartId,
        },
      });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to add cart",
        color: "danger",
      });
    }
    setBusyLoader(false);
  };

  return (
    <div className="tw:mb-2">
      <AppSwiper config={swiperConfig} callback={handleSwiperCallback}>
        {cartData.map((cart, index) => (
          <AppSwiper.Slide key={cart.cartId} isAutoWidth>
            <button
              className={clsx(
                "tw:px-3 tw:rounded-full tw:border tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-medium tw:py-1.5 tw:cursor-pointer tw:transition-colors",
                activeCartId === cart.cartId
                  ? "tw:bg-primary tw:text-white tw:border-primary"
                  : "tw:border-gray-300 tw:text-foreground tw:bg-card"
              )}
              onClick={() => viewCart(cart.cartId)}
            >
              Window - {index + 1}
              {cartData.length - 1 === index && index !== 0 && (
                <X
                  size={14}
                  onClick={(e) => handleRemoveCart(cart.cartId, index, e)}
                  className="tw:cursor-pointer"
                />
              )}
            </button>
          </AppSwiper.Slide>
        ))}
        {cartData.length <= 2 && (
          <AppSwiper.Slide isAutoWidth>
            <button
              className="tw:px-3 tw:rounded-full tw:border tw:border-dashed tw:border-primary/50 tw:text-primary tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:py-1.5 tw:cursor-pointer tw:transition-colors tw:hover:bg-primary/5"
              onClick={handleAddCart}
            >
              <Plus size={14} />
              ADD
            </button>
          </AppSwiper.Slide>
        )}
      </AppSwiper>

      <AppAlertDialog
        show={alertConfirm.show}
        title={alertConfirm.title}
        description={alertConfirm.description}
        onConfirm={alertConfirm.onConfirm}
        onCancel={alertConfirm.onCancel}
      />

      <BusyLoader show={busyLoader} />
    </div>
  );
};

export default CartTabs;
