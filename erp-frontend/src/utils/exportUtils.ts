import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export const exportTableToExcel = (tableId: string, filename: string) => {
  const table = document.getElementById(tableId);
  if (!table) return;
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

export const exportTableToPDF = (tableId: string, filename: string) => {
  const doc = new jsPDF();
  const table = document.getElementById(tableId);
  if (!table) return;

  autoTable(doc, { html: `#${tableId}` });
  doc.save(`${filename}.pdf`);
};

export const exportTableToPNG = async (tableId: string, filename: string) => {
  const table = document.getElementById(tableId);
  if (!table) return;

  const canvas = await html2canvas(table as HTMLElement);
  const dataUrl = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
