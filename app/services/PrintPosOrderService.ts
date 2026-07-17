import { format } from "date-fns";
import { get } from "lodash";
import { API, API_VERSION, CLUB_URL } from "~/constants";
import AuthService from "./AuthService";
import CommonService from "./CommonService";
import LoyaltyPointService from "./LoyaltyPointService";

declare const window: any;

class PrintPosOrderService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  static async printPosTemplate(
    data: {
      orderId: string;
      returnId?: string;
      created: string;
      deals: Array<{
        name: string;
        aliasName: string;
        price: number;
        qty: number;
        mrp: number;
        subtotal: number;
        unitType?: string;
        isOfferDeal: boolean;
        isFree: boolean;
        HSNNumber: string;
        ledgerData: Array<any>;
        taxInfo: any;
      }>;
      mobile: number;
      gst: string;
      store: string;
      total: number;
      baseTotal: number;
      saving: number;
      taxes: Array<any>;
      reward: number;
      doorStepDeliver: boolean;
      doorStepDeliverTime: string;
      doorStepDeliverAddr: string;
      storeAddr: string;
      subTotal: number;
      kcBalance: number;
      kcRedeemed: number;
      kcRedeemdVal: number;
      customer: any;
      payReceipt: any;
      couponValue: number;
      couponType: string;
      luckyDraw?: any;
      shippingCharges?: number;
    },
    displayTax = true,
    options: {
      isReturnPrint?: boolean;
      langKey?: string;
      isPartnerOrder?: boolean;
    } = { isReturnPrint: false, langKey: "", isPartnerOrder: false }
  ) {
    let t = "";

    // Prepare QR code for Club URL with retailer mobile if available
    let qrSrc = "";
    const retailerMobile = String(data?.mobile || "").trim();
    const qrText = retailerMobile ? `${CLUB_URL}/store/${retailerMobile}` : "";
    if (qrText) {
      try {
        const mod: any = await import("qrcode");
        qrSrc = await mod.toDataURL(qrText, {
          margin: 1,
          errorCorrectionLevel: "M",
          width: 128,
        });
      } catch (e) {
        // ignore QR errors to avoid blocking print
        qrSrc = "";
      }
    }

    let smartcoinProgram = "";

    let convIndianComma = (val: number, decimal = 2) => {
      return CommonService.commaSeparated(
        CommonService.roundedByDecimalPlace(val, decimal)
      );
    };

    let gst = "";
    if (data.gst) {
      gst = `
      <div class="fs-md b-gap">
        GSTIN: ${data.gst}
      </div>      
      `;
    }

    let items = "";
    (data.deals || []).forEach((e) => {
      let u = e.unitType || "";
      if (u == "kg" && e.qty < 1) {
        e.qty *= 1000;
        u = "gm";
      }

      if (u == "gm" && e.qty > 999) {
        e.qty = CommonService.roundedByDecimalPlace(e.qty / 1000, 3);
        u = "kg";
      }

      let offerBdg = e.isOfferDeal
        ? '<span style="font-size: .55rem; font-weight:bold;">(Offer)</span>'
        : "";

      let priceDisp = e.isFree ? "FREE" : convIndianComma(e.price);

      let totalDisp = e.isFree ? "FREE" : convIndianComma(e.subtotal);

      let barcode = "--";
      if (e.ledgerData && e.ledgerData.length > 0) {
        barcode = e.ledgerData[0].barcode || "";
      }

      items += `
      <tr>
        <td>
          <strong>
            ${e.aliasName || e.name} ${offerBdg}
          </strong>
        </td>
        <td>${convIndianComma(e.mrp)}</td>        
        <td>${priceDisp}</td>
        <td style="text-align: center;">${e.qty} ${u}</td>
        <td class="t-right">${totalDisp}</td>
      </tr>
      
      `;
    });

    // <tr>
    //     <td colspan="5" style="padding-left:.9rem;">
    //       <span>${barcode}</span>
    //       <span> | </span>
    //       <span>HSN: ${e.HSNNumber || "--"}</span>
    //       <span> | </span>
    //       <span>GST: ${e.taxInfo?.gst || "0"}%</span>
    //     </td>
    //   </tr>

    let saving = "";
    let kcRedeemTempl = "";
    if (
      (data.saving || data.couponValue || data.kcRedeemed) &&
      !options.isReturnPrint
    ) {
      const onMrp = data.saving || 0;
      const coupon = data.couponValue || 0;
      const kcRedeem = data.kcRedeemed || 0;
      let totSave = onMrp + kcRedeem;

      if (data.couponType != "KingCoins") {
        totSave += coupon;
      }

      let mrpTempl = "";
      let couponTempl = "";
      let totSaveTempl = "";

      if (onMrp) {
        const mrpVal = CommonService.roundedByDecimalPlace(onMrp, 2);
        mrpTempl = `
        <tr>
          <td>
            <div class="fs-md">
              Save on MRP:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">- &#8377;${mrpVal}</div>
          </td>
        </tr>          
        `;
      }

      if (coupon && data.couponType != "KingCoins") {
        couponTempl = `
        <tr>
          <td>
            <div class="fs-md">
              Coupon Value:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">-&#8377;${CommonService.roundedByDecimalPlace(
              coupon,
              2
            )}</div>
          </td>
        </tr>          
        `;
      }

      if (kcRedeem) {
        const kcval = CommonService.roundedByDecimalPlace(
          data.kcRedeemdVal || 0,
          2
        );
        kcRedeemTempl = `
        <tr>
          <td>
            <div class="fs-md">
              SmartCoins Redeemed:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">- ${kcRedeem} coins</div>
          </td>
        </tr>          
        `;
      }

      if (totSave) {
        totSaveTempl = `
        <tr>
          <td>
            <div class="fs-md">
              Total Saving:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">- &#8377;.${totSave}</div>
          </td>
        </tr>          
        `;
      }

      if (totSave || couponTempl) {
        saving = `
          ${mrpTempl}
          ${couponTempl}
        `;
      }
    }

    let reward = "";
    if (data.reward || (data.couponType == "KingCoins" && data.couponValue)) {
      let c = 0;
      if (data.couponType == "KingCoins" && data.couponValue) {
        c = data.couponValue;
      }
      let k = Math.abs(data.reward - c);
      // let k = Math.abs(data.reward);
      let ktmplt = "";
      let ctmplt = "";

      if (k) {
        let px = c ? "Order" : "";
        ktmplt = `
        <tr>
          <td>
            <div class="fs-md">
              ${px} SmartCoins Reward:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">+${k} coins</div>
          </td>
        </tr>          
      `;
      }

      if (c) {
        ctmplt = `
        <tr>
          <td>
            <div class="fs-md">
              Coupon SmartCoins Reward:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">+${c} coins</div>
          </td>
        </tr>          
      `;
      }

      reward = `      
        ${ctmplt}
        ${ktmplt}
      `;
    }

    let kcBalance = "";
    if (data.kcBalance) {
      kcBalance = `      
        <tr>
          <td>
            <div class="fs-md">
              Available SmartCoins:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">${data.kcBalance || 0} coins</div>
          </td>
        </tr>
      `;
    }

    if (kcRedeemTempl || reward || kcBalance) {
      smartcoinProgram = `
      <tr>
        <td colspan="2" style="position:relative;">
          <div class="smartcoin-program-lbl">
            SmartCoins Program
          </div>
          <table class="smartcoin-program">
            ${kcRedeemTempl}
            ${reward}
            ${kcBalance}
          </table>
        </td>
      </tr>
    `;
    }

    let customer = "";
    if (data.customer && data.customer.customerId) {
      // Use _addr if available (contains delivery address data), otherwise construct from address fields

      customer = `
        <div class="b-gap p-x">
          <div class="f-semibold fs-normal">${data.customer.name}</div>
          <div class="fs-md">
            ${data.customer._addr}
          </div>
        </div>             
      `;
    }

    let taxes = "";
    if (displayTax) {
      (data.taxes || []).forEach((e) => {
        const pa = convIndianComma(e.taxableOnAmount, 2);
        const tx = convIndianComma(e.taxableAmount, 2);
        let t = "";
        if (e.taxPerc > 0) {
          t = `<small>Total ${e.taxType} collected @ ${e.taxPerc}% on &#8377; ${pa}</small>`;
        } else {
          t = `<small>Total ${e.taxType} collected </small>`;
        }
        taxes += `
          <table>
            <tbody>
              <tr>
                <td colspan="3">
                  ${t}
                </td>
                <td>
                  <div class="t-right">
                    <small>&#8377; ${tx}</small>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>        
        `;
      });
    }

    let doorStep = "";
    if (data.doorStepDeliver) {
      let dstime = "";
      if (data.doorStepDeliverTime) {
        dstime = `
        <div>Delivery Time: ${data.doorStepDeliverTime}</div>
        `;
      }

      doorStep = `
      <div class="b-gap fs-md p-x">
        <div>
          Delivery Address: ${data.doorStepDeliverAddr}
        </div>        
        ${dstime}        
      </div>      
      `;
    }

    let bill = "";

    if (options.isReturnPrint) {
      bill = `
      <table>
        <tbody>
          <tr>
            <td>
              <div class="fs-md">
                Return ID:
              </div>
            </td>
            <td>
              <div class="fs-md t-right">
                ${data.returnId}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="fs-md">
                Return On:
              </div>
            </td>
            <td>
              <div class="fs-md t-right">
                ${data.created}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="fs-md">
                Bill No.:
              </div>
            </td>
            <td>
              <div class="fs-md t-right">
                ${data.orderId}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      `;
    } else {
      bill = `
      <table>
        <tbody>
          <tr>
            <td>
              <div class="fs-md">
                Bill No.:
              </div>
            </td>
            <td>
              <div class="fs-md t-right">
                ${data.orderId}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="fs-md">
                Date:
              </div>
            </td>
            <td>
              <div class="fs-md t-right">
                ${data.created}
              </div>
            </td>
          </tr>
        </tbody>
      </table>      
      `;
    }

    if (data.payReceipt?.referenceNo) {
      bill += `
      <table>
        <tbody>
          <tr>
            <td>
              <div class="fs-md">
                Receipt Ref No.:
              </div>
            </td>
            <td>
              <div class="fs-md t-right">
                ${data.payReceipt.referenceNo}
              </div>
            </td>
          </tr>
        </tbody>
      </table>      
      `;
    }

    let totalLbl = "";
    if (options.isReturnPrint) {
      totalLbl = "Total Amount";
    } else {
      totalLbl = "Payable Amount";
    }

    let title = options?.isReturnPrint
      ? '<div class="t-center f-semibold fs-md">Return Receipt</div>'
      : "";

    if (!title) {
      title = "";
      // if (displayTax) {
      //   title = '<div class="t-center f-semibold fs-md">Invoice</div>';
      // } else {
      //   title = '<div class="t-center f-semibold fs-md">Receipt</div>';
      // }
    }

    const isNewPrinter =
      ["F323604", "F323604"].indexOf(AuthService.getLoggedInUserId() || "") !=
      -1;

    const paperWidth = isNewPrinter ? "80mm" : "55mm";

    // FOR LANGUAGE OPTIONS

    let langLoaderScript = "";
    let langScript = "";

    if (options.langKey && options.langKey != "en") {
      langLoaderScript = ``;

      langScript = `
        <script async type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
        <script type="text/javascript">
          function googleTranslateElementInit(data) {
            document.cookie = 'googtrans=/en/${options.langKey}; path=/;';
            var t = setTimeout(() => {
              clearTimeout(t);
              new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages:'en,kn,hi'}, 'google_translate_element');
            }, 500);
            var hEls = document.getElementsByTagName('html');            
            var tt = setInterval(() => {                                    
              if(hEls && hEls[0].classList.contains('translated-ltr'))  {
                clearInterval(tt);
                print();
                document.cookie = 'googtrans=; path=/;';
                document.cookie = 'googtrans=; path=/; domain=.storeking.in;';
                close();
              }              
            }, 1000);            
          }
        </script>
      `;
    } else {
      // Wait for images (QR/logo) to load before printing, then close
      langScript = `
        <script>
          (function(){
            function allImagesLoaded(){
              var imgs = Array.prototype.slice.call(document.images || []);
              return imgs.every(function(img){ return img.complete; });
            }
            function waitAndPrint(retries){
              if (allImagesLoaded() || retries <= 0) {
                setTimeout(function(){ window.print(); window.close(); }, 300);
              } else {
                setTimeout(function(){ waitAndPrint(retries - 1); }, 150);
              }
            }
            window.addEventListener('load', function(){ waitAndPrint(40); });
          })();
        </script>`;
    }

    let lcdPrint = {
      time: "",
      title: "",
      desc: "",
      status: "",
      template: "",
    };

    if (data.luckyDraw?.configId) {
      let from = format(data.luckyDraw.fromDate, "dd MMM yyyy");
      let to = format(data.luckyDraw.toDate, "dd MMM yyyy");
      lcdPrint.time = from + " to " + to;
      let fc = data.luckyDraw.overAllKingCoins;
      if (data.luckyDraw.availableKingCoins < data.luckyDraw.overAllKingCoins) {
        fc = data.luckyDraw.availableKingCoins;
      }
      if (data.luckyDraw.status != "Qualified") {
        lcdPrint.title =
          "Do purchase and accumulate <strong>" +
          data.luckyDraw.minCoin +
          " coins</strong> and be part of lucky draw";
      }
      lcdPrint.desc = data.luckyDraw.kingCoins
        ? "You have earned <strong>" +
          data.luckyDraw.kingCoins +
          " coins</strong>. "
        : "";
      if (data.luckyDraw.status == "Qualified") {
        lcdPrint.desc += "Now you have qualified for lucky draw";
        lcdPrint.status = "Qualified";
      } else {
        let rem = data.luckyDraw.yetToEarn;
        if (rem) {
          lcdPrint.desc +=
            " still <strong>" +
            rem +
            " more coins</strong/> are required for qualifying";
        }
        lcdPrint.status = "Not Qualified";
      }
      lcdPrint.template = `
         <div class="lcd-blk">
           <div class="lcd-header">
             <div class="left"></div>
             <div class="center">
               ${data.luckyDraw.title}
             </div>
             <div class="right"></div>
           </div>
           <div style="font-size: 11px; margin-bottom: 10px; font-weight: 600; margin-top: 10px;">
            From ${lcdPrint.time}
           </div>
           <div style="font-size: 11px; margin-bottom: 10px;">
            ${lcdPrint.title}
           </div>
           <div style="font-size: 11px; margin-bottom: 10px; font-weight: 600;">
            Status: ${data.luckyDraw.status}
           </div>
           <div style="font-size: 11px; margin-bottom: 10px;">
            ${lcdPrint.desc}
           </div>
         </div>
      `;
    }

    let paisaDiff = "";

    if (data.total != data.baseTotal) {
      paisaDiff = `
        <div style="font-size: 10px; color:grey; margin-top: 5px;">
          Base Price = &#8377; ${convIndianComma(data.baseTotal, 2)}
        </div>
      `;
    }

    let shippingCharges = "";
    if (data.shippingCharges) {
      shippingCharges = `
        <tr>
          <td>
            <div class="fs-md">
              Shipping Charges:
            </div>
          </td>            
          <td>
            <div class="fs-md t-right">+ &#8377;${CommonService.roundedByDecimalPlace(
              data.shippingCharges,
              2
            )}</div>
          </td>
        </tr>          
      `;
    }

    t += `
      <html>
        <head>
          <title>${
            options?.isPartnerOrder ? "Invoice" : "StoreKing POS"
          }</title>
          ${langLoaderScript}
          <style>          
            body {
              font-family: monospace;
              font-size: 12px;
              width: 80mm;
              box-shadow: 0px 1px 4px 4px #dedede;
              background:white;
              padding: .5rem;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              text-align: left;
              padding: 0.2rem;
              font-size: .7rem;
            }

            .b-gap {
              margin-bottom: .5rem;
            }

            .b-gap-1 {
              margin-bottom: 1rem;
            }

            .b-gap-2 {
              margin-bottom: 1.3rem;
            }

            .b-gap {
              margin-bottom: .7rem;
            }

            .f-semibold {
              font-weight: 600;
            }

            .fs-normal {
              font-size: 1rem;
            }

            .fs-md {
              font-size: .8rem;
            }

            .t-center {
              text-align: center;
            }

            .t-right {
              text-align: right;
            }


            .b-t-dashed {
              border-top: 1px dashed;
            }

            .b-b-dashed {
              border-bottom: 1px dashed;
            }

            .p-x {
              padding-left: 0.2rem;
              padding-right: 0.2rem;
            }

            .logo {
              text-align: center;
              margin: 1rem 0px;
            }

            .logo img {
              width: 70px;
              display: inline-block;
            }

            .skiptranslate {
              display:none;
            }
            
            body {
              top: 0px !important;
            }

            .lcd-blk {
              border-bottom: 2px dashed;  
            }
            
            .lcd-header {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .lcd-header .left, .lcd-header .right {
              border-top: 2px dashed;
              flex:1;
            }
            
            .lcd-header .left {
              margin-right: 10px;
            }
            
            .lcd-header .right {
              margin-left: 10px;
            }
            
            .lcd-header .center {
              width: auto;  
              font-weight: 600;
            }
            
            .lcd-blk .desc {
              padding: 10px;
              text-align:center;  
              font-weight: 600;
            }

          .smartcoin-program {
            border:.3rem double; 
            border-radius: 20px; 
            margin: 1rem 0;            
          }

          .smartcoin-program tr:first-child td{
            padding-top: 1rem;
          }

          .smartcoin-program tr:last-child td{
            padding-bottom: 1rem;
          }
          
          .smartcoin-program tr td {
            padding: .2rem .5rem;
          }
          
          .smartcoin-program-lbl {
            font-weight: bold;
            background:white; 
            position:absolute;
            top:.7rem; 
            display:inline-block;
            left:.8rem; 
            font-size: .9rem; 
            font-style:italic;
            padding:0 .5rem;
          }
          
          .qr-wrap {
            margin-top: .8rem;
            text-align: center;
          }
          .qr-wrap img {
            width: 128px;
            height: 128px;
          }
          .qr-wrap .qr-text {
            font-size: .6rem;
            color: #6b7280;
            margin-top: .2rem;
            word-break: break-all;
          }
            

          </style>
        </head>
        <body>                   

          <div class="main">

            ${title}

            <div>
              <div class="logo">   
                <img src="https://storeking.in/assets/assets/images/logo/logo_2.png"/>
              </div>

              <div class="t-center b-gap-2">
                <div class="f-semibold fs-normal">${data.store}</div>
                <div class="fs-md">${data.storeAddr}</div>
                ${gst}
              </div>
              
            </div>            

            ${customer}

            ${doorStep}
            
            ${bill}

            <table class="b-gap">
              <tbody>
                <tr>
                  <td>
                    <div class="fs-md">
                      Items:
                    </div>
                  </td>
                  <td>
                    <div class="fs-md t-right">
                      ${data.deals.length}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>  

            <table>
              <thead class="b-t-dashed b-b-dashed">        
                <tr>
                  <th width="40%">Item</th>
                  <th width="20%">MRP(&#8377;)</th>
                  <th width="20%">Price(&#8377;)</th>
                  <th width="20%" class="t-center">Qty</th>
                  <th width="20%">Total(&#8377;)</th>
                </tr>
              </thead>
              <tbody>                
                ${items}
              </tbody>
            </table>

            <table class="b-gap">
              <tbody>
                <tr class="b-t-dashed b-b-dashed">
                  <td>
                    <div class="f-semibold fs-normal">Total Amount</div>
                  </td>
                  <td>
                    <div class="f-semibold fs-normal t-right">
                      &#8377; ${convIndianComma(data.subTotal)}
                    </div>
                  </td>
                </tr>                
                
                ${saving}
                ${shippingCharges}
                
                ${smartcoinProgram}

                <tr class="b-t-dashed b-b-dashed">
                  <td>
                    <div class="f-semibold fs-normal">${totalLbl}</div>
                    ${paisaDiff}
                  </td>
                  <td>
                    <div class="f-semibold fs-normal t-right">
                      &#8377; ${convIndianComma(data.total, 0)}
                    </div>
                  </td>
                </tr>                                

              </tbody>
            </table>            

            
            <div class="b-gap">
            ${taxes} 
            </div>

            <div class="b-gap">
              ${lcdPrint.template}
            </div>

            
            <div class="fs-md t-center">
              ${
                options?.isPartnerOrder
                  ? ""
                  : "---- We also do Home delivery ----"
              }              
            </div>
            <div class="fs-md t-center">
              <small>Thank you for Shopping!! Visit Again!!</small>
            </div>

            ${
              qrSrc
                ? `
            <div class="qr-wrap">
              <img src="${qrSrc}" alt="QR Code"/>
              <div class="qr-text">${qrText}</div>
            </div>`
                : ""
            }

          </div>

          <div id="google_translate_element"></div>
          
          <div class="print-brk"></div> 
          
          ${langScript}
        
        </body>
      </html>
    `;

    const w: any = window.open("", "SK-POS");
    w.document.write(t);
    w.document.close();
    w.focus();
    // w.print();
  }

  static async prepareTemplateData(
    orderResp: {
      _payableAmt: number;
      createdAt: Date;
      orderRefNo: string;
      customerInfo: {
        _addr: string;
        customerId: string;
        name: string;
        email: string;
        mobile: string;
        isGuestCustomer: boolean;
        address: {
          line1: string;
          line2: string;
          city: string;
          state: string;
          pincode: string;
        };
      };
      items: Array<{
        dealName: string;
        dealId: string;
        dealRefId: string;
        finalPrice: number;
        price: number;
        quantity: number;
        fulfilledQty: number;
        mrp: number;
        uom: string;
      }>;
      sellerInfo: {
        franchiseName: string;
        address: {
          state: string;
          district: string;
          city: string;
          picode: string;
          street: string;
        };
        gst: string;
        mobile: string;
      };
      shippingAddress: {
        doorNo: string;
        street: string;
        landmark: string;
        city: string;
        full_address: string;
        state: string;
        district: string;
        town: string;
        pincode: string;
      };
      deliveryAddress?: {
        street?: string;
        state?: string;
        landmark?: string;
        doorNo?: string;
        district?: string;
        city?: string;
      };
      coinsRewared: number;
      coinsRedeemed: number;
      coinsRedeemedValue: number;
    },
    displayTax = true,
    options: {
      isReturnPrint?: boolean;
      langKey?: string;
    } = {
      isReturnPrint: false,
      langKey: "",
    }
  ) {
    let kcBalance = 0;

    const prepareData = () => {
      const deals = (orderResp.items || []).map((e) => {
        const price = e.price || 0;
        return {
          name: e.dealName,
          aliasName: e.dealName,
          price,
          qty: e.fulfilledQty,
          // keep subtotal compatible with existing usage in template
          subtotal: e.finalPrice,
          mrp: e.mrp,
          subMrp: e.fulfilledQty * e.mrp,
          unitType: "", //e.uom,
          isOfferDeal: false,
          isFree: false,
          // missing fields used by printPosTemplate
          HSNNumber: get(e, "HSNNumber", ""),
          ledgerData: get(e, "ledgerData", []),
          taxInfo: get(e, "taxInfo", { gst: 0 }),
        };
      });

      let total = 0;
      let totalMrp = deals.reduce(
        (s: number, i: any) => (s += i.mrp * i.qty),
        0
      );
      // sum actual subtotal values produced above (finalPrice may not exist on deal objects)
      let totalPrice = deals.reduce(
        (s: number, i: any) => (s += i.subtotal || 0),
        0
      );

      if (options.isReturnPrint) {
        total = deals.reduce((s: number, i: any) => (s += i.subtotal), 0);
      } else {
        total = orderResp._payableAmt || 0; //(deals).reduce((s: number, i: any) => s += i._payableAmt, 0);
      }

      const fAddr: Record<string, any> =
        get(orderResp, "sellerInfo.address") || {};
      let deliverAddr = [
        "addressLine1",
        "addressLine2",
        "city",
        "district",
        "state",
        "pincode",
      ]
        .map((e) => {
          return fAddr[e] || "";
        })
        .filter(Boolean)
        .join(",");

      const storeAddObj: Record<string, any> = get(
        orderResp,
        "sellerInfo.address",
        {}
      );
      const storeAddrStr = [
        "addressLine1",
        "addressLine2",
        "city",
        "district",
        "state",
        "pincode",
      ]
        .map((e) => {
          return storeAddObj[e] || "";
        })
        .filter(Boolean)
        .join(", ");

      const c = orderResp.customerInfo || {};
      // Use deliveryAddress for customer address if available, otherwise fallback to customer address
      if (orderResp.shippingAddress) {
        const deliveryAddr = orderResp.shippingAddress;
        c._addr = [
          deliveryAddr.doorNo,
          deliveryAddr.street,
          deliveryAddr.landmark,
          deliveryAddr.city,
          deliveryAddr.district,
          deliveryAddr.state,
        ]
          .filter(Boolean)
          .join(", ");
      } else if (c.address && c.address.line1) {
        c._addr = c.address.line1 + " " + c.address.line2;
      } else {
        c._addr = "";
      }

      const delvTime = get(orderResp, "shippingAddress.shipsOn.date", "");

      PrintPosOrderService.printPosTemplate(
        {
          created: format(orderResp.createdAt, "dd MMM yyyy hh:mm a"),
          orderId: orderResp.orderRefNo,
          returnId: "",
          deals: deals,
          gst: orderResp.sellerInfo.gst || "",
          mobile: Number(orderResp.sellerInfo.mobile),
          saving:
            deals.reduce((s: any, i: any) => (s += i.subMrp), 0) - totalPrice,
          store: orderResp.sellerInfo.franchiseName,
          total: total,
          baseTotal: orderResp._payableAmt,
          subTotal: deals.reduce((s: any, i: any) => (s += i.subtotal), 0),
          taxes: [],
          reward: orderResp.coinsRewared || 0,
          doorStepDeliver: false,
          doorStepDeliverAddr: deliverAddr,
          doorStepDeliverTime: delvTime
            ? format(delvTime, "dd MMM yyyy hh:mm a")
            : "",
          storeAddr: storeAddrStr,
          kcBalance: kcBalance,
          kcRedeemed: orderResp.coinsRedeemed || 0,
          kcRedeemdVal: orderResp.coinsRedeemedValue || 0,
          customer: c.isGuestCustomer == true ? {} : c,
          payReceipt: {},
          couponValue: 0,
          couponType: "",
          luckyDraw: {},
          shippingCharges: 0, // Add shipping charges
        },
        displayTax,
        { ...options, isPartnerOrder: false }
      );
    };

    if (!orderResp.customerInfo.isGuestCustomer) {
      const resp = await LoyaltyPointService.getLoyaltyBalance(
        orderResp.customerInfo.customerId,
        "Customer"
      );
      kcBalance = resp.data.useablePoints || 0;
      prepareData();
    } else {
      kcBalance = 0;
      prepareData();
    }
  }

  static printLabel(data: any) {
    let t = `
      <html>
      <head>
        <style>
        .font-size-10{font-size:10px}
        .font-size-20{font-size:20px}
        .mblk {
          display: block;
          width: 55mm;
          height: 100%;
          margin: 0 auto;          
       }
        .cnt {
          width: 320px;
          padding: 5px;
       }
        .cnt .pname {
          font-size: 13px;
          border-top: 1px solid;
          border-bottom: 1px solid;
          padding: 5px 0px;          
       }
        .cnt .flx {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0px;
       }
       .print-brk {
          page-break-before: always;
        }        
        </style>
      </head>
      <body>
        ${data}
        <script>(function(){setTimeout(function(){window.print();},1000)})()</script>
      </body>
      </html>
    `;
    // window.print();
    const w: any = window.open("", "SK-POS");
    w.document.write(t);
    const timer = setTimeout(() => {
      clearTimeout(timer);
      w.window.close();
    }, 2000);
  }
}

export default PrintPosOrderService;
