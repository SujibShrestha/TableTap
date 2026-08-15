import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

import { buildQrPrintHtml } from "./utils";

interface PrintQrOptions {
  tableNumber: string;
  url: string;
}

export function printQrCode({ tableNumber, url }: PrintQrOptions): void {
  const qrSvg = renderToStaticMarkup(
    <QRCodeSVG value={url} size={260} fgColor="#1d1c18" bgColor="transparent" level="M" />
  );

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const html = buildQrPrintHtml({ qrSvg, tableNumber, origin });

  const printWindow = window.open("", "_blank", "width=420,height=620");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  printWindow.onafterprint = () => printWindow.close();
  setTimeout(() => printWindow.print(), 300);
}