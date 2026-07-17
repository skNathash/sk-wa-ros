class PrintSellerBoxService {
  static printSellerBox(
    products: any,
    options: { boxId: string; orderId: string }
  ) {
    let items = "";

    products.forEach((e: any, i: number) => {
      items += `<tr>
        <td class="text-center">${i + 1}</td>
        <td class="product-name">${e.name}</td>
        <td class="text-right">Rs.${e.mrp}</td>
        <td class="text-right">Rs.${e.price}</td>
        <td class="text-right">${e.scannedQty}</td>                
      </tr>`;
    });

    // HTML template for the print document
    const printHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Package Box Details</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  color: #333;
              }
              .header {
                  text-align: center;
                  padding: 15px;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #2196F3;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  color: #2196F3;
              }
              .info-container {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 30px;
                  gap: 10px;
              }
              .info-box {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 8px;
                  width: 45%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .info-item {
                  margin-bottom: 10px;
                  display: flex;
                  align-items: center;
              }
              .info-label {
                  font-weight: bold;
                  min-width: 120px;
                  color: #666;
              }
              .info-value {
                  color: #333;
              }
              .barcode-container {
                  text-align: center;
                  margin-top: 15px;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  font-size: 12px;
              }
              thead {
                  background-color: #2196F3;
                  color: white;
              }
              th, td {
                  padding: 8px 6px;
                  text-align: left;
                  border: 1px solid #ddd;
                  vertical-align: top;
              }
              th {
                  font-weight: 600;
                  white-space: nowrap;
              }
              td {
                  line-height: 1.3;
              }
              tbody tr:nth-child(even) {
                  background-color: #f8f9fa;
              }
              tbody tr:hover {
                  background-color: #f1f1f1;
              }
              .product-name {
                  word-break: break-word;
              }
              .text-right {
                  text-align: right;
              }
              .text-center {
                  text-align: center;
              }
              @media print {
                  body {
                      padding: 0;
                      margin: 20px;
                  }
                  .header {
                      border-bottom-color: #000;
                  }
                  .header h1 {
                      color: #000;
                  }
                  thead {
                      background-color: #eee !important;
                      color: #000;
                  }
                  .info-box {
                      box-shadow: none;
                      border: 1px solid #ddd;
                  }
                  table {
                      box-shadow: none;
                      font-size: 11px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Package Box Details</h1>
          </div>
  
          <div class="info-container">
              <div class="info-box">
                  <div class="info-item">
                      <span class="info-label">Order ID:</span>
                      <span class="info-value">${options.orderId}</span>
                  </div>
              </div>
              <div class="info-box">
                  <div class="info-item">
                      <span class="info-label">Box ID:</span>
                      <span class="info-value">${options.boxId}</span>
                  </div>
                  <div class="barcode-container">
                      <canvas id="box-barcode"></canvas>
                  </div>
              </div>
          </div>
  
          <table>
              <thead>
                  <tr>
                      <th style="width: 3%">#</th>
                      <th style="width: 35%">Name</th>
                      <th style="width: 8%" class="text-right">MRP</th>
                      <th style="width: 7%" class="text-right">Price</th>
                      <th style="width: 10%" class="text-right">Qty</th>
                  </tr>
              </thead>
              <tbody>
                  ${items}
              </tbody>
          </table>
  
          <script>
              // Function to load JsBarcode script
              function loadScript(url) {
                  return new Promise((resolve, reject) => {
                      const script = document.createElement('script');
                      script.src = url;
                      script.onload = resolve;
                      script.onerror = reject;
                      document.head.appendChild(script);
                  });
              }
  
              // Function to generate barcode
              function generateBarcode() {
                  try {
                      JsBarcode("#box-barcode", "${options.boxId}", {
                          width: 2,
                          height: 50,
                          fontSize: 14,
                          marginTop: 10,
                          marginBottom: 10
                      });
                      return true; // Barcode generated successfully
                  } catch (err) {
                      console.error('Failed to generate barcode:', err);
                      return false; // Barcode generation failed
                  }
              }
  
              // Load JsBarcode and generate barcode
              async function init() {
                  try {
                      await loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js');
                      const barcodeGenerated = generateBarcode();
                      if (barcodeGenerated) {
                          window.print(); // Print only if barcode is generated
                      } else {
                          console.error('Barcode generation failed, printing aborted.');
                      }
                  } catch (err) {
                      console.error('Failed to load JsBarcode:', err);
                  } finally {
                      window.close(); // Close the print window after printing
                  }
              }
  
              // Start initialization when document is ready
              if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', init);
              } else {
                  init();
              }
          </script>
      </body>
      </html>
    `;

    // Open a new window and write the HTML content
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.title = "Putaway Print - " + options.boxId;
      printWindow.document.write(printHtml);
      printWindow.document.close(); // Ensure the document is fully loaded
    }
  }
}

export default PrintSellerBoxService;
