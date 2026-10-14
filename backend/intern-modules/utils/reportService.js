const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// Shared report-generation helpers. A "column" is { key, label }; "rows"
// are plain objects. All three formats consume the exact same shape so
// report controllers only need to build one dataset per report.

function toCSV(columns, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  return [header, ...lines].join("\n");
}

async function toXLSX(columns, rows, sheetName = "Report") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.substring(0, 31));
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 2, 14) }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

function toPDF(title, columns, rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4", layout: rows.length && columns.length > 5 ? "landscape" : "portrait" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#6B7A90").text(`Generated ${new Date().toLocaleString()} · ${rows.length} record(s)`);
    doc.moveDown(0.8);
    doc.fillColor("#000000");

    const startX = doc.x;
    let y = doc.y;
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / columns.length;

    const drawRow = (values, bold) => {
      doc.fontSize(8.5).font(bold ? "Helvetica-Bold" : "Helvetica");
      values.forEach((v, i) => {
        doc.text(String(v ?? ""), startX + i * colWidth, y, { width: colWidth - 6, ellipsis: true });
      });
      y += 16;
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    };

    drawRow(columns.map((c) => c.label), true);
    doc.moveTo(startX, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).strokeColor("#DCE6F0").stroke();

    rows.forEach((row) => drawRow(columns.map((c) => row[c.key])));

    if (rows.length === 0) {
      doc.fontSize(10).fillColor("#6B7A90").text("No records match the selected filters.", startX, y);
    }

    doc.end();
  });
}

// Sends the generated report with the correct headers for the requested
// format. `format` is "csv" | "xlsx" | "pdf" (defaults to csv).
async function sendReport(res, { format = "csv", filename, title, columns, rows }) {
  const safeName = filename.replace(/[^a-z0-9-_]/gi, "_");

  if (format === "xlsx") {
    const buffer = await toXLSX(columns, rows, title);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.xlsx"`);
    return res.send(buffer);
  }

  if (format === "pdf") {
    const buffer = await toPDF(title, columns, rows);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    return res.send(buffer);
  }

  const csv = toCSV(columns, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.csv"`);
  return res.send(csv);
}

module.exports = { toCSV, toXLSX, toPDF, sendReport };
