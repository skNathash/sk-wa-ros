import clsx from "clsx";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppSwiper from "~/components/core/swiper";

type ProductVariantsProps = {
  variants: any[];
  currentDealId: string;
  viewVariant: (d: any) => void;
};

const variantSlideOption: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
  autoHeight: true,
};

const ProductVariants = ({
  variants,
  currentDealId,
  viewVariant,
}: ProductVariantsProps) => {
  if (!variants?.length) return null;

  return (
    <div className="tw:mb-4">
      {variants.map((x: any, k: number) => (
        <div key={k}>
          <div className="tw:mb-2 tw:text-xs tw:lg:text-sm tw:font-medium">
            Select {x.name}
          </div>
          <AppSwiper config={variantSlideOption}>
            {(x.values || []).map((e: any) => (
              <AppSwiper.Slide key={e._id} isAutoWidth={true}>
                <div
                  className="tw:bg-gradient-to-br tw:from-[#5790f2] tw:to-[#f4f4f4] tw:rounded-lg tw:border-app-gray-2 tw:border tw:overflow-hidden tw:cursor-pointer tw:h-full tw:min-w-20 tw:mb-1"
                  onClick={() => viewVariant(e)}
                >
                  {/* show discount */}

                  <div className="tw:py-0.5 tw:px-4">
                    <span className="tw:font-semibold tw:text-xs tw:text-white">
                      {e._deal?.discount ? (
                        <>{e._deal?.discount}% OFF</>
                      ) : (
                        <>&nbsp;</>
                      )}
                    </span>
                  </div>

                  <div
                    className={clsx(
                      "tw:rounded-t-lg tw:p-2 tw:flex tw:justify-center tw:w-full",
                      e._id == currentDealId
                        ? "tw:bg-[#eaf3ff]"
                        : "tw:bg-[#fafafa]",
                      !e._deal?.discount ? "" : ""
                    )}
                  >
                    <div className="w-full self-center">
                      <div className="tw:mb-1 tw:font-medium tw:text-xs">
                        {e.csa}
                      </div>
                      <div>
                        <span className="tw:text-sm tw:font-semibold tw:mr-1">
                          <Amount
                            value={e._deal?.roundPrice || e._deal?.price}
                            decimalPlaces={2}
                          />
                        </span>
                        {e._deal?.discount ? (
                          <>
                            <span className="tw:text-xs tw:text-app-gray-4 tw:me-0.5">
                              MRP
                            </span>
                            <span className="tw:text-xs tw:line-through">
                              <Amount value={e._deal?.mrp} decimalPlaces={2} />
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      ))}
    </div>
  );
};

export default ProductVariants;
