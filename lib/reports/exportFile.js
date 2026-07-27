import * as XLSX from "xlsx";

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function exportCSV(reportName, columns, rows) {
  const lines = [columns.map(csvEscape).join(","), ...rows.map(r => r.map(csvEscape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(blob, `${slug(reportName)}.csv`);
}

export function exportXLSX(reportName, columns, rows) {
  const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
  triggerBlobDownload(blob, `${slug(reportName)}.xlsx`);
}

// PDF: opens a clean, formatted printable view and triggers the browser's
// print dialog, where "Save as PDF" produces a real PDF. This avoids
// pulling in a heavyweight PDF-generation library for what the browser
// already does natively and reliably.
export function exportPDF(reportName, columns, rows, subtitle) {
  const win = window.open("", "_blank");
  if (!win) return;

  const tableRows = rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
  const tableHead = `<tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;

  win.document.write(`
    <html>
      <head>
        <title>${escapeHtml(reportName)}</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 18px; margin-bottom: 2px; }
          p.subtitle { font-size: 11px; color: #64748b; margin-top: 0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { text-align: left; background: #f1f5f9; padding: 6px 8px; border-bottom: 1px solid #cbd5e1; }
          td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reportName)}</h1>
        <p class="subtitle">${escapeHtml(subtitle || "")} — generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <table>
          <thead>${tableHead}</thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
