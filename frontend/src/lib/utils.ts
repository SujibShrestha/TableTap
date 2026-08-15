import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char
  );
}

export function buildQrPrintHtml({
  qrSvg,
  tableNumber,
  origin,
}: {
  qrSvg: string;
  tableNumber: string;
  origin: string;
}): string {
  const safeNumber = escapeHtml(tableNumber);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Table ${safeNumber} QR</title>
    <style>
      @page { size: auto; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #fef9f2;
        color: #1d1c18;
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        background: #ffffff;
        border: 1px solid #dec0b8;
        border-radius: 20px;
        padding: 40px 48px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(45, 36, 30, 0.08);
      }
      .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
      }
      .brand img { width: 36px; height: 36px; border-radius: 8px; }
      .brand span {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #802102;
      }
      .table-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #57423c;
        margin-bottom: 4px;
      }
      .table-number {
        font-size: 42px;
        font-weight: 700;
        color: #1d1c18;
        margin-bottom: 24px;
      }
      .qr { display: inline-block; padding: 16px; background: #fff; border-radius: 12px; }
      .qr svg { display: block; }
      .caption {
        margin-top: 20px;
        font-size: 13px;
        color: #57423c;
        letter-spacing: 0.04em;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">
        <img src="${origin}/logo-sm.png" alt="TableTap" />
        <span>TableTap</span>
      </div>
      <div class="table-label">Table</div>
      <div class="table-number">${safeNumber}</div>
      <div class="qr">${qrSvg}</div>
      <p class="caption">Scan to view the digital menu</p>
    </div>
  </body>
</html>`;
}
