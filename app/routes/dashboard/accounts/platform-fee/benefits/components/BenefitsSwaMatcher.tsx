import React, { useState } from "react";
import { ArrowRight, Layers, Store } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";

interface BenefitsSwaMatcherProps {
  onCheckout?: () => void;
  onAskSwa?: () => void;
}

export default function BenefitsSwaMatcher({
  onCheckout,
  onAskSwa,
}: BenefitsSwaMatcherProps) {
  const appNav = useAppNav();
  const [stockValue, setStockValue] = useState<number>(3); // index for 8L
  const [billsValue, setBillsValue] = useState<number>(2); // index for 120

  const stockSteps = [
    { label: "₹50K", value: "₹50 K" },
    { label: "₹1 L", value: "₹1 L" },
    { label: "₹5 L", value: "₹5 L" },
    { label: "₹8 L", value: "₹8 L" },
    { label: "₹15 L", value: "₹15 L" },
    { label: "₹50 L", value: "₹50 L" },
  ];

  const billSteps = [
    { label: "5", value: 5, monthly: "150" },
    { label: "50", value: 50, monthly: "1,500" },
    { label: "120", value: 120, monthly: "3,600" },
    { label: "200", value: 200, monthly: "6,000" },
    { label: "400", value: 400, monthly: "12,000" },
  ];

  const currentStock = stockSteps[stockValue] || stockSteps[3];
  const currentBill = billSteps[billsValue] || billSteps[2];

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      appNav.to("/dashboard/accounts/platform-fee", {
        tab: "commission-invoices",
        subtab: "available-plans",
        skipBenefits: "true",
      });
    }
  };

  return (
    <div className="tw:space-y-4">
      {/* Section Header */}
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-end tw:justify-between tw:gap-2">
        <h2 className="tw:text-2xl tw:sm:text-3xl tw:font-serif tw:font-medium tw:text-[#182638]">
          Two sliders. <span className="tw:italic tw:font-normal">Your</span>{" "}
          match.
        </h2>
        <div className="tw:text-xs tw:font-semibold tw:tracking-widest tw:text-slate-400 tw:uppercase">
          TWO NUMBERS YOU ALREADY KNOW
        </div>
      </div>

      {/* Main Two Columns */}
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-12 tw:gap-4 tw:lg:gap-6">
        {/* Left Column: Interactive Inputs & Swa prompt */}
        <div className="tw:lg:col-span-6 tw:bg-white tw:border tw:border-slate-200/90 tw:rounded-3xl tw:p-4 tw:lg:p-8 tw:shadow-xs tw:flex tw:flex-col tw:justify-between tw:space-y-4 tw:lg:space-y-6">
          <div className="tw:space-y-4 tw:lg:space-y-6">
            <div>
              <h3 className="tw:text-lg tw:lg:text-3xl tw:font-serif tw:font-medium tw:text-[#182638]">
                Tell Swa about your shop.
              </h3>
              <p className="tw:hidden tw:lg:block tw:text-sm tw:text-slate-600 tw:mt-1">
                Two questions every shopkeeper knows the answer to by closing
                time.
              </p>
            </div>

            {/* Slider 1: Monthly Stock Purchase */}
            <div className="tw:space-y-2 tw:lg:space-y-3 tw:pt-0 tw:lg:pt-2">
              <div className="tw:flex tw:items-center tw:justify-between">
                <span className="tw:text-xs tw:font-bold tw:tracking-wider tw:text-slate-500 tw:uppercase">
                  MONTHLY STOCK PURCHASE
                </span>
                <span className="tw:bg-amber-100 tw:text-amber-800 tw:text-[10px] tw:font-bold tw:px-2.5 tw:py-0.5 tw:rounded-md tw:uppercase">
                  STOCK
                </span>
              </div>

              <div className="tw:flex tw:items-baseline tw:gap-2">
                <span className="tw:text-2xl tw:lg:text-4xl tw:font-serif tw:font-bold tw:text-[#B45309]">
                  {currentStock.value}
                </span>
                <span className="tw:text-xs tw:sm:text-sm tw:text-slate-500">
                  from vendors, last month
                </span>
              </div>

              {/* Slider Bar */}
              <div className="tw:pt-1 tw:lg:pt-2">
                <input
                  type="range"
                  min="0"
                  max={stockSteps.length - 1}
                  step="1"
                  value={stockValue}
                  onChange={(e) => setStockValue(Number(e.target.value))}
                  className="tw:w-full tw:h-2 tw:bg-amber-100 tw:rounded-lg tw:appearance-none tw:cursor-pointer tw:accent-[#B45309]"
                />
                <div className="tw:flex tw:justify-between tw:text-xs tw:text-slate-400 tw:pt-1.5 tw:font-medium">
                  <span>₹50K</span>
                  <span>₹1 L</span>
                  <span>₹5 L</span>
                  <span>₹15 L</span>
                  <span>₹50 L</span>
                </div>
              </div>
            </div>

            {/* Slider 2: Bills Per Day · Counter */}
            <div className="tw:space-y-2 tw:lg:space-y-3 tw:pt-0 tw:lg:pt-2">
              <div className="tw:flex tw:items-center tw:justify-between">
                <span className="tw:text-xs tw:font-bold tw:tracking-wider tw:text-slate-500 tw:uppercase">
                  BILLS PER DAY · COUNTER
                </span>
                <span className="tw:bg-blue-100 tw:text-blue-800 tw:text-[10px] tw:font-bold tw:px-2.5 tw:py-0.5 tw:rounded-md tw:uppercase">
                  SHOP
                </span>
              </div>

              <div className="tw:flex tw:items-baseline tw:gap-2">
                <span className="tw:text-2xl tw:lg:text-4xl tw:font-serif tw:font-bold tw:text-[#1D4ED8]">
                  {currentBill.value}
                </span>
                <span className="tw:text-xs tw:sm:text-sm tw:text-slate-500">
                  = {currentBill.monthly} / month
                </span>
              </div>

              {/* Slider Bar */}
              <div className="tw:pt-1 tw:lg:pt-2">
                <input
                  type="range"
                  min="0"
                  max={billSteps.length - 1}
                  step="1"
                  value={billsValue}
                  onChange={(e) => setBillsValue(Number(e.target.value))}
                  className="tw:w-full tw:h-2 tw:bg-blue-100 tw:rounded-lg tw:appearance-none tw:cursor-pointer tw:accent-[#1D4ED8]"
                />
                <div className="tw:flex tw:justify-between tw:text-xs tw:text-slate-400 tw:pt-1.5 tw:font-medium">
                  <span>5</span>
                  <span>50</span>
                  <span>100</span>
                  <span>200</span>
                  <span>400</span>
                </div>
              </div>
            </div>
          </div>

          {/* Swa Buddy Prompt Box */}
          <div className="tw:bg-[#F3F7FC] tw:border tw:border-blue-100/80 tw:rounded-2xl tw:p-4 tw:hidden tw:lg:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:justify-between tw:gap-4">
            <div className="tw:flex tw:items-start tw:gap-3">
              <img
                src="/assets/images/ai/swa-buddy.png"
                alt="Swa"
                className="tw:w-10 tw:h-10 tw:rounded-full tw:object-cover tw:border tw:border-white tw:shadow-xs tw:shrink-0"
              />
              <div>
                <div className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-slate-500 tw:uppercase">
                  SWA · YOUR PLANS BUDDY
                </div>
                <div className="tw:text-sm tw:font-serif tw:italic tw:text-slate-700 tw:mt-0.5">
                  The pair on the right is what fits your{" "}
                  <strong className="tw:font-serif tw:font-bold tw:text-slate-900">
                    {currentStock.value}
                  </strong>{" "}
                  monthly buy and{" "}
                  <strong className="tw:font-serif tw:font-bold tw:text-slate-900">
                    {currentBill.monthly}
                  </strong>{" "}
                  bills / month. Curious how I picked?
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAskSwa}
              className="tw:bg-[#1E2B3E] tw:hover:bg-[#152030] tw:text-white tw:px-4 tw:py-2.5 tw:rounded-xl tw:text-sm tw:font-medium tw:flex tw:items-center tw:gap-1.5 tw:shrink-0 tw:transition-all"
            >
              Ask Swa
              <ArrowRight className="tw:w-3.5 tw:h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Dark Navy Recommendation Card */}
        <div className="tw:lg:col-span-6 tw:bg-[#1E2B3E] tw:rounded-3xl tw:p-4 tw:sm:p-8 tw:text-white tw:flex tw:flex-col tw:justify-between tw:space-y-4 tw:sm:space-y-6 tw:shadow-md">
          <div className="tw:space-y-3.5 tw:sm:space-y-5">
            {/* Top Swa Quote */}
            <div className="tw:flex tw:items-start tw:gap-3 tw:sm:gap-3.5">
              <img
                src="/assets/images/ai/swa-buddy.png"
                alt="Swa Avatar"
                className="tw:w-9 tw:h-9 tw:sm:w-11 tw:sm:h-11 tw:rounded-full tw:border-2 tw:border-white/90 tw:object-cover tw:shrink-0"
              />
              <div className="tw:space-y-1">
                <div className="tw:text-[10px] tw:font-bold tw:tracking-widest tw:text-slate-300 tw:uppercase">
                  SWA RECOMMENDS
                </div>
                <div className="tw:text-xs tw:sm:text-base tw:font-serif tw:italic tw:text-slate-100 tw:leading-snug tw:sm:leading-relaxed">
                  &ldquo;For a shop your size in HSR —{" "}
                  <strong className="tw:font-bold tw:text-white">
                    Stock 10L + Shop Unlimited
                  </strong>
                  . That&apos;s what{" "}
                  <strong className="tw:font-bold tw:text-white">
                    42 peers
                  </strong>{" "}
                  on your street chose.&rdquo;
                </div>
              </div>
            </div>

            <div className="tw:border-t tw:border-dashed tw:border-slate-600/70"></div>

            {/* Plan Item 1: Stock 10L */}
            <div className="tw:bg-[#28384E] tw:rounded-2xl tw:p-3 tw:sm:p-4 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border tw:border-slate-600/30">
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:gap-3.5">
                <div className="tw:w-9 tw:h-9 tw:sm:w-11 tw:sm:h-11 tw:bg-[#C27803] tw:rounded-xl tw:flex tw:items-center tw:justify-center tw:text-white tw:shrink-0 tw:shadow-xs">
                  <Layers className="tw:w-4 tw:h-4 tw:sm:w-5 tw:sm:h-5" />
                </div>
                <div>
                  <div className="tw:font-serif tw:font-bold tw:text-white tw:text-sm tw:sm:text-lg">
                    Stock 10L
                  </div>
                  <div className="tw:text-[11px] tw:sm:text-xs tw:text-slate-300">
                    ₹10 L / mo credit
                    <span className="tw:hidden tw:sm:inline">
                      {" "}
                      · ₹7L – ₹15L / month
                    </span>
                  </div>
                </div>
              </div>
              <div className="tw:text-right tw:shrink-0">
                <div className="tw:text-lg tw:sm:text-2xl tw:font-serif tw:font-bold tw:text-white">
                  ₹38,335
                </div>
                <div className="tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-slate-400 tw:uppercase">
                  1YR · GST IN
                </div>
              </div>
            </div>

            {/* Plan Item 2: Shop Unlimited */}
            <div className="tw:bg-[#28384E] tw:rounded-2xl tw:p-3 tw:sm:p-4 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border tw:border-slate-600/30">
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:gap-3.5">
                <div className="tw:w-9 tw:h-9 tw:sm:w-11 tw:sm:h-11 tw:bg-[#1D4ED8] tw:rounded-xl tw:flex tw:items-center tw:justify-center tw:text-white tw:shrink-0 tw:shadow-xs">
                  <Store className="tw:w-4 tw:h-4 tw:sm:w-5 tw:sm:h-5" />
                </div>
                <div>
                  <div className="tw:font-serif tw:font-bold tw:text-white tw:text-sm tw:sm:text-lg">
                    Shop Unlimited
                  </div>
                  <div className="tw:text-[11px] tw:sm:text-xs tw:text-slate-300">
                    2,000+ bills / mo
                    <span className="tw:hidden tw:sm:inline">
                      {" "}
                      · 2,000+ bills per month
                    </span>
                  </div>
                </div>
              </div>
              <div className="tw:text-right tw:shrink-0">
                <div className="tw:text-lg tw:sm:text-2xl tw:font-serif tw:font-bold tw:text-white">
                  ₹24,175
                </div>
                <div className="tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-slate-400 tw:uppercase">
                  1YR · GST IN
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="tw:space-y-1.5 tw:pt-1">
              <div className="tw:flex tw:items-center tw:justify-between">
                <span className="tw:text-[10px] tw:font-bold tw:tracking-widest tw:text-slate-300 tw:uppercase">
                  SWA&apos;S CONFIDENCE
                </span>
                <span className="tw:text-xs tw:font-bold tw:text-amber-400">
                  100%
                </span>
              </div>
              <div className="tw:w-full tw:h-1.5 tw:bg-slate-700 tw:rounded-full tw:overflow-hidden">
                <div className="tw:w-full tw:h-full tw:bg-[#DDA14B] tw:rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Checkout Banner Box */}
          <div className="tw:bg-[#DCA44E] tw:rounded-2xl tw:p-3.5 tw:sm:p-5 tw:text-[#182638] tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-3 tw:sm:gap-4 tw:shadow-sm">
            <div>
              <div className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-[#523707] tw:uppercase">
                BOTH PLANS · ONE BILL
              </div>
              <div className="tw:text-xl tw:sm:text-3xl tw:font-serif tw:font-bold tw:text-[#182638] tw:mt-0.5">
                ₹62,510
              </div>
              <div className="tw:text-[11px] tw:sm:text-xs tw:text-[#473007] tw:mt-0.5">
                yearly · GST 18% included · locks your rate till Jan 2028
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:bg-[#1E2B3E] tw:hover:bg-[#152030] tw:text-white tw:px-4 tw:py-2.5 tw:sm:px-6 tw:sm:py-3.5 tw:rounded-xl tw:text-sm tw:font-semibold tw:shrink-0 tw:shadow-md tw:transition-all"
            >
              Checkout
              <ArrowRight className="tw:w-4 tw:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
