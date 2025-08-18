// src/utils/exportUtils.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// ================= EXCEL =================
export const exportTableToExcel = (tableId: string, filename: string) => {
  const table = document.getElementById(tableId);
  if (!table || !document.body) return;
  
  const html = table.outerHTML;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ================= PDF =================
export const exportTableToPDF = (tableId: string, filename: string) => {
  const doc = new jsPDF();
  const table = document.getElementById(tableId);
  if (!table) return;

  autoTable(doc, { html: `#${tableId}` });
  doc.save(`${filename}.pdf`);
};

// ================= PNG =================
export const exportTableToPNG = async (tableId: string, filename: string) => {
  const table = document.getElementById(tableId);
  if (!table || !document.body) return;

  const canvas = await html2canvas(table as HTMLElement);
  const dataUrl = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ================= CSV (NEW) =================
export const exportDataToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0 || !document.body) return;

  const keys = Object.keys(data[0]);
  const csvRows = [
    keys.join(","), // header
    ...data.map((row) =>
      keys
        .map((key) => {
          const cell = row[key];
          return typeof cell === "string" && cell.includes(",")
            ? `"${cell}"`
            : cell;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
